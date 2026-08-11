# Machine Learning Lab — Redes Neurais

Projeto educacional interativo para estudar redes neurais artificiais desde o Perceptron até arquiteturas multicamadas. O conteúdo combina teoria, visualizações em Canvas, contas matemáticas passo a passo e laboratórios executados diretamente no navegador.

O material foi desenvolvido para a disciplina de **Machine Learning da Uniube**, pelo **Prof. Me. Mateus de Sousa Valente**.

## Conteúdos abordados

- Neurônio biológico e neurônio artificial.
- Entradas, pesos sinápticos, bias e combinação linear.
- Potencial de ativação e sinal de saída.
- Funções Step, Linear, Sigmoid, Tanh e ReLU.
- Regra de aprendizagem do Perceptron.
- Erro `y − ŷ`, taxa de aprendizado, épocas e convergência.
- ADALINE, saída linear, erro quadrático e Regra Delta/LMS.
- MADALINE e combinação de várias unidades adaptativas.
- Perceptron Multicamadas, forward pass e backpropagation.
- Separação linear, separação não linear, XOR e classificação multiclasse.

## Páginas principais

| Página | Conteúdo |
| --- | --- |
| [`index.html`](index.html) | Introdução às redes neurais e às principais arquiteturas. |
| [`pages/perceptron-introducao.html`](pages/perceptron-introducao.html) | Teoria do Perceptron, elementos do neurônio e matemática do treinamento. |
| [`pages/perceptron-multicamadas.html`](pages/perceptron-multicamadas.html) | MLP, funções de ativação, backpropagation e experimentos visuais em 2D e 3D. |
| [`pages/adaline.html`](pages/adaline.html) | ADALINE, comparação com o Perceptron e Regra Delta. |
| [`pages/madaline.html`](pages/madaline.html) | MADALINE, múltiplas unidades e fronteiras de decisão. |
| [`pages/laboratorios.html`](pages/laboratorios.html) | Página intermediária para acessar todos os laboratórios. |

## Laboratórios interativos

- **Portas lógicas:** treinamento e teste de AND, OR e outras configurações com um Perceptron.
- **Separação de grupos:** criação de pontos das classes A e B e comparação entre fronteiras lineares e não lineares.
- **XOR:** comparação entre um Perceptron simples e uma rede multicamadas.
- **XOR com dois neurônios ocultos:** duas retas formam a faixa de decisão responsável pelos casos positivos do XOR.
- **Fronteiras ocultas:** ajuste individual dos pesos e do bias de diferentes neurônios.
- **Laboratório 3D:** três entradas (`x₁`, `x₂`, `x₃`) e planos de decisão rotacionáveis no espaço.
- **Classificação multiclasse:** separação de três grupos em regiões diferentes.
- **ADALINE e MADALINE:** acompanhamento dos cálculos, erros e ajustes realizados durante o aprendizado.

Os experimentos apresentam, conforme o modelo estudado:

- Valores das entradas, pesos e bias.
- Potenciais de ativação dos neurônios.
- Previsão, resposta esperada e erro.
- Atualizações realizadas durante o treinamento.
- Gráficos de erro e taxa de acerto.
- Representações das fronteiras de decisão.
- Código JavaScript didático, separado em funções e comentado.

## Tecnologias

- HTML5
- CSS3
- JavaScript puro
- Canvas 2D para gráficos, redes e projeções tridimensionais
- Highlight.js para destacar os exemplos de código

O projeto não utiliza framework, processo de compilação ou instalação obrigatória de dependências.

## Como executar

É possível abrir o arquivo [`index.html`](index.html) diretamente no navegador.

Para evitar restrições do navegador com arquivos locais, recomenda-se executar um servidor HTTP simples na raiz do projeto:

```bash
python -m http.server 8000
```

Depois, acesse:

```text
http://localhost:8000
```

Também é possível utilizar extensões como **Live Server** no Visual Studio Code.

## Estrutura do projeto

```text
perceptron/
├── index.html                    # Introdução às redes neurais
├── assets/
│   └── images/                   # Imagens e diagramas utilizados nas aulas
├── css/
│   └── styles.css                # Estilos compartilhados por todas as páginas
├── js/
│   ├── labs/                     # Visualizações e algoritmos dos laboratórios
│   ├── code-highlighting.js      # Destaque dos códigos didáticos
│   ├── image-lightbox.js         # Ampliação das imagens ao clicar
│   └── *.js                      # Scripts específicos de cada capítulo
└── pages/
    ├── perceptron-introducao.html
    ├── perceptron.html
    ├── perceptron-multicamadas.html
    ├── adaline.html
    ├── madaline.html
    ├── separacao.html
    ├── xor.html
    ├── multiclasse.html
    └── laboratorios.html
```

## Proposta didática

O objetivo é permitir que o estudante relacione a fórmula matemática ao comportamento visual do modelo. Ao alterar uma entrada, um peso ou o bias, os cálculos e as fronteiras são atualizados para mostrar como cada parâmetro participa da decisão.

As implementações JavaScript priorizam clareza: utilizam funções separadas, arrays, matrizes, laços simples e comentários explicativos para facilitar o acompanhamento em sala de aula.

## Referências

- [Embarcados — Rede Perceptron de uma única camada](https://embarcados.com.br/rede-perceptron-de-uma-unica-camada/)
- [Felipe Túlio — Aprendizado supervisionado e redes neurais artificiais](https://felipetulio.com.br/aprendizado-supervisionado-redes-neurais-artificiais/)
- [Google Machine Learning — Activation Functions](https://developers.google.com/machine-learning/crash-course/neural-networks/activation-functions)
- [Widrow e Lehr — 30 Years of Adaptive Neural Networks](https://isl.stanford.edu/~widrow/papers/j199030years.pdf)

---

**Material produzido para a disciplina de Machine Learning — Uniube**  
**Prof. Me. Mateus de Sousa Valente**
