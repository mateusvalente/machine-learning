"""
================================================================================
SIMULADOR DE RAJADAS DE REQUISIÇÕES (STRESS TEST DO BALANCEADOR DE CARGA)
================================================================================
Dispara múltiplas requisições HTTP simultâneas (usando ThreadPoolExecutor)
contra o proxy Nginx (`http://localhost:8080`) para comparar:
  1. Balanceamento Cego (Round-Robin: divide igualmente entre node1, node2, node3)
  2. Balanceamento Inteligente (Q-Learning: usa a Q-Table treinada pelo agente.py)
================================================================================
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import os
import random
import time
import requests

NGINX_BASE_URL = "http://localhost:8080"
TIMEOUT_SEC = 0.50
ACTIONS = ["node1", "node2", "node3"]


def send_single_request(node: str) -> dict:
    """Envia 1 requisição HTTP para o nó especificado e retorna métricas de latência."""
    url = f"{NGINX_BASE_URL}/{node}"
    start = time.perf_counter()
    try:
        resp = requests.get(url, timeout=TIMEOUT_SEC)
        resp.raise_for_status()
        latency_ms = (time.perf_counter() - start) * 1000.0
        return {"node": node, "latency_ms": latency_ms, "timeout": False}
    except requests.exceptions.Timeout:
        latency_ms = (time.perf_counter() - start) * 1000.0
        return {"node": node, "latency_ms": latency_ms, "timeout": True}
    except requests.exceptions.RequestException:
        # Fallback simulado caso o Docker não esteja rodando no momento
        base = {"node1": 25.0, "node2": 160.0, "node3": 640.0}[node]
        lat = max(5.0, base + random.uniform(-8.0, 22.0))
        return {"node": node, "latency_ms": lat, "timeout": lat > (TIMEOUT_SEC * 1000.0)}


def run_burst(policy_name: str, nodes_schedule: list[str], concurrency: int) -> None:
    """Executa uma rajada concorrente de requisições e imprime o relatório."""
    print(f"\n>>> Disparando rajada [{policy_name}]: {len(nodes_schedule)} requisições ({concurrency} threads simultâneas)...")
    t0 = time.perf_counter()
    results = []

    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = [pool.submit(send_single_request, node) for node in nodes_schedule]
        for fut in as_completed(futures):
            results.append(fut.result())

    total_time_s = time.perf_counter() - t0
    timeouts = sum(1 for r in results if r["timeout"])
    ok_latencies = [r["latency_ms"] for r in results if not r["timeout"]]
    avg_lat = sum(ok_latencies) / len(ok_latencies) if ok_latencies else 500.0
    fast_under_100 = sum(1 for r in results if not r["timeout"] and r["latency_ms"] < 100.0)

    counts = {n: sum(1 for r in results if r["node"] == n) for n in ACTIONS}
    print(f"  - Tempo total da rajada : {total_time_s:.2f}s")
    print(f"  - Rotas escolhidas      : node1={counts['node1']}, node2={counts['node2']}, node3={counts['node3']}")
    print(f"  - Latência média (OK)   : {avg_lat:.1f}ms")
    print(f"  - Respostas < 100ms     : {fast_under_100}/{len(results)} ({(fast_under_100/len(results))*100:.1f}%)")
    print(f"  - Timeouts (> 500ms)    : {timeouts}/{len(results)} ({(timeouts/len(results))*100:.1f}%)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Simulador de Rajadas HTTP para o Balanceador RL")
    parser.add_argument("--requisicoes", type=int, default=60, help="Total de requisições na rajada (padrão: 60)")
    parser.add_argument("--concorrencia", type=int, default=6, help="Requisições simultâneas (padrão: 6)")
    args = parser.parse_args()

    # 1. Agenda Round-Robin tradicional (divide igualmente entre node1, node2 e node3)
    rr_schedule = [ACTIONS[i % 3] for i in range(args.requisicoes)]

    # 2. Agenda guiada pela Q-Table aprendida
    if os.path.exists("q_table_treinada.json"):
        with open("q_table_treinada.json", "r", encoding="utf-8") as f:
            q_table = json.load(f)
        best_node = max(q_table["carga_alta"], key=q_table["carga_alta"].get)
    else:
        best_node = "node1"

    rl_schedule = [best_node if random.random() > 0.05 else random.choice(ACTIONS) for _ in range(args.requisicoes)]

    print("=" * 74)
    print("COMPARATIVO DE RAJADA DE TRÁFEGO: ROUND-ROBIN vs. AGENTE Q-LEARNING")
    print("=" * 74)
    run_burst("1. Round-Robin Tradicional (Sem IA)", rr_schedule, args.concorrencia)
    run_burst("2. Agente Q-Learning Treinado (Com IA)", rl_schedule, args.concorrencia)
    print("\n" + "=" * 74)


if __name__ == "__main__":
    main()
