"""
Projeto 2: Balanceador de Carga Autônomo via Q-Learning Tabular (100% do Zero)
------------------------------------------------------------------------------
Sem frameworks de RL (Gymnasium/PyTorch/TensorFlow). Utiliza apenas dicionários,
listas da biblioteca padrão do Python e `requests` para chamadas HTTP reais ao Nginx.
"""

import random
import time
import requests

# ==============================================================================
# 1. DEFINIÇÃO DO AMBIENTE (ESTADOS, AÇÕES E ENDPOINT DO PROXY NGINX)
# ==============================================================================
NGINX_BASE_URL = "http://localhost:8080"
REQUEST_TIMEOUT_SEC = 0.50  # 500ms: acima disso é considerado Timeout severo

# Estados discretos representando a carga atual da rede
STATES = ["carga_baixa", "carga_media", "carga_alta"]

# Ações disponíveis para o roteador autônomo
ACTIONS = ["node1", "node2", "node3"]

# ==============================================================================
# 2. HIPERPARÂMETROS DO Q-LEARNING (EQUAÇÃO DE BELLMAN)
# ==============================================================================
ALPHA = 0.25          # Taxa de aprendizado (Learning Rate - α)
GAMMA = 0.85          # Fator de desconto para recompensas futuras (Discount Factor - γ)
EPSILON_START = 0.40  # Taxa inicial de exploração (ε-greedy)
EPSILON_MIN = 0.05    # Taxa mínima de exploração
EPSILON_DECAY = 0.992 # Fator de decaimento de ε por episódio
EPISODES = 500        # Total de episódios de treinamento

# Inicialização da Q-Table usando apenas dicionários nativos: Q[estado][acao] = 0.0
Q_TABLE = {
    state: {action: 0.0 for action in ACTIONS}
    for state in STATES
}


def get_network_state(episode: int) -> str:
    """
    Determina o estado atual da rede (ciclando entre os perfis de tráfego
    para garantir que todos os estados da Q-Table sejam visitados).
    """
    return STATES[episode % len(STATES)]


def select_action(state: str, epsilon: float) -> tuple[str, str]:
    """
    Política Epsilon-Greedy implementada do zero:
    - Com probabilidade `epsilon`: escolhe um nó aleatório (Exploração).
    - Com probabilidade `1 - epsilon`: escolhe o nó com maior valor Q(s, a) (Explotação).
    """
    if random.random() < epsilon:
        return random.choice(ACTIONS), "EXPLORACAO"

    state_actions = Q_TABLE[state]
    max_q = max(state_actions.values())
    # Em caso de empate (ex.: início do treino com tudo 0.0), sorteia entre os empatados
    best_actions = [act for act, q_val in state_actions.items() if q_val == max_q]
    return random.choice(best_actions), "EXPLOTACAO"


def calculate_reward(latency_ms: float, timed_out: bool) -> float:
    """
    Função de Recompensa baseada na latência de resposta HTTP:
    - Timeout ou falha de conexão: punição severa (-100.0)
    - Latência < 100ms: pontuação máxima (+20.0)
    - Latência entre 100ms e 250ms: recompensa moderada/baixa (+2.0)
    - Latência >= 250ms: penalidade por lentidão (-15.0)
    """
    if timed_out:
        return -100.0
    if latency_ms < 100.0:
        return +20.0
    if latency_ms < 250.0:
        return +2.0
    return -15.0


def dispatch_request(action_node: str, current_state: str) -> tuple[float, bool]:
    """
    Envia a requisição HTTP real através do proxy Nginx para o nó selecionado.
    Sob estados de carga mais alta, adiciona um pequeno overhead simulado na query
    do `traefik/whoami` para refletir o estresse da rede.
    """
    extra_load_ms = {"carga_baixa": 0, "carga_media": 15, "carga_alta": 35}[current_state]
    url = f"{NGINX_BASE_URL}/{action_node}"

    start_time = time.perf_counter()
    try:
        response = requests.get(
            url,
            headers={"X-Network-State": current_state},
            params={"load_sim": f"{extra_load_ms}ms"},
            timeout=REQUEST_TIMEOUT_SEC,
        )
        response.raise_for_status()
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        return latency_ms, False
    except requests.exceptions.Timeout:
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        return latency_ms, True
    except requests.exceptions.RequestException:
        # Fallback didático caso o script seja testado sem o Docker estar ativo no momento
        simulated_base = {"node1": 28.0, "node2": 155.0, "node3": 650.0}[action_node]
        jitter = random.uniform(-10.0, 20.0)
        latency_ms = max(5.0, simulated_base + extra_load_ms + jitter)
        timed_out = latency_ms > (REQUEST_TIMEOUT_SEC * 1000.0)
        return latency_ms, timed_out


def update_q_table(state: str, action: str, reward: float, next_state: str) -> float:
    """
    EQUAÇÃO DE BELLMAN (Q-LEARNING TABULAR):
    Q(s, a) <- Q(s, a) + alpha * [ R + gamma * max_{a'} Q(s', a') - Q(s, a) ]
    """
    current_q = Q_TABLE[state][action]
    max_future_q = max(Q_TABLE[next_state].values())

    # Cálculo explícito do Alvo Temporal (TD Target) e Erro Temporal (TD Error)
    td_target = reward + (GAMMA * max_future_q)
    td_error = td_target - current_q

    # Atualização in-place na Q-Table
    new_q = current_q + (ALPHA * td_error)
    Q_TABLE[state][action] = new_q
    return new_q


def print_q_table() -> None:
    """Exibe a Q-Table formatada no terminal e a política ótima aprendida."""
    print("\n" + "=" * 74)
    print(f"{'ESTADO DA REDE':<18} | {'NODE 1 (1.0 CPU)':>14} | {'NODE 2 (0.25 CPU)':>15} | {'NODE 3 (0.05 CPU)':>15} | {'MELHOR ROTA'}")
    print("-" * 74)
    for state, actions in Q_TABLE.items():
        best_node = max(actions, key=actions.get)
        print(
            f"{state:<18} | "
            f"{actions['node1']:>14.2f} | "
            f"{actions['node2']:>15.2f} | "
            f"{actions['node3']:>15.2f} | "
            f"-> {best_node.upper()}"
        )
    print("=" * 74)


def main() -> None:
    epsilon = EPSILON_START
    action_counts = {node: 0 for node in ACTIONS}

    print("Iniciando treinamento do Balanceador de Carga Autonomo (500 episodios)...")
    print(f"Hiperparametros: alpha={ALPHA}, gamma={GAMMA}, epsilon_inicial={EPSILON_START}\n")

    for episode in range(1, EPISODES + 1):
        # 1. Observa o estado atual da rede (s)
        state = get_network_state(episode)

        # 2. Escolhe uma ação de roteamento (a) via política ε-greedy
        action, mode = select_action(state, epsilon)
        action_counts[action] += 1

        # 3. Executa o roteamento HTTP e mede a latência real da resposta
        latency_ms, timed_out = dispatch_request(action, state)

        # 4. Calcula a recompensa imediata (R)
        reward = calculate_reward(latency_ms, timed_out)

        # 5. Observa o próximo estado da rede (s')
        next_state = get_network_state(episode + 1)

        # 6. Atualiza a Q-Table aplicando a Equação de Bellman
        new_q = update_q_table(state, action, reward, next_state)

        # 7. Decaimento da taxa de exploração (ε)
        epsilon = max(EPSILON_MIN, epsilon * EPSILON_DECAY)

        # Logs periódicos a cada 25 episódios (e nos primeiros 5)
        if episode <= 5 or episode % 25 == 0 or episode == EPISODES:
            status_str = "TIMEOUT!" if timed_out else f"{latency_ms:6.1f}ms"
            print(
                f"[Ep {episode:03d}/{EPISODES}] Estado: {state:<11} | "
                f"Rota: {action} ({mode:<10}) | Latencia: {status_str} | "
                f"R: {reward:+6.1f} | Q(s,a): {new_q:7.2f} | eps: {epsilon:.3f}"
            )

    # Relatório Final
    print_q_table()
    print("\nDistribuicao total de requisicoes roteadas nos 500 episodios:")
    for node, count in action_counts.items():
        pct = (count / EPISODES) * 100
        print(f"  - {node}: {count} requisicoes ({pct:.1f}%)")


if __name__ == "__main__":
    main()
