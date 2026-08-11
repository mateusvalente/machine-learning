// Substitui os exemplos longos por versões introdutórias.
// Todo código mostrado usa arrays, matrizes, índices e laços for.
(function () {
  var codeElement = document.querySelector('.code-window code');
  var fileLabel = document.querySelector('.code-window-bar span');

  if (!codeElement || !fileLabel) {
    return;
  }

  var fileName = fileLabel.textContent;
  var code = '';

  // Mantém a descrição e o fluxo visual coerentes com a versão simplificada.
  function configureExplanation(description, labels) {
    var paragraph = document.querySelector('.algorithm-section header > p:not(.eyebrow)');
    var flowItems = document.querySelectorAll('.algorithm-flow span');

    if (paragraph) {
      paragraph.textContent = description;
    }

    for (var i = 0; i < flowItems.length; i++) {
      if (i < labels.length) {
        flowItems[i].textContent = labels[i];
      }
    }
  }

  if (fileName === 'perceptron-porta-logica.js') {
    configureExplanation(
      'Versão introdutória com uma matriz de amostras, um array para o modelo e laços for. Leia na ordem abaixo.',
      ['dados[][]', 'calcularPotencial()', 'degrau()', 'prever()', 'treinarAmostra()', 'treinarEpoca()']
    );
    code = `// Cada linha contém [x1, x2, resposta correta].
var amostras = [
  [0, 0, 0],
  [0, 1, 0],
  [1, 0, 0],
  [1, 1, 1]
];

// modelo[0] guarda os pesos; modelo[1] guarda o bias.
var modelo = [
  [0.1, -0.1],
  0
];

function degrau(u) {
  if (u >= 0) {
    return 1;
  }
  return 0;
}

function calcularPotencial(entradas, pesos, bias) {
  var soma = bias;

  for (var i = 0; i < entradas.length; i++) {
    soma = soma + entradas[i] * pesos[i];
  }

  return soma;
}

// Retorna [potencial u, previsão].
function prever(entradas, modeloAtual) {
  var u = calcularPotencial(
    entradas,
    modeloAtual[0],
    modeloAtual[1]
  );
  var yChapeu = degrau(u);
  return [u, yChapeu];
}

function treinarAmostra(amostra, modeloAtual, taxa) {
  var entradas = [amostra[0], amostra[1]];
  var respostaCorreta = amostra[2];
  var resultado = prever(entradas, modeloAtual);
  var erro = respostaCorreta - resultado[1];

  for (var i = 0; i < entradas.length; i++) {
    modeloAtual[0][i] = modeloAtual[0][i]
      + taxa * erro * entradas[i];
  }

  modeloAtual[1] = modeloAtual[1] + taxa * erro;
}

function treinarEpoca(dados, modeloAtual, taxa) {
  for (var i = 0; i < dados.length; i++) {
    treinarAmostra(dados[i], modeloAtual, taxa);
  }
}

for (var epoca = 0; epoca < 20; epoca++) {
  treinarEpoca(amostras, modelo, 0.2);
}

for (var i = 0; i < amostras.length; i++) {
  var entrada = [amostras[i][0], amostras[i][1]];
  var resultado = prever(entrada, modelo);
  console.log(entrada, resultado[1]);
}`;
  }

  if (fileName === 'separacao-linear.js') {
    configureExplanation(
      'Os pontos e o modelo são arrays numéricos. O treinamento usa somente índices, contas diretas e laços for.',
      ['pontos[][]', 'potencial()', 'step()', 'classificar()', 'treinarPonto()', 'treinarEpoca()']
    );
    code = `// Cada linha contém [x1, x2, classe].
// Classe B = 0 e classe A = 1.
var pontos = [
  [-0.8,  0.6, 0],
  [-0.4,  0.2, 0],
  [ 0.3,  0.5, 1],
  [ 0.7, -0.2, 1]
];

// modelo = [[w1, w2], bias].
var modelo = [
  [0.2, -0.1],
  0
];

function potencial(entrada, modeloAtual) {
  var w1 = modeloAtual[0][0];
  var w2 = modeloAtual[0][1];
  var bias = modeloAtual[1];
  return w1 * entrada[0] + w2 * entrada[1] + bias;
}

function step(u) {
  if (u >= 0) {
    return 1;
  }
  return 0;
}

function classificar(entrada, modeloAtual) {
  var u = potencial(entrada, modeloAtual);
  return step(u);
}

function treinarPonto(ponto, modeloAtual, taxa) {
  var entrada = [ponto[0], ponto[1]];
  var classeCorreta = ponto[2];
  var previsao = classificar(entrada, modeloAtual);
  var erro = classeCorreta - previsao;

  modeloAtual[0][0] = modeloAtual[0][0]
    + taxa * erro * entrada[0];
  modeloAtual[0][1] = modeloAtual[0][1]
    + taxa * erro * entrada[1];
  modeloAtual[1] = modeloAtual[1] + taxa * erro;

  return erro;
}

function treinarEpoca(dados, modeloAtual, taxa) {
  var quantidadeErros = 0;

  for (var i = 0; i < dados.length; i++) {
    var erro = treinarPonto(dados[i], modeloAtual, taxa);
    quantidadeErros = quantidadeErros + Math.abs(erro);
  }

  return quantidadeErros;
}

for (var epoca = 0; epoca < 100; epoca++) {
  var erros = treinarEpoca(pontos, modelo, 0.15);
  if (erros === 0) {
    break;
  }
}

// A fronteira satisfaz w1*x1 + w2*x2 + bias = 0.
function obterFronteira(modeloAtual) {
  var w1 = modeloAtual[0][0];
  var w2 = modeloAtual[0][1];
  var bias = modeloAtual[1];
  var inclinacao = -w1 / w2;
  var intercepto = -bias / w2;
  return [inclinacao, intercepto];
}

console.log(modelo);
console.log(obterFronteira(modelo));`;
  }

  if (fileName === 'mlp-xor.js') {
    configureExplanation(
      'A rede 2 → 2 → 1 é representada por matrizes. Forward, backpropagation e atualização usam apenas laços for.',
      ['sigmoid()', 'potencial()', 'forward()', 'backpropagation()', 'atualizarPesos()', 'treinarAmostra()']
    );
    code = `// Cada linha contém [x1, x2, resposta XOR].
var dadosXOR = [
  [0, 0, 0],
  [0, 1, 1],
  [1, 0, 1],
  [1, 1, 0]
];

// rede[0] = matriz de pesos da camada oculta.
// rede[1] = biases ocultos.
// rede[2] = pesos da saída.
// rede[3] = bias da saída.
var rede = [
  [[0.49, 0.22], [0.63, -0.69]],
  [0.14, 0.40],
  [0.76, 0.04],
  0.17
];

function sigmoid(u) {
  return 1 / (1 + Math.exp(-u));
}

function derivadaSigmoid(ativacao) {
  return ativacao * (1 - ativacao);
}

function potencial(entradas, pesos, bias) {
  var soma = bias;
  for (var i = 0; i < entradas.length; i++) {
    soma = soma + entradas[i] * pesos[i];
  }
  return soma;
}

// Retorna [potenciais ocultos, ativações, uSaida, yChapeu].
function forward(entradas, redeAtual) {
  var potenciaisOcultos = [0, 0];
  var ativacoesOcultas = [0, 0];

  for (var j = 0; j < 2; j++) {
    potenciaisOcultos[j] = potencial(
      entradas,
      redeAtual[0][j],
      redeAtual[1][j]
    );
    ativacoesOcultas[j] = sigmoid(potenciaisOcultos[j]);
  }

  var uSaida = potencial(
    ativacoesOcultas,
    redeAtual[2],
    redeAtual[3]
  );
  var yChapeu = sigmoid(uSaida);

  return [potenciaisOcultos, ativacoesOcultas, uSaida, yChapeu];
}

// Retorna [delta da saída, deltas ocultos].
function backpropagation(alvo, redeAtual, resultado) {
  var yChapeu = resultado[3];
  var deltaSaida = yChapeu - alvo;
  var deltasOcultos = [0, 0];

  for (var j = 0; j < 2; j++) {
    deltasOcultos[j] = deltaSaida
      * redeAtual[2][j]
      * derivadaSigmoid(resultado[1][j]);
  }

  return [deltaSaida, deltasOcultos];
}

function atualizarPesos(entradas, redeAtual, resultado, deltas, taxa) {
  var deltaSaida = deltas[0];

  for (var j = 0; j < 2; j++) {
    redeAtual[2][j] = redeAtual[2][j]
      - taxa * deltaSaida * resultado[1][j];
  }
  redeAtual[3] = redeAtual[3] - taxa * deltaSaida;

  for (var j = 0; j < 2; j++) {
    for (var i = 0; i < 2; i++) {
      redeAtual[0][j][i] = redeAtual[0][j][i]
        - taxa * deltas[1][j] * entradas[i];
    }
    redeAtual[1][j] = redeAtual[1][j] - taxa * deltas[1][j];
  }
}

function treinarAmostra(amostra, redeAtual, taxa) {
  var entradas = [amostra[0], amostra[1]];
  var alvo = amostra[2];
  var resultado = forward(entradas, redeAtual);
  var deltas = backpropagation(alvo, redeAtual, resultado);
  atualizarPesos(entradas, redeAtual, resultado, deltas, taxa);
}

for (var epoca = 0; epoca < 10000; epoca++) {
  for (var linha = 0; linha < dadosXOR.length; linha++) {
    treinarAmostra(dadosXOR[linha], rede, 0.7);
  }
}`;
  }

  if (fileName === 'mlp-tres-grupos.js') {
    configureExplanation(
      'A versão usa três neurônios ocultos e três saídas. Pesos, ativações e deltas são matrizes percorridas com for.',
      ['tanh()', 'softmax()', 'forward()', 'criarAlvo()', 'backpropagation()', 'atualizarPesos()']
    );
    code = `// Índices das classes: A = 0, B = 1, C = 2.
var classes = ['A', 'B', 'C'];

// Cada linha contém [x1, x2, índice da classe].
var dados = [
  [-0.8,  0.6, 0],
  [ 0.7,  0.6, 1],
  [ 0.0, -0.7, 2]
];

function tanh(u) {
  return Math.tanh(u);
}

function derivadaTanh(ativacao) {
  return 1 - ativacao * ativacao;
}

function potencial(entradas, pesos, bias) {
  var soma = bias;
  for (var i = 0; i < entradas.length; i++) {
    soma = soma + entradas[i] * pesos[i];
  }
  return soma;
}

function softmax(potenciais) {
  var maior = potenciais[0];
  var exponenciais = [0, 0, 0];
  var probabilidades = [0, 0, 0];
  var soma = 0;

  for (var i = 1; i < potenciais.length; i++) {
    if (potenciais[i] > maior) {
      maior = potenciais[i];
    }
  }

  for (var i = 0; i < potenciais.length; i++) {
    exponenciais[i] = Math.exp(potenciais[i] - maior);
    soma = soma + exponenciais[i];
  }

  for (var i = 0; i < potenciais.length; i++) {
    probabilidades[i] = exponenciais[i] / soma;
  }

  return probabilidades;
}

// rede = [pesosOcultos, biasesOcultos, pesosSaida, biasesSaida].
var rede = [
  [[0.2, -0.1], [-0.3, 0.4], [0.1, 0.3]],
  [0, 0, 0],
  [[0.2, -0.2, 0.1], [-0.1, 0.3, -0.2], [0.1, -0.2, 0.3]],
  [0, 0, 0]
];

// Retorna [ativações ocultas, potenciais de saída, probabilidades].
function forward(entradas, redeAtual) {
  var ativacoes = [0, 0, 0];
  var potenciaisSaida = [0, 0, 0];

  for (var j = 0; j < 3; j++) {
    var u = potencial(entradas, redeAtual[0][j], redeAtual[1][j]);
    ativacoes[j] = tanh(u);
  }

  for (var k = 0; k < 3; k++) {
    potenciaisSaida[k] = potencial(
      ativacoes,
      redeAtual[2][k],
      redeAtual[3][k]
    );
  }

  return [ativacoes, potenciaisSaida, softmax(potenciaisSaida)];
}

function criarAlvo(indiceCorreto) {
  var alvo = [0, 0, 0];
  alvo[indiceCorreto] = 1;
  return alvo;
}

// Retorna [deltas da saída, deltas ocultos].
function backpropagation(indiceCorreto, redeAtual, resultado) {
  var alvo = criarAlvo(indiceCorreto);
  var deltasSaida = [0, 0, 0];
  var deltasOcultos = [0, 0, 0];

  for (var k = 0; k < 3; k++) {
    deltasSaida[k] = resultado[2][k] - alvo[k];
  }

  for (var j = 0; j < 3; j++) {
    var erroRecebido = 0;
    for (var k = 0; k < 3; k++) {
      erroRecebido = erroRecebido
        + deltasSaida[k] * redeAtual[2][k][j];
    }
    deltasOcultos[j] = erroRecebido
      * derivadaTanh(resultado[0][j]);
  }

  return [deltasSaida, deltasOcultos];
}

function atualizarPesos(entradas, redeAtual, resultado, deltas, taxa) {
  for (var k = 0; k < 3; k++) {
    for (var j = 0; j < 3; j++) {
      redeAtual[2][k][j] = redeAtual[2][k][j]
        - taxa * deltas[0][k] * resultado[0][j];
    }
    redeAtual[3][k] = redeAtual[3][k] - taxa * deltas[0][k];
  }

  for (var j = 0; j < 3; j++) {
    for (var i = 0; i < 2; i++) {
      redeAtual[0][j][i] = redeAtual[0][j][i]
        - taxa * deltas[1][j] * entradas[i];
    }
    redeAtual[1][j] = redeAtual[1][j] - taxa * deltas[1][j];
  }
}

function treinarAmostra(amostra, redeAtual, taxa) {
  var entradas = [amostra[0], amostra[1]];
  var resultado = forward(entradas, redeAtual);
  var deltas = backpropagation(amostra[2], redeAtual, resultado);
  atualizarPesos(entradas, redeAtual, resultado, deltas, taxa);
}

for (var epoca = 0; epoca < 3000; epoca++) {
  for (var linha = 0; linha < dados.length; linha++) {
    treinarAmostra(dados[linha], rede, 0.1);
  }
}`;
  }

  if (fileName === 'madaline-simplificada.js') {
    configureExplanation(
      'Cada ADALINE é uma linha da matriz [w1, w2, bias]. A MR-I é apresentada com índices e laços for.',
      ['potencial()', 'sinal()', 'forward()', 'selecionarUnidades()', 'atualizarLMS()', 'treinarAmostra()']
    );
    code = `// Cada linha contém [x1, x2, alvo] em valores bipolares.
var dadosXOR = [
  [-1, -1, -1],
  [-1,  1,  1],
  [ 1, -1,  1],
  [ 1,  1, -1]
];

// Cada linha da rede contém [w1, w2, bias].
var rede = [
  [ 0.1,  0.1, 0],
  [-0.1, -0.1, 0]
];

function potencial(adaline, entradas) {
  return adaline[0] * entradas[0]
       + adaline[1] * entradas[1]
       + adaline[2];
}

function sinal(u) {
  if (u >= 0) {
    return 1;
  }
  return -1;
}

// Retorna [potenciais, decisões ocultas, saída OR].
function forward(redeAtual, entradas) {
  var potenciais = [0, 0];
  var decisoes = [0, 0];
  var saida = -1;

  for (var j = 0; j < 2; j++) {
    potenciais[j] = potencial(redeAtual[j], entradas);
    decisoes[j] = sinal(potenciais[j]);

    if (decisoes[j] === 1) {
      saida = 1;
    }
  }

  return [potenciais, decisoes, saida];
}

function selecionarUnidades(resultado, alvo) {
  var selecionadas = [];

  if (resultado[2] === alvo) {
    return selecionadas;
  }

  // Para produzir +1, escolhe quem está mais perto de zero.
  if (alvo === 1) {
    var maisProxima = 0;
    if (Math.abs(resultado[0][1]) < Math.abs(resultado[0][0])) {
      maisProxima = 1;
    }
    selecionadas[0] = maisProxima;
    return selecionadas;
  }

  // Para produzir -1, corrige todas que votaram +1.
  for (var j = 0; j < 2; j++) {
    if (resultado[1][j] === 1) {
      selecionadas[selecionadas.length] = j;
    }
  }

  return selecionadas;
}

function atualizarLMS(adaline, entradas, alvo, taxa) {
  var u = potencial(adaline, entradas);
  var erroLinear = alvo - u;

  adaline[0] = adaline[0] + taxa * erroLinear * entradas[0];
  adaline[1] = adaline[1] + taxa * erroLinear * entradas[1];
  adaline[2] = adaline[2] + taxa * erroLinear;
}

function treinarAmostra(amostra, redeAtual, taxa) {
  var entradas = [amostra[0], amostra[1]];
  var alvo = amostra[2];
  var resultado = forward(redeAtual, entradas);
  var selecionadas = selecionarUnidades(resultado, alvo);

  for (var i = 0; i < selecionadas.length; i++) {
    var indice = selecionadas[i];
    atualizarLMS(redeAtual[indice], entradas, alvo, taxa);
  }
}

for (var epoca = 0; epoca < 20; epoca++) {
  for (var linha = 0; linha < dadosXOR.length; linha++) {
    treinarAmostra(dadosXOR[linha], rede, 0.15);
  }
}`;
  }

  codeElement.textContent = code;
  codeElement.className = 'language-javascript';
}());
