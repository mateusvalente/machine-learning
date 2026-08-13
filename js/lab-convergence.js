// =============================================================================
// CONTROLADOR COMPARTILHADO: TREINAR ATÉ CONVERGIR
//
// Este arquivo não substitui o algoritmo de nenhum laboratório. Ele aciona o
// botão original de "1 época" ou "1 rodada", lê as métricas que a própria
// página atualiza e decide quando parar.
// =============================================================================

(function () {
  'use strict';

  var scriptUrl = document.currentScript && document.currentScript.src;
  var projectRoot = scriptUrl ? new URL('../', scriptUrl) : new URL('../', window.location.href);
  var page = window.location.pathname.replace(/\\/g, '/').split('/').pop().toLowerCase();

  // Cada linha contém:
  // [botão de uma etapa, botão após o qual inserir, métrica principal, modo,
  //  alvo, perda auxiliar, limite, mínimo, paciência, tolerância, bloco por frame]
  var configurations = {
    'perceptron.html': ['epochBtn', 'autoBtn', 'accuracyStat', 'max', 100, '', 1000, 8, 14, 0.0001, 2],
    'separacao.html': ['trainOne', 'trainAuto', 'accuracy', 'max', 100, 'loss', 3000, 15, 18, 0.0005, 2],
    'xor.html': ['trainOne', 'trainAuto', 'accuracy', 'max', 100, 'loss', 12000, 80, 25, 0.00005, 3],
    'multiclasse.html': ['trainOne', 'trainAuto', 'accuracy', 'max', 100, 'loss', 8000, 50, 22, 0.0001, 3],
    'perceptron-multicamadas.html': ['mlpTrainEpoch', 'mlpTrainAuto', 'mlpAccuracy', 'max', 100, 'mlpLoss', 12000, 80, 25, 0.00005, 3],
    'madaline.html': ['madalineTrainEpoch', 'madalineTrainAuto', 'madalineAccuracy', 'max', 100, 'madalineLoss', 5000, 30, 20, 0.0001, 3],
    'lvq-laboratorio.html': ['lvqTrainEpoch', 'lvqTrainHundred', 'lvqErrorMetric', 'min', 0, 'lvqErrorMetric', 3000, 20, 18, 0.005, 3],
    'rbf-classificacao.html': ['rbfClassTrainOne', 'rbfClassTrainHundred', 'rbfClassAccuracy', 'max', 95, 'rbfClassLoss', 4000, 20, 18, 0.00005, 3],
    'rbf-regressao.html': ['rbfRegressionTrainOne', 'rbfRegressionTrainHundred', 'rbfRegressionR2', 'max', 0.99, 'rbfRegressionMse', 5000, 30, 22, 0.00001, 3],
    'rede-configuravel.html': ['trainOne', 'trainHundred', 'sampleAccuracyMetric', 'max', 100, 'lossMetric', 12000, 100, 25, 0.00005, 3],
    'regressao-linear.html': ['regressionTrainOne', 'regressionTrainHundred', 'regressionR2', 'max', 0.99, 'regressionMse', 10000, 30, 22, 0.00001, 4],
    'svm-laboratorio.html': ['svmEpoch', 'svmTrain', 'svmLossMetric', 'min', 0.001, 'svmLossMetric', 3000, 20, 18, 0.00005, 3],
    'transformer-laboratorio.html': ['transformerTrainOne', 'transformerTrainFifty', 'transformerLoss', 'stable', 0, 'transformerLoss', 8000, 100, 30, 0.00005, 3],
    'cnn-laboratorio.html': ['cnnTrainOne', 'cnnTrainHundred', 'cnnAccuracy', 'max', 99.9, 'cnnLoss', 3000, 30, 20, 0.00005, 1],
    'gan-laboratorio.html': ['ganTrainOne', 'ganTrainMany', 'ganSimilarity', 'max', 96, 'ganGLoss', 10000, 150, 35, 0.0001, 20]
  };

  var configuration = configurations[page];
  if (!configuration) return;

  var stepButton = document.getElementById(configuration[0]);
  var insertionAnchor = document.getElementById(configuration[1]);
  var metricElement = document.getElementById(configuration[2]);
  var lossElement = configuration[5] ? document.getElementById(configuration[5]) : null;
  if (!stepButton || !insertionAnchor || !metricElement) return;

  // Carrega apenas nos laboratórios que usam o controlador.
  var style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('css/lab-convergence.css', projectRoot).href;
  document.head.appendChild(style);

  var button = document.createElement('button');
  button.type = 'button';
  button.id = 'trainUntilConvergence';
  button.className = 'button outline full-button train-until-convergence';
  button.textContent = 'Treinar até convergir';
  button.title = 'Repete a opção de uma época até atingir o critério ou o limite de segurança.';
  insertionAnchor.insertAdjacentElement('afterend', button);

  var feedback = document.createElement('div');
  feedback.className = 'lab-convergence-feedback';
  feedback.setAttribute('aria-live', 'polite');
  feedback.textContent = criterionDescription();
  button.insertAdjacentElement('afterend', feedback);

  var running = false;
  var attempts = 0;
  var stableCount = 0;
  var previousObserved = null;
  var unchangedDomCount = 0;
  var previousMetricText = '';

  // Converte "4/4" em 100, "97,5%" em 97.5 e números comuns em Number.
  function readNumber(element) {
    if (!element) return NaN;
    var text = element.textContent.trim().replace(/−/g, '-');
    var ratio = text.match(/(-?\d+(?:[.,]\d+)?)\s*\/\s*(-?\d+(?:[.,]\d+)?)/);
    if (ratio) {
      var numerator = Number(ratio[1].replace(',', '.'));
      var denominator = Number(ratio[2].replace(',', '.'));
      return denominator === 0 ? NaN : 100 * numerator / denominator;
    }
    var number = text.match(/-?\d+(?:[.,]\d+)?/);
    if (!number) return NaN;
    return Number(number[0].replace(',', '.'));
  }

  function criterionDescription() {
    var mode = configuration[3];
    var target = configuration[4];
    if (mode === 'max') return 'Critério: atingir ' + target + ' na métrica principal ou estabilizar a perda.';
    if (mode === 'min') return 'Critério: reduzir a métrica até ' + target + ' ou estabilizar a perda.';
    return 'Critério: estabilizar a perda durante várias épocas.';
  }

  function setFeedback(message, type) {
    feedback.textContent = message;
    feedback.className = 'lab-convergence-feedback' + (type ? ' ' + type : '');
  }

  function finish(message, type) {
    running = false;
    button.classList.remove('is-running');
    button.textContent = 'Treinar até convergir';
    setFeedback(message, type);
  }

  function targetReached(value) {
    if (!isFinite(value)) return false;
    if (configuration[3] === 'max') return value >= configuration[4];
    if (configuration[3] === 'min') return value <= configuration[4];
    return false;
  }

  // Usa preferencialmente a perda para detectar um platô. Se não houver perda,
  // usa a métrica principal. A tolerância é absoluta para valores menores que 1.
  function updateStability(metricValue) {
    var observed = readNumber(lossElement);
    if (!isFinite(observed)) observed = metricValue;
    if (!isFinite(observed)) return;

    if (previousObserved !== null) {
      var scale = Math.max(1, Math.abs(previousObserved));
      var difference = Math.abs(observed - previousObserved);
      if (difference <= configuration[9] * scale) stableCount = stableCount + 1;
      else stableCount = 0;
    }
    previousObserved = observed;
  }

  function processOneStep() {
    stepButton.click();
    attempts = attempts + 1;

    var metricValue = readNumber(metricElement);
    var currentMetricText = metricElement.textContent.trim();
    if (currentMetricText === previousMetricText) unchangedDomCount = unchangedDomCount + 1;
    else unchangedDomCount = 0;
    previousMetricText = currentMetricText;
    updateStability(metricValue);

    if (targetReached(metricValue)) {
      finish('Convergência atingida após ' + attempts + ' etapas: critério principal alcançado.', 'success');
      return true;
    }

    if (attempts >= configuration[7] && stableCount >= configuration[8]) {
      finish('Treinamento estabilizado após ' + attempts + ' etapas. A perda deixou de mudar de forma relevante.', 'success');
      return true;
    }

    // Se nem a métrica nem a perda existem ainda, os dados podem estar carregando.
    if (attempts >= 25 && unchangedDomCount >= 25 && !isFinite(metricValue) && !isFinite(readNumber(lossElement))) {
      finish('O treinamento ainda não iniciou. Aguarde o carregamento dos dados e tente novamente.', 'warning');
      return true;
    }

    if (attempts >= configuration[6]) {
      finish('Limite de segurança de ' + configuration[6] + ' etapas atingido sem confirmar convergência.', 'warning');
      return true;
    }
    return false;
  }

  function cycle() {
    if (!running) return;
    var chunk = configuration[10];

    for (var index = 0; index < chunk && running; index++) {
      if (processOneStep()) return;
    }
    button.textContent = 'Parar · ' + attempts + ' etapas';
    setFeedback('Treinando… métrica atual: ' + metricElement.textContent.trim() + '. Estabilidade: ' + stableCount + '/' + configuration[8] + '.', '');
    window.setTimeout(cycle, 0);
  }

  function start() {
    if (running) {
      finish('Treinamento interrompido pelo usuário após ' + attempts + ' etapas.', 'warning');
      return;
    }

    running = true;
    attempts = 0;
    stableCount = 0;
    previousObserved = null;
    unchangedDomCount = 0;
    previousMetricText = metricElement.textContent.trim();
    button.classList.add('is-running');
    button.textContent = 'Parar · 0 etapas';
    setFeedback('Treinamento iniciado. O navegador continuará responsivo entre os blocos.', '');
    window.setTimeout(cycle, 0);
  }

  button.addEventListener('click', start);
}());
