# Projeto 2: Balanceador de Carga Autônomo (Docker + Python)

Este kit contém toda a infraestrutura conteinerizada para executar e testar o **Balanceador de Carga Inteligente via Q-Learning Tabular**.

## 1. Arquitetura dos Contêineres (`docker-compose.yml`)

- **`node1` (`traefik/whoami`):** `cpus: 1.00` — Servidor rápido (responde em $< 50\text{ms}$).
- **`node2` (`traefik/whoami`):** `cpus: 0.25` — Servidor intermediário (responde em $\approx 150\text{ms}$).
- **`node3` (`traefik/whoami`):** `cpus: 0.05` — Servidor estrangulado (sofre *timeout* $> 500\text{ms}$).
- **`nginx-proxy` (`nginx:alpine`):** Proxy reverso na porta `8080` roteando `/node1`, `/node2` e `/node3`.

## 2. Parâmetros e Algoritmo (`agente.py`)

- **Algoritmo:** Q-Learning Tabular Off-Policy (Equação de Bellman):
  $$Q(s, a) \leftarrow Q(s, a) + \alpha \cdot \left[ R + \gamma \cdot \max_{a'} Q(s', a') - Q(s, a) \right]$$
- **Taxa de Aprendizado ($\alpha$):** `0.25`
- **Fator de Desconto ($\gamma$):** `0.85`
- **Exploração ($\varepsilon$-greedy):** Inicia em `0.40` e decai `0.992` por episódio até `0.05`.
- **Função de Recompensa ($R$):**
  - Latência $< 100\text{ms} \rightarrow +20.0$
  - Latência entre $100\text{ms}$ e $250\text{ms} \rightarrow +2.0$
  - Latência $\ge 250\text{ms} \rightarrow -15.0$
  - Timeout ($> 500\text{ms}$) $\rightarrow -100.0$

## 3. Como Executar Passo a Passo

1. Suba os contêineres Docker:
   ```bash
   docker compose up -d
   ```
2. Instale a dependência `requests`:
   ```bash
   pip install -r requirements.txt
   ```
3. Execute o treinamento de 500 episódios do Agente RL:
   ```bash
   python agente.py
   ```
4. Simule uma **rajada concorrente de múltiplas requisições** comparando o *Round-Robin* tradicional contra o Agente Q-Learning:
   ```bash
   python simulador_trafego.py --requisicoes 60 --concorrencia 6
   ```
5. Ao finalizar o laboratório, desligue o ambiente:
   ```bash
   docker compose down
   ```
