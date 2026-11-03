"""
================================================================================
PROJETO 2: BALANCEADOR DE CARGA AUTÔNOMO (Q-LEARNING TABULAR 100% DO ZERO)
================================================================================
Algoritmo: Q-Learning Off-Policy (Equação de Bellman)
Bibliotecas: Apenas estruturas nativas do Python (`dict`, `list`) e `requests`.

Parâmetros do Algoritmo:
  - Estados (S): ['carga_baixa', 'carga_media', 'carga_alta']
  - Ações (A)  : ['node1', 'node2', 'node3'] (roteamento via proxy Nginx :8080)
  - Alpha (α)  : 0.25 (Taxa de Aprendizado / Learning Rate)
  - Gamma (γ)  : 0.85 (Fator de Desconto / Discount Factor)
  - Epsilon (ε): 0.40 -> 0.05 (Taxa de Exploração com decaimento de 0.992/ep)

Recompensa (R) baseada na latência HTTP:
  - Latência < 100ms        : +20.0 (Pontuação máxima - SLA excelente)
  - Latência 100ms a 250ms  : +2.0  (Aceitável, porém subótimo)
  - Latência >= 250ms       : -15.0 (Lentidão severa)
  - Timeout (> 500ms)       : -100.0 (Punição severa por queda de serviço)
================================================================================
"""

import json
import random
import time
import requests

# Configuração do Proxy Reverso Nginx
NGINX_BASE_URL = "http://localhost:8080"
REQUEST_TIMEOUT_SEC = 0.50  # 500ms

# Espaço de Estados (S) e Espaço de Ações (A)
STATES = ["carga_baixa", "carga_media", "carga_alta"]
ACTIONS = ["node1", "node2", "node3"]

# Hiperparâmetros da Equação de Bellman
ALPHA = 0.25
GAMMA = 0.85
EPSILON_START = 0.40
EPSILON_MIN = 0.05
EPSILON_DECAY = 0.992
EPISODES = 500

# Inicialização da Q-Table: Dicionário aninhado Q[estado][acao] = 0.0
Q_TABLE = {
    state: {action: 0.0 for action in ACTIONS}
    for state in STATES
}


def get_network_state(episode: int) -> str:
    """Alterna entre os estados de carga da rede ao longo dos episódios."""
    return STATES[episode % len(STATES)]


def select_action(state: str, epsilon: float) -> tuple[str, str]:
    """
    Política Epsilon-Greedy:
    - Com probabilidade `epsilon`: explora um servidor aleatório.
    - Com probabilidade `1 - epsilon`: explota o servidor com maior Q(s, a).
    """
    if random.random() < epsilon:
        return random.choice(ACTIONS), "EXPLORACAO"

    q_values = Q_TABLE[state]
    max_q = max(q_values.values())
    best_actions = [act for act, val in q_values.items() if val == max_q]
    return random.choice(best_actions), "EXPLOTACAO"


def calculate_reward(latency_ms: float, timed_out: bool) -> float:
    """Traduz a latência HTTP medida em um sinal numérico de Recompensa (R)."""
    if timed_out:
        return -100.0
    if latency_ms < 100.0:
        return +20.0
    if latency_ms < 250.0:
        return +2.0
    return -15.0


def dispatch_request(action_node: str, current_state: str) -> tuple[float, bool]:
    """
    Dispara a requisição HTTP para `http://localhost:8080/{node}` e cronometra
    o tempo de resposta real dos contêineres Docker (`traefik/whoami`).
    """
    extra_load_ms = {"carga_baixa": 0, "carga_media": 20, "carga_alta": 45}[current_state]
    url = f"{NGINX_BASE_URL}/{action_node}"

    start_time = time.perf_counter()
    try:
        response = requests.get(
            url,
            headers={"X-Network-State": current_state},
            params={"load": f"{extra_load_ms}ms"},
            timeout=REQUEST_TIMEOUT_SEC,
        )
        response.raise_for_status()
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        return latency_ms, False
    except requests.exceptions.Timeout:
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        return latency_ms, True
    except requests.exceptions.RequestException:
        # Fallback didático caso o Docker ainda não tenha sido iniciado
        base = {"node1": 24.0, "node2": 155.0, "node3": 640.0}[action_node]
        jitter = random.uniform(-8.0, 18.0)
        latency_ms = max(4.0, base + extra_load_ms + jitter)
        return latency_ms, (latency_ms > REQUEST_TIMEOUT_SEC * 1000.0)


def update_q_table(state: str, action: str, reward: float, next_state: str) -> float:
    """
    EQUAÇÃO DE BELLMAN (Q-LEARNING):
    Q(s, a) <- Q(s, a) + alpha * [ R + gamma * max_{a'} Q(s', a') - Q(s, a) ]
    """
    current_q = Q_TABLE[state][action]
    max_future_q = max(Q_TABLE[next_state].values())

    td_target = reward + (GAMMA * max_future_q)
    td_error = td_target - current_q

    new_q = current_q + (ALPHA * td_error)
    Q_TABLE[state][action] = new_q
    return new_q


def print_summary(action_counts: dict[str, int]) -> None:
    """Imprime a Q-Table final e salva em `q_table_treinada.json` para uso em rajadas."""
    print("\n" + "=" * 78)
    print(f"{'ESTADO DA REDE':<16} | {'NODE 1 (1.0 CPU)':>16} | {'NODE 2 (0.25 CPU)':>17} | {'NODE 3 (0.05 CPU)':>17} | {'POLÍTICA π(s)'}")
    print("-" * 78)
    for state, actions in Q_TABLE.items():
        best_node = max(actions, key=actions.get)
        print(
            f"{state:<16} | "
            f"{actions['node1']:>16.2f} | "
            f"{actions['node2']:>17.2f} | "
            f"{actions['node3']:>17.2f} | "
            f"-> {best_node.upper()}"
        )
    print("=" * 78)

    print("\nDistribuição de tráfego durante os 500 episódios de treinamento:")
    for node, count in action_counts.items():
        pct = (count / EPISODES) * 100.0
        print(f"  - {node}: {count:3d} requisições ({pct:5.1f}%)")

    with open("q_table_treinada.json", "w", encoding="utf-8") as f:
        json.dump(Q_TABLE, f, indent=2, ensure_ascii=False)
    print("\n[OK] Q-Table salva em 'q_table_treinada.json'. Execute 'python simulador_trafego.py' para testar rajadas concorrentes!")


def main() -> None:
    epsilon = EPSILON_START
    action_counts = {node: 0 for node in ACTIONS}

    print("Iniciando treinamento do Balanceador de Carga Autônomo (500 episódios)...")
    print(f"Parâmetros: alpha={ALPHA}, gamma={GAMMA}, epsilon_inicial={EPSILON_START}\n")

    for episode in range(1, EPISODES + 1):
        state = get_network_state(episode)
        action, mode = select_action(state, epsilon)
        action_counts[action] += 1

        latency_ms, timed_out = dispatch_request(action, state)
        reward = calculate_reward(latency_ms, timed_out)
        next_state = get_network_state(episode + 1)

        new_q = update_q_table(state, action, reward, next_state)
        epsilon = max(EPSILON_MIN, epsilon * EPSILON_DECAY)

        if episode <= 5 or episode % 25 == 0 or episode == EPISODES:
            lat_str = "TIMEOUT!" if timed_out else f"{latency_ms:6.1f}ms"
            print(
                f"[Ep {episode:03d}/{EPISODES}] S: {state:<11} | "
                f"Ação: {action} ({mode:<10}) | Latência: {lat_str} | "
                f"R: {reward:+6.1f} | Q(s,a): {new_q:7.2f} | ε: {epsilon:.3f}"
            )

    print_summary(action_counts)


if __name__ == "__main__":
    main()
