# Projeto 2: Balanceador de Carga Inteligente (Docker + Python)

Neste laboratório, aplicamos **Q-Learning Tabular** na infraestrutura de microsserviços. O agente em Python aprende de forma autônoma para qual nó de servidor rotear requisições HTTP medindo a latência real das respostas através de um proxy reverso Nginx.

## Arquitetura do Ambiente

- **`node1` (`traefik/whoami`):** Limite de `1.00` CPU (alta performance, responde em $< 100\text{ms}$).
- **`node2` (`traefik/whoami`):** Limite de `0.25` CPU (performance moderada, $\approx 150\text{ms}$).
- **`node3` (`traefik/whoami`):** Limite de `0.05` CPU (estrangulado, sofre *timeout* $> 500\text{ms}$).
- **`nginx-proxy` (`nginx:alpine`):** Proxy na porta `8080` que expõe `/node1`, `/node2` e `/node3`.

## Como Executar

1. Certifique-se de que o **Docker Desktop** está em execução.
2. Suba a infraestrutura conteinerizada:
   ```bash
   docker compose up -d
   ```
3. Instale a biblioteca `requests` (caso não a possua no seu ambiente virtual Python) e execute os 500 episódios de treinamento:
   ```bash
   pip install requests
   python agente.py
   ```
4. Ao final da execução, derrube os contêineres:
   ```bash
   docker compose down
   ```
