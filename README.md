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
- Rede Neural de Base Radial, centros, distâncias e ativações Gaussianas.
- Learning Vector Quantization, vetores protótipo, LVQ1 e LVQ2.1.
- Transformers, embeddings, posição, Self-Attention e previsão de tokens.
- GANs, treinamento adversário, Gerador, Discriminador e geração de dígitos.
- CNNs, convolução, ReLU, Max Pooling e classificação de imagens.
- Separação linear, separação não linear, XOR e classificação multiclasse.
- Generalização, underfitting, ajuste adequado e overfitting.
- Convergência, gradiente estocástico, mini-batches, seeds e reprodutibilidade.
- Preparação de dados, valores ausentes, escala, vazamento e pipelines.
- Variáveis contínuas, discretas, categóricas nominais e ordinais.
- Ordinal Encoding, One-Hot Encoding e escolha do tratamento por modelo.
- SVM linear, margem máxima, vetores de suporte, perda hinge e kernels.

## Páginas principais

As páginas canônicas acompanham os mesmos grupos exibidos no menu:

- [`pages/machine-learning/`](pages/machine-learning/) — introdução, aprendizagem, treino, regressão linear e não linear, classificação, convergência, preparação de dados, generalização e modelos de IA.
- [`pages/aprendizagem-supervisionada/`](pages/aprendizagem-supervisionada/) — visão geral, Árvore de Decisão, SVM e LVQ.
- [`pages/redes-neurais/`](pages/redes-neurais/) — introdução, Perceptron, MLP, ADALINE, MADALINE, RBF, Transformers, GANs, CNNs e laboratórios.

Não há páginas soltas em `pages/`: cada HTML pertence ao mesmo grupo temático apresentado na navegação lateral.

## Laboratórios interativos

- **Portas lógicas:** treinamento e teste de AND, OR e outras configurações com um Perceptron.
- **Separação de grupos:** criação de pontos das classes A e B e comparação entre fronteiras lineares e não lineares.
- **XOR:** comparação entre um Perceptron simples e uma rede multicamadas.
- **XOR com dois neurônios ocultos:** duas retas formam a faixa de decisão responsável pelos casos positivos do XOR.
- **Fronteiras ocultas:** ajuste individual dos pesos e do bias de diferentes neurônios.
- **Laboratório 3D:** três entradas (`x₁`, `x₂`, `x₃`) e planos de decisão rotacionáveis no espaço.
- **Classificação multiclasse:** separação de três grupos em regiões diferentes.
- **Regressão matemática interativa:** pontos arrastáveis, ajuste manual dos coeficientes, solução OLS, gradiente descendente, resíduos, MSE e R² para reta e parábola.
- **ADALINE e MADALINE:** acompanhamento dos cálculos, erros e ajustes realizados durante o aprendizado.
- **Rede configurável:** escolha de 1 a 10 entradas, até 4 camadas ocultas, neurônios por camada e de 1 a 4 saídas, com dataset sintético e backpropagation completo.
- **Regressão linear:** duas entradas automotivas, uma saída contínua, plano tridimensional, custo e somatórias dos gradientes.
- **LVQ1 e LVQ2.1:** protótipos competitivos, fronteiras por proximidade, janela de dúvida e ajustes supervisionados.
- **RBF para classificação:** regiões Gaussianas locais, centros, distâncias, fronteira não linear e erro × acurácia.
- **RBF para regressão:** sete curvas-base, saída linear, MSE, R² e aproximação de uma função contínua.
- **Mini Transformer:** embeddings, posições, matriz causal de Self-Attention, cross-entropy e geração de tokens.
- **Mini GAN:** jogo entre Gerador e Discriminador, formação gradual de dígitos e perdas adversárias.
- **Mini CNN:** desenho livre, quatro mapas convolucionais, ReLU, Max Pooling e classificação Softmax.
- **SVM linear:** reta de decisão, margens `u=±1`, vetores de suporte, perda hinge e teste de novos pontos.

Os experimentos apresentam, conforme o modelo estudado:

- Valores das entradas, pesos e bias.
- Potenciais de ativação dos neurônios.
- Previsão, resposta esperada e erro.
- Atualizações realizadas durante o treinamento.
- Gráficos de erro e taxa de acerto.
- Representações das fronteiras de decisão.
- Código JavaScript didático, separado em funções e comentado.
- Opção **Treinar até convergir** com critério por modelo e limite de segurança, sem substituir os treinamentos manuais.

## Tecnologias

- HTML5
- CSS3
- JavaScript puro
- Canvas 2D para gráficos, redes e projeções tridimensionais
- Highlight.js para destacar os exemplos de código

O projeto não utiliza framework, processo de compilação ou instalação obrigatória de dependências.

## Navegação

Todas as páginas principais utilizam a mesma navegação:

- Barra superior com ações **Voltar** e **Home**.
- Barra lateral recolhida por padrão no desktop.
- Expansão automática ao passar o mouse.
- Botão para manter a barra lateral fixa.
- Submenu de laboratórios com atalhos para cada experimento.
- Submenu de preparação de dados com visão geral, tipos de variáveis e codificação de categorias.
- Grupo recolhível de **Redes Neurais**, incluindo modelos e laboratórios aninhados.
- Menu móvel acionado pelo botão **Menu**.

A preferência de manter a lateral fixa é salva no navegador.

### Manutenção do menu

- [`js/navigation.js`](js/navigation.js) contém a constante `MENU`, que define títulos, ícones, caminhos e submenus.
- [`css/navigation.css`](css/navigation.css) contém toda a aparência e responsividade da barra superior e lateral.
- Cada página mantém apenas `<header class="site-header"></header>` e carrega `navigation.js` no fim do documento.
- O componente encontra a raiz do projeto pelo próprio endereço do script, portanto funciona em qualquer profundidade de pasta.

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
├── index.html                    # Página inicial com acesso direto às trilhas
├── assets/
│   └── images/                   # Imagens e diagramas utilizados nas aulas
├── css/
│   ├── styles.css                # Estilos compartilhados por todas as páginas
│   ├── configurable-network-lab.css # Estilos do laboratório configurável
│   ├── regression-lab.css        # Estilos do laboratório de regressão
│   ├── data-preparation.css       # Estilos das páginas de preparação de dados
│   ├── svm.css                    # Teoria e laboratório de SVM
│   ├── model-guide.css            # Guia editorial das famílias de modelos de IA
│   ├── learning-models.css        # Exemplos de modelos por tipo de aprendizagem
│   ├── convergence.css            # Teoria e experimento visual de convergência
│   ├── lab-convergence.css        # Estado e retorno do treino até convergir
│   ├── navigation.css             # Todo o visual do menu compartilhado
│   ├── rbf-labs.css              # Estilos dos dois laboratórios RBF
│   └── advanced-neural.css       # Teoria e laboratórios de Transformer, GAN e CNN
├── js/
│   ├── labs/                     # Visualizações e algoritmos dos laboratórios
│   ├── code-highlighting.js      # Destaque dos códigos didáticos
│   ├── image-lightbox.js         # Ampliação das imagens ao clicar
│   ├── navigation.js             # Configuração e geração do menu compartilhado
│   ├── convergence-demo.js       # Simulação estocástica, seeds e gráfico de perda
│   ├── lab-convergence.js        # Controlador compartilhado para treinar até convergir
│   └── *.js                      # Scripts específicos de cada capítulo
└── pages/
    ├── machine-learning/             # Primeiro grupo do menu
    ├── aprendizagem-supervisionada/  # Algoritmos supervisionados
    └── redes-neurais/                # Teoria, arquiteturas e laboratórios
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
