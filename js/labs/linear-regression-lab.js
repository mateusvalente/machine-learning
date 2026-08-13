// =============================================================================
// LABORATÓRIO DE REGRESSÃO LINEAR MÚLTIPLA
// x1 = potência (cv), x2 = peso (kg), y = consumo (L/100 km).
// O treinamento usa gradiente descendente em lote: uma atualização por época.
// =============================================================================

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. DATASET FIXO: [POTÊNCIA, PESO, CONSUMO]
  // ---------------------------------------------------------------------------
  var data = [
    [70, 950, 5.9],
    [90, 1450, 7.0],
    [110, 1050, 6.6],
    [130, 1650, 8.0],
    [150, 1200, 7.6],
    [170, 1800, 9.1],
    [190, 1350, 8.4],
    [210, 1900, 9.9],
    [230, 1500, 9.4],
    [250, 2000, 10.7],
    [180, 1050, 7.8],
    [100, 1750, 7.9]
  ];

  var learningRate = 0.08;
  var w1 = 0;
  var w2 = 0;
  var bias = 0;
  var epoch = 0;
  var errorHistory = [];
  var lastEpochDetails = null;

  var planeCanvas = document.getElementById('regressionPlane');
  var planeContext = planeCanvas.getContext('2d');
  var chartCanvas = document.getElementById('regressionErrorChart');
  var chartContext = chartCanvas.getContext('2d');

  // ---------------------------------------------------------------------------
  // 2. ESTATÍSTICAS PARA PADRONIZAR AS DUAS ENTRADAS
  // ---------------------------------------------------------------------------
  function columnMean(column) {
    var sum = 0;
    for (var row = 0; row < data.length; row++) sum = sum + data[row][column];
    return sum / data.length;
  }

  function columnStandardDeviation(column, mean) {
    var squaredSum = 0;
    for (var row = 0; row < data.length; row++) {
      var distance = data[row][column] - mean;
      squaredSum = squaredSum + distance * distance;
    }
    return Math.sqrt(squaredSum / data.length);
  }

  var powerMean = columnMean(0);
  var weightMean = columnMean(1);
  var consumptionMean = columnMean(2);
  var powerDeviation = columnStandardDeviation(0, powerMean);
  var weightDeviation = columnStandardDeviation(1, weightMean);

  function normalizePower(power) {
    return (power - powerMean) / powerDeviation;
  }

  function normalizeWeight(weight) {
    return (weight - weightMean) / weightDeviation;
  }

  // ---------------------------------------------------------------------------
  // 3. FORWARD: DUAS ENTRADAS E UMA SAÍDA LINEAR
  // ---------------------------------------------------------------------------
  function predictNormalized(normalizedPower, normalizedWeight) {
    return bias + w1 * normalizedPower + w2 * normalizedWeight;
  }

  function predict(power, weight) {
    return predictNormalized(normalizePower(power), normalizeWeight(weight));
  }

  // ---------------------------------------------------------------------------
  // 4. CUSTO E MÉTRICAS
  // E = 1/(2N) × Σ(ŷ - y)². O fator 1/2 simplifica a derivada.
  // ---------------------------------------------------------------------------
  function evaluateModel() {
    var squaredErrorSum = 0;
    var absoluteErrorSum = 0;
    var totalVariation = 0;

    for (var row = 0; row < data.length; row++) {
      var prediction = predict(data[row][0], data[row][1]);
      var error = prediction - data[row][2];
      squaredErrorSum = squaredErrorSum + error * error;
      absoluteErrorSum = absoluteErrorSum + Math.abs(error);
      var targetDistance = data[row][2] - consumptionMean;
      totalVariation = totalVariation + targetDistance * targetDistance;
    }

    var mse = squaredErrorSum / data.length;
    return {
      cost: mse / 2,
      mse: mse,
      rmse: Math.sqrt(mse),
      mae: absoluteErrorSum / data.length,
      r2: 1 - squaredErrorSum / totalVariation
    };
  }

  // ---------------------------------------------------------------------------
  // 5. GRADIENTES EM LOTE
  // Cada derivada reúne os erros de todos os carros antes da atualização.
  // ---------------------------------------------------------------------------
  function calculateGradients() {
    var gradientW1Sum = 0;
    var gradientW2Sum = 0;
    var gradientBiasSum = 0;
    var predictions = [];
    var modelErrors = [];
    var normalizedInputs = [];

    for (var row = 0; row < data.length; row++) {
      var x1 = normalizePower(data[row][0]);
      var x2 = normalizeWeight(data[row][1]);
      var prediction = predictNormalized(x1, x2);
      var modelError = prediction - data[row][2];

      normalizedInputs[row] = [x1, x2];
      predictions[row] = prediction;
      modelErrors[row] = modelError;
      gradientW1Sum = gradientW1Sum + modelError * x1;
      gradientW2Sum = gradientW2Sum + modelError * x2;
      gradientBiasSum = gradientBiasSum + modelError;
    }

    return {
      w1: gradientW1Sum / data.length,
      w2: gradientW2Sum / data.length,
      bias: gradientBiasSum / data.length,
      predictions: predictions,
      errors: modelErrors,
      normalizedInputs: normalizedInputs
    };
  }

  // ---------------------------------------------------------------------------
  // 6. UMA ÉPOCA DE GRADIENTE DESCENDENTE
  // ---------------------------------------------------------------------------
  function trainEpoch() {
    var oldW1 = w1;
    var oldW2 = w2;
    var oldBias = bias;
    var costBefore = evaluateModel().cost;
    var gradients = calculateGradients();

    w1 = w1 - learningRate * gradients.w1;
    w2 = w2 - learningRate * gradients.w2;
    bias = bias - learningRate * gradients.bias;
    epoch = epoch + 1;

    lastEpochDetails = {
      oldW1: oldW1,
      oldW2: oldW2,
      oldBias: oldBias,
      newW1: w1,
      newW2: w2,
      newBias: bias,
      costBefore: costBefore,
      costAfter: evaluateModel().cost,
      gradients: gradients
    };
    recordHistory();
  }

  function recordHistory() {
    errorHistory.push([epoch, evaluateModel().cost]);
    if (errorHistory.length > 401) errorHistory.shift();
  }

  // ---------------------------------------------------------------------------
  // 7. CONVERSÃO PARA A EQUAÇÃO NAS UNIDADES ORIGINAIS
  // ---------------------------------------------------------------------------
  function originalUnitCoefficients() {
    var powerCoefficient = w1 / powerDeviation;
    var weightCoefficient = w2 / weightDeviation;
    var originalBias = bias - powerCoefficient * powerMean - weightCoefficient * weightMean;
    return [originalBias, powerCoefficient, weightCoefficient];
  }

  // ---------------------------------------------------------------------------
  // 8. DESENHO DO PLANO TRIDIMENSIONAL
  // ---------------------------------------------------------------------------
  var graphRanges = {
    powerMin: 60,
    powerMax: 260,
    weightMin: 850,
    weightMax: 2050,
    consumptionMin: 0,
    consumptionMax: 12
  };

  function normalizeRange(value, minimum, maximum) {
    return (value - minimum) / (maximum - minimum);
  }

  function projectPoint(power, weight, consumption) {
    var normalizedPower = normalizeRange(power, graphRanges.powerMin, graphRanges.powerMax);
    var normalizedWeight = normalizeRange(weight, graphRanges.weightMin, graphRanges.weightMax);
    var normalizedConsumption = normalizeRange(consumption, graphRanges.consumptionMin, graphRanges.consumptionMax);
    return [
      125 + normalizedPower * 650 + normalizedWeight * 235,
      575 - normalizedWeight * 135 - normalizedConsumption * 440
    ];
  }

  function drawLine(context, start, end, color, width, dash) {
    context.beginPath();
    context.moveTo(start[0], start[1]);
    context.lineTo(end[0], end[1]);
    context.strokeStyle = color;
    context.lineWidth = width;
    context.setLineDash(dash || []);
    context.stroke();
    context.setLineDash([]);
  }

  function drawRegressionPlane() {
    planeContext.clearRect(0, 0, planeCanvas.width, planeCanvas.height);
    planeContext.fillStyle = '#fbfcff';
    planeContext.fillRect(0, 0, planeCanvas.width, planeCanvas.height);

    var corners = [
      [graphRanges.powerMin, graphRanges.weightMin],
      [graphRanges.powerMax, graphRanges.weightMin],
      [graphRanges.powerMax, graphRanges.weightMax],
      [graphRanges.powerMin, graphRanges.weightMax]
    ];
    var projectedCorners = [];
    for (var corner = 0; corner < corners.length; corner++) {
      projectedCorners[corner] = projectPoint(corners[corner][0], corners[corner][1], predict(corners[corner][0], corners[corner][1]));
    }

    // Superfície prevista pelo modelo atual.
    planeContext.beginPath();
    planeContext.moveTo(projectedCorners[0][0], projectedCorners[0][1]);
    for (corner = 1; corner < projectedCorners.length; corner++) planeContext.lineTo(projectedCorners[corner][0], projectedCorners[corner][1]);
    planeContext.closePath();
    planeContext.fillStyle = 'rgba(25,169,135,.23)';
    planeContext.fill();
    planeContext.strokeStyle = '#159b7c';
    planeContext.lineWidth = 3;
    planeContext.stroke();

    // Linhas internas ajudam a perceber a inclinação do plano.
    for (var grid = 1; grid < 4; grid++) {
      var fraction = grid / 4;
      var gridPower = graphRanges.powerMin + fraction * (graphRanges.powerMax - graphRanges.powerMin);
      var gridWeight = graphRanges.weightMin + fraction * (graphRanges.weightMax - graphRanges.weightMin);
      drawLine(planeContext, projectPoint(gridPower, graphRanges.weightMin, predict(gridPower, graphRanges.weightMin)), projectPoint(gridPower, graphRanges.weightMax, predict(gridPower, graphRanges.weightMax)), 'rgba(21,155,124,.35)', 1);
      drawLine(planeContext, projectPoint(graphRanges.powerMin, gridWeight, predict(graphRanges.powerMin, gridWeight)), projectPoint(graphRanges.powerMax, gridWeight, predict(graphRanges.powerMax, gridWeight)), 'rgba(21,155,124,.35)', 1);
    }

    // Eixos principais.
    var origin = projectPoint(graphRanges.powerMin, graphRanges.weightMin, graphRanges.consumptionMin);
    var powerEnd = projectPoint(graphRanges.powerMax, graphRanges.weightMin, graphRanges.consumptionMin);
    var weightEnd = projectPoint(graphRanges.powerMin, graphRanges.weightMax, graphRanges.consumptionMin);
    var consumptionEnd = projectPoint(graphRanges.powerMin, graphRanges.weightMin, graphRanges.consumptionMax);
    drawLine(planeContext, origin, powerEnd, '#344058', 2.5);
    drawLine(planeContext, origin, weightEnd, '#344058', 2.5);
    drawLine(planeContext, origin, consumptionEnd, '#344058', 2.5);

    planeContext.font = '700 14px Manrope';
    planeContext.fillStyle = '#3c475f';
    planeContext.textAlign = 'center';
    planeContext.fillText('POTÊNCIA x₁ (cv)', powerEnd[0] - 20, powerEnd[1] + 48);
    planeContext.fillText('PESO x₂ (kg)', weightEnd[0] + 62, weightEnd[1] - 12);
    planeContext.save();
    planeContext.translate(consumptionEnd[0] - 58, consumptionEnd[1] + 85);
    planeContext.rotate(-Math.PI / 2);
    planeContext.fillText('CONSUMO y (L/100 km)', 0, 0);
    planeContext.restore();

    // Números nos três eixos.
    planeContext.font = '600 12px DM Mono';
    for (var tick = 0; tick <= 4; tick++) {
      var ratio = tick / 4;
      var powerValue = graphRanges.powerMin + ratio * (graphRanges.powerMax - graphRanges.powerMin);
      var weightValue = graphRanges.weightMin + ratio * (graphRanges.weightMax - graphRanges.weightMin);
      var consumptionValue = graphRanges.consumptionMin + ratio * (graphRanges.consumptionMax - graphRanges.consumptionMin);
      var powerPoint = projectPoint(powerValue, graphRanges.weightMin, graphRanges.consumptionMin);
      var weightPoint = projectPoint(graphRanges.powerMin, weightValue, graphRanges.consumptionMin);
      var consumptionPoint = projectPoint(graphRanges.powerMin, graphRanges.weightMin, consumptionValue);
      planeContext.fillStyle = '#667187';
      planeContext.textAlign = 'center';
      planeContext.fillText(String(Math.round(powerValue)), powerPoint[0], powerPoint[1] + 21);
      planeContext.fillText(String(Math.round(weightValue)), weightPoint[0] + 21, weightPoint[1] - 5);
      planeContext.textAlign = 'right';
      planeContext.fillText(formatNumber(consumptionValue, 0), consumptionPoint[0] - 11, consumptionPoint[1] + 4);
    }

    // Pontos reais e resíduos verticais.
    for (var row = 0; row < data.length; row++) {
      var actualPoint = projectPoint(data[row][0], data[row][1], data[row][2]);
      var predictedConsumption = predict(data[row][0], data[row][1]);
      var predictedPoint = projectPoint(data[row][0], data[row][1], predictedConsumption);
      drawLine(planeContext, actualPoint, predictedPoint, 'rgba(227,92,110,.75)', 2, [5, 5]);
      planeContext.beginPath();
      planeContext.arc(actualPoint[0], actualPoint[1], 7, 0, Math.PI * 2);
      planeContext.fillStyle = '#fff';
      planeContext.fill();
      planeContext.strokeStyle = '#4e46e5';
      planeContext.lineWidth = 4;
      planeContext.stroke();
      planeContext.fillStyle = '#172033';
      planeContext.font = '700 11px Manrope';
      planeContext.textAlign = 'left';
      planeContext.fillText(String(row + 1), actualPoint[0] + 10, actualPoint[1] - 7);
    }
  }

  // ---------------------------------------------------------------------------
  // 9. GRÁFICO DO CUSTO COM EIXOS NUMERADOS
  // ---------------------------------------------------------------------------
  function drawErrorChart() {
    var width = chartCanvas.width;
    var height = chartCanvas.height;
    var left = 78;
    var right = 30;
    var top = 28;
    var bottom = 62;
    chartContext.clearRect(0, 0, width, height);
    chartContext.fillStyle = '#fbfcff';
    chartContext.fillRect(0, 0, width, height);

    var maximumError = 0.1;
    for (var index = 0; index < errorHistory.length; index++) {
      if (errorHistory[index][1] > maximumError) maximumError = errorHistory[index][1];
    }
    maximumError = maximumError * 1.08;
    var firstEpoch = errorHistory[0][0];
    var lastEpoch = errorHistory[errorHistory.length - 1][0];
    var epochRange = Math.max(1, lastEpoch - firstEpoch);

    chartContext.font = '600 13px Manrope';
    chartContext.textBaseline = 'middle';
    chartContext.textAlign = 'right';
    for (var yTick = 0; yTick <= 5; yTick++) {
      var errorValue = maximumError * (5 - yTick) / 5;
      var y = top + yTick * (height - top - bottom) / 5;
      drawLine(chartContext, [left, y], [width - right, y], '#e4e7ef', 1);
      chartContext.fillStyle = '#647086';
      chartContext.fillText(formatNumber(errorValue, 2), left - 12, y);
    }

    chartContext.textAlign = 'center';
    chartContext.textBaseline = 'top';
    for (var xTick = 0; xTick <= 5; xTick++) {
      var x = left + xTick * (width - left - right) / 5;
      var epochValue = firstEpoch + epochRange * xTick / 5;
      chartContext.fillStyle = '#647086';
      chartContext.fillText(String(Math.round(epochValue)), x, height - bottom + 14);
    }
    chartContext.fillStyle = '#354058';
    chartContext.font = '800 14px Manrope';
    chartContext.fillText('ÉPOCAS', (left + width - right) / 2, height - 25);
    chartContext.save();
    chartContext.translate(21, (top + height - bottom) / 2);
    chartContext.rotate(-Math.PI / 2);
    chartContext.fillText('CUSTO E', 0, 0);
    chartContext.restore();

    if (errorHistory.length === 1) {
      var onlyY = top + (1 - errorHistory[0][1] / maximumError) * (height - top - bottom);
      chartContext.beginPath();
      chartContext.arc(left, onlyY, 6, 0, Math.PI * 2);
      chartContext.fillStyle = '#e35c6e';
      chartContext.fill();
      return;
    }

    chartContext.beginPath();
    for (index = 0; index < errorHistory.length; index++) {
      var pointX = left + (errorHistory[index][0] - firstEpoch) * (width - left - right) / epochRange;
      var pointY = top + (1 - errorHistory[index][1] / maximumError) * (height - top - bottom);
      if (index === 0) chartContext.moveTo(pointX, pointY);
      else chartContext.lineTo(pointX, pointY);
    }
    chartContext.strokeStyle = '#e35c6e';
    chartContext.lineWidth = 4;
    chartContext.lineJoin = 'round';
    chartContext.stroke();
  }

  // ---------------------------------------------------------------------------
  // 10. TABELA DE RESULTADOS
  // ---------------------------------------------------------------------------
  function renderResultsTable() {
    var html = '<thead><tr><th>#</th><th>x₁ · Potência</th><th>x₂ · Peso</th><th>y · Real</th><th>ŷ · Previsto</th><th>e = y − ŷ</th><th>½e²</th></tr></thead><tbody>';
    for (var row = 0; row < data.length; row++) {
      var prediction = predict(data[row][0], data[row][1]);
      var signedError = data[row][2] - prediction;
      var halfSquaredError = 0.5 * signedError * signedError;
      var errorClass = signedError >= 0 ? 'error-positive' : 'error-negative';
      html += '<tr><td>' + (row + 1) + '</td><td>' + data[row][0] + ' cv</td><td>' + data[row][1] + ' kg</td><td>' + formatNumber(data[row][2], 1) + '</td><td>' + formatNumber(prediction, 3) + '</td><td class="' + errorClass + '">' + formatNumber(signedError, 3) + '</td><td>' + formatNumber(halfSquaredError, 4) + '</td></tr>';
    }
    html += '</tbody>';
    document.getElementById('regressionResultsTable').innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // 11. MATEMÁTICA COMPLETA DA ÚLTIMA ÉPOCA
  // ---------------------------------------------------------------------------
  function gradientSumText(errors, normalizedInputs, column) {
    var terms = [];
    for (var row = 0; row < errors.length; row++) {
      if (column === -1) terms.push('(' + formatNumber(errors[row], 3) + ')');
      else terms.push('(' + formatNumber(errors[row], 3) + '×' + formatNumber(normalizedInputs[row][column], 3) + ')');
    }
    return terms.join(' + ');
  }

  function renderMathSteps() {
    var container = document.getElementById('regressionMathSteps');
    if (!lastEpochDetails) {
      container.innerHTML = '<article class="full"><span>→</span><h3>Treine pelo menos uma época</h3><p>Depois do primeiro clique, este espaço mostrará a normalização, as 12 parcelas de cada somatória, os gradientes e os novos parâmetros.</p><div class="regression-math-lines"><code>w₁ = 0 · w₂ = 0 · b = 0</code><code>E inicial = <strong>' + formatNumber(evaluateModel().cost, 4) + '</strong></code></div></article>';
      return;
    }

    var details = lastEpochDetails;
    var x1 = details.gradients.normalizedInputs[0][0];
    var x2 = details.gradients.normalizedInputs[0][1];
    var firstPrediction = details.gradients.predictions[0];
    var firstModelError = details.gradients.errors[0];
    var html = '';

    html += '<article><span>1</span><h3>Padronizar as entradas</h3><p>Usamos o primeiro carro: 70 cv e 950 kg.</p><div class="regression-math-lines">' +
      '<code>x₁′ = (70 − ' + formatNumber(powerMean, 2) + ') ÷ ' + formatNumber(powerDeviation, 2) + ' = <strong>' + formatNumber(x1, 4) + '</strong></code>' +
      '<code>x₂′ = (950 − ' + formatNumber(weightMean, 2) + ') ÷ ' + formatNumber(weightDeviation, 2) + ' = <strong>' + formatNumber(x2, 4) + '</strong></code></div></article>';

    html += '<article><span>2</span><h3>Forward da primeira amostra</h3><p>Os parâmetros abaixo são os valores antes da atualização desta época.</p><div class="regression-math-lines">' +
      '<code>ŷ₁ = b + w₁x₁′ + w₂x₂′</code>' +
      '<code>ŷ₁ = ' + formatNumber(details.oldBias, 4) + ' + (' + formatNumber(details.oldW1, 4) + '×' + formatNumber(x1, 4) + ') + (' + formatNumber(details.oldW2, 4) + '×' + formatNumber(x2, 4) + ')</code>' +
      '<code>ŷ₁ = <strong>' + formatNumber(firstPrediction, 4) + ' L/100 km</strong></code></div></article>';

    html += '<article><span>3</span><h3>Erro da primeira amostra</h3><p>Para o gradiente usamos ŷ − y. É o oposto de e = y − ŷ mostrado na tabela.</p><div class="regression-math-lines">' +
      '<code>erro₁ = ŷ₁ − y₁</code><code>erro₁ = ' + formatNumber(firstPrediction, 4) + ' − 5,9 = <strong>' + formatNumber(firstModelError, 4) + '</strong></code>' +
      '<code>½erro₁² = 0,5 × (' + formatNumber(firstModelError, 4) + ')² = <strong>' + formatNumber(0.5 * firstModelError * firstModelError, 4) + '</strong></code></div></article>';

    html += '<article><span>4</span><h3>Custo de todos os carros</h3><p>N = 12. Somamos os erros quadráticos e calculamos a média com o fator ½.</p><div class="regression-math-lines">' +
      '<code>E = 1/(2×12) × Σ(ŷᵢ − yᵢ)²</code>' +
      '<code>E antes = <strong>' + formatNumber(details.costBefore, 5) + '</strong></code><code>E depois = <strong>' + formatNumber(details.costAfter, 5) + '</strong></code></div></article>';

    html += '<article class="full"><span>5</span><h3>Somatórias gerais dos três gradientes</h3><p>Cada linha abaixo contém as 12 parcelas usadas naquela derivada.</p><div class="regression-math-lines">' +
      '<code><em>∂E/∂w₁</em> = 1/12 × [' + gradientSumText(details.gradients.errors, details.gradients.normalizedInputs, 0) + '] = <strong>' + formatNumber(details.gradients.w1, 5) + '</strong></code>' +
      '<code><em>∂E/∂w₂</em> = 1/12 × [' + gradientSumText(details.gradients.errors, details.gradients.normalizedInputs, 1) + '] = <strong>' + formatNumber(details.gradients.w2, 5) + '</strong></code>' +
      '<code><em>∂E/∂b</em> = 1/12 × [' + gradientSumText(details.gradients.errors, details.gradients.normalizedInputs, -1) + '] = <strong>' + formatNumber(details.gradients.bias, 5) + '</strong></code></div></article>';

    html += '<article class="full"><span>6</span><h3>Atualização simultânea dos parâmetros</h3><p>Aplicamos parâmetro novo = parâmetro atual − η × gradiente, com η = 0,08.</p><div class="regression-math-lines">' +
      '<code>w₁ novo = ' + formatNumber(details.oldW1, 5) + ' − 0,08 × (' + formatNumber(details.gradients.w1, 5) + ') = <strong>' + formatNumber(details.newW1, 5) + '</strong></code>' +
      '<code>w₂ novo = ' + formatNumber(details.oldW2, 5) + ' − 0,08 × (' + formatNumber(details.gradients.w2, 5) + ') = <strong>' + formatNumber(details.newW2, 5) + '</strong></code>' +
      '<code>b novo = ' + formatNumber(details.oldBias, 5) + ' − 0,08 × (' + formatNumber(details.gradients.bias, 5) + ') = <strong>' + formatNumber(details.newBias, 5) + '</strong></code></div></article>';
    container.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // 12. TEXTOS, EQUAÇÕES E MÉTRICAS ATUALIZADOS
  // ---------------------------------------------------------------------------
  function formatNumber(value, digits) {
    var safeValue = Math.abs(value) < 0.0000001 ? 0 : value;
    return safeValue.toFixed(digits).replace('.', ',');
  }

  function renderEquations() {
    document.getElementById('normalizedEquation').innerHTML = 'ŷ = ' + formatNumber(bias, 4) + '<br>+ (' + formatNumber(w1, 4) + ' × x₁′)<br>+ (' + formatNumber(w2, 4) + ' × x₂′)';
    var original = originalUnitCoefficients();
    document.getElementById('originalEquation').innerHTML = 'ŷ = ' + formatNumber(original[0], 4) + '<br>+ (' + formatNumber(original[1], 5) + ' × potência)<br>+ (' + formatNumber(original[2], 6) + ' × peso)';
    document.getElementById('coefficientReading').innerHTML =
      '<span><strong>w₁:</strong> inclinação associada à potência quando o peso permanece fixo.</span>' +
      '<span><strong>w₂:</strong> inclinação associada ao peso quando a potência permanece fixa.</span>' +
      '<span><strong>bias:</strong> ponto de referência que desloca todo o plano para cima ou para baixo.</span>';
  }

  function renderNewCarPrediction() {
    var newPower = 200;
    var newWeight = 1500;
    var normalizedPower = normalizePower(newPower);
    var normalizedWeight = normalizeWeight(newWeight);
    var result = predict(newPower, newWeight);
    document.getElementById('newCarPrediction').innerHTML =
      '<code>x₁′ = (200 − ' + formatNumber(powerMean, 2) + ') ÷ ' + formatNumber(powerDeviation, 2) + ' = ' + formatNumber(normalizedPower, 4) + '</code>' +
      '<code>x₂′ = (1500 − ' + formatNumber(weightMean, 2) + ') ÷ ' + formatNumber(weightDeviation, 2) + ' = ' + formatNumber(normalizedWeight, 4) + '</code>' +
      '<code>ŷ = ' + formatNumber(bias, 4) + ' + (' + formatNumber(w1, 4) + '×' + formatNumber(normalizedPower, 4) + ') + (' + formatNumber(w2, 4) + '×' + formatNumber(normalizedWeight, 4) + ')</code>' +
      '<strong>Consumo previsto: ' + formatNumber(result, 2) + ' L/100 km</strong>';
  }

  function renderMetrics() {
    var metrics = evaluateModel();
    document.getElementById('regressionEpoch').textContent = epoch;
    document.getElementById('regressionMse').textContent = formatNumber(metrics.mse, 4);
    document.getElementById('regressionRmse').textContent = formatNumber(metrics.rmse, 4);
    document.getElementById('regressionR2').textContent = formatNumber(metrics.r2, 4);
    var status = document.getElementById('regressionStatus');
    status.textContent = epoch === 0 ? 'Modelo novo' : (metrics.r2 >= 0.9 ? 'Plano ajustado' : 'Treinando');
    status.className = metrics.r2 >= 0.9 ? 'status success' : 'status';
  }

  function renderAll() {
    renderMetrics();
    renderEquations();
    renderNewCarPrediction();
    renderResultsTable();
    renderMathSteps();
    drawRegressionPlane();
    drawErrorChart();
  }

  // ---------------------------------------------------------------------------
  // 13. BOTÕES DE TREINAMENTO
  // ---------------------------------------------------------------------------
  document.getElementById('regressionTrainOne').addEventListener('click', function () {
    trainEpoch();
    renderAll();
  });

  document.getElementById('regressionTrainHundred').addEventListener('click', function () {
    for (var count = 0; count < 100; count++) trainEpoch();
    renderAll();
  });

  document.getElementById('regressionReset').addEventListener('click', function () {
    w1 = 0;
    w2 = 0;
    bias = 0;
    epoch = 0;
    errorHistory = [];
    lastEpochDetails = null;
    recordHistory();
    renderAll();
  });

  // ---------------------------------------------------------------------------
  // 14. INICIALIZAÇÃO
  // ---------------------------------------------------------------------------
  recordHistory();
  renderAll();
}());
