# Laboratório de Aprendizado por Reforço: Do Zero à Infraestrutura

Bem-vindo ao repositório de práticas de Machine Learning. Este módulo foca na desconstrução do Aprendizado por Reforço (RL), abandonando frameworks de alto nível para entender a matemática e a lógica de tomada de decisão (Equação de Bellman) na prática.

🔗 **Repositório Oficial:** [github.com/mateusvalente/machine-learning](https://github.com/mateusvalente/machine-learning)

## O que vamos construir?

Muitos cursos focam em rotas ou jogos complexos. Aqui, criaremos dois projetos orientados a tarefas que ilustram como um agente inteligente aprende regras e comportamentos invisíveis através de tentativa, erro e recompensas.

### Projeto 1: O Agente Tamagotchi (Q-Learning no Navegador)
Neste laboratório, implementamos um mascote virtual usando **HTML, CSS e JavaScript puro (Vanilla JS)**.
* **O Desafio:** A IA não sabe o que é fome ou energia. Ela apenas observa números (Estados) e possui botões que pode apertar (Ações: Alimentar, Dormir, Ignorar).
* **O Aprendizado:** Através do Q-Learning Tabular, criamos uma matriz em memória. Sempre que a IA toma uma ação que mantém o mascote vivo, ela recebe uma pontuação positiva. O loop de treinamento roda diretamente no seu navegador, atualizando a interface em tempo real.
* **Tecnologias:** JavaScript, Manipulação de DOM/Canvas. Nenhuma biblioteca externa.
* **Diretório:** [`projeto1-tamagotchi/`](./projeto1-tamagotchi/)

### Projeto 2: Balanceador de Carga Inteligente (Docker + Python)
Elevamos a complexidade aplicando RL em infraestrutura. Criaremos um ambiente de microsserviços onde a IA atua como um balanceador de tráfego.
* **O Desafio:** Temos 3 contêineres servidores (com capacidades de CPU diferentes) e um proxy Nginx. O agente envia requisições e precisa aprender qual servidor responde mais rápido.
* **O Aprendizado:** O script Python (nosso Agente) avalia a latência da rede. Respostas rápidas geram recompensas altas; *timeouts* ou lentidão geram punições. A IA mapeia essas latências e converge para a rota mais eficiente.
* **Tecnologias:** Python (Requests), Docker, Docker Compose, imagens `traefik/whoami`.
* **Diretório:** [`projeto2-load-balancer/`](./projeto2-load-balancer/)

## Como Executar
Todo o código-fonte, arquitetura dos contêineres e instruções de execução estão disponíveis nos diretórios do projeto. Clone o repositório e siga os passos do README interno de cada laboratório para iniciar os treinamentos:

1. **Projeto 1 (Navegador):** Abra `projeto1-tamagotchi/index.html` diretamente no navegador (ou sirva com `python -m http.server 8000`).
2. **Projeto 2 (Docker + Python):** Entre em `projeto2-load-balancer/`, suba os contêineres com `docker compose up -d` e execute `python agente.py`.
