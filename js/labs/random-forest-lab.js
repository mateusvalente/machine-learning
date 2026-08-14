// =============================================================================
// LABORATÓRIO RANDOM FOREST
// Cada árvore é um stump: [atributo, limiar, classeEsquerda, classeDireita, ...].
// =============================================================================
(function () {
  'use strict';

  var trainingData = [
    [1.0, 2.0, 'A'], [1.8, 6.8, 'A'], [2.8, 4.2, 'A'], [3.8, 1.8, 'A'],
    [4.7, 3.0, 'A'], [2.2, 3.1, 'A'], [4.5, 7.4, 'B'], [5.5, 5.7, 'B'],
    [6.8, 3.4, 'B'], [7.8, 5.2, 'B'], [8.8, 2.5, 'B'], [7.2, 8.1, 'B']
  ];
  var validationData = [
    [1.5, 4.5, 'A'], [2.8, 2.2, 'A'], [3.5, 5.0, 'A'], [4.2, 3.5, 'A'],
    [3.4, 7.8, 'B'], [5.2, 4.8, 'B'], [6.2, 2.9, 'B'], [6.4, 7.1, 'B'],
    [7.5, 4.2, 'B'], [8.5, 7.8, 'B']
  ];
  var forest = [];
  var history = [];
  var randomState = 42;
  var canvas = document.getElementById('forestCanvas');
  var context = canvas.getContext('2d');
  var historyCanvas = document.getElementById('forestHistoryCanvas');
  var historyContext = historyCanvas.getContext('2d');

  function numberValue(id, fallback) {
    var value = Number(document.getElementById(id).value);
    if (!isFinite(value)) return fallback;
    return value;
  }

  function format(value) { return value.toFixed(3).replace('.', ','); }

  function resetRandom() {
    randomState = Math.floor(numberValue('forestSeed', 42));
    if (randomState <= 0) randomState = 42;
  }

  function random() {
    randomState = (randomState * 1664525 + 1013904223) % 4294967296;
    return randomState / 4294967296;
  }

  function randomIndex(limit) { return Math.floor(random() * limit); }

  function gini(countA, countB) {
    var total = countA + countB;
    if (total === 0) return 0;
    var pA = countA / total;
    var pB = countB / total;
    return 1 - pA * pA - pB * pB;
  }

  function majority(countA, countB) {
    if (countA >= countB) return 'A';
    return 'B';
  }

  function bootstrap() {
    var indices = [];
    for (var i = 0; i < trainingData.length; i++) indices[i] = randomIndex(trainingData.length);
    return indices;
  }

  function sortNumbers(values) {
    for (var round = 0; round < values.length; round++) {
      for (var i = 0; i < values.length - 1; i++) {
        if (values[i] > values[i + 1]) {
          var temporary = values[i]; values[i] = values[i + 1]; values[i + 1] = temporary;
        }
      }
    }
  }

  function uniqueValues(indices, feature) {
    var values = [];
    for (var i = 0; i < indices.length; i++) {
      var value = trainingData[indices[i]][feature];
      var exists = false;
      for (var j = 0; j < values.length; j++) if (values[j] === value) exists = true;
      if (!exists) values[values.length] = value;
    }
    sortNumbers(values);
    return values;
  }

  /* Resultado: [giniPonderado, esquerdaA, esquerdaB, direitaA, direitaB]. */
  function evaluateSplit(indices, feature, threshold) {
    var leftA = 0; var leftB = 0; var rightA = 0; var rightB = 0;
    for (var i = 0; i < indices.length; i++) {
      var sample = trainingData[indices[i]];
      if (sample[feature] <= threshold) {
        if (sample[2] === 'A') leftA++; else leftB++;
      } else {
        if (sample[2] === 'A') rightA++; else rightB++;
      }
    }
    var leftTotal = leftA + leftB;
    var rightTotal = rightA + rightB;
    var total = leftTotal + rightTotal;
    var weighted = leftTotal / total * gini(leftA, leftB) + rightTotal / total * gini(rightA, rightB);
    return [weighted, leftA, leftB, rightA, rightB];
  }

  function candidateFeatures() {
    var maximum = Number(document.getElementById('forestMaxFeatures').value);
    if (maximum === 2) return [0, 1];
    return [randomIndex(2)];
  }

  function trainStump() {
    var indices = bootstrap();
    var features = candidateFeatures();
    var best = null;
    for (var f = 0; f < features.length; f++) {
      var feature = features[f];
      var values = uniqueValues(indices, feature);
      for (var i = 0; i < values.length - 1; i++) {
        var threshold = (values[i] + values[i + 1]) / 2;
        var evaluation = evaluateSplit(indices, feature, threshold);
        if (best === null || evaluation[0] < best[0]) best = [evaluation[0], feature, threshold, evaluation[1], evaluation[2], evaluation[3], evaluation[4]];
      }
    }
    if (best === null) best = [0.5, features[0], trainingData[indices[0]][features[0]], 1, 0, 0, 1];
    /* [feature, threshold, leftClass, rightClass, gini, bootstrap, counts...] */
    return [best[1], best[2], majority(best[3], best[4]), majority(best[5], best[6]), best[0], indices, best[3], best[4], best[5], best[6], features];
  }

  function predictTree(tree, point) {
    if (point[tree[0]] <= tree[1]) return tree[2];
    return tree[3];
  }

  /* [classe, votosA, votosB] */
  function predictForest(point, count) {
    var limit = Math.min(count, forest.length);
    var votesA = 0; var votesB = 0;
    for (var i = 0; i < limit; i++) {
      if (predictTree(forest[i], point) === 'A') votesA++; else votesB++;
    }
    if (limit === 0) return ['—', 0, 0];
    return [votesA >= votesB ? 'A' : 'B', votesA, votesB];
  }

  function validationError() {
    if (forest.length === 0) return 1;
    var errors = 0;
    for (var i = 0; i < validationData.length; i++) {
      if (predictForest(validationData[i], forest.length)[0] !== validationData[i][2]) errors++;
    }
    return errors / validationData.length;
  }

  function addTree(renderAfter) {
    forest[forest.length] = trainStump();
    history[history.length] = validationError();
    if (renderAfter) renderAll();
  }

  function resetForest() {
    forest = [];
    history = [];
    resetRandom();
    renderAll();
  }

  function trainForest() {
    forest = [];
    history = [];
    resetRandom();
    var target = Math.max(1, Math.min(40, Math.floor(numberValue('forestTreeTarget', 12))));
    for (var i = 0; i < target; i++) addTree(false);
    renderAll();
  }

  function lastErrorsEqual(windowSize) {
    if (history.length < windowSize) return false;
    var last = history[history.length - 1];
    for (var i = history.length - windowSize; i < history.length; i++) if (Math.abs(history[i] - last) > 0.000001) return false;
    return true;
  }

  function stabilize() {
    if (forest.length === 0) resetRandom();
    while (forest.length < 40 && !lastErrorsEqual(8)) addTree(false);
    renderAll();
    document.getElementById('forestStatus').textContent = lastErrorsEqual(8) ? 'Erro estável por 8 árvores' : 'Limite de 40 árvores';
  }

  function plotX(value) { return 62 + value / 10 * (canvas.width - 92); }
  function plotY(value) { return canvas.height - 58 - value / 10 * (canvas.height - 88); }

  function drawForest(query) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#fbfcff'; context.fillRect(0, 0, canvas.width, canvas.height);
    if (forest.length > 0) {
      var cells = 34;
      for (var row = 0; row < cells; row++) {
        for (var column = 0; column < cells; column++) {
          var xValue = (column + 0.5) / cells * 10;
          var yValue = (row + 0.5) / cells * 10;
          var predicted = predictForest([xValue, yValue], forest.length)[0];
          context.fillStyle = predicted === 'A' ? 'rgba(78,70,229,.12)' : 'rgba(224,108,55,.12)';
          var x0 = plotX(column / cells * 10);
          var x1 = plotX((column + 1) / cells * 10);
          var y0 = plotY((row + 1) / cells * 10);
          var y1 = plotY(row / cells * 10);
          context.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
        }
      }
    }
    context.font = '700 13px Manrope'; context.textAlign = 'center';
    for (var tick = 0; tick <= 10; tick++) {
      var px = plotX(tick); var py = plotY(tick);
      context.strokeStyle = '#e0e4ed'; context.lineWidth = 1;
      context.beginPath(); context.moveTo(px, 25); context.lineTo(px, canvas.height - 58); context.stroke();
      context.beginPath(); context.moveTo(62, py); context.lineTo(canvas.width - 30, py); context.stroke();
      context.fillStyle = '#59647b'; context.fillText(String(tick), px, canvas.height - 34);
      context.textAlign = 'right'; context.fillText(String(tick), 51, py + 5); context.textAlign = 'center';
    }
    context.save(); context.globalAlpha = 0.28;
    for (var t = 0; t < forest.length; t++) {
      var tree = forest[t]; context.strokeStyle = tree[0] === 0 ? '#4e46e5' : '#e06c37'; context.lineWidth = 2;
      context.beginPath();
      if (tree[0] === 0) { context.moveTo(plotX(tree[1]), 25); context.lineTo(plotX(tree[1]), canvas.height - 58); }
      else { context.moveTo(62, plotY(tree[1])); context.lineTo(canvas.width - 30, plotY(tree[1])); }
      context.stroke();
    }
    context.restore();
    for (var i = 0; i < trainingData.length; i++) {
      context.beginPath(); context.arc(plotX(trainingData[i][0]), plotY(trainingData[i][1]), 11, 0, Math.PI * 2);
      context.fillStyle = trainingData[i][2] === 'A' ? '#4e46e5' : '#e06c37'; context.fill();
      context.fillStyle = '#fff'; context.font = '900 11px Manrope'; context.fillText(trainingData[i][2], plotX(trainingData[i][0]), plotY(trainingData[i][1]) + 4);
      context.fillStyle = '#303a52'; context.font = '750 10px Manrope'; context.fillText('P' + (i + 1), plotX(trainingData[i][0]), plotY(trainingData[i][1]) - 17);
    }
    context.beginPath(); context.arc(plotX(query[0]), plotY(query[1]), 15, 0, Math.PI * 2); context.fillStyle = '#172033'; context.fill(); context.strokeStyle = '#8fe4d3'; context.lineWidth = 5; context.stroke();
    context.fillStyle = '#fff'; context.font = '900 16px Manrope'; context.fillText('?', plotX(query[0]), plotY(query[1]) + 6);
    context.fillStyle = '#172033'; context.font = '800 14px Manrope'; context.textAlign = 'right'; context.fillText('x₁', canvas.width - 28, canvas.height - 34); context.textAlign = 'left'; context.fillText('x₂', 20, 25);
  }

  function treeRule(tree) {
    return 'x' + (tree[0] + 1) + ' ≤ ' + format(tree[1]);
  }

  function renderTreeTable(query) {
    var html = '';
    for (var i = 0; i < forest.length; i++) {
      var tree = forest[i];
      var bootstrapText = '';
      for (var b = 0; b < tree[5].length; b++) { if (b > 0) bootstrapText += ', '; bootstrapText += 'P' + (tree[5][b] + 1); }
      html += '<tr><td>' + (i + 1) + '</td><td>' + bootstrapText + '</td><td><code>' + treeRule(tree) + '</code></td><td>' + tree[2] + '</td><td>' + tree[3] + '</td><td>' + format(tree[4]) + '</td><td>' + predictTree(tree, query) + '</td></tr>';
    }
    document.getElementById('forestTreeBody').innerHTML = html || '<tr><td colspan="7">Treine a primeira árvore.</td></tr>';
  }

  function giniFormula(countA, countB) {
    var total = countA + countB;
    if (total === 0) return '0';
    return '1 − (' + countA + '/' + total + ')² − (' + countB + '/' + total + ')² = ' + format(gini(countA, countB));
  }

  function renderMath() {
    if (forest.length === 0) {
      document.getElementById('forestMath').innerHTML = '<article class="full"><b>Comece o treinamento</b><p>Clique em “Treinar 1 árvore” para visualizar o primeiro sorteio.</p></article>';
      return;
    }
    var tree = forest[forest.length - 1];
    var indices = '';
    for (var i = 0; i < tree[5].length; i++) { if (i > 0) indices += ', '; indices += 'P' + (tree[5][i] + 1); }
    var leftTotal = tree[6] + tree[7];
    var rightTotal = tree[8] + tree[9];
    document.getElementById('forestMath').innerHTML =
      '<article><b>1 · Bootstrap com reposição</b><code>[' + indices + ']</code><p>Repetições aumentam o peso daquela amostra nesta árvore.</p></article>' +
      '<article><b>2 · Atributos candidatos</b><code>' + (tree[10].length === 2 ? 'x₁ e x₂' : 'x' + (tree[10][0] + 1)) + '</code><p>A árvore procura limiares apenas nesses atributos.</p></article>' +
      '<article><b>3 · Lado esquerdo</b><code>A=' + tree[6] + ' · B=' + tree[7] + '<br>Gini(L) = ' + giniFormula(tree[6], tree[7]) + '</code><p>Folha escolhida: classe ' + tree[2] + '.</p></article>' +
      '<article><b>4 · Lado direito</b><code>A=' + tree[8] + ' · B=' + tree[9] + '<br>Gini(R) = ' + giniFormula(tree[8], tree[9]) + '</code><p>Folha escolhida: classe ' + tree[3] + '.</p></article>' +
      '<article class="full"><b>5 · Divisão escolhida</b><code>' + treeRule(tree) + '<br>Gini_div = (' + leftTotal + '/12)×Gini(L) + (' + rightTotal + '/12)×Gini(R) = ' + format(tree[4]) + '</code><p>Entre os limiares candidatos, este produziu o menor Gini ponderado.</p></article>';
  }

  function drawHistory() {
    var ctx = historyContext; var w = historyCanvas.width; var h = historyCanvas.height;
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#fbfcff'; ctx.fillRect(0, 0, w, h);
    var left = 64; var right = 30; var top = 28; var bottom = 55;
    ctx.font = '700 12px Manrope'; ctx.textAlign = 'right';
    for (var tick = 0; tick <= 4; tick++) {
      var value = tick * 25; var y = h - bottom - value / 100 * (h - top - bottom);
      ctx.strokeStyle = '#e0e4ed'; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(w - right, y); ctx.stroke(); ctx.fillStyle = '#59647b'; ctx.fillText(value + '%', left - 10, y + 4);
    }
    if (history.length === 0) { ctx.textAlign = 'center'; ctx.fillText('Treine árvores para criar o histórico.', w / 2, h / 2); return; }
    var colors = ['#e35c6e', '#19a987'];
    for (var series = 0; series < 2; series++) {
      ctx.beginPath(); ctx.strokeStyle = colors[series]; ctx.lineWidth = 4;
      for (var i = 0; i < history.length; i++) {
        var x = history.length === 1 ? left : left + i / (history.length - 1) * (w - left - right);
        var percentage = series === 0 ? history[i] * 100 : (1 - history[i]) * 100;
        var py = h - bottom - percentage / 100 * (h - top - bottom);
        if (i === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
      }
      ctx.stroke();
    }
    ctx.textAlign = 'center'; ctx.fillStyle = '#59647b'; ctx.fillText('1', left, h - 27); ctx.fillText(String(history.length), w - right, h - 27); ctx.fillText('número de árvores', w / 2, h - 27);
  }

  function renderAll() {
    var query = [Math.max(0, Math.min(10, numberValue('forestQueryX', 5))), Math.max(0, Math.min(10, numberValue('forestQueryY', 5)))];
    var result = predictForest(query, forest.length);
    var error = validationError();
    drawForest(query); renderTreeTable(query); renderMath(); drawHistory();
    document.getElementById('forestTreeCount').textContent = forest.length;
    document.getElementById('forestPrediction').textContent = forest.length ? 'Classe ' + result[0] : '—';
    document.getElementById('forestVotesA').textContent = result[1];
    document.getElementById('forestVotesB').textContent = result[2];
    document.getElementById('forestError').textContent = forest.length ? Math.round(error * 100) + '%' : '—';
    document.getElementById('forestStatus').textContent = forest.length ? forest.length + ' árvore(s) · seed ' + numberValue('forestSeed', 42) : 'Floresta vazia';
  }

  document.getElementById('forestAddTree').addEventListener('click', function () { if (forest.length === 0) resetRandom(); addTree(true); });
  document.getElementById('forestTrain').addEventListener('click', trainForest);
  document.getElementById('forestStabilize').addEventListener('click', stabilize);
  document.getElementById('forestReset').addEventListener('click', resetForest);
  document.getElementById('forestPredict').addEventListener('click', renderAll);
  document.getElementById('forestQueryX').addEventListener('input', renderAll);
  document.getElementById('forestQueryY').addEventListener('input', renderAll);
  document.getElementById('forestSeed').addEventListener('change', resetForest);
  document.getElementById('forestMaxFeatures').addEventListener('change', resetForest);
  canvas.addEventListener('click', function (event) {
    var rectangle = canvas.getBoundingClientRect();
    var internalX = (event.clientX - rectangle.left) * canvas.width / rectangle.width;
    var internalY = (event.clientY - rectangle.top) * canvas.height / rectangle.height;
    var x = (internalX - 62) / (canvas.width - 92) * 10;
    var y = (canvas.height - 58 - internalY) / (canvas.height - 88) * 10;
    document.getElementById('forestQueryX').value = Math.max(0, Math.min(10, x)).toFixed(1);
    document.getElementById('forestQueryY').value = Math.max(0, Math.min(10, y)).toFixed(1);
    renderAll();
  });
  /* Abre o laboratório com uma floresta pronta; “Reiniciar” volta ao estado vazio. */
  trainForest();
}());
