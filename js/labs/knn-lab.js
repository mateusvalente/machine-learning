// =============================================================================
// LABORATÓRIO k-NN
// Os dados usam arrays [x1, x2, classe]. Não há pesos nem épocas.
// =============================================================================
(function () {
  'use strict';

  var originalData = [
    [1.2, 18, 'A'], [2.0, 55, 'A'], [3.1, 35, 'A'], [3.8, 78, 'A'], [4.4, 48, 'A'],
    [5.8, 22, 'B'], [6.5, 58, 'B'], [7.3, 38, 'B'], [8.1, 76, 'B'], [9.0, 50, 'B']
  ];
  var data = copyData(originalData);
  var canvas = document.getElementById('knnCanvas');
  var context = canvas.getContext('2d');
  var errorCanvas = document.getElementById('knnErrorCanvas');
  var errorContext = errorCanvas.getContext('2d');
  var selectedNeighbors = [];

  function copyData(source) {
    var copy = [];
    for (var i = 0; i < source.length; i++) copy[i] = [source[i][0], source[i][1], source[i][2]];
    return copy;
  }

  function numberValue(id, fallback) {
    var value = Number(document.getElementById(id).value);
    if (!isFinite(value)) return fallback;
    return value;
  }

  function format(value) {
    return value.toFixed(3).replace('.', ',');
  }

  function parameters() {
    return [
      Math.max(1, Math.min(9, Number(document.getElementById('knnK').value))),
      document.getElementById('knnMetric').value,
      document.getElementById('knnVote').value,
      document.getElementById('knnNormalize').checked
    ];
  }

  function ranges(excludedIndex) {
    var minimumX = null;
    var maximumX = null;
    var minimumY = null;
    var maximumY = null;
    for (var i = 0; i < data.length; i++) {
      if (i === excludedIndex) continue;
      if (minimumX === null || data[i][0] < minimumX) minimumX = data[i][0];
      if (maximumX === null || data[i][0] > maximumX) maximumX = data[i][0];
      if (minimumY === null || data[i][1] < minimumY) minimumY = data[i][1];
      if (maximumY === null || data[i][1] > maximumY) maximumY = data[i][1];
    }
    return [minimumX, maximumX, minimumY, maximumY];
  }

  function normalizePoint(point, scale) {
    var amplitudeX = scale[1] - scale[0];
    var amplitudeY = scale[3] - scale[2];
    var x = amplitudeX === 0 ? 0 : (point[0] - scale[0]) / amplitudeX;
    var y = amplitudeY === 0 ? 0 : (point[1] - scale[2]) / amplitudeY;
    return [x, y];
  }

  function distance(a, b, metric) {
    var dx = a[0] - b[0];
    var dy = a[1] - b[1];
    if (metric === 'manhattan') return Math.abs(dx) + Math.abs(dy);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function sortDistances(items) {
    for (var round = 0; round < items.length; round++) {
      for (var i = 0; i < items.length - 1; i++) {
        if (items[i][0] > items[i + 1][0]) {
          var temporary = items[i];
          items[i] = items[i + 1];
          items[i + 1] = temporary;
        }
      }
    }
  }

  /* Retorna [classe, votosA, votosB, itensOrdenados, escala]. */
  function classify(point, excludedIndex, chosenK) {
    var config = parameters();
    var metric = config[1];
    var voteMode = config[2];
    var normalize = config[3];
    var scale = ranges(excludedIndex);
    var queryForDistance = normalize ? normalizePoint(point, scale) : [point[0], point[1]];
    var distances = [];

    for (var i = 0; i < data.length; i++) {
      if (i === excludedIndex) continue;
      var sampleForDistance = normalize ? normalizePoint(data[i], scale) : [data[i][0], data[i][1]];
      var measured = distance(queryForDistance, sampleForDistance, metric);
      distances[distances.length] = [measured, i, data[i][2], queryForDistance, sampleForDistance];
    }
    sortDistances(distances);
    var k = Math.min(chosenK, distances.length);
    var votesA = 0;
    var votesB = 0;
    for (var neighbor = 0; neighbor < k; neighbor++) {
      var weight = voteMode === 'weighted' ? 1 / (distances[neighbor][0] + 0.000001) : 1;
      distances[neighbor][5] = weight;
      if (distances[neighbor][2] === 'A') votesA = votesA + weight;
      else votesB = votesB + weight;
    }
    var predicted;
    if (Math.abs(votesA - votesB) < 0.000001) predicted = distances[0][2];
    else predicted = votesA > votesB ? 'A' : 'B';
    return [predicted, votesA, votesB, distances, scale];
  }

  function leaveOneOut(k) {
    var errors = 0;
    for (var i = 0; i < data.length; i++) {
      var result = classify([data[i][0], data[i][1]], i, k);
      if (result[0] !== data[i][2]) errors = errors + 1;
    }
    return errors / data.length;
  }

  function buildDataTable() {
    var html = '<thead><tr><th>Ponto</th><th>x₁</th><th>x₂</th><th>Classe</th></tr></thead><tbody>';
    for (var i = 0; i < data.length; i++) {
      html = html + '<tr><td>P' + (i + 1) + '</td>' +
        '<td><input class="knn-data-input" data-row="' + i + '" data-column="0" type="number" min="0" max="10" step="0.1" value="' + data[i][0] + '"></td>' +
        '<td><input class="knn-data-input" data-row="' + i + '" data-column="1" type="number" min="0" max="100" step="1" value="' + data[i][1] + '"></td>' +
        '<td><select class="knn-class-input" data-row="' + i + '"><option' + (data[i][2] === 'A' ? ' selected' : '') + '>A</option><option' + (data[i][2] === 'B' ? ' selected' : '') + '>B</option></select></td></tr>';
    }
    document.getElementById('knnDataTable').innerHTML = html + '</tbody>';
    var numberInputs = document.querySelectorAll('.knn-data-input');
    for (var n = 0; n < numberInputs.length; n++) numberInputs[n].addEventListener('input', updateDatasetValue);
    var classInputs = document.querySelectorAll('.knn-class-input');
    for (var c = 0; c < classInputs.length; c++) classInputs[c].addEventListener('change', updateDatasetClass);
  }

  function updateDatasetValue(event) {
    var row = Number(event.target.getAttribute('data-row'));
    var column = Number(event.target.getAttribute('data-column'));
    var value = Number(event.target.value);
    if (!isFinite(value)) return;
    data[row][column] = value;
    renderAll();
  }

  function updateDatasetClass(event) {
    var row = Number(event.target.getAttribute('data-row'));
    data[row][2] = event.target.value;
    renderAll();
  }

  function plotX(value) { return 62 + value / 10 * (canvas.width - 92); }
  function plotY(value) { return canvas.height - 58 - value / 100 * (canvas.height - 88); }

  function drawPlot(query) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#fbfcff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '700 13px Manrope';
    context.textAlign = 'center';
    for (var x = 0; x <= 10; x++) {
      var px = plotX(x);
      context.strokeStyle = x === 0 ? '#657087' : '#e2e6ef';
      context.lineWidth = x === 0 ? 2 : 1;
      context.beginPath(); context.moveTo(px, 25); context.lineTo(px, canvas.height - 58); context.stroke();
      context.fillStyle = '#59647b'; context.fillText(String(x), px, canvas.height - 34);
    }
    context.textAlign = 'right';
    for (var y = 0; y <= 100; y = y + 10) {
      var py = plotY(y);
      context.strokeStyle = y === 0 ? '#657087' : '#e2e6ef';
      context.lineWidth = y === 0 ? 2 : 1;
      context.beginPath(); context.moveTo(62, py); context.lineTo(canvas.width - 30, py); context.stroke();
      context.fillStyle = '#59647b'; context.fillText(String(y), 51, py + 5);
    }
    context.textAlign = 'left'; context.fillStyle = '#172033'; context.fillText('x₂', 20, 25);
    context.textAlign = 'right'; context.fillText('x₁', canvas.width - 28, canvas.height - 34);

    context.strokeStyle = '#19a987'; context.lineWidth = 3;
    for (var line = 0; line < selectedNeighbors.length; line++) {
      var index = selectedNeighbors[line];
      context.beginPath(); context.moveTo(plotX(query[0]), plotY(query[1])); context.lineTo(plotX(data[index][0]), plotY(data[index][1])); context.stroke();
    }
    for (var i = 0; i < data.length; i++) {
      var selected = false;
      for (var check = 0; check < selectedNeighbors.length; check++) if (selectedNeighbors[check] === i) selected = true;
      context.beginPath(); context.arc(plotX(data[i][0]), plotY(data[i][1]), selected ? 14 : 11, 0, Math.PI * 2);
      context.fillStyle = data[i][2] === 'A' ? '#4e46e5' : '#e06c37'; context.fill();
      if (selected) { context.strokeStyle = '#19a987'; context.lineWidth = 5; context.stroke(); }
      context.fillStyle = '#fff'; context.font = '900 11px Manrope'; context.textAlign = 'center'; context.fillText(data[i][2], plotX(data[i][0]), plotY(data[i][1]) + 4);
      context.fillStyle = '#303a52'; context.font = '750 11px Manrope'; context.fillText('P' + (i + 1), plotX(data[i][0]), plotY(data[i][1]) - 18);
    }
    context.beginPath(); context.arc(plotX(query[0]), plotY(query[1]), 15, 0, Math.PI * 2); context.fillStyle = '#172033'; context.fill(); context.strokeStyle = '#8fe4d3'; context.lineWidth = 5; context.stroke();
    context.fillStyle = '#fff'; context.font = '900 16px Manrope'; context.fillText('?', plotX(query[0]), plotY(query[1]) + 6);
  }

  function distanceFormula(item, metric, normalized) {
    var q = item[3];
    var p = item[4];
    if (metric === 'manhattan') return '|' + format(q[0]) + '−' + format(p[0]) + '| + |' + format(q[1]) + '−' + format(p[1]) + '|';
    return '√((' + format(q[0]) + '−' + format(p[0]) + ')² + (' + format(q[1]) + '−' + format(p[1]) + ')²)' + (normalized ? ' · valores normalizados' : '');
  }

  function renderDistances(result, k) {
    var metric = parameters()[1];
    var normalized = parameters()[3];
    var html = '';
    selectedNeighbors = [];
    for (var i = 0; i < result[3].length; i++) {
      var item = result[3][i];
      var nearest = i < k;
      if (nearest) selectedNeighbors[selectedNeighbors.length] = item[1];
      html = html + '<tr class="' + (nearest ? 'nearest' : '') + '"><td>' + (i + 1) + 'º</td><td>P' + (item[1] + 1) + '</td><td>' + item[2] + '</td><td><code>' + distanceFormula(item, metric, normalized) + '</code></td><td>' + format(item[0]) + '</td><td>' + (nearest ? format(item[5]) : '—') + '</td></tr>';
    }
    document.getElementById('knnDistanceBody').innerHTML = html;
    var scale = result[4];
    var mode = parameters()[2] === 'weighted' ? 'Σ 1/(d+ε)' : 'contagem simples';
    document.getElementById('knnMath').innerHTML =
      '<article><b>Escala usada</b><code>x₁: [' + format(scale[0]) + '; ' + format(scale[1]) + ']<br>x₂: [' + format(scale[2]) + '; ' + format(scale[3]) + ']</code></article>' +
      '<article><b>Votos dos k vizinhos</b><code>A = ' + format(result[1]) + '<br>B = ' + format(result[2]) + '<br>regra = ' + mode + '</code></article>' +
      '<article class="full"><b>Decisão</b><code>maior voto → ŷ = classe ' + result[0] + '</code></article>';
  }

  function drawErrorChart(values, selectedK) {
    var ctx = errorContext;
    var w = errorCanvas.width;
    var h = errorCanvas.height;
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#fbfcff'; ctx.fillRect(0, 0, w, h);
    var left = 64; var right = 30; var top = 28; var bottom = 55;
    ctx.font = '700 12px Manrope'; ctx.textAlign = 'right';
    for (var tick = 0; tick <= 4; tick++) {
      var value = tick * 25; var y = h - bottom - value / 100 * (h - top - bottom);
      ctx.strokeStyle = '#e0e4ed'; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(w - right, y); ctx.stroke();
      ctx.fillStyle = '#59647b'; ctx.fillText(value + '%', left - 10, y + 4);
    }
    var colors = ['#e35c6e', '#19a987'];
    for (var series = 0; series < 2; series++) {
      ctx.beginPath(); ctx.strokeStyle = colors[series]; ctx.lineWidth = 4;
      for (var i = 0; i < values.length; i++) {
        var x = left + i / (values.length - 1) * (w - left - right);
        var percentage = series === 0 ? values[i][1] * 100 : (1 - values[i][1]) * 100;
        var py = h - bottom - percentage / 100 * (h - top - bottom);
        if (i === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
      }
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    for (var point = 0; point < values.length; point++) {
      var px = left + point / (values.length - 1) * (w - left - right);
      ctx.fillStyle = values[point][0] === selectedK ? '#172033' : '#59647b'; ctx.font = values[point][0] === selectedK ? '900 14px Manrope' : '700 13px Manrope';
      ctx.fillText('k=' + values[point][0], px, h - 27);
    }
  }

  function renderAll() {
    var query = [Math.max(0, Math.min(10, numberValue('knnQueryX', 5))), Math.max(0, Math.min(100, numberValue('knnQueryY', 50)))];
    var config = parameters();
    var result = classify(query, -1, config[0]);
    var effectiveK = Math.min(config[0], data.length);
    renderDistances(result, effectiveK);
    drawPlot(query);
    var kValues = [1, 3, 5, 7, 9];
    var curve = [];
    var selectedError = 0;
    for (var i = 0; i < kValues.length; i++) {
      var error = leaveOneOut(kValues[i]);
      curve[i] = [kValues[i], error];
      if (kValues[i] === config[0]) selectedError = error;
    }
    drawErrorChart(curve, config[0]);
    document.getElementById('knnPrediction').textContent = 'Classe ' + result[0];
    document.getElementById('knnVotesA').textContent = format(result[1]);
    document.getElementById('knnVotesB').textContent = format(result[2]);
    document.getElementById('knnNearest').textContent = format(result[3][0][0]);
    document.getElementById('knnError').textContent = Math.round(selectedError * 100) + '%';
    document.getElementById('knnStatus').textContent = 'k=' + config[0] + ' · ' + (config[1] === 'euclidean' ? 'Euclidiana' : 'Manhattan') + (config[3] ? ' · normalizado' : ' · escala bruta');
  }

  function reset() {
    data = copyData(originalData);
    document.getElementById('knnQueryX').value = 5;
    document.getElementById('knnQueryY').value = 50;
    document.getElementById('knnK').value = 3;
    document.getElementById('knnMetric').value = 'euclidean';
    document.getElementById('knnVote').value = 'uniform';
    document.getElementById('knnNormalize').checked = true;
    buildDataTable(); renderAll();
  }

  canvas.addEventListener('click', function (event) {
    var rectangle = canvas.getBoundingClientRect();
    var internalX = (event.clientX - rectangle.left) * canvas.width / rectangle.width;
    var internalY = (event.clientY - rectangle.top) * canvas.height / rectangle.height;
    var x = (internalX - 62) / (canvas.width - 92) * 10;
    var y = (canvas.height - 58 - internalY) / (canvas.height - 88) * 100;
    document.getElementById('knnQueryX').value = Math.max(0, Math.min(10, x)).toFixed(1);
    document.getElementById('knnQueryY').value = Math.max(0, Math.min(100, y)).toFixed(1);
    renderAll();
  });
  var controlIds = ['knnQueryX', 'knnQueryY', 'knnK', 'knnMetric', 'knnVote', 'knnNormalize'];
  for (var control = 0; control < controlIds.length; control++) document.getElementById(controlIds[control]).addEventListener('input', renderAll);
  document.getElementById('knnClassify').addEventListener('click', renderAll);
  document.getElementById('knnReset').addEventListener('click', reset);
  buildDataTable(); renderAll();
}());
