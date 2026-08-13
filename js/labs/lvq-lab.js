// =============================================================================
// LABORATÓRIO LVQ1 E LVQ2.1
// Protótipos e amostras usam arrays [x1, x2, classe].
// A classe 0 é chamada A; a classe 1 é chamada B.
// =============================================================================

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. DATASET ROTULADO E PROTÓTIPOS INICIAIS
  // ---------------------------------------------------------------------------
  var data = [
    [-3.2,  2.7, 0], [-2.8,  1.8, 0], [-2.5,  0.8, 0], [-2.0,  2.4, 0],
    [-1.7,  1.2, 0], [-1.3,  2.9, 0], [-2.8, -1.8, 0], [-2.2, -2.7, 0],
    [-1.5, -1.5, 0], [-0.9, -2.8, 0], [-0.7, -0.7, 0], [-0.4,  1.1, 0],
    [ 3.1,  2.5, 1], [ 2.7,  1.4, 1], [ 2.2,  2.8, 1], [ 1.7,  1.1, 1],
    [ 1.2,  2.1, 1], [ 0.6,  0.5, 1], [ 2.9, -2.4, 1], [ 2.3, -1.4, 1],
    [ 1.8, -2.8, 1], [ 1.1, -1.2, 1], [ 0.5, -2.4, 1], [ 0.2, -0.3, 1]
  ];

  var initialPrototypes = [
    [-1.2,  2.2, 0],
    [-0.8, -2.1, 0],
    [ 2.8,  2.0, 1],
    [ 2.4, -2.0, 1]
  ];

  var prototypes = [];
  var epoch = 0;
  var sampleCursor = 0;
  var totalUpdates = 0;
  var totalPresented = 0;
  var history = [];
  var lastStep = null;
  var testPoint = null;
  var canvas = document.getElementById('lvqCanvas');
  var context = canvas.getContext('2d');
  var historyCanvas = document.getElementById('lvqHistoryCanvas');
  var historyContext = historyCanvas.getContext('2d');
  var margin = 62;
  var rangeMinimum = -4;
  var rangeMaximum = 4;

  function copyPrototypes() {
    prototypes = [];
    for (var index = 0; index < initialPrototypes.length; index++) {
      prototypes[index] = [
        initialPrototypes[index][0],
        initialPrototypes[index][1],
        initialPrototypes[index][2]
      ];
    }
  }

  function snapshotPrototypes() {
    var snapshot = [];
    for (var index = 0; index < prototypes.length; index++) {
      snapshot[index] = [prototypes[index][0], prototypes[index][1], prototypes[index][2]];
    }
    return snapshot;
  }

  function number(value, digits) {
    var safeValue = Math.abs(value) < 0.0000001 ? 0 : value;
    return safeValue.toFixed(digits).replace('.', ',');
  }

  function className(classValue) {
    return classValue === 0 ? 'A' : 'B';
  }

  // ---------------------------------------------------------------------------
  // 2. DISTÂNCIA, COMPETIÇÃO E CLASSIFICAÇÃO
  // ---------------------------------------------------------------------------
  function squaredDistance(point, prototype) {
    var differenceX1 = point[0] - prototype[0];
    var differenceX2 = point[1] - prototype[1];
    return differenceX1 * differenceX1 + differenceX2 * differenceX2;
  }

  function distance(point, prototype) {
    return Math.sqrt(squaredDistance(point, prototype));
  }

  function twoNearest(point) {
    var first = -1;
    var second = -1;

    for (var index = 0; index < prototypes.length; index++) {
      if (first === -1 || distance(point, prototypes[index]) < distance(point, prototypes[first])) {
        second = first;
        first = index;
      } else if (second === -1 || distance(point, prototypes[index]) < distance(point, prototypes[second])) {
        second = index;
      }
    }
    return [first, second];
  }

  function predict(point) {
    var nearest = twoNearest(point)[0];
    return prototypes[nearest][2];
  }

  function classificationMetrics() {
    var correct = 0;
    for (var index = 0; index < data.length; index++) {
      if (predict(data[index]) === data[index][2]) correct = correct + 1;
    }
    return {
      accuracy: correct / data.length,
      error: 1 - correct / data.length,
      correct: correct
    };
  }

  // ---------------------------------------------------------------------------
  // 3. TAXA DECRESCENTE E MOVIMENTO DOS PROTÓTIPOS
  // ---------------------------------------------------------------------------
  function currentLearningRate() {
    var initialRate = Number(document.getElementById('lvqLearningRate').value);
    if (!isFinite(initialRate) || initialRate <= 0) initialRate = 0.04;
    // Decaimento suave: depois de 20 épocas a taxa vale aproximadamente 37%.
    return initialRate * Math.exp(-totalPresented / (data.length * 20));
  }

  function movePrototype(index, point, learningRate, direction) {
    var oldPosition = [prototypes[index][0], prototypes[index][1]];
    prototypes[index][0] = prototypes[index][0] + direction * learningRate * (point[0] - prototypes[index][0]);
    prototypes[index][1] = prototypes[index][1] + direction * learningRate * (point[1] - prototypes[index][1]);
    return {
      index: index,
      direction: direction,
      oldPosition: oldPosition,
      newPosition: [prototypes[index][0], prototypes[index][1]]
    };
  }

  // ---------------------------------------------------------------------------
  // 4. LVQ1: SOMENTE O VENCEDOR É ALTERADO
  // ---------------------------------------------------------------------------
  function trainLVQ1(sample, learningRate) {
    var prototypesBefore = snapshotPrototypes();
    var nearest = twoNearest(sample);
    var winnerIndex = nearest[0];
    var correctWinner = prototypes[winnerIndex][2] === sample[2];
    var distances = [];
    for (var index = 0; index < prototypes.length; index++) distances[index] = distance(sample, prototypes[index]);
    var movement = movePrototype(winnerIndex, sample, learningRate, correctWinner ? 1 : -1);
    totalUpdates = totalUpdates + 1;
    lastStep = {
      algorithm: 'lvq1', sample: [sample[0], sample[1], sample[2]], learningRate: learningRate,
      prototypesBefore: prototypesBefore,
      nearest: nearest, distances: distances, winnerIndex: winnerIndex,
      correctWinner: correctWinner, movements: [movement], updated: true
    };
  }

  // ---------------------------------------------------------------------------
  // 5. LVQ2.1: DOIS PROTÓTIPOS E TESTE DA JANELA
  // ---------------------------------------------------------------------------
  function windowTest(firstDistance, secondDistance, width) {
    var safeFirst = Math.max(0.000001, firstDistance);
    var safeSecond = Math.max(0.000001, secondDistance);
    var ratioOne = safeFirst / safeSecond;
    var ratioTwo = safeSecond / safeFirst;
    var minimumRatio = Math.min(ratioOne, ratioTwo);
    var threshold = (1 - width) / (1 + width);
    return {
      ratioOne: ratioOne,
      ratioTwo: ratioTwo,
      minimumRatio: minimumRatio,
      threshold: threshold,
      inside: minimumRatio > threshold
    };
  }

  function trainLVQ21(sample, learningRate) {
    var prototypesBefore = snapshotPrototypes();
    var nearest = twoNearest(sample);
    var firstIndex = nearest[0];
    var secondIndex = nearest[1];
    var distances = [];
    for (var index = 0; index < prototypes.length; index++) distances[index] = distance(sample, prototypes[index]);
    var differentClasses = prototypes[firstIndex][2] !== prototypes[secondIndex][2];
    var firstCorrect = prototypes[firstIndex][2] === sample[2];
    var secondCorrect = prototypes[secondIndex][2] === sample[2];
    var exactlyOneCorrect = firstCorrect !== secondCorrect;
    var width = Number(document.getElementById('lvqWindow').value);
    if (!isFinite(width) || width <= 0 || width >= 1) width = 0.3;
    var windowResult = windowTest(distances[firstIndex], distances[secondIndex], width);
    var shouldUpdate = differentClasses && exactlyOneCorrect && windowResult.inside;
    var movements = [];

    if (shouldUpdate) {
      if (firstCorrect) {
        movements.push(movePrototype(firstIndex, sample, learningRate, 1));
        movements.push(movePrototype(secondIndex, sample, learningRate, -1));
      } else {
        movements.push(movePrototype(firstIndex, sample, learningRate, -1));
        movements.push(movePrototype(secondIndex, sample, learningRate, 1));
      }
      totalUpdates = totalUpdates + 2;
    }

    lastStep = {
      algorithm: 'lvq21', sample: [sample[0], sample[1], sample[2]], learningRate: learningRate,
      prototypesBefore: prototypesBefore,
      nearest: nearest, distances: distances, differentClasses: differentClasses,
      firstCorrect: firstCorrect, secondCorrect: secondCorrect,
      exactlyOneCorrect: exactlyOneCorrect, window: windowResult,
      windowWidth: width, movements: movements, updated: shouldUpdate
    };
  }

  // ---------------------------------------------------------------------------
  // 6. CONTROLE DAS AMOSTRAS E ÉPOCAS
  // ---------------------------------------------------------------------------
  function processNextSample() {
    var sample = data[sampleCursor];
    var learningRate = currentLearningRate();
    if (document.getElementById('lvqAlgorithm').value === 'lvq21') trainLVQ21(sample, learningRate);
    else trainLVQ1(sample, learningRate);
    totalPresented = totalPresented + 1;
    sampleCursor = sampleCursor + 1;
    if (sampleCursor >= data.length) {
      sampleCursor = 0;
      epoch = epoch + 1;
      recordHistory();
    }
  }

  function trainEpoch() {
    for (var count = 0; count < data.length; count++) processNextSample();
  }

  function recordHistory() {
    var metrics = classificationMetrics();
    history.push([epoch, metrics.error, metrics.accuracy]);
    if (history.length > 301) history.shift();
  }

  // ---------------------------------------------------------------------------
  // 7. DESENHO DO PLANO, REGIÕES E MOVIMENTOS
  // ---------------------------------------------------------------------------
  function canvasX(value) {
    return margin + (value - rangeMinimum) * (canvas.width - 2 * margin) / (rangeMaximum - rangeMinimum);
  }

  function canvasY(value) {
    return canvas.height - margin - (value - rangeMinimum) * (canvas.height - 2 * margin) / (rangeMaximum - rangeMinimum);
  }

  function valueX(pixel) {
    return rangeMinimum + (pixel - margin) * (rangeMaximum - rangeMinimum) / (canvas.width - 2 * margin);
  }

  function valueY(pixel) {
    return rangeMinimum + (canvas.height - margin - pixel) * (rangeMaximum - rangeMinimum) / (canvas.height - 2 * margin);
  }

  function drawDecisionRegions() {
    var cell = 10;
    for (var pixelX = margin; pixelX < canvas.width - margin; pixelX = pixelX + cell) {
      for (var pixelY = margin; pixelY < canvas.height - margin; pixelY = pixelY + cell) {
        var predictedClass = predict([valueX(pixelX + cell / 2), valueY(pixelY + cell / 2)]);
        context.fillStyle = predictedClass === 0 ? 'rgba(78,70,229,.105)' : 'rgba(239,130,68,.105)';
        context.fillRect(pixelX, pixelY, cell, cell);
      }
    }

    // Marca as trocas de classe entre células vizinhas como fronteira.
    for (pixelX = margin + cell; pixelX < canvas.width - margin - cell; pixelX = pixelX + cell) {
      for (pixelY = margin + cell; pixelY < canvas.height - margin - cell; pixelY = pixelY + cell) {
        var centerClass = predict([valueX(pixelX), valueY(pixelY)]);
        var rightClass = predict([valueX(pixelX + cell), valueY(pixelY)]);
        var lowerClass = predict([valueX(pixelX), valueY(pixelY + cell)]);
        context.strokeStyle = 'rgba(47,55,78,.55)';
        context.lineWidth = 1.5;
        if (centerClass !== rightClass) {
          context.beginPath(); context.moveTo(pixelX + cell / 2, pixelY - cell / 2); context.lineTo(pixelX + cell / 2, pixelY + cell / 2); context.stroke();
        }
        if (centerClass !== lowerClass) {
          context.beginPath(); context.moveTo(pixelX - cell / 2, pixelY + cell / 2); context.lineTo(pixelX + cell / 2, pixelY + cell / 2); context.stroke();
        }
      }
    }
  }

  function drawGrid() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#fbfcff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawDecisionRegions();
    context.font = '600 13px DM Mono';
    for (var tick = -4; tick <= 4; tick++) {
      var x = canvasX(tick);
      var y = canvasY(tick);
      context.beginPath(); context.moveTo(x, margin); context.lineTo(x, canvas.height - margin); context.moveTo(margin, y); context.lineTo(canvas.width - margin, y);
      context.strokeStyle = tick === 0 ? '#9da6b9' : '#e4e7ef'; context.lineWidth = tick === 0 ? 2 : 1; context.stroke();
      context.fillStyle = '#647086'; context.textAlign = 'center'; context.textBaseline = 'top'; context.fillText(String(tick), x, canvas.height - margin + 13);
      if (tick !== 0) { context.textAlign = 'right'; context.textBaseline = 'middle'; context.fillText(String(tick), margin - 12, y); }
    }
    context.fillStyle = '#354058'; context.font = '800 15px Manrope'; context.textAlign = 'center'; context.fillText('x₁', canvas.width - margin + 28, canvasY(0)); context.fillText('x₂', canvasX(0), margin - 32);
  }

  function drawSample(sample, index) {
    var x = canvasX(sample[0]);
    var y = canvasY(sample[1]);
    context.beginPath();
    if (sample[2] === 0) context.arc(x, y, 7, 0, Math.PI * 2);
    else context.rect(x - 6, y - 6, 12, 12);
    context.fillStyle = sample[2] === 0 ? '#4e46e5' : '#ef8244';
    context.fill();
    context.strokeStyle = '#fff'; context.lineWidth = 2; context.stroke();
    if (index === sampleCursor) { context.beginPath(); context.arc(x, y, 13, 0, Math.PI * 2); context.strokeStyle = '#172033'; context.lineWidth = 2; context.stroke(); }
  }

  function drawPrototype(prototype, index) {
    var x = canvasX(prototype[0]);
    var y = canvasY(prototype[1]);
    context.save(); context.translate(x, y); context.rotate(Math.PI / 4); context.fillStyle = prototype[2] === 0 ? '#4e46e5' : '#ef8244'; context.fillRect(-13, -13, 26, 26); context.strokeStyle = '#172033'; context.lineWidth = 4; context.strokeRect(-13, -13, 26, 26); context.restore();
    context.fillStyle = '#172033'; context.font = '800 14px Manrope'; context.textAlign = 'left'; context.textBaseline = 'middle'; context.fillText(className(prototype[2]) + (prototype[2] === 0 ? index + 1 : index - 1), x + 18, y);
  }

  function drawArrow(start, end, color) {
    var startX = canvasX(start[0]); var startY = canvasY(start[1]); var endX = canvasX(end[0]); var endY = canvasY(end[1]);
    context.beginPath(); context.moveTo(startX, startY); context.lineTo(endX, endY); context.strokeStyle = color; context.lineWidth = 4; context.stroke();
    var angle = Math.atan2(endY - startY, endX - startX); context.beginPath(); context.moveTo(endX, endY); context.lineTo(endX - 12 * Math.cos(angle - Math.PI / 6), endY - 12 * Math.sin(angle - Math.PI / 6)); context.lineTo(endX - 12 * Math.cos(angle + Math.PI / 6), endY - 12 * Math.sin(angle + Math.PI / 6)); context.closePath(); context.fillStyle = color; context.fill();
  }

  function drawPlane() {
    drawGrid();
    for (var index = 0; index < data.length; index++) drawSample(data[index], index);
    if (lastStep && lastStep.movements) {
      for (index = 0; index < lastStep.movements.length; index++) drawArrow(lastStep.movements[index].oldPosition, lastStep.movements[index].newPosition, lastStep.movements[index].direction === 1 ? '#087c66' : '#c45627');
    }
    for (index = 0; index < prototypes.length; index++) drawPrototype(prototypes[index], index);
    if (testPoint) {
      context.beginPath(); context.arc(canvasX(testPoint[0]), canvasY(testPoint[1]), 11, 0, Math.PI * 2); context.fillStyle = '#fff'; context.fill(); context.strokeStyle = '#172033'; context.lineWidth = 4; context.stroke(); context.fillStyle = '#172033'; context.font = '800 14px Manrope'; context.textAlign = 'left'; context.fillText('teste', canvasX(testPoint[0]) + 16, canvasY(testPoint[1]));
    }
  }

  // ---------------------------------------------------------------------------
  // 8. GRÁFICO DE ERRO E ACURÁCIA
  // ---------------------------------------------------------------------------
  function drawHistory() {
    var width = historyCanvas.width; var height = historyCanvas.height; var left = 66; var right = 28; var top = 25; var bottom = 58;
    historyContext.clearRect(0, 0, width, height); historyContext.fillStyle = '#fbfcff'; historyContext.fillRect(0, 0, width, height);
    historyContext.font = '600 12px Manrope'; historyContext.textBaseline = 'middle';
    for (var yTick = 0; yTick <= 5; yTick++) {
      var y = top + yTick * (height - top - bottom) / 5; var value = 1 - yTick / 5;
      historyContext.beginPath(); historyContext.moveTo(left, y); historyContext.lineTo(width - right, y); historyContext.strokeStyle = '#e4e7ef'; historyContext.lineWidth = 1; historyContext.stroke();
      historyContext.fillStyle = '#647086'; historyContext.textAlign = 'right'; historyContext.fillText(number(value * 100, 0) + '%', left - 10, y);
    }
    var firstEpoch = history[0][0]; var lastEpoch = history[history.length - 1][0]; var epochRange = Math.max(1, lastEpoch - firstEpoch);
    historyContext.textAlign = 'center'; historyContext.textBaseline = 'top';
    for (var xTick = 0; xTick <= 5; xTick++) {
      var x = left + xTick * (width - left - right) / 5; var epochValue = firstEpoch + epochRange * xTick / 5;
      historyContext.fillStyle = '#647086'; historyContext.fillText(String(Math.round(epochValue)), x, height - bottom + 13);
    }
    historyContext.fillStyle = '#354058'; historyContext.font = '800 13px Manrope'; historyContext.fillText('ÉPOCAS', (left + width - right) / 2, height - 23);
    drawHistoryLine(1, '#e35c6e', left, right, top, bottom, epochRange, firstEpoch);
    drawHistoryLine(2, '#19a987', left, right, top, bottom, epochRange, firstEpoch);
  }

  function drawHistoryLine(column, color, left, right, top, bottom, epochRange, firstEpoch) {
    historyContext.beginPath();
    for (var index = 0; index < history.length; index++) {
      var x = left + (history[index][0] - firstEpoch) * (historyCanvas.width - left - right) / epochRange;
      var y = top + (1 - history[index][column]) * (historyCanvas.height - top - bottom);
      if (index === 0) historyContext.moveTo(x, y); else historyContext.lineTo(x, y);
    }
    historyContext.strokeStyle = color; historyContext.lineWidth = 4; historyContext.lineJoin = 'round'; historyContext.stroke();
    if (history.length === 1) { historyContext.beginPath(); historyContext.arc(left, top + (1 - history[0][column]) * (historyCanvas.height - top - bottom), 5, 0, Math.PI * 2); historyContext.fillStyle = color; historyContext.fill(); }
  }

  // ---------------------------------------------------------------------------
  // 9. EXPLICAÇÃO MATEMÁTICA DA ÚLTIMA AMOSTRA
  // ---------------------------------------------------------------------------
  function distanceExpression(sample, prototype, index) {
    var differenceX1 = sample[0] - prototype[0]; var differenceX2 = sample[1] - prototype[1];
    return 'd' + (index + 1) + ' = √[(' + number(sample[0], 2) + '−' + number(prototype[0], 2) + ')² + (' + number(sample[1], 2) + '−' + number(prototype[1], 2) + ')²] = ' + number(distance(sample, prototype), 4);
  }

  function movementMath(movement, sample, rate) {
    var sign = movement.direction === 1 ? '+' : '−'; var action = movement.direction === 1 ? 'atração' : 'repulsão';
    return '<code>' + action + ': m<sub>novo</sub> = m ' + sign + ' α(x − m)<br>x₁: ' + number(movement.oldPosition[0], 4) + ' ' + sign + ' ' + number(rate, 4) + '×(' + number(sample[0], 2) + '−' + number(movement.oldPosition[0], 4) + ') = <strong>' + number(movement.newPosition[0], 4) + '</strong><br>x₂: ' + number(movement.oldPosition[1], 4) + ' ' + sign + ' ' + number(rate, 4) + '×(' + number(sample[1], 2) + '−' + number(movement.oldPosition[1], 4) + ') = <strong>' + number(movement.newPosition[1], 4) + '</strong></code>';
  }

  function renderMath() {
    var container = document.getElementById('lvqMathSteps');
    if (!lastStep) { container.innerHTML = '<p>Treine uma amostra para visualizar as contas.</p>'; return; }
    var step = lastStep; var html = '<article><b>1 · Amostra supervisionada</b><p>Entrada e resposta correta.</p><code>x = [' + number(step.sample[0], 2) + '; ' + number(step.sample[1], 2) + ']<br>y = classe ' + className(step.sample[2]) + '</code></article>';
    html += '<article><b>2 · Todas as distâncias</b><p>O menor valor determina o primeiro colocado.</p><code>';
    for (var index = 0; index < step.prototypesBefore.length; index++) html += distanceExpression(step.sample, step.prototypesBefore[index], index) + (index < step.prototypesBefore.length - 1 ? '<br>' : '');
    html += '</code></article>';

    if (step.algorithm === 'lvq1') {
      var winner = prototypes[step.winnerIndex];
      html += '<article><b>3 · Vencedor e decisão</b><p>O protótipo ' + className(winner[2]) + (step.correctWinner ? ' acertou' : ' errou') + ' a classe.</p><code>m* = protótipo ' + (step.winnerIndex + 1) + '<br>classe(m*) = ' + className(winner[2]) + '<br>classe(x) = ' + className(step.sample[2]) + '<br>ação = <strong>' + (step.correctWinner ? 'ATRAIR' : 'REPELIR') + '</strong></code></article>';
      html += '<article><b>4 · Novo protótipo</b><p>Somente o vencedor muda no LVQ1.</p>' + movementMath(step.movements[0], step.sample, step.learningRate) + '</article>';
    } else {
      var first = prototypes[step.nearest[0]]; var second = prototypes[step.nearest[1]];
      html += '<article><b>3 · Dupla candidata</b><p>Os dois mais próximos precisam representar classes diferentes e exatamente um deve estar correto.</p><code>1º: protótipo ' + (step.nearest[0] + 1) + ' · classe ' + className(first[2]) + '<br>2º: protótipo ' + (step.nearest[1] + 1) + ' · classe ' + className(second[2]) + '<br>classes diferentes? <strong>' + (step.differentClasses ? 'sim' : 'não') + '</strong><br>exatamente um correto? <strong>' + (step.exactlyOneCorrect ? 'sim' : 'não') + '</strong></code></article>';
      html += '<article><b>4 · Teste da janela</b><p>Quanto mais próximas as distâncias, mais perto da fronteira está x.</p><code>s = (1−' + number(step.windowWidth, 2) + ')/(1+' + number(step.windowWidth, 2) + ') = ' + number(step.window.threshold, 4) + '<br>min(d₁/d₂, d₂/d₁) = ' + number(step.window.minimumRatio, 4) + '<br>' + number(step.window.minimumRatio, 4) + ' &gt; ' + number(step.window.threshold, 4) + '? <strong>' + (step.window.inside ? 'sim' : 'não') + '</strong></code></article>';
      if (step.updated) {
        html += '<article class="full"><b>5 · Ajuste duplo</b><p>O correto é atraído e o incorreto é repelido ao mesmo tempo.</p>';
        for (index = 0; index < step.movements.length; index++) html += movementMath(step.movements[index], step.sample, step.learningRate);
        html += '</article>';
      } else {
        var reason = !step.differentClasses ? 'os dois protótipos pertencem à mesma classe' : (!step.exactlyOneCorrect ? 'não existe exatamente um protótipo correto no par' : 'a amostra está fora da janela');
        html += '<article class="full"><b>5 · Sem atualização</b><p>O LVQ2.1 é seletivo.</p><code>Motivo: <strong>' + reason + '</strong><br>Os protótipos permanecem na mesma posição.</code></article>';
      }
    }
    container.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // 10. MÉTRICAS, TABELA E INTERFACE
  // ---------------------------------------------------------------------------
  function renderPrototypeTable() {
    var html = '<thead><tr><th>Protótipo</th><th>Classe</th><th>m₁</th><th>m₂</th><th>Amostras representadas</th></tr></thead><tbody>';
    for (var index = 0; index < prototypes.length; index++) {
      var represented = 0;
      for (var row = 0; row < data.length; row++) if (twoNearest(data[row])[0] === index) represented = represented + 1;
      html += '<tr><td>m' + (index + 1) + '</td><td class="' + (prototypes[index][2] === 0 ? 'prototype-a' : 'prototype-b') + '">' + className(prototypes[index][2]) + '</td><td>' + number(prototypes[index][0], 4) + '</td><td>' + number(prototypes[index][1], 4) + '</td><td>' + represented + '</td></tr>';
    }
    document.getElementById('lvqPrototypeTable').innerHTML = html + '</tbody>';
  }

  function renderMetrics() {
    var metrics = classificationMetrics();
    document.getElementById('lvqEpochMetric').textContent = epoch;
    document.getElementById('lvqUpdateMetric').textContent = totalUpdates;
    document.getElementById('lvqErrorMetric').textContent = number(metrics.error * 100, 1) + '%';
    document.getElementById('lvqCompressionMetric').textContent = data.length + ' → ' + prototypes.length;
    var status = document.getElementById('lvqStatus'); status.textContent = epoch === 0 && totalPresented === 0 ? 'Modelo novo' : (metrics.accuracy >= 0.9 ? 'Protótipos ajustados' : 'Treinando'); status.className = metrics.accuracy >= 0.9 ? 'status success' : 'status';
    document.getElementById('lvqPlaneTitle').textContent = 'Fronteiras do ' + (document.getElementById('lvqAlgorithm').value === 'lvq21' ? 'LVQ2.1' : 'LVQ1');
    document.getElementById('lvqWindow').disabled = document.getElementById('lvqAlgorithm').value !== 'lvq21';
  }

  function renderAll() {
    renderMetrics(); renderMath(); renderPrototypeTable(); drawPlane(); drawHistory();
  }

  function resetModel() {
    copyPrototypes(); epoch = 0; sampleCursor = 0; totalUpdates = 0; totalPresented = 0; history = []; lastStep = null; testPoint = null; recordHistory(); renderAll();
  }

  // ---------------------------------------------------------------------------
  // 11. EVENTOS
  // ---------------------------------------------------------------------------
  document.getElementById('lvqNextSample').addEventListener('click', function () { processNextSample(); renderAll(); });
  document.getElementById('lvqTrainEpoch').addEventListener('click', function () { trainEpoch(); renderAll(); });
  document.getElementById('lvqTrainHundred').addEventListener('click', function () { for (var count = 0; count < 100; count++) trainEpoch(); renderAll(); });
  document.getElementById('lvqReset').addEventListener('click', resetModel);
  document.getElementById('lvqAlgorithm').addEventListener('change', resetModel);
  document.getElementById('lvqTestButton').addEventListener('click', function () {
    var x1 = Number(document.getElementById('lvqTestX1').value); var x2 = Number(document.getElementById('lvqTestX2').value); testPoint = [x1, x2]; var nearest = twoNearest(testPoint)[0];
    document.getElementById('lvqTestResult').innerHTML = 'Classe prevista: <strong>' + className(prototypes[nearest][2]) + '</strong><br>Protótipo vencedor: m' + (nearest + 1) + '<br>Distância: ' + number(distance(testPoint, prototypes[nearest]), 4); drawPlane();
  });

  copyPrototypes(); recordHistory(); renderAll();
}());
