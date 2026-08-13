// =============================================================================
// LABORATÓRIO SVM LINEAR
// Cada amostra é um array [x1, x2, classe].
// As classes são -1 e +1, como na formulação matemática binária da SVM.
// =============================================================================

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. DATASET E ESTADO DO MODELO
  // ---------------------------------------------------------------------------
  var data = [
    [-3.2, -1.5, -1], [-3.0,  1.2, -1], [-2.5,  2.3, -1],
    [-2.2, -0.2, -1], [-1.7, -2.1, -1], [-1.2,  0.8, -1],
    [ 1.0, -0.5, +1], [ 1.4,  2.0, +1], [ 1.8, -2.0, +1],
    [ 2.2,  0.4, +1], [ 2.8, -1.0, +1], [ 3.2,  2.2, +1]
  ];

  var weights = [0, 0];
  var bias = 0;
  var epoch = 0;
  var sampleCursor = 0;
  var lastStep = null;
  var testPoint = null;
  var lossHistory = [];
  var accuracyHistory = [];

  var canvas = document.getElementById('svmCanvas');
  var context = canvas.getContext('2d');
  var historyCanvas = document.getElementById('svmHistoryCanvas');
  var historyContext = historyCanvas.getContext('2d');

  var xMinimum = -4;
  var xMaximum = 4;
  var yMinimum = -3;
  var yMaximum = 3;
  var plotLeft = 64;
  var plotRight = 28;
  var plotTop = 28;
  var plotBottom = 58;

  // ---------------------------------------------------------------------------
  // 2. FUNÇÕES MATEMÁTICAS DA SVM
  // ---------------------------------------------------------------------------
  function potentialWith(sample, w1, w2, b) {
    return w1 * sample[0] + w2 * sample[1] + b;
  }

  function potential(sample) {
    return potentialWith(sample, weights[0], weights[1], bias);
  }

  function predict(sample) {
    if (potential(sample) >= 0) {
      return +1;
    }
    return -1;
  }

  function functionalMargin(sample) {
    return sample[2] * potential(sample);
  }

  function hingeLoss(sample) {
    return Math.max(0, 1 - functionalMargin(sample));
  }

  function readParameters() {
    var rate = Number(document.getElementById('svmLearningRate').value);
    var penalty = Number(document.getElementById('svmC').value);
    var lambda = Number(document.getElementById('svmLambda').value);

    if (!isFinite(rate) || rate <= 0) rate = 0.05;
    if (!isFinite(penalty) || penalty <= 0) penalty = 1;
    if (!isFinite(lambda) || lambda < 0) lambda = 0.02;
    return [rate, penalty, lambda];
  }

  // Apresenta uma amostra e aplica o subgradiente da perda hinge.
  function trainSample(sampleIndex) {
    var parameters = readParameters();
    var rate = parameters[0];
    var penalty = parameters[1];
    var lambda = parameters[2];
    var sample = data[sampleIndex];
    var x1 = sample[0];
    var x2 = sample[1];
    var target = sample[2];
    var oldW1 = weights[0];
    var oldW2 = weights[1];
    var oldBias = bias;
    var oldPotential = potentialWith(sample, oldW1, oldW2, oldBias);
    var oldMargin = target * oldPotential;
    var oldLoss = Math.max(0, 1 - oldMargin);
    var violatesMargin = oldMargin < 1;
    var shrink = 1 - rate * lambda;

    // A parcela de regularização diminui os pesos em todas as amostras.
    weights[0] = shrink * weights[0];
    weights[1] = shrink * weights[1];

    // A perda hinge corrige pesos e bias somente quando y*u < 1.
    if (violatesMargin) {
      weights[0] = weights[0] + rate * penalty * target * x1;
      weights[1] = weights[1] + rate * penalty * target * x2;
      bias = bias + rate * penalty * target;
    }

    // O array guarda todos os valores necessários para explicar esta etapa.
    lastStep = [
      sampleIndex, x1, x2, target,
      oldW1, oldW2, oldBias,
      oldPotential, oldMargin, oldLoss,
      violatesMargin,
      weights[0], weights[1], bias,
      rate, penalty, lambda
    ];
  }

  function finishEpochIfNeeded() {
    if (sampleCursor >= data.length) {
      sampleCursor = 0;
      epoch = epoch + 1;
      recordHistory();
    }
  }

  function trainNextSample() {
    trainSample(sampleCursor);
    sampleCursor = sampleCursor + 1;
    finishEpochIfNeeded();
    renderAll();
  }

  function trainOneEpoch(renderAfter) {
    var remaining = data.length - sampleCursor;

    for (var index = 0; index < remaining; index++) {
      trainSample(sampleCursor);
      sampleCursor = sampleCursor + 1;
    }

    finishEpochIfNeeded();
    if (renderAfter) renderAll();
  }

  function trainFiftyEpochs() {
    for (var count = 0; count < 50; count++) {
      trainOneEpoch(false);
    }
    renderAll();
  }

  // ---------------------------------------------------------------------------
  // 3. AVALIAÇÃO DO ESTADO ATUAL
  // ---------------------------------------------------------------------------
  function evaluate() {
    var totalLoss = 0;
    var correct = 0;
    var supportCount = 0;

    for (var index = 0; index < data.length; index++) {
      totalLoss = totalLoss + hingeLoss(data[index]);
      if (predict(data[index]) === data[index][2]) correct = correct + 1;
      if (functionalMargin(data[index]) <= 1.05) supportCount = supportCount + 1;
    }

    var norm = Math.sqrt(weights[0] * weights[0] + weights[1] * weights[1]);
    var width = norm > 0.000001 ? 2 / norm : 0;
    return [totalLoss / data.length, correct / data.length, supportCount, width, totalLoss];
  }

  function recordHistory() {
    var metrics = evaluate();
    lossHistory[lossHistory.length] = metrics[0];
    accuracyHistory[accuracyHistory.length] = metrics[1];
  }

  function resetModel() {
    weights[0] = 0;
    weights[1] = 0;
    bias = 0;
    epoch = 0;
    sampleCursor = 0;
    lastStep = null;
    testPoint = null;
    lossHistory = [];
    accuracyHistory = [];
    recordHistory();
    document.getElementById('svmTestResult').textContent = 'Digite as coordenadas e faça o teste.';
    renderAll();
  }

  // ---------------------------------------------------------------------------
  // 4. CONVERSÃO ENTRE COORDENADAS E CANVAS
  // ---------------------------------------------------------------------------
  function plotWidth() {
    return canvas.width - plotLeft - plotRight;
  }

  function plotHeight() {
    return canvas.height - plotTop - plotBottom;
  }

  function canvasX(value) {
    return plotLeft + (value - xMinimum) * plotWidth() / (xMaximum - xMinimum);
  }

  function canvasY(value) {
    return plotTop + (yMaximum - value) * plotHeight() / (yMaximum - yMinimum);
  }

  function graphX(pixel) {
    return xMinimum + (pixel - plotLeft) * (xMaximum - xMinimum) / plotWidth();
  }

  function graphY(pixel) {
    return yMaximum - (pixel - plotTop) * (yMaximum - yMinimum) / plotHeight();
  }

  // ---------------------------------------------------------------------------
  // 5. DESENHO DO PLANO, EIXOS, RETA E MARGENS
  // ---------------------------------------------------------------------------
  function drawDecisionBackground() {
    var cell = 12;
    if (Math.abs(weights[0]) < 0.000001 && Math.abs(weights[1]) < 0.000001) {
      context.fillStyle = '#f6f7fb';
      context.fillRect(plotLeft, plotTop, plotWidth(), plotHeight());
      return;
    }
    context.save();
    context.beginPath();
    context.rect(plotLeft, plotTop, plotWidth(), plotHeight());
    context.clip();

    for (var pixelY = plotTop; pixelY < plotTop + plotHeight(); pixelY = pixelY + cell) {
      for (var pixelX = plotLeft; pixelX < plotLeft + plotWidth(); pixelX = pixelX + cell) {
        var point = [graphX(pixelX + cell / 2), graphY(pixelY + cell / 2), 0];
        context.fillStyle = potential(point) >= 0 ? '#fff1e9' : '#eef0ff';
        context.fillRect(pixelX, pixelY, cell + 1, cell + 1);
      }
    }
    context.restore();
  }

  function drawAxes() {
    context.save();
    context.font = '14px DM Mono, monospace';
    context.textAlign = 'center';
    context.textBaseline = 'top';

    for (var x = xMinimum; x <= xMaximum; x++) {
      var px = canvasX(x);
      context.strokeStyle = x === 0 ? '#7d879b' : '#d9deea';
      context.lineWidth = x === 0 ? 2 : 1;
      context.beginPath();
      context.moveTo(px, plotTop);
      context.lineTo(px, plotTop + plotHeight());
      context.stroke();
      context.fillStyle = '#4f5b72';
      context.fillText(String(x), px, plotTop + plotHeight() + 12);
    }

    context.textAlign = 'right';
    context.textBaseline = 'middle';
    for (var y = yMinimum; y <= yMaximum; y++) {
      var py = canvasY(y);
      context.strokeStyle = y === 0 ? '#7d879b' : '#d9deea';
      context.lineWidth = y === 0 ? 2 : 1;
      context.beginPath();
      context.moveTo(plotLeft, py);
      context.lineTo(plotLeft + plotWidth(), py);
      context.stroke();
      context.fillStyle = '#4f5b72';
      context.fillText(String(y), plotLeft - 12, py);
    }

    context.textAlign = 'right';
    context.textBaseline = 'bottom';
    context.font = '700 16px DM Mono, monospace';
    context.fillText('x₁', plotLeft + plotWidth(), canvasY(0) - 8);
    context.textAlign = 'left';
    context.fillText('x₂', canvasX(0) + 9, plotTop + 5);
    context.restore();
  }

  function drawBoundary(level, color, dashed, lineWidth) {
    if (Math.abs(weights[0]) < 0.000001 && Math.abs(weights[1]) < 0.000001) return;

    context.save();
    context.beginPath();
    context.rect(plotLeft, plotTop, plotWidth(), plotHeight());
    context.clip();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.setLineDash(dashed ? [10, 8] : []);
    context.beginPath();

    if (Math.abs(weights[1]) > 0.000001) {
      var leftY = (level - bias - weights[0] * xMinimum) / weights[1];
      var rightY = (level - bias - weights[0] * xMaximum) / weights[1];
      context.moveTo(canvasX(xMinimum), canvasY(leftY));
      context.lineTo(canvasX(xMaximum), canvasY(rightY));
    } else {
      var verticalX = (level - bias) / weights[0];
      context.moveTo(canvasX(verticalX), canvasY(yMinimum));
      context.lineTo(canvasX(verticalX), canvasY(yMaximum));
    }

    context.stroke();
    context.restore();
  }

  function drawPoint(sample, index) {
    var px = canvasX(sample[0]);
    var py = canvasY(sample[1]);
    var isSupport = functionalMargin(sample) <= 1.05;
    var isCurrent = lastStep && lastStep[0] === index;

    if (isSupport) {
      context.strokeStyle = '#13a283';
      context.lineWidth = 5;
      context.beginPath();
      context.arc(px, py, 16, 0, Math.PI * 2);
      context.stroke();
    }

    if (isCurrent) {
      context.strokeStyle = '#f2ba37';
      context.lineWidth = 4;
      context.beginPath();
      context.arc(px, py, 22, 0, Math.PI * 2);
      context.stroke();
    }

    context.fillStyle = sample[2] === -1 ? '#5149dc' : '#e4773d';
    if (sample[2] === -1) {
      context.beginPath();
      context.arc(px, py, 10, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillRect(px - 9, py - 9, 18, 18);
    }
  }

  function drawTestPoint() {
    if (!testPoint) return;
    var px = canvasX(testPoint[0]);
    var py = canvasY(testPoint[1]);
    context.strokeStyle = '#111827';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(px - 10, py - 10);
    context.lineTo(px + 10, py + 10);
    context.moveTo(px + 10, py - 10);
    context.lineTo(px - 10, py + 10);
    context.stroke();
  }

  function drawPlane() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawDecisionBackground();
    drawAxes();
    drawBoundary(-1, '#13a283', true, 3);
    drawBoundary(+1, '#13a283', true, 3);
    drawBoundary(0, '#222b45', false, 4);

    for (var index = 0; index < data.length; index++) {
      drawPoint(data[index], index);
    }
    drawTestPoint();
  }

  // ---------------------------------------------------------------------------
  // 6. GRÁFICO DE PERDA E ACURÁCIA
  // ---------------------------------------------------------------------------
  function drawHistoryAxes(left, top, width, height, maximumLoss) {
    historyContext.font = '13px DM Mono, monospace';
    historyContext.textBaseline = 'middle';

    for (var tick = 0; tick <= 4; tick++) {
      var y = top + height - tick * height / 4;
      historyContext.strokeStyle = '#dce1eb';
      historyContext.lineWidth = 1;
      historyContext.beginPath();
      historyContext.moveTo(left, y);
      historyContext.lineTo(left + width, y);
      historyContext.stroke();

      historyContext.fillStyle = '#5d687d';
      historyContext.textAlign = 'right';
      historyContext.fillText(format(maximumLoss * tick / 4, 2), left - 9, y);
      historyContext.textAlign = 'left';
      historyContext.fillText(String(tick * 25) + '%', left + width + 9, y);
    }

    var maximumIndex = Math.max(1, lossHistory.length - 1);
    historyContext.textAlign = 'center';
    historyContext.textBaseline = 'top';
    for (var xTick = 0; xTick <= 5; xTick++) {
      var historyIndex = Math.round(maximumIndex * xTick / 5);
      var px = left + width * xTick / 5;
      historyContext.fillText(String(historyIndex), px, top + height + 11);
    }
    historyContext.font = '700 14px DM Mono, monospace';
    historyContext.fillText('época', left + width / 2, top + height + 32);
  }

  function drawHistoryLine(values, color, left, top, width, height, scaleMaximum) {
    if (values.length === 0) return;
    var maximumIndex = Math.max(1, values.length - 1);
    historyContext.strokeStyle = color;
    historyContext.lineWidth = 4;
    historyContext.lineJoin = 'round';
    historyContext.beginPath();

    for (var index = 0; index < values.length; index++) {
      var px = left + index * width / maximumIndex;
      var py = top + height - values[index] * height / scaleMaximum;
      if (index === 0) historyContext.moveTo(px, py);
      else historyContext.lineTo(px, py);
    }
    historyContext.stroke();
  }

  function drawHistory() {
    historyContext.clearRect(0, 0, historyCanvas.width, historyCanvas.height);
    historyContext.fillStyle = '#fbfcff';
    historyContext.fillRect(0, 0, historyCanvas.width, historyCanvas.height);

    var maximumLoss = 1;
    for (var index = 0; index < lossHistory.length; index++) {
      if (lossHistory[index] > maximumLoss) maximumLoss = lossHistory[index];
    }
    maximumLoss = maximumLoss * 1.1;

    var left = 65;
    var top = 25;
    var width = historyCanvas.width - 135;
    var height = historyCanvas.height - 82;
    drawHistoryAxes(left, top, width, height, maximumLoss);
    drawHistoryLine(lossHistory, '#e35c6e', left, top, width, height, maximumLoss);
    drawHistoryLine(accuracyHistory, '#19a987', left, top, width, height, 1);
  }

  // ---------------------------------------------------------------------------
  // 7. TEXTOS, TABELA E CONTAS DA ÚLTIMA AMOSTRA
  // ---------------------------------------------------------------------------
  function format(value, digits) {
    var safeValue = Math.abs(value) < 0.0000001 ? 0 : value;
    return safeValue.toFixed(digits).replace('.', ',');
  }

  function signed(value, digits) {
    if (value >= 0) return '+' + format(value, digits);
    return format(value, digits);
  }

  function updateMetrics() {
    var metrics = evaluate();
    document.getElementById('svmEpochMetric').textContent = String(epoch);
    document.getElementById('svmAccuracyMetric').textContent = format(metrics[1] * 100, 1) + '%';
    document.getElementById('svmLossMetric').textContent = format(metrics[0], 3);
    document.getElementById('svmWidthMetric').textContent = metrics[3] === 0 ? '—' : format(metrics[3], 2);
    document.getElementById('svmSupportMetric').textContent = String(metrics[2]);
    document.getElementById('svmStatus').textContent = 'Época ' + epoch + ' · próxima amostra ' + (sampleCursor + 1);
  }

  function renderMath() {
    var container = document.getElementById('svmMath');
    if (!lastStep) {
      container.innerHTML = '<article class="full"><b>Comece o treinamento</b><p>Clique em “Treinar próxima amostra” para acompanhar uma atualização completa.</p></article>';
      return;
    }

    var x1 = lastStep[1];
    var x2 = lastStep[2];
    var target = lastStep[3];
    var oldW1 = lastStep[4];
    var oldW2 = lastStep[5];
    var oldBias = lastStep[6];
    var oldPotential = lastStep[7];
    var oldMargin = lastStep[8];
    var oldLoss = lastStep[9];
    var violates = lastStep[10];
    var newW1 = lastStep[11];
    var newW2 = lastStep[12];
    var newBias = lastStep[13];
    var rate = lastStep[14];
    var penalty = lastStep[15];
    var lambda = lastStep[16];
    var oldPrediction = oldPotential >= 0 ? +1 : -1;
    var regularizationFactor = 1 - rate * lambda;
    var total = evaluate();
    var regularization = lambda * (weights[0] * weights[0] + weights[1] * weights[1]) / 2;
    var objective = regularization + penalty * total[4] / data.length;
    var updateDescription = violates ? 'A margem é menor que 1: regularização e correção hinge.' : 'A margem já é suficiente: somente a regularização reduz os pesos.';

    var w1Correction = violates ? rate * penalty * target * x1 : 0;
    var w2Correction = violates ? rate * penalty * target * x2 : 0;
    var biasCorrection = violates ? rate * penalty * target : 0;

    container.innerHTML =
      '<article><b>1 · Forward</b><p>Monte u com os pesos e o bias anteriores.</p><code>u = (' + format(oldW1, 3) + ')×(' + format(x1, 1) + ') + (' + format(oldW2, 3) + ')×(' + format(x2, 1) + ') + (' + format(oldBias, 3) + ')<br>u = <strong>' + format(oldPotential, 3) + '</strong> → ŷ = ' + signed(oldPrediction, 0) + '</code></article>' +
      '<article><b>2 · Margem funcional</b><p>Multiplique o alvo pelo escore.</p><code>m = y×u = (' + signed(target, 0) + ')×(' + format(oldPotential, 3) + ')<br>m = <strong>' + format(oldMargin, 3) + '</strong></code></article>' +
      '<article><b>3 · Perda hinge</b><p>Somente valores de m menores que 1 produzem perda.</p><code>L = máx(0, 1−' + format(oldMargin, 3) + ')<br>L = <strong>' + format(oldLoss, 3) + '</strong><br>' + updateDescription + '</code></article>' +
      '<article><b>4 · Fator de regularização</b><p>λ encolhe os pesos, mas não o bias.</p><code>1−ηλ = 1−' + format(rate, 3) + '×' + format(lambda, 3) + '<br>fator = <strong>' + format(regularizationFactor, 4) + '</strong></code></article>' +
      '<article class="full"><b>5 · Atualização completa</b><p>Use wᵢ ← (1−ηλ)wᵢ + ηCyxᵢ e b ← b + ηCy quando m&lt;1.</p><code>w₁ ← ' + format(regularizationFactor, 4) + '×(' + format(oldW1, 3) + ') + (' + format(w1Correction, 3) + ') = <strong>' + format(newW1, 3) + '</strong><br>w₂ ← ' + format(regularizationFactor, 4) + '×(' + format(oldW2, 3) + ') + (' + format(w2Correction, 3) + ') = <strong>' + format(newW2, 3) + '</strong><br>b ← ' + format(oldBias, 3) + ' + (' + format(biasCorrection, 3) + ') = <strong>' + format(newBias, 3) + '</strong></code></article>' +
      '<article class="full"><b>6 · Objetivo do dataset após a correção</b><p>Somamos a regularização e a média das perdas hinge.</p><code>J = (λ/2)‖w‖² + C×(1/n)ΣLᵢ<br>J = ' + format(regularization, 4) + ' + ' + format(penalty, 2) + '×(' + format(total[4], 3) + '/' + data.length + ') = <strong>' + format(objective, 4) + '</strong></code></article>';
  }

  function renderTable() {
    var html = '<thead><tr><th>#</th><th>x₁</th><th>x₂</th><th>y</th><th>u</th><th>ŷ</th><th>m=y·u</th><th>hinge</th><th>situação</th></tr></thead><tbody>';

    for (var index = 0; index < data.length; index++) {
      var sample = data[index];
      var score = potential(sample);
      var prediction = score >= 0 ? +1 : -1;
      var margin = sample[2] * score;
      var loss = Math.max(0, 1 - margin);
      var isSupport = margin <= 1.05;
      html = html + '<tr' + (isSupport ? ' class="is-support"' : '') + '><td>' + (index + 1) + '</td><td>' + format(sample[0], 1) + '</td><td>' + format(sample[1], 1) + '</td><td>' + signed(sample[2], 0) + '</td><td>' + format(score, 3) + '</td><td>' + signed(prediction, 0) + '</td><td>' + format(margin, 3) + '</td><td>' + format(loss, 3) + '</td><td>' + (isSupport ? 'm≤1,05 · suporte' : 'fora da margem') + '</td></tr>';
    }

    html = html + '</tbody>';
    document.getElementById('svmDataTable').innerHTML = html;
  }

  function testNewPoint() {
    var x1 = Number(document.getElementById('svmTestX1').value);
    var x2 = Number(document.getElementById('svmTestX2').value);
    if (!isFinite(x1) || !isFinite(x2)) return;

    testPoint = [x1, x2, 0];
    var score = potential(testPoint);
    var prediction = score >= 0 ? +1 : -1;
    document.getElementById('svmTestResult').innerHTML = 'u = ' + format(weights[0], 3) + '×' + format(x1, 1) + ' + ' + format(weights[1], 3) + '×' + format(x2, 1) + ' + ' + format(bias, 3) + ' = <strong>' + format(score, 3) + '</strong><br>classe prevista: <strong>' + signed(prediction, 0) + '</strong>';
    drawPlane();
  }

  function renderAll() {
    updateMetrics();
    drawPlane();
    drawHistory();
    renderMath();
    renderTable();
  }

  // ---------------------------------------------------------------------------
  // 8. EVENTOS DOS BOTÕES
  // ---------------------------------------------------------------------------
  document.getElementById('svmNext').addEventListener('click', trainNextSample);
  document.getElementById('svmEpoch').addEventListener('click', function () { trainOneEpoch(true); });
  document.getElementById('svmTrain').addEventListener('click', trainFiftyEpochs);
  document.getElementById('svmReset').addEventListener('click', resetModel);
  document.getElementById('svmTest').addEventListener('click', testNewPoint);
  document.getElementById('svmLearningRate').addEventListener('change', renderAll);
  document.getElementById('svmC').addEventListener('change', renderAll);
  document.getElementById('svmLambda').addEventListener('change', renderAll);

  resetModel();
}());
