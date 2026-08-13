// =============================================================================
// DEMONSTRAÇÃO DA CAMADA OCULTA DE UMA REDE RBF
// Cada neurônio calcula a distância entre x e seu centro c.
// =============================================================================

(function () {
  'use strict';

  var canvas = document.getElementById('rbfCanvas');
  var context = canvas.getContext('2d');
  var x1Control = document.getElementById('rbfX1');
  var x2Control = document.getElementById('rbfX2');
  var gammaControl = document.getElementById('rbfGamma');
  var centers = [
    [-2.2, 1.8],
    [1.9, 2.1],
    [0.2, -2.1]
  ];
  var colors = ['#4e46e5', '#19a987', '#ef8a48'];
  var outputWeights = [1.2, -0.7, 0.9];
  var outputBias = 0.15;
  var rangeMinimum = -4;
  var rangeMaximum = 4;
  var margin = 68;

  function number(value, digits) {
    return Number(value).toFixed(digits).replace('.', ',');
  }

  function squaredDistance(point, center) {
    var differenceX1 = point[0] - center[0];
    var differenceX2 = point[1] - center[1];
    return differenceX1 * differenceX1 + differenceX2 * differenceX2;
  }

  function gaussianActivation(point, center, gamma) {
    return Math.exp(-gamma * squaredDistance(point, center));
  }

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

  function influenceRadius(gamma) {
    // Nesse raio, a ativação é aproximadamente e^-1 = 0,368.
    return Math.sqrt(1 / gamma);
  }

  function drawGrid() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#fbfcff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '600 13px DM Mono';
    context.textAlign = 'center';
    context.textBaseline = 'top';

    for (var tick = -4; tick <= 4; tick++) {
      var x = canvasX(tick);
      var y = canvasY(tick);
      context.beginPath();
      context.moveTo(x, margin);
      context.lineTo(x, canvas.height - margin);
      context.moveTo(margin, y);
      context.lineTo(canvas.width - margin, y);
      context.strokeStyle = tick === 0 ? '#aeb5c6' : '#e5e8f0';
      context.lineWidth = tick === 0 ? 2 : 1;
      context.stroke();
      context.fillStyle = '#647086';
      context.fillText(String(tick), x, canvas.height - margin + 13);
      if (tick !== 0) {
        context.textAlign = 'right';
        context.textBaseline = 'middle';
        context.fillText(String(tick), margin - 12, y);
        context.textAlign = 'center';
        context.textBaseline = 'top';
      }
    }

    context.fillStyle = '#354058';
    context.font = '800 15px Manrope';
    context.fillText('x₁', canvas.width - margin + 28, canvasY(0) - 7);
    context.fillText('x₂', canvasX(0), margin - 35);
  }

  function drawCenter(center, index, gamma) {
    var centerX = canvasX(center[0]);
    var centerY = canvasY(center[1]);
    var radiusInPixels = influenceRadius(gamma) * (canvas.width - 2 * margin) / (rangeMaximum - rangeMinimum);
    context.beginPath();
    context.arc(centerX, centerY, radiusInPixels, 0, Math.PI * 2);
    context.fillStyle = colors[index] + '13';
    context.fill();
    context.setLineDash([7, 7]);
    context.strokeStyle = colors[index] + '88';
    context.lineWidth = 2;
    context.stroke();
    context.setLineDash([]);

    context.beginPath();
    context.arc(centerX, centerY, 12, 0, Math.PI * 2);
    context.fillStyle = colors[index];
    context.fill();
    context.strokeStyle = '#fff';
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = '#172033';
    context.font = '800 14px Manrope';
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.fillText('c' + (index + 1) + ' = [' + number(center[0], 1) + '; ' + number(center[1], 1) + ']', centerX + 18, centerY);
  }

  function drawInput(point) {
    var x = canvasX(point[0]);
    var y = canvasY(point[1]);
    context.beginPath();
    context.arc(x, y, 13, 0, Math.PI * 2);
    context.fillStyle = '#fff';
    context.fill();
    context.strokeStyle = '#e35c6e';
    context.lineWidth = 5;
    context.stroke();
    context.fillStyle = '#9e3545';
    context.font = '800 15px Manrope';
    context.textAlign = 'left';
    context.textBaseline = 'bottom';
    context.fillText('x = [' + number(point[0], 1) + '; ' + number(point[1], 1) + ']', x + 17, y - 7);
  }

  function drawLines(point) {
    for (var index = 0; index < centers.length; index++) {
      context.beginPath();
      context.moveTo(canvasX(point[0]), canvasY(point[1]));
      context.lineTo(canvasX(centers[index][0]), canvasY(centers[index][1]));
      context.setLineDash([4, 5]);
      context.strokeStyle = colors[index] + '99';
      context.lineWidth = 2;
      context.stroke();
      context.setLineDash([]);
    }
  }

  function renderCards(point, gamma) {
    var html = '';
    var activations = [];
    for (var index = 0; index < centers.length; index++) {
      var distanceSquared = squaredDistance(point, centers[index]);
      var activation = gaussianActivation(point, centers[index], gamma);
      activations[index] = activation;
      html += '<article style="--center-color:' + colors[index] + '"><b>Neurônio φ' + (index + 1) + '</b><span>centro c' + (index + 1) + ' = [' + number(centers[index][0], 1) + '; ' + number(centers[index][1], 1) + ']</span><code>‖x − c' + (index + 1) + '‖² = ' + number(distanceSquared, 3) + '<br>φ' + (index + 1) + ' = e<sup>−' + number(gamma, 2) + '×' + number(distanceSquared, 3) + '</sup><br>φ' + (index + 1) + ' = <strong>' + number(activation, 4) + '</strong></code></article>';
    }
    document.getElementById('rbfActivationCards').innerHTML = html;

    var output = outputBias;
    var terms = [];
    for (index = 0; index < activations.length; index++) {
      output = output + outputWeights[index] * activations[index];
      terms.push('(' + number(outputWeights[index], 2) + ' × ' + number(activations[index], 4) + ')');
    }
    document.getElementById('rbfOutputMath').innerHTML = 'ŷ = b + v₁φ₁ + v₂φ₂ + v₃φ₃<br>ŷ = ' + number(outputBias, 2) + ' + ' + terms.join(' + ') + '<br>ŷ = <strong>' + number(output, 4) + '</strong>';
  }

  function render() {
    var point = [Number(x1Control.value), Number(x2Control.value)];
    var gamma = Number(gammaControl.value);
    document.getElementById('rbfX1Output').textContent = number(point[0], 1);
    document.getElementById('rbfX2Output').textContent = number(point[1], 1);
    document.getElementById('rbfGammaOutput').textContent = number(gamma, 2);
    document.getElementById('rbfWidthReading').innerHTML = '<strong>Leitura de γ:</strong><br>raio onde φ ≈ 0,368:<br><span class="mono">r = √(1/γ) = ' + number(influenceRadius(gamma), 3) + '</span>';

    drawGrid();
    for (var index = 0; index < centers.length; index++) drawCenter(centers[index], index, gamma);
    drawLines(point);
    drawInput(point);
    renderCards(point, gamma);
  }

  function useCanvasPoint(event) {
    var rectangle = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rectangle.width;
    var scaleY = canvas.height / rectangle.height;
    var pixelX = (event.clientX - rectangle.left) * scaleX;
    var pixelY = (event.clientY - rectangle.top) * scaleY;
    var x1 = Math.max(rangeMinimum, Math.min(rangeMaximum, valueX(pixelX)));
    var x2 = Math.max(rangeMinimum, Math.min(rangeMaximum, valueY(pixelY)));
    x1Control.value = x1.toFixed(1);
    x2Control.value = x2.toFixed(1);
    render();
  }

  x1Control.addEventListener('input', render);
  x2Control.addEventListener('input', render);
  gammaControl.addEventListener('input', render);
  canvas.addEventListener('click', useCanvasPoint);
  document.getElementById('rbfResetDemo').addEventListener('click', function () {
    x1Control.value = '2';
    x2Control.value = '1.5';
    gammaControl.value = '0.6';
    render();
  });

  render();
}());
