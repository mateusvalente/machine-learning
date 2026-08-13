// =============================================================================
// LABORATÓRIO: REDE NEURAL CONFIGURÁVEL
// A implementação usa arrays e laços for para deixar as matrizes visíveis.
// Em toda a página, u é o potencial e a é a ativação do neurônio.
// =============================================================================

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. ELEMENTOS DA PÁGINA E ESTADO DO EXPERIMENTO
  // ---------------------------------------------------------------------------
  var inputCountSelect = document.getElementById('inputCount');
  var hiddenCountSelect = document.getElementById('hiddenLayerCount');
  var outputCountSelect = document.getElementById('outputCount');
  var hiddenControls = document.getElementById('hiddenLayerControls');
  var sampleSelect = document.getElementById('selectedSample');
  var networkCanvas = document.getElementById('configurableNetworkCanvas');
  var networkContext = networkCanvas.getContext('2d');
  var lossCanvas = document.getElementById('configurableLossCanvas');
  var lossContext = lossCanvas.getContext('2d');

  var layerSizes = [];
  var weights = [];
  var biases = [];
  var dataInputs = [];
  var dataTargets = [];
  var lossHistory = [];
  var epoch = 0;
  var selectedSampleIndex = 0;
  var datasetVersion = 1;
  var networkVersion = 1;
  var randomSeed = 1;

  // ---------------------------------------------------------------------------
  // 2. FUNÇÕES BÁSICAS: NÚMEROS, SIGMOID E FORMATAÇÃO
  // ---------------------------------------------------------------------------
  function seededRandom() {
    randomSeed = (randomSeed * 16807) % 2147483647;
    return (randomSeed - 1) / 2147483646;
  }

  function sigmoid(u) {
    var limited = Math.max(-30, Math.min(30, u));
    return 1 / (1 + Math.exp(-limited));
  }

  function sigmoidDerivative(activation) {
    return activation * (1 - activation);
  }

  function formatNumber(value, digits) {
    var decimals = typeof digits === 'number' ? digits : 3;
    var safeValue = Math.abs(value) < 0.0000001 ? 0 : value;
    return safeValue.toFixed(decimals).replace('.', ',');
  }

  function formatVector(values, digits) {
    var pieces = [];
    for (var index = 0; index < values.length; index++) {
      pieces.push(formatNumber(values[index], digits));
    }
    return '[' + pieces.join('; ') + ']';
  }

  function copyVector(values) {
    var copy = [];
    for (var index = 0; index < values.length; index++) copy[index] = values[index];
    return copy;
  }

  function clippedProbability(value) {
    return Math.max(0.000001, Math.min(0.999999, value));
  }

  // ---------------------------------------------------------------------------
  // 3. CONTROLES DINÂMICOS DA ARQUITETURA
  // ---------------------------------------------------------------------------
  function addOptions(select, first, last) {
    for (var value = first; value <= last; value++) {
      var option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    }
  }

  function initializeControls() {
    addOptions(inputCountSelect, 1, 10);
    addOptions(hiddenCountSelect, 0, 4);
    addOptions(outputCountSelect, 1, 4);
    inputCountSelect.value = '3';
    hiddenCountSelect.value = '2';
    outputCountSelect.value = '2';
    renderHiddenLayerControls();
  }

  function renderHiddenLayerControls() {
    var previousValues = [];
    var oldSelects = hiddenControls.querySelectorAll('select');
    var index;
    for (index = 0; index < oldSelects.length; index++) previousValues[index] = oldSelects[index].value;

    hiddenControls.innerHTML = '';
    var count = Number(hiddenCountSelect.value);

    for (index = 0; index < count; index++) {
      var label = document.createElement('label');
      label.innerHTML = 'NEURÔNIOS C' + (index + 1);
      var select = document.createElement('select');
      select.className = 'hidden-size-select';
      select.setAttribute('aria-label', 'Neurônios da camada oculta ' + (index + 1));
      addOptions(select, 1, 10);
      select.value = previousValues[index] || String(Math.max(3, 5 - index));
      var small = document.createElement('small');
      small.textContent = 'Tamanho da camada C' + (index + 1);
      label.appendChild(select);
      label.appendChild(small);
      hiddenControls.appendChild(label);
    }
  }

  function readArchitecture() {
    layerSizes = [Number(inputCountSelect.value)];
    var hiddenSelects = hiddenControls.querySelectorAll('select');
    for (var index = 0; index < hiddenSelects.length; index++) {
      layerSizes.push(Number(hiddenSelects[index].value));
    }
    layerSizes.push(Number(outputCountSelect.value));
  }

  // ---------------------------------------------------------------------------
  // 4. DATASET SINTÉTICO E REPRODUZÍVEL
  // ---------------------------------------------------------------------------
  function generateDataset() {
    dataInputs = [];
    dataTargets = [];
    randomSeed = 4200 + datasetVersion * 97 + layerSizes[0] * 31 + layerSizes[layerSizes.length - 1] * 17;
    var sampleCount = 16;
    var sample;
    var input;
    var output;

    for (sample = 0; sample < sampleCount; sample++) {
      var inputs = [];
      for (input = 0; input < layerSizes[0]; input++) {
        inputs[input] = Math.round(seededRandom() * 100) / 100;
      }
      dataInputs[sample] = inputs;
    }

    // Calcula uma pontuação escondida para cada saída.
    var scoresByOutput = [];
    for (output = 0; output < layerSizes[layerSizes.length - 1]; output++) {
      scoresByOutput[output] = [];
      for (sample = 0; sample < sampleCount; sample++) {
        var score = 0;
        for (input = 0; input < layerSizes[0]; input++) {
          var coefficient = ((((input + 1) * (output + 2) + output) % 7) - 3) / 3;
          score = score + coefficient * (dataInputs[sample][input] - 0.5);
        }

        // A interação torna parte da regra não linear quando há duas entradas.
        if (layerSizes[0] > 1) {
          var first = output % layerSizes[0];
          var second = (output + 1) % layerSizes[0];
          score = score + 0.55 * (dataInputs[sample][first] - 0.5) * (dataInputs[sample][second] - 0.5);
        }
        scoresByOutput[output][sample] = score;
      }
    }

    // A mediana cria aproximadamente oito alvos 0 e oito alvos 1 por saída.
    var thresholds = [];
    for (output = 0; output < scoresByOutput.length; output++) {
      var orderedScores = copyVector(scoresByOutput[output]);
      orderedScores.sort(function (a, b) { return a - b; });
      thresholds[output] = (orderedScores[7] + orderedScores[8]) / 2;
    }

    for (sample = 0; sample < sampleCount; sample++) {
      var targets = [];
      for (output = 0; output < thresholds.length; output++) {
        targets[output] = scoresByOutput[output][sample] >= thresholds[output] ? 1 : 0;
      }
      dataTargets[sample] = targets;
    }

    renderSampleOptions();
  }

  // ---------------------------------------------------------------------------
  // 5. CRIAÇÃO DAS MATRIZES DE PESOS E BIASES
  // ---------------------------------------------------------------------------
  function createNetwork() {
    weights = [];
    biases = [];
    randomSeed = 9000 + networkVersion * 131 + layerSizes.length * 19;

    for (var layer = 1; layer < layerSizes.length; layer++) {
      var weightLayer = [];
      var biasLayer = [];
      var scale = Math.sqrt(2 / (layerSizes[layer - 1] + layerSizes[layer]));

      for (var neuron = 0; neuron < layerSizes[layer]; neuron++) {
        weightLayer[neuron] = [];
        biasLayer[neuron] = (seededRandom() * 2 - 1) * scale;

        for (var previous = 0; previous < layerSizes[layer - 1]; previous++) {
          weightLayer[neuron][previous] = (seededRandom() * 2 - 1) * scale;
        }
      }
      weights[layer - 1] = weightLayer;
      biases[layer - 1] = biasLayer;
    }

    epoch = 0;
    lossHistory = [];
    recordHistory();
  }

  // ---------------------------------------------------------------------------
  // 6. FORWARD PASS
  // ---------------------------------------------------------------------------
  function forward(inputValues) {
    var activations = [copyVector(inputValues)];
    var potentials = [];

    for (var layer = 0; layer < weights.length; layer++) {
      var layerPotentials = [];
      var layerActivations = [];

      for (var neuron = 0; neuron < weights[layer].length; neuron++) {
        var u = biases[layer][neuron];
        for (var previous = 0; previous < weights[layer][neuron].length; previous++) {
          u = u + weights[layer][neuron][previous] * activations[layer][previous];
        }
        layerPotentials[neuron] = u;
        layerActivations[neuron] = sigmoid(u);
      }
      potentials[layer] = layerPotentials;
      activations[layer + 1] = layerActivations;
    }

    return { activations: activations, potentials: potentials };
  }

  // ---------------------------------------------------------------------------
  // 7. ERRO E BACKPROPAGATION
  // ---------------------------------------------------------------------------
  function sampleLoss(predictions, targets) {
    var total = 0;
    for (var output = 0; output < targets.length; output++) {
      var probability = clippedProbability(predictions[output]);
      total = total - targets[output] * Math.log(probability) - (1 - targets[output]) * Math.log(1 - probability);
    }
    return total / targets.length;
  }

  function calculateDeltas(activations, targets) {
    var deltas = [];
    var lastWeightLayer = weights.length - 1;
    var outputActivations = activations[activations.length - 1];
    deltas[lastWeightLayer] = [];

    // Com Sigmoid + entropia cruzada, o delta de cada saída parte de ŷ - y.
    // Como E é a média das saídas, dividimos também pela quantidade de saídas.
    for (var output = 0; output < outputActivations.length; output++) {
      deltas[lastWeightLayer][output] = (outputActivations[output] - targets[output]) / targets.length;
    }

    // Agora o erro volta da última camada oculta até a primeira.
    for (var layer = lastWeightLayer - 1; layer >= 0; layer--) {
      deltas[layer] = [];
      for (var neuron = 0; neuron < activations[layer + 1].length; neuron++) {
        var returnedError = 0;
        for (var nextNeuron = 0; nextNeuron < deltas[layer + 1].length; nextNeuron++) {
          returnedError = returnedError + weights[layer + 1][nextNeuron][neuron] * deltas[layer + 1][nextNeuron];
        }
        deltas[layer][neuron] = returnedError * sigmoidDerivative(activations[layer + 1][neuron]);
      }
    }
    return deltas;
  }

  function updateWeights(activations, deltas, learningRate) {
    for (var layer = 0; layer < weights.length; layer++) {
      for (var neuron = 0; neuron < weights[layer].length; neuron++) {
        for (var previous = 0; previous < weights[layer][neuron].length; previous++) {
          var gradient = deltas[layer][neuron] * activations[layer][previous];
          weights[layer][neuron][previous] = weights[layer][neuron][previous] - learningRate * gradient;
        }
        biases[layer][neuron] = biases[layer][neuron] - learningRate * deltas[layer][neuron];
      }
    }
  }

  function trainSample(sampleIndex, learningRate) {
    var result = forward(dataInputs[sampleIndex]);
    var deltas = calculateDeltas(result.activations, dataTargets[sampleIndex]);
    updateWeights(result.activations, deltas, learningRate);
  }

  function trainEpoch() {
    var learningRate = Number(document.getElementById('learningRate').value);
    if (!isFinite(learningRate) || learningRate <= 0) learningRate = 0.2;
    for (var sample = 0; sample < dataInputs.length; sample++) trainSample(sample, learningRate);
    epoch = epoch + 1;
    recordHistory();
  }

  // ---------------------------------------------------------------------------
  // 8. AVALIAÇÃO DA REDE
  // ---------------------------------------------------------------------------
  function evaluateNetwork() {
    var lossTotal = 0;
    var correctBits = 0;
    var correctSamples = 0;
    var totalBits = dataInputs.length * layerSizes[layerSizes.length - 1];

    for (var sample = 0; sample < dataInputs.length; sample++) {
      var result = forward(dataInputs[sample]);
      var predictions = result.activations[result.activations.length - 1];
      lossTotal = lossTotal + sampleLoss(predictions, dataTargets[sample]);
      var complete = true;

      for (var output = 0; output < predictions.length; output++) {
        var predictedClass = predictions[output] >= 0.5 ? 1 : 0;
        if (predictedClass === dataTargets[sample][output]) correctBits = correctBits + 1;
        else complete = false;
      }
      if (complete) correctSamples = correctSamples + 1;
    }

    return {
      loss: lossTotal / dataInputs.length,
      bitAccuracy: correctBits / totalBits,
      sampleAccuracy: correctSamples / dataInputs.length
    };
  }

  function recordHistory() {
    var metrics = evaluateNetwork();
    lossHistory.push([epoch, metrics.loss]);
    if (lossHistory.length > 401) lossHistory.shift();
  }

  // ---------------------------------------------------------------------------
  // 9. DESENHO DA REDE
  // ---------------------------------------------------------------------------
  function nodeY(index, count) {
    var top = 96;
    var bottom = networkCanvas.height - 54;
    if (count === 1) return (top + bottom) / 2;
    return top + index * (bottom - top) / (count - 1);
  }

  function nodeX(layerIndex) {
    var left = 72;
    var right = networkCanvas.width - 72;
    if (layerSizes.length === 1) return networkCanvas.width / 2;
    return left + layerIndex * (right - left) / (layerSizes.length - 1);
  }

  function layerTitle(layerIndex) {
    if (layerIndex === 0) return 'ENTRADAS (' + layerSizes[layerIndex] + ')';
    if (layerIndex === layerSizes.length - 1) return 'SAÍDAS (' + layerSizes[layerIndex] + ')';
    return 'OCULTA C' + layerIndex + ' (' + layerSizes[layerIndex] + ')';
  }

  function drawRoundedRectangle(context, x, y, width, height, radius) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fill();
  }

  function drawNetwork() {
    networkContext.clearRect(0, 0, networkCanvas.width, networkCanvas.height);
    var inspected = forward(dataInputs[selectedSampleIndex]);
    var layer;
    var neuron;
    var previous;

    // Conexões são desenhadas primeiro para ficarem atrás dos neurônios.
    for (layer = 1; layer < layerSizes.length; layer++) {
      for (neuron = 0; neuron < layerSizes[layer]; neuron++) {
        for (previous = 0; previous < layerSizes[layer - 1]; previous++) {
          var weight = weights[layer - 1][neuron][previous];
          var alpha = Math.min(0.58, 0.12 + Math.abs(weight) * 0.32);
          networkContext.beginPath();
          networkContext.moveTo(nodeX(layer - 1) + 24, nodeY(previous, layerSizes[layer - 1]));
          networkContext.lineTo(nodeX(layer) - 24, nodeY(neuron, layerSizes[layer]));
          networkContext.strokeStyle = weight >= 0 ? 'rgba(78,70,229,' + alpha + ')' : 'rgba(239,126,66,' + alpha + ')';
          networkContext.lineWidth = Math.min(3.2, 0.7 + Math.abs(weight) * 1.7);
          networkContext.stroke();
        }
      }
    }

    for (layer = 0; layer < layerSizes.length; layer++) {
      var x = nodeX(layer);
      networkContext.fillStyle = layer === 0 ? '#edecff' : (layer === layerSizes.length - 1 ? '#fff0e6' : '#e5f9f4');
      drawRoundedRectangle(networkContext, x - 70, 18, 140, 36, 8);
      networkContext.fillStyle = layer === 0 ? '#4942c7' : (layer === layerSizes.length - 1 ? '#ae5727' : '#087d67');
      networkContext.font = '700 14px Manrope';
      networkContext.textAlign = 'center';
      networkContext.fillText(layerTitle(layer), x, 41);

      for (neuron = 0; neuron < layerSizes[layer]; neuron++) {
        var y = nodeY(neuron, layerSizes[layer]);
        var activation = inspected.activations[layer][neuron];
        networkContext.beginPath();
        networkContext.arc(x, y, 25, 0, Math.PI * 2);
        networkContext.fillStyle = '#fff';
        networkContext.fill();
        networkContext.strokeStyle = layer === 0 ? '#625aeb' : (layer === layerSizes.length - 1 ? '#e57b3c' : '#19a987');
        networkContext.lineWidth = 3;
        networkContext.stroke();

        networkContext.fillStyle = '#172033';
        networkContext.font = '800 13px Manrope';
        var nodeName = layer === 0 ? 'x' + (neuron + 1) : (layer === layerSizes.length - 1 ? 'ŷ' + (neuron + 1) : 'h' + layer + ',' + (neuron + 1));
        networkContext.fillText(nodeName, x, y - 4);
        networkContext.fillStyle = '#647086';
        networkContext.font = '600 10px DM Mono';
        networkContext.fillText(formatNumber(activation, 2), x, y + 12);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 10. GRÁFICO DO ERRO COM EIXOS NUMERADOS
  // ---------------------------------------------------------------------------
  function drawLossChart() {
    var width = lossCanvas.width;
    var height = lossCanvas.height;
    var left = 76;
    var right = 30;
    var top = 28;
    var bottom = 60;
    lossContext.clearRect(0, 0, width, height);
    lossContext.fillStyle = '#fbfcff';
    lossContext.fillRect(0, 0, width, height);

    var maximumLoss = 0.2;
    for (var index = 0; index < lossHistory.length; index++) {
      if (lossHistory[index][1] > maximumLoss) maximumLoss = lossHistory[index][1];
    }
    maximumLoss = maximumLoss * 1.12;
    var firstEpoch = lossHistory[0][0];
    var lastEpoch = lossHistory[lossHistory.length - 1][0];
    var epochRange = Math.max(1, lastEpoch - firstEpoch);

    lossContext.font = '600 13px Manrope';
    lossContext.textAlign = 'right';
    lossContext.textBaseline = 'middle';
    for (var yTick = 0; yTick <= 5; yTick++) {
      var yValue = maximumLoss * (5 - yTick) / 5;
      var y = top + yTick * (height - top - bottom) / 5;
      lossContext.beginPath();
      lossContext.moveTo(left, y);
      lossContext.lineTo(width - right, y);
      lossContext.strokeStyle = '#e4e7ef';
      lossContext.lineWidth = 1;
      lossContext.stroke();
      lossContext.fillStyle = '#647086';
      lossContext.fillText(formatNumber(yValue, 2), left - 11, y);
    }

    lossContext.textAlign = 'center';
    lossContext.textBaseline = 'top';
    for (var xTick = 0; xTick <= 5; xTick++) {
      var x = left + xTick * (width - left - right) / 5;
      var epochValue = firstEpoch + epochRange * xTick / 5;
      lossContext.fillStyle = '#647086';
      lossContext.fillText(String(Math.round(epochValue)), x, height - bottom + 13);
    }
    lossContext.fillStyle = '#354058';
    lossContext.font = '800 14px Manrope';
    lossContext.fillText('ÉPOCAS', (left + width - right) / 2, height - 24);
    lossContext.save();
    lossContext.translate(20, (top + height - bottom) / 2);
    lossContext.rotate(-Math.PI / 2);
    lossContext.fillText('ERRO MÉDIO', 0, 0);
    lossContext.restore();

    if (lossHistory.length === 1) {
      lossContext.beginPath();
      lossContext.arc(left, top + (height - top - bottom) * (1 - lossHistory[0][1] / maximumLoss), 5, 0, Math.PI * 2);
      lossContext.fillStyle = '#e35c6e';
      lossContext.fill();
      return;
    }

    lossContext.beginPath();
    for (index = 0; index < lossHistory.length; index++) {
      var pointX = left + (lossHistory[index][0] - firstEpoch) * (width - left - right) / epochRange;
      var pointY = top + (1 - lossHistory[index][1] / maximumLoss) * (height - top - bottom);
      if (index === 0) lossContext.moveTo(pointX, pointY);
      else lossContext.lineTo(pointX, pointY);
    }
    lossContext.strokeStyle = '#e35c6e';
    lossContext.lineWidth = 4;
    lossContext.lineJoin = 'round';
    lossContext.stroke();
  }

  // ---------------------------------------------------------------------------
  // 11. TABELA DINÂMICA DE ENTRADAS, SAÍDAS E ERROS
  // ---------------------------------------------------------------------------
  function renderResultsTable() {
    var table = document.getElementById('resultsTable');
    var html = '<thead><tr><th rowspan="2">#</th><th colspan="' + layerSizes[0] + '">Entradas</th>';
    var outputCount = layerSizes[layerSizes.length - 1];
    var output;
    for (output = 0; output < outputCount; output++) html += '<th class="output-group" colspan="3">Saída ' + (output + 1) + '</th>';
    html += '<th class="cost-group" rowspan="2">Custo E</th></tr><tr>';
    var input;
    for (input = 0; input < layerSizes[0]; input++) html += '<th>x' + (input + 1) + '</th>';
    for (output = 0; output < outputCount; output++) html += '<th>y' + (output + 1) + '</th><th>ŷ' + (output + 1) + '</th><th>e' + (output + 1) + '</th>';
    html += '</tr></thead><tbody>';

    for (var sample = 0; sample < dataInputs.length; sample++) {
      var result = forward(dataInputs[sample]);
      var predictions = result.activations[result.activations.length - 1];
      html += '<tr data-sample="' + sample + '"' + (sample === selectedSampleIndex ? ' class="selected"' : '') + '><td>' + (sample + 1) + '</td>';
      for (input = 0; input < dataInputs[sample].length; input++) html += '<td>' + formatNumber(dataInputs[sample][input], 2) + '</td>';
      for (output = 0; output < predictions.length; output++) {
        var predictedClass = predictions[output] >= 0.5 ? 1 : 0;
        var predictionClass = predictedClass === dataTargets[sample][output] ? 'predicted-one' : 'predicted-zero';
        html += '<td><strong>' + dataTargets[sample][output] + '</strong></td>';
        html += '<td class="' + predictionClass + '">' + formatNumber(predictions[output], 3) + ' → ' + predictedClass + '</td>';
        html += '<td>' + formatNumber(dataTargets[sample][output] - predictions[output], 3) + '</td>';
      }
      html += '<td class="sample-loss">' + formatNumber(sampleLoss(predictions, dataTargets[sample]), 4) + '</td></tr>';
    }
    html += '</tbody>';
    table.innerHTML = html;

    var rows = table.querySelectorAll('tbody tr');
    for (var row = 0; row < rows.length; row++) {
      rows[row].addEventListener('click', function () {
        selectedSampleIndex = Number(this.getAttribute('data-sample'));
        sampleSelect.value = String(selectedSampleIndex);
        renderAll();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 12. EXPLICAÇÃO MATEMÁTICA COM OS VALORES REAIS DA AMOSTRA
  // ---------------------------------------------------------------------------
  function sumExpression(layer, neuron, activations) {
    var terms = [];
    var maximumTerms = Math.min(5, weights[layer][neuron].length);
    for (var previous = 0; previous < maximumTerms; previous++) {
      terms.push('(' + formatNumber(weights[layer][neuron][previous], 3) + ' × ' + formatNumber(activations[layer][previous], 3) + ')');
    }
    if (weights[layer][neuron].length > maximumTerms) terms.push('…');
    return formatNumber(biases[layer][neuron], 3) + ' + ' + terms.join(' + ');
  }

  function renderMathWalkthrough() {
    var inputs = dataInputs[selectedSampleIndex];
    var targets = dataTargets[selectedSampleIndex];
    var result = forward(inputs);
    var activations = result.activations;
    var potentials = result.potentials;
    var predictions = activations[activations.length - 1];
    var deltas = calculateDeltas(activations, targets);
    var learningRate = Number(document.getElementById('learningRate').value) || 0.2;
    var html = '';
    var layer;
    var output;

    html += '<article class="config-math-card"><span>1</span><h3>Forward: da entrada até ŷ</h3><p>O primeiro neurônio de cada camada mostra como a somatória foi montada.</p><div class="config-math-lines">';
    for (layer = 0; layer < weights.length; layer++) {
      var label = layer === weights.length - 1 ? 'saída' : 'C' + (layer + 1);
      html += '<code><em>u(' + label + ',1)</em> = ' + sumExpression(layer, 0, activations) + ' = <strong>' + formatNumber(potentials[layer][0], 4) + '</strong></code>';
      html += '<code>a(' + label + ',1) = σ(' + formatNumber(potentials[layer][0], 4) + ') = <strong>' + formatNumber(activations[layer + 1][0], 4) + '</strong></code>';
    }
    html += '</div></article>';

    html += '<article class="config-math-card"><span>2</span><h3>Erro: cada saída participa do custo</h3><p>O erro com sinal e = y − ŷ ajuda a interpretar a direção. A entropia cruzada E é a função efetivamente minimizada.</p><div class="config-math-lines">';
    for (output = 0; output < predictions.length; output++) {
      var probability = clippedProbability(predictions[output]);
      var outputCost = -targets[output] * Math.log(probability) - (1 - targets[output]) * Math.log(1 - probability);
      html += '<code>e' + (output + 1) + ' = ' + targets[output] + ' − ' + formatNumber(predictions[output], 4) + ' = <strong>' + formatNumber(targets[output] - predictions[output], 4) + '</strong></code>';
      html += '<code>E' + (output + 1) + ' = −[' + targets[output] + 'ln(' + formatNumber(predictions[output], 4) + ') + (1−' + targets[output] + ')ln(1−' + formatNumber(predictions[output], 4) + ')] = <strong>' + formatNumber(outputCost, 4) + '</strong></code>';
    }
    html += '<code>E<sub>amostra</sub> = (E1 + … + E' + predictions.length + ') ÷ ' + predictions.length + ' = <strong>' + formatNumber(sampleLoss(predictions, targets), 4) + '</strong></code></div></article>';

    var lastLayer = deltas.length - 1;
    html += '<article class="config-math-card"><span>3</span><h3>Delta dos neurônios de saída</h3><p>Sigmoid mais entropia cruzada simplifica a derivada. Como usamos a média das m saídas, δ = (ŷ − y) ÷ m.</p><div class="config-math-lines">';
    for (output = 0; output < predictions.length; output++) {
      html += '<code>δ<sup>saída</sup>' + (output + 1) + ' = (ŷ' + (output + 1) + ' − y' + (output + 1) + ') ÷ ' + predictions.length + ' = (' + formatNumber(predictions[output], 4) + ' − ' + targets[output] + ') ÷ ' + predictions.length + ' = <strong>' + formatNumber(deltas[lastLayer][output], 4) + '</strong></code>';
    }
    html += '</div></article>';

    html += '<article class="config-math-card"><span>4</span><h3>O erro volta pelas camadas ocultas</h3>';
    if (weights.length === 1) {
      html += '<p>Esta arquitetura não possui camada oculta. O delta da saída já pode atualizar diretamente os pesos ligados às entradas.</p><div class="config-math-lines"><code>entradas → saídas: <strong>não há delta oculto</strong></code></div>';
    } else {
      html += '<p>Para o primeiro neurônio de cada camada, somamos os deltas ponderados da camada seguinte e multiplicamos por σ′(a).</p><div class="config-math-lines">';
      for (layer = lastLayer - 1; layer >= 0; layer--) {
        var returned = 0;
        var returnedTerms = [];
        for (var next = 0; next < deltas[layer + 1].length; next++) {
          returned = returned + weights[layer + 1][next][0] * deltas[layer + 1][next];
          if (next < 4) returnedTerms.push('(' + formatNumber(weights[layer + 1][next][0], 3) + '×' + formatNumber(deltas[layer + 1][next], 3) + ')');
        }
        if (deltas[layer + 1].length > 4) returnedTerms.push('…');
        var hiddenActivation = activations[layer + 1][0];
        html += '<code>δ<sup>C' + (layer + 1) + '</sup>1 = [' + returnedTerms.join(' + ') + '] × [' + formatNumber(hiddenActivation, 3) + '×(1−' + formatNumber(hiddenActivation, 3) + ')] = <strong>' + formatNumber(deltas[layer][0], 4) + '</strong></code>';
      }
      html += '</div>';
    }
    html += '</article>';

    html += '<article class="config-math-card full"><span>5</span><h3>Ajuste de um peso e do bias em cada camada</h3><p>O gradiente do peso multiplica o delta do neurônio pela ativação que chegou pela conexão. Para o bias, essa entrada vale sempre 1.</p><div class="config-math-lines">';
    for (layer = 0; layer < weights.length; layer++) {
      var oldWeight = weights[layer][0][0];
      var oldBias = biases[layer][0];
      var gradient = deltas[layer][0] * activations[layer][0];
      var newWeight = oldWeight - learningRate * gradient;
      var newBias = oldBias - learningRate * deltas[layer][0];
      var updateLabel = layer === weights.length - 1 ? 'saída' : 'C' + (layer + 1);
      html += '<code><em>Camada ' + updateLabel + '</em>: w₁₁ novo = ' + formatNumber(oldWeight, 4) + ' − ' + formatNumber(learningRate, 2) + ' × (' + formatNumber(deltas[layer][0], 4) + ' × ' + formatNumber(activations[layer][0], 4) + ') = <strong>' + formatNumber(newWeight, 4) + '</strong></code>';
      html += '<code>b₁ novo = ' + formatNumber(oldBias, 4) + ' − ' + formatNumber(learningRate, 2) + ' × (' + formatNumber(deltas[layer][0], 4) + ' × 1) = <strong>' + formatNumber(newBias, 4) + '</strong></code>';
    }
    html += '</div></article>';
    document.getElementById('mathWalkthrough').innerHTML = html;
  }

  function renderForwardSummary() {
    var result = forward(dataInputs[selectedSampleIndex]);
    var lastActivation = result.activations[result.activations.length - 1];
    var hiddenDescription = 'Nenhuma camada oculta';
    if (layerSizes.length > 2) {
      var hiddenParts = [];
      for (var layer = 1; layer < result.activations.length - 1; layer++) hiddenParts.push('a<sup>C' + layer + '</sup> = ' + formatVector(result.activations[layer], 3));
      hiddenDescription = hiddenParts.join('<br>');
    }
    document.getElementById('forwardSummary').innerHTML =
      '<div><b>Entrada da amostra ' + (selectedSampleIndex + 1) + '</b><code>x = ' + formatVector(dataInputs[selectedSampleIndex], 2) + '</code></div>' +
      '<div><b>Ativações ocultas</b><code>' + hiddenDescription + '</code></div>' +
      '<div><b>Saída e alvo</b><code>ŷ = ' + formatVector(lastActivation, 3) + '<br>y = ' + formatVector(dataTargets[selectedSampleIndex], 0) + '</code></div>';
  }

  // ---------------------------------------------------------------------------
  // 13. ATUALIZAÇÃO DA INTERFACE
  // ---------------------------------------------------------------------------
  function renderSampleOptions() {
    sampleSelect.innerHTML = '';
    for (var sample = 0; sample < dataInputs.length; sample++) {
      var option = document.createElement('option');
      option.value = sample;
      option.textContent = 'Amostra ' + (sample + 1);
      sampleSelect.appendChild(option);
    }
    selectedSampleIndex = Math.min(selectedSampleIndex, dataInputs.length - 1);
    sampleSelect.value = String(selectedSampleIndex);
  }

  function updateArchitectureText() {
    document.getElementById('architectureText').textContent = 'Arquitetura: ' + layerSizes.join(' → ');
  }

  function updateMetrics() {
    var metrics = evaluateNetwork();
    document.getElementById('epochMetric').textContent = epoch;
    document.getElementById('lossMetric').textContent = formatNumber(metrics.loss, 4);
    document.getElementById('bitAccuracyMetric').textContent = formatNumber(metrics.bitAccuracy * 100, 1) + '%';
    document.getElementById('sampleAccuracyMetric').textContent = formatNumber(metrics.sampleAccuracy * 100, 1) + '%';
    var status = document.getElementById('networkStatus');
    status.textContent = epoch === 0 ? 'Rede nova' : (metrics.bitAccuracy >= 0.9 ? 'Aprendizado avançado' : 'Treinando');
    status.className = metrics.bitAccuracy >= 0.9 ? 'status success' : 'status';
  }

  function renderAll() {
    updateArchitectureText();
    updateMetrics();
    renderForwardSummary();
    renderMathWalkthrough();
    renderResultsTable();
    drawNetwork();
    drawLossChart();
  }

  function rebuildEverything(createNewDataset) {
    readArchitecture();
    selectedSampleIndex = 0;
    if (createNewDataset) generateDataset();
    networkVersion = networkVersion + 1;
    createNetwork();
    renderAll();
  }

  // ---------------------------------------------------------------------------
  // 14. EVENTOS DOS BOTÕES
  // ---------------------------------------------------------------------------
  hiddenCountSelect.addEventListener('change', renderHiddenLayerControls);

  document.getElementById('applyArchitecture').addEventListener('click', function () {
    datasetVersion = datasetVersion + 1;
    rebuildEverything(true);
  });

  document.getElementById('newDataset').addEventListener('click', function () {
    readArchitecture();
    datasetVersion = datasetVersion + 1;
    selectedSampleIndex = 0;
    generateDataset();
    networkVersion = networkVersion + 1;
    createNetwork();
    renderAll();
  });

  document.getElementById('resetNetwork').addEventListener('click', function () {
    networkVersion = networkVersion + 1;
    createNetwork();
    renderAll();
  });

  document.getElementById('trainOne').addEventListener('click', function () {
    trainEpoch();
    renderAll();
  });

  document.getElementById('trainHundred').addEventListener('click', function () {
    for (var count = 0; count < 100; count++) trainEpoch();
    renderAll();
  });

  sampleSelect.addEventListener('change', function () {
    selectedSampleIndex = Number(sampleSelect.value);
    renderAll();
  });

  document.getElementById('learningRate').addEventListener('change', renderMathWalkthrough);

  // ---------------------------------------------------------------------------
  // 15. INICIALIZAÇÃO
  // ---------------------------------------------------------------------------
  initializeControls();
  readArchitecture();
  generateDataset();
  createNetwork();
  renderAll();
}());
