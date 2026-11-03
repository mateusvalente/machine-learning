# Projeto 1: O Agente Tamagotchi (Q-Learning no Navegador)

Neste laboratório prático, construímos um agente de **Aprendizado por Reforço (Q-Learning Tabular)** 100% em HTML, CSS e JavaScript puro (Vanilla JS), sem bibliotecas externas.

## Dinâmica do Ambiente e Equação de Bellman

- **Estados ($S$):** Níveis discretos de **Fome** ($0$ a $10$) e **Energia** ($0$ a $10$), totalizando $11 \times 11 = 121$ estados.
- **Ações ($A$):** `alimentar`, `dormir` e `ignorar`.
- **Recompensa ($R$):**
  - $+10$: quando Fome e Energia permanecem na zona equilibrada ($3 \le \text{status} \le 7$).
  - $-10$: se qualquer um dos status atingir os extremos críticos ($0$ ou $10$), encerrando o episódio.
  - $-1$: custo metabólico na zona de alerta intermediária.

A cada ciclo (`setInterval`), a Q-Table é atualizada em memória e no DOM usando a Equação de Bellman:

$$Q(s, a) \leftarrow Q(s, a) + \alpha \cdot \left[ R + \gamma \cdot \max_{a'} Q(s', a') - Q(s, a) \right]$$

## Como Executar

1. Basta abrir o arquivo [`index.html`](./index.html) em qualquer navegador moderno, ou iniciar um servidor HTTP na raiz do repositório:
   ```bash
   python -m http.server 8000
   ```
2. Acesse `http://localhost:8000/labs-rl/projeto1-tamagotchi/` e observe a Q-Table convergindo em tempo real. Use o botão **Velocidade** para acelerar o treinamento (`15ms` por passo).
