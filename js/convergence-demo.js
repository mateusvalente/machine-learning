// =============================================================================
// EXPERIMENTO DE CONVERGÊNCIA
// O modelo é uma regressão linear: y_estimado = peso * x + bias.
// A seed controla a inicialização e o embaralhamento das amostras.
// =============================================================================

(function () {
  'use strict';

  var canvas = document.getElementById('convergenceCanvas');
  var context = canvas.getContext('2d');
  var trainingData = [];
  var validationData = [];
  var currentRun = null;
  var comparisonRuns = [];

  // ---------------------------------------------------------------------------
  // 1. GERADOR PSEUDOALEATÓRIO COM SEED
  // ---------------------------------------------------------------------------
  // Esta função LCG sempre produz a mesma sequência para a mesma seed.
  function createRandom(seed) {
    var state = Math.floor(Math.abs(seed)) % 2147483647;
    if (state === 0) state = 1;

    return function () {
      state = state * 16807 % 2147483647;
      return (state - 1) / 2147483646;
    };
  }

  // Aproxima uma distribuição normal somando números uniformes.
  function normalNoise(random) {
    var sum = 0;
    for (var index = 0; index < 6; index++) {
      sum = sum + random();
    }
    return (sum - 3) / 3;
  }

  // ---------------------------------------------------------------------------
  // 2. DATASET FIXO
  // ---------------------------------------------------------------------------
  // O dataset não muda entre execuções. Assim, as curvas diferem somente pela
  // inicialização e pela ordem dos mini-batches controladas pela seed escolhida.
  function createDataset() {
    var random = createRandom(20260813);
    trainingData = [];
    validationData = [];

    for (var index = 0; index < 64; index++) {
      var x = -2 + 4 * index / 63;
      var y = 3 * x + 1 + 0.65 * normalNoise(random);
      trainingData[trainingData.length] = [x, y];
    }

    for (var validationIndex = 0; validationIndex < 24; validationIndex++) {
      var validationX = -1.9 + 3.8 * validationIndex / 23;
      var validationY = 3 * validationX + 1 + 0.65 * normalNoise(random);
      validationData[validationData.length] = [validationX, validationY];
    }
  }

  // ---------------------------------------------------------------------------
  // 3. FUNÇÕES MATEMÁTICAS
  // ---------------------------------------------------------------------------
  function prediction(x, weight, bias) {
    return weight * x + bias;
  }

  function meanSquaredError(data, weight, bias) {
    var total = 0;

    for (var index = 0; index < data.length; index++) {
      var error = prediction(data[index][0], weight, bias) - data[index][1];
      total = total + error * error;
    }
    return total / data.length;
  }

  function shuffledIndices(length, random) {
    var indices = [];
    for (var index = 0; index < length; index++) indices[index] = index;

    for (var current = length - 1; current > 0; current--) {
      var chosen = Math.floor(random() * (current + 1));
      var temporary = indices[current];
      indices[current] = indices[chosen];
      indices[chosen] = temporary;
    }
    return indices;
  }

  // Calcula os gradientes médios de um mini-batch.
  function batchGradient(data, indices, start, end, weight, bias) {
    var gradientWeight = 0;
    var gradientBias = 0;
    var count = end - start;

    for (var position = start; position < end; position++) {
      var sample = data[indices[position]];
      var estimated = prediction(sample[0], weight, bias);
      var error = estimated - sample[1];
      gradientWeight = gradientWeight + 2 * error * sample[0];
      gradientBias = gradientBias + 2 * error;
    }

    return [gradientWeight / count, gradientBias / count];
  }

  // ---------------------------------------------------------------------------
  // 4. TREINAMENTO COMPLETO
  // ---------------------------------------------------------------------------
  function train(seed, batchSize, learningRate, epochs) {
    var random = createRandom(seed);
    var weight = -1 + 2 * random();
    var bias = -1 + 2 * random();
    var initialWeight = weight;
    var initialBias = bias;
    var trainingLosses = [];
    var validationLosses = [];
    var firstStep = null;
    var diverged = false;

    // A posição zero representa o modelo antes da primeira época.
    trainingLosses[0] = meanSquaredError(trainingData, weight, bias);
    validationLosses[0] = meanSquaredError(validationData, weight, bias);

    for (var epoch = 1; epoch <= epochs; epoch++) {
      var indices = shuffledIndices(trainingData.length, random);

      for (var start = 0; start < trainingData.length; start = start + batchSize) {
        var end = Math.min(start + batchSize, trainingData.length);
        var oldWeight = weight;
        var oldBias = bias;
        var gradient = batchGradient(trainingData, indices, start, end, weight, bias);
        weight = weight - learningRate * gradient[0];
        bias = bias - learningRate * gradient[1];

        // Guardamos o primeiro lote para exibir toda a conta na página.
        if (firstStep === null) {
          var firstBatchLoss = 0;
          for (var position = start; position < end; position++) {
            var sample = trainingData[indices[position]];
            var error = prediction(sample[0], oldWeight, oldBias) - sample[1];
            firstBatchLoss = firstBatchLoss + error * error;
          }
          firstBatchLoss = firstBatchLoss / (end - start);
          firstStep = [
            oldWeight, oldBias, gradient[0], gradient[1],
            weight, bias, firstBatchLoss, end - start,
            trainingData[indices[start]][0], trainingData[indices[start]][1]
          ];
        }
      }

      var trainingLoss = meanSquaredError(trainingData, weight, bias);
      var validationLoss = meanSquaredError(validationData, weight, bias);
      trainingLosses[epoch] = trainingLoss;
      validationLosses[epoch] = validationLoss;

      if (!isFinite(trainingLoss) || trainingLoss > 1000000) {
        diverged = true;
        break;
      }
    }

    return [
      seed, batchSize, learningRate, epochs,
      initialWeight, initialBias, weight, bias,
      trainingLosses, validationLosses, firstStep, diverged
    ];
  }

  // ---------------------------------------------------------------------------
  // 5. LEITURA DOS CONTROLES E MÉTRICAS
  // ---------------------------------------------------------------------------
  function readConfiguration() {
    var seed = Math.floor(Number(document.getElementById('convergenceSeed').value));
    var batchSize = Number(document.getElementById('convergenceBatch').value);
    var learningRate = Number(document.getElementById('convergenceRate').value);
    var epochs = Math.floor(Number(document.getElementById('convergenceEpochs').value));

    if (!isFinite(seed) || seed < 1) seed = 42;
    if (!isFinite(batchSize) || batchSize < 1) batchSize = 4;
    if (!isFinite(learningRate) || learningRate <= 0) learningRate = 0.08;
    if (!isFinite(epochs) || epochs < 10) epochs = 80;
    return [seed, batchSize, learningRate, epochs];
  }

  function minimumInformation(values) {
    var minimum = Infinity;
    var minimumIndex = 0;

    for (var index = 0; index < values.length; index++) {
      if (isFinite(values[index]) && values[index] < minimum) {
        minimum = values[index];
        minimumIndex = index;
      }
    }
    return [minimum, minimumIndex];
  }

  function convergenceState(run) {
    if (run[11]) return 'divergiu';
    var losses = run[8];
    if (losses.length < 6) return 'instável';

    var last = losses[losses.length - 1];
    var earlier = losses[losses.length - 6];
    var relativeChange = Math.abs(last - earlier) / Math.max(earlier, 0.000001);
    if (relativeChange < 0.03) return 'convergiu';
    return 'em progresso';
  }

  function format(value, digits) {
    if (!isFinite(value)) return '∞';
    if (Math.abs(value) >= 10000) return value.toExponential(2).replace('.', ',');
    return value.toFixed(digits).replace('.', ',');
  }

  // ---------------------------------------------------------------------------
  // 6. GRÁFICO EM ESCALA LOGARÍTMICA
  // ---------------------------------------------------------------------------
  function logValue(value) {
    return Math.log(Math.max(value, 0.000001)) / Math.LN10;
  }

  function findChartRange() {
    var minimum = Infinity;
    var maximum = -Infinity;
    var runs = [currentRun];

    for (var comparisonIndex = 0; comparisonIndex < comparisonRuns.length; comparisonIndex++) {
      runs[runs.length] = comparisonRuns[comparisonIndex];
    }

    for (var runIndex = 0; runIndex < runs.length; runIndex++) {
      if (!runs[runIndex]) continue;
      for (var seriesIndex = 8; seriesIndex <= 9; seriesIndex++) {
        var values = runs[runIndex][seriesIndex];
        for (var valueIndex = 0; valueIndex < values.length; valueIndex++) {
          if (!isFinite(values[valueIndex])) continue;
          var logged = logValue(values[valueIndex]);
          if (logged < minimum) minimum = logged;
          if (logged > maximum) maximum = logged;
        }
      }
    }

    if (!isFinite(minimum) || !isFinite(maximum)) return [-3, 2];
    minimum = Math.floor(minimum - 0.25);
    maximum = Math.ceil(maximum + 0.25);
    if (maximum - minimum < 2) maximum = minimum + 2;
    return [minimum, maximum];
  }

  function drawAxes(left, top, width, height, range, epochs) {
    context.font = '14px DM Mono, monospace';
    context.textBaseline = 'middle';

    for (var tick = 0; tick <= 5; tick++) {
      var y = top + height * tick / 5;
      var logLoss = range[1] - (range[1] - range[0]) * tick / 5;
      context.strokeStyle = '#dce1eb';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(left + width, y);
      context.stroke();
      context.fillStyle = '#5b667c';
      context.textAlign = 'right';
      context.fillText('10^' + format(logLoss, 1), left - 10, y);
    }

    context.textAlign = 'center';
    context.textBaseline = 'top';
    for (var xTick = 0; xTick <= 5; xTick++) {
      var epoch = Math.round(epochs * xTick / 5);
      var x = left + width * xTick / 5;
      context.fillText(String(epoch), x, top + height + 12);
    }
    context.font = '700 15px DM Mono, monospace';
    context.fillText('época', left + width / 2, top + height + 37);
    context.save();
    context.translate(18, top + height / 2);
    context.rotate(-Math.PI / 2);
    context.fillText('MSE · escala log', 0, 0);
    context.restore();
  }

  function drawSeries(values, color, dashed, lineWidth, left, top, width, height, range, epochs) {
    if (!values || values.length === 0) return;
    context.save();
    context.beginPath();
    context.rect(left, top, width, height);
    context.clip();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.lineJoin = 'round';
    context.setLineDash(dashed ? [8, 6] : []);
    context.beginPath();
    var started = false;

    for (var index = 0; index < values.length; index++) {
      if (!isFinite(values[index])) continue;
      var x = left + width * index / epochs;
      var logged = logValue(values[index]);
      var y = top + height * (range[1] - logged) / (range[1] - range[0]);
      if (!started) {
        context.moveTo(x, y);
        started = true;
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();
    context.restore();
  }

  function drawChart() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#fbfcff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (!currentRun) return;

    var left = 85;
    var top = 28;
    var width = canvas.width - 125;
    var height = canvas.height - 95;
    var range = findChartRange();
    var epochs = currentRun[3];
    drawAxes(left, top, width, height, range, epochs);

    for (var index = 0; index < comparisonRuns.length; index++) {
      drawSeries(comparisonRuns[index][8], 'rgba(25,169,135,0.55)', true, 2, left, top, width, height, range, epochs);
    }
    drawSeries(currentRun[8], '#5149dc', false, 4, left, top, width, height, range, epochs);
    drawSeries(currentRun[9], '#e4773d', false, 4, left, top, width, height, range, epochs);
  }

  // ---------------------------------------------------------------------------
  // 7. CONTA DO PRIMEIRO MINI-BATCH
  // ---------------------------------------------------------------------------
  function renderMath(run) {
    var step = run[10];
    if (!step) return;
    var rate = run[2];
    document.getElementById('convergenceMath').innerHTML =
      '<article><b>1 · Forward</b><p>Primeira amostra do lote: x=' + format(step[8], 2) + ' e y=' + format(step[9], 2) + '.</p><code>ŷ = (' + format(step[0], 3) + ')×(' + format(step[8], 2) + ') + (' + format(step[1], 3) + ')<br>O lote possui B=' + step[7] + ' amostras.</code></article>' +
      '<article><b>2 · Perda e gradientes</b><p>A média combina todos os erros do lote.</p><code>MSE<sub>lote</sub> = ' + format(step[6], 4) + '<br>∂J/∂w = ' + format(step[2], 4) + '<br>∂J/∂b = ' + format(step[3], 4) + '</code></article>' +
      '<article><b>3 · Ajuste</b><p>Subtraímos taxa × gradiente.</p><code>w ← ' + format(step[0], 3) + ' − ' + format(rate, 3) + '×(' + format(step[2], 4) + ') = <strong>' + format(step[4], 3) + '</strong><br>b ← ' + format(step[1], 3) + ' − ' + format(rate, 3) + '×(' + format(step[3], 4) + ') = <strong>' + format(step[5], 3) + '</strong></code></article>';
  }

  function renderMetrics(run) {
    var validationMinimum = minimumInformation(run[9]);
    var finalLoss = run[8][run[8].length - 1];
    var state = convergenceState(run);
    document.getElementById('convergenceSeedMetric').textContent = String(run[0]);
    document.getElementById('convergenceLossMetric').textContent = format(finalLoss, 5);
    document.getElementById('convergenceValidationMetric').textContent = format(validationMinimum[0], 5);
    document.getElementById('convergenceBestEpochMetric').textContent = String(validationMinimum[1]);
    document.getElementById('convergenceStateMetric').textContent = state;

    var finalWeight = run[6];
    var finalBias = run[7];
    document.getElementById('convergenceSummary').innerHTML =
      '<strong>Trajetória da seed ' + run[0] + ':</strong> começou em w=' + format(run[4], 3) + ', b=' + format(run[5], 3) +
      ' e terminou em w=' + format(finalWeight, 3) + ', b=' + format(finalBias, 3) + '. O padrão verdadeiro do dataset é aproximadamente <strong>y=3x+1</strong>. Estado: <strong>' + state + '</strong>.';
  }

  // ---------------------------------------------------------------------------
  // 8. EXECUÇÕES COM UMA OU VÁRIAS SEEDS
  // ---------------------------------------------------------------------------
  function executeCurrent() {
    var config = readConfiguration();
    comparisonRuns = [];
    currentRun = train(config[0], config[1], config[2], config[3]);
    document.getElementById('convergenceSeedResultsCard').hidden = true;
    renderMetrics(currentRun);
    renderMath(currentRun);
    drawChart();
  }

  function arraysAreEqual(first, second) {
    if (first.length !== second.length) return false;
    for (var index = 0; index < first.length; index++) {
      if (first[index] !== second[index]) return false;
    }
    return true;
  }

  function repeatSeed() {
    var config = readConfiguration();
    var first = train(config[0], config[1], config[2], config[3]);
    var second = train(config[0], config[1], config[2], config[3]);
    currentRun = second;
    comparisonRuns = [first];
    renderMetrics(currentRun);
    renderMath(currentRun);
    drawChart();
    var identical = arraysAreEqual(first[8], second[8]);
    document.getElementById('convergenceSummary').innerHTML = '<strong>Repetição controlada:</strong> as duas execuções com seed ' + config[0] + (identical ? ' produziram exatamente a mesma sequência de perdas neste laboratório determinístico.' : ' não coincidiram; existe outra fonte de variação.') + ' As curvas ficam sobrepostas.';
    document.getElementById('convergenceSeedResultsCard').hidden = true;
  }

  function average(values) {
    var sum = 0;
    for (var index = 0; index < values.length; index++) sum = sum + values[index];
    return sum / values.length;
  }

  function standardDeviation(values, mean) {
    var total = 0;
    for (var index = 0; index < values.length; index++) {
      var difference = values[index] - mean;
      total = total + difference * difference;
    }
    return Math.sqrt(total / values.length);
  }

  function compareSeeds() {
    var config = readConfiguration();
    var runs = [];
    var finalLosses = [];
    var html = '<thead><tr><th>Seed</th><th>w final</th><th>b final</th><th>MSE final</th><th>Estado</th></tr></thead><tbody>';

    for (var index = 0; index < 5; index++) {
      var seed = config[0] + index;
      var run = train(seed, config[1], config[2], config[3]);
      runs[runs.length] = run;
      var finalLoss = run[8][run[8].length - 1];
      finalLosses[finalLosses.length] = finalLoss;
      html = html + '<tr><td>' + seed + '</td><td>' + format(run[6], 4) + '</td><td>' + format(run[7], 4) + '</td><td>' + format(finalLoss, 6) + '</td><td>' + convergenceState(run) + '</td></tr>';
    }

    var mean = average(finalLosses);
    var deviation = standardDeviation(finalLosses, mean);
    html = html + '<tr><th colspan="3">Resumo das 5 execuções</th><th colspan="2">' + format(mean, 6) + ' ± ' + format(deviation, 6) + '</th></tr></tbody>';
    currentRun = runs[0];
    comparisonRuns = [];
    for (var runIndex = 1; runIndex < runs.length; runIndex++) comparisonRuns[comparisonRuns.length] = runs[runIndex];
    document.getElementById('convergenceSeedTable').innerHTML = html;
    document.getElementById('convergenceSeedResultsCard').hidden = false;
    renderMetrics(currentRun);
    renderMath(currentRun);
    drawChart();
    document.getElementById('convergenceSummary').innerHTML = '<strong>Cinco seeds comparadas:</strong> a perda final média foi ' + format(mean, 6) + ' e o desvio padrão foi ' + format(deviation, 6) + '. As linhas verdes mostram as trajetórias adicionais.';
  }

  // Aumenta o horizonte em blocos de 10 épocas. Como a seed e o dataset não
  // mudam, treinar novamente até 40 épocas reproduz as 30 primeiras e continua
  // a mesma trajetória. O limite evita uma execução sem fim.
  function executeUntilConverged() {
    var config = readConfiguration();
    var maximumEpochs = 1000;
    var candidateEpochs = 10;
    var run = null;
    var state = 'em progresso';

    while (candidateEpochs <= maximumEpochs) {
      run = train(config[0], config[1], config[2], candidateEpochs);
      state = convergenceState(run);
      if (run[11] || (candidateEpochs >= 30 && state === 'convergiu')) break;
      candidateEpochs = candidateEpochs + 10;
    }

    currentRun = run;
    comparisonRuns = [];
    document.getElementById('convergenceEpochs').value = String(run[8].length - 1);
    document.getElementById('convergenceSeedResultsCard').hidden = true;
    renderMetrics(currentRun);
    renderMath(currentRun);
    drawChart();

    if (run[11]) {
      document.getElementById('convergenceSummary').innerHTML = '<strong>Treinamento interrompido:</strong> a perda divergiu antes de convergir. Reduza a taxa de aprendizado e tente novamente.';
    } else if (state === 'convergiu') {
      document.getElementById('convergenceSummary').innerHTML = '<strong>Convergência detectada:</strong> a variação relativa da perda nas últimas épocas ficou abaixo do critério. Foram necessárias ' + (run[8].length - 1) + ' épocas para esta seed e configuração.';
    } else {
      document.getElementById('convergenceSummary').innerHTML = '<strong>Limite de segurança atingido:</strong> ' + maximumEpochs + ' épocas foram executadas sem confirmar estabilização.';
    }
  }

  // ---------------------------------------------------------------------------
  // 9. EVENTOS E INICIALIZAÇÃO
  // ---------------------------------------------------------------------------
  document.getElementById('convergenceRun').addEventListener('click', executeCurrent);
  document.getElementById('convergenceRepeat').addEventListener('click', repeatSeed);
  document.getElementById('convergenceCompare').addEventListener('click', compareSeeds);
  document.getElementById('convergenceUntil').addEventListener('click', executeUntilConverged);
  createDataset();
  executeCurrent();
}());
