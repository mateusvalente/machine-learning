// ============================================================================
// LABORATÓRIO MULTICLASSE: GRUPOS A, B E C
// Modelo linear e MLP são implementados separadamente. Softmax converte os
// potenciais de saída em três probabilidades comparáveis.
// ============================================================================

const $ = selector => document.querySelector(selector);
const canvas = $('#multiPlane');
const ctx = canvas.getContext('2d');
const networkView = new MLPNetworkView($('#mlpNetworkCanvas'));
const labels = ['A', 'B', 'C'];
const colors = ['#4e46e5', '#ed6a78', '#19a987'];
const regionColors = ['rgba(78,70,229,.13)', 'rgba(237,106,120,.13)', 'rgba(25,169,135,.13)'];

const presets = {
  clusters: [
    [-.82,.68,'A'],[-.67,.48,'A'],[-.52,.72,'A'],[-.72,.25,'A'],[-.42,.44,'A'],
    [.38,.72,'B'],[.62,.58,'B'],[.78,.78,'B'],[.48,.35,'B'],[.82,.30,'B'],
    [-.24,-.52,'C'],[.02,-.72,'C'],[.28,-.48,'C'],[-.05,-.30,'C'],[.40,-.78,'C']
  ],
  nonlinear: [
    [-.78,.70,'A'],[-.58,.52,'A'],[.68,-.62,'A'],[.82,-.38,'A'],[-.72,.34,'A'],[.55,-.82,'A'],
    [.62,.68,'B'],[.80,.42,'B'],[-.64,-.62,'B'],[-.42,-.80,'B'],[.42,.54,'B'],[-.82,-.30,'B'],
    [-.20,.18,'C'],[.02,.30,'C'],[.25,.08,'C'],[-.24,-.16,'C'],[.12,-.25,'C'],[.02,.02,'C']
  ]
};

let points = [];
let selectedClass = 'A';
let linearModel;
let mlp;
let epochs = 0;
let loss = 0;
let autoTimer = null;
const historyChart = new TrainingHistoryChart($('#trainingChart'));
let viewedInput = { x1: 0, x2: 0, label: '—' };
let lastMathStep = null;

const randomWeight = () => Math.random() * 1.2 - 0.6;

function softmax(values) {
  const max = Math.max(...values);
  const exponentials = values.map(value => Math.exp(value - max));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map(value => value / total);
}

function activate(u) {
  const type = $('#activation').value;
  if (type === 'sigmoid') return 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, u))));
  if (type === 'relu') return Math.max(0, u);
  return Math.tanh(u);
}

function activationDerivative(u, activated) {
  const type = $('#activation').value;
  if (type === 'sigmoid') return activated * (1 - activated);
  if (type === 'relu') return u > 0 ? 1 : 0;
  return 1 - activated * activated;
}

// ----------------------------------------------------------------------------
// 1. INICIALIZAÇÃO
// ----------------------------------------------------------------------------
function initializeModels() {
  stopAutoTraining();
  linearModel = Array.from({ length: 3 }, () => ({ w1: randomWeight(), w2: randomWeight(), b: randomWeight() }));
  mlp = {
    hidden: Array.from({ length: 8 }, () => ({ w1: randomWeight(), w2: randomWeight(), b: randomWeight() })),
    output: Array.from({ length: 3 }, () => ({ weights: Array.from({ length: 8 }, randomWeight), b: randomWeight() }))
  };
  epochs = 0;
  loss = 0;
  viewedInput = points.length ? { x1: points[0][0], x2: points[0][1], label: points[0][2] } : { x1: 0, x2: 0, label: '—' };
  lastMathStep = null;
  historyChart.reset();
  recordTrainingHistory();
  render();
}

// ----------------------------------------------------------------------------
// 2. CLASSIFICADOR LINEAR COM TRÊS SAÍDAS
// ----------------------------------------------------------------------------
function forwardLinear(x1, x2) {
  const potentials = linearModel.map(neuron => neuron.w1 * x1 + neuron.w2 * x2 + neuron.b);
  return { potentials, probabilities: softmax(potentials) };
}

function trainLinearSample(x1, x2, targetIndex, learningRate) {
  const forward = forwardLinear(x1, x2);
  const probabilities = forward.probabilities;
  const before = { w: linearModel[targetIndex].w1 };
  linearModel.forEach((neuron, classIndex) => {
    const delta = probabilities[classIndex] - (classIndex === targetIndex ? 1 : 0);
    neuron.w1 -= learningRate * delta * x1;
    neuron.w2 -= learningRate * delta * x2;
    neuron.b -= learningRate * delta;
  });
  lastMathStep = { type: 'linear', x1, x2, targetIndex, learningRate, forward, before, after: { w: linearModel[targetIndex].w1 } };
  return -Math.log(Math.max(1e-8, probabilities[targetIndex]));
}

// ----------------------------------------------------------------------------
// 3. MLP MULTICLASSE: FORWARD PASS E BACKPROPAGATION
// ----------------------------------------------------------------------------
function forwardMLP(x1, x2) {
  const hidden = mlp.hidden.map(neuron => {
    const u = neuron.w1 * x1 + neuron.w2 * x2 + neuron.b;
    return { u, activated: activate(u) };
  });
  const potentials = mlp.output.map(neuron =>
    neuron.b + neuron.weights.reduce((sum, weight, index) => sum + weight * hidden[index].activated, 0)
  );
  return { hidden, potentials, probabilities: softmax(potentials) };
}

function trainMLPSample(x1, x2, targetIndex, learningRate) {
  const forward = forwardMLP(x1, x2);
  const outputDeltas = forward.probabilities.map((probability, classIndex) =>
    probability - (classIndex === targetIndex ? 1 : 0)
  );
  const oldOutputWeights = mlp.output.map(neuron => [...neuron.weights]);
  const before = { outputW00: mlp.output[0].weights[0], hiddenW00: mlp.hidden[0].w1 };

  const hiddenDeltas = forward.hidden.map((neuron, hiddenIndex) => {
    const responsibility = outputDeltas.reduce(
      (sum, delta, classIndex) => sum + delta * oldOutputWeights[classIndex][hiddenIndex], 0
    );
    return responsibility * activationDerivative(neuron.u, neuron.activated);
  });

  mlp.output.forEach((neuron, classIndex) => {
    neuron.weights.forEach((weight, hiddenIndex) => {
      neuron.weights[hiddenIndex] = weight - learningRate * outputDeltas[classIndex] * forward.hidden[hiddenIndex].activated;
    });
    neuron.b -= learningRate * outputDeltas[classIndex];
  });

  mlp.hidden.forEach((neuron, hiddenIndex) => {
    neuron.w1 -= learningRate * hiddenDeltas[hiddenIndex] * x1;
    neuron.w2 -= learningRate * hiddenDeltas[hiddenIndex] * x2;
    neuron.b -= learningRate * hiddenDeltas[hiddenIndex];
  });
  lastMathStep = { type: 'mlp', x1, x2, targetIndex, learningRate, forward, outputDeltas, hiddenDeltas, before, after: { outputW00: mlp.output[0].weights[0], hiddenW00: mlp.hidden[0].w1 } };
  return -Math.log(Math.max(1e-8, forward.probabilities[targetIndex]));
}

function probabilitiesFor(x1, x2) {
  return $('#model').value === 'linear' ? forwardLinear(x1, x2).probabilities : forwardMLP(x1, x2).probabilities;
}

function predictIndex(x1, x2) {
  const probabilities = probabilitiesFor(x1, x2);
  return probabilities.indexOf(Math.max(...probabilities));
}

// ----------------------------------------------------------------------------
// 4. TREINAMENTO
// ----------------------------------------------------------------------------
function trainEpoch() {
  if (!points.length) return;
  const learningRate = Number($('#lr').value) || 0.1;
  const shuffled = [...points].sort(() => Math.random() - 0.5);
  loss = shuffled.reduce((total, [x1, x2, label]) => {
    const targetIndex = labels.indexOf(label);
    return total + ($('#model').value === 'linear'
      ? trainLinearSample(x1, x2, targetIndex, learningRate)
      : trainMLPSample(x1, x2, targetIndex, learningRate));
  }, 0) / points.length;
  epochs++;
  const viewedSample = shuffled[shuffled.length - 1];
  viewedInput = { x1: viewedSample[0], x2: viewedSample[1], label: viewedSample[2] };
  recordTrainingHistory();
  render();
}

function countHits() {
  return points.filter(([x1, x2, label]) => predictIndex(x1, x2) === labels.indexOf(label)).length;
}

function currentMeanError() {
  if (!points.length) return 0;
  return points.reduce((total, [x1, x2, label]) => {
    const targetIndex = labels.indexOf(label);
    return total - Math.log(Math.max(1e-8, probabilitiesFor(x1, x2)[targetIndex]));
  }, 0) / points.length;
}

function recordTrainingHistory() {
  const accuracy = points.length ? countHits() / points.length : 0;
  historyChart.add(epochs, currentMeanError(), accuracy);
}

function stopAutoTraining() {
  if (autoTimer) clearInterval(autoTimer);
  autoTimer = null;
  const button = $('#trainAuto');
  if (button) button.textContent = 'Treinar automaticamente';
}

function toggleAutoTraining() {
  if (autoTimer) return stopAutoTraining();
  let rounds = 0;
  autoTimer = setInterval(() => {
    for (let i = 0; i < 5; i++) trainEpoch();
    rounds += 5;
    if ((countHits() === points.length && epochs > 30) || rounds >= 2500) stopAutoTraining();
  }, 20);
  $('#trainAuto').textContent = 'Pausar treinamento';
}

// ----------------------------------------------------------------------------
// 5. PLANO E TRÊS REGIÕES DE DECISÃO
// ----------------------------------------------------------------------------
const margin = 50;
const mapX = x => margin + (x + 1) * (canvas.width - 2 * margin) / 2;
const mapY = y => canvas.height - margin - (y + 1) * (canvas.height - 2 * margin) / 2;
const unmapX = pixel => (pixel - margin) * 2 / (canvas.width - 2 * margin) - 1;
const unmapY = pixel => (canvas.height - margin - pixel) * 2 / (canvas.height - 2 * margin) - 1;

function drawRegions() {
  const cell = 9;
  const predictions = [];
  for (let px = margin; px < canvas.width - margin; px += cell) {
    const column = [];
    for (let py = margin; py < canvas.height - margin; py += cell) {
      const predicted = predictIndex(unmapX(px + cell / 2), unmapY(py + cell / 2));
      column.push(predicted);
      ctx.fillStyle = regionColors[predicted];
      ctx.fillRect(px, py, cell, cell);
    }
    predictions.push(column);
  }

  ctx.save();
  ctx.strokeStyle = '#2f374e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  predictions.forEach((column, xIndex) => column.forEach((predicted, yIndex) => {
    const px = margin + xIndex * cell;
    const py = margin + yIndex * cell;
    if (predictions[xIndex + 1] && predictions[xIndex + 1][yIndex] !== predicted) {
      ctx.moveTo(px + cell, py);
      ctx.lineTo(px + cell, py + cell);
    }
    if (column[yIndex + 1] !== undefined && column[yIndex + 1] !== predicted) {
      ctx.moveTo(px, py + cell);
      ctx.lineTo(px + cell, py + cell);
    }
  }));
  ctx.stroke();
  ctx.restore();
}

function drawPlane() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fbfbff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawRegions();

  ctx.strokeStyle = '#dfe4ef';
  ctx.lineWidth = 1;
  for (let value = -1; value <= 1; value += 0.5) {
    ctx.beginPath();
    ctx.moveTo(mapX(value), mapY(-1));
    ctx.lineTo(mapX(value), mapY(1));
    ctx.moveTo(mapX(-1), mapY(value));
    ctx.lineTo(mapX(1), mapY(value));
    ctx.stroke();
  }
  ctx.strokeStyle = '#4b556d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mapX(-1), mapY(0));
  ctx.lineTo(mapX(1), mapY(0));
  ctx.moveTo(mapX(0), mapY(-1));
  ctx.lineTo(mapX(0), mapY(1));
  ctx.stroke();

  ctx.save();
  ctx.fillStyle = '#4b556d';
  ctx.font = '600 14px Manrope';
  for (let value = -1; value <= 1.001; value += 0.5) {
    const label = Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, mapX(value), mapY(0) + 8);
    if (Math.abs(value) > 0.001) {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, mapX(0) - 8, mapY(value));
    }
  }
  ctx.restore();
  ctx.fillStyle = '#4b556d';
  ctx.font = '600 14px Manrope';
  ctx.fillText('x₁', mapX(.94), mapY(-.08));
  ctx.fillText('x₂', mapX(.04), mapY(.92));

  points.forEach(([x, y, label]) => {
    const classIndex = labels.indexOf(label);
    ctx.beginPath();
    ctx.arc(mapX(x), mapY(y), 14, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = colors[classIndex];
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = colors[classIndex];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 13px Manrope';
    ctx.fillText(label, mapX(x), mapY(y) + 1);
  });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ----------------------------------------------------------------------------
// 6. DADOS, TESTE E INTERFACE
// ----------------------------------------------------------------------------
function loadPreset() {
  points = presets[$('#preset').value].map(point => [...point]);
  initializeModels();
}

function addPoint(label, x = Number($('#newX').value), y = Number($('#newY').value)) {
  selectedClass = label;
  $('#selectedClass').textContent = label;
  points.push([Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)), label]);
  initializeModels();
}

function render() {
  drawPlane();
  renderNetwork();
  renderMathSteps();
  const hits = points.length ? countHits() : 0;
  const isMLP = $('#model').value === 'mlp';
  $('#epochs').textContent = epochs;
  $('#accuracy').textContent = points.length ? `${hits}/${points.length}` : '—';
  $('#loss').textContent = epochs ? loss.toFixed(3) : '—';
  $('#chartTitle').textContent = isMLP ? 'Três regiões com MLP' : 'Três regiões lineares com Softmax';
  $('#chartStatus').textContent = points.length ? (hits === points.length ? 'Separado ✓' : `${points.length - hits} fora`) : 'Adicione pontos';
  $('#chartStatus').className = `status ${hits === points.length && points.length ? 'success' : ''}`;
  $('#explanationTitle').textContent = isMLP ? 'Softmax escolhe; a camada oculta modela' : 'Três potenciais produzem três regiões lineares';
  $('#explanation').innerHTML = isMLP
    ? 'A camada oculta cria representações não lineares. Na saída, três neurônios calculam <strong>u<sub>A</sub>, u<sub>B</sub> e u<sub>C</sub></strong>; Softmax converte esses valores em probabilidades.'
    : 'O modelo calcula três combinações lineares, uma por classe. Softmax compara os três potenciais. As fronteiras continuam retas, mas agora separam <strong>A, B e C</strong>.';
}

function renderMathSteps() {
  const container = $('#multiMathSteps');
  if (!lastMathStep) {
    container.innerHTML = '<p>Treine uma época para visualizar as contas.</p>';
    return;
  }
  const step = lastMathStep;
  const targetLabel = labels[step.targetIndex];
  if (step.type === 'linear') {
    const delta = step.forward.probabilities[step.targetIndex] - 1;
    container.innerHTML = `<div><b>1 · Potenciais</b><span>[uA,uB,uC]=[${step.forward.potentials.map(value => value.toFixed(3)).join(', ')}]</span></div><div><b>2 · Softmax</b><span>[${step.forward.probabilities.map(value => value.toFixed(3)).join(', ')}]</span></div><div><b>3 · Alvo</b><span>classe ${targetLabel} → one-hot [${labels.map((_, index) => index === step.targetIndex ? 1 : 0).join(', ')}]</span></div><div><b>4 · Delta ${targetLabel}</b><span>P(${targetLabel})−1=${delta.toFixed(4)}</span></div><div><b>5 · Gradiente</b><span>∂L/∂w=${delta.toFixed(4)}·x₁(${step.x1})=${(delta * step.x1).toFixed(4)}</span></div><div><b>6 · Atualização</b><span>w: ${step.before.w.toFixed(4)} → ${step.after.w.toFixed(4)}</span></div>`;
    return;
  }
  const h = step.forward.hidden[0];
  const probability = step.forward.probabilities[step.targetIndex];
  const entropy = -Math.log(Math.max(1e-8, probability));
  container.innerHTML = `<div><b>1 · Potencial h₁</b><span>u₁=${h.u.toFixed(4)} → a₁=${h.activated.toFixed(4)}</span></div><div><b>2 · Potenciais de saída</b><span>[${step.forward.potentials.map(value => value.toFixed(3)).join(', ')}]</span></div><div><b>3 · Softmax</b><span>P(A,B,C)=[${step.forward.probabilities.map(value => value.toFixed(3)).join(', ')}]</span></div><div><b>4 · Entropia</b><span>−ln P(${targetLabel}) = −ln(${probability.toFixed(4)}) = ${entropy.toFixed(4)}</span></div><div><b>5 · Deltas</b><span>δ${targetLabel}=${step.outputDeltas[step.targetIndex].toFixed(4)} · δh₁=${step.hiddenDeltas[0].toFixed(4)}</span></div><div><b>6 · Pesos atualizados</b><span>v₁₁: ${step.before.outputW00.toFixed(4)} → ${step.after.outputW00.toFixed(4)} · w₁₁: ${step.before.hiddenW00.toFixed(4)} → ${step.after.hiddenW00.toFixed(4)}</span></div>`;
}

function renderNetwork() {
  const { x1, x2, label } = viewedInput;
  if ($('#model').value === 'linear') {
    const forward = forwardLinear(x1, x2);
    networkView.draw({
      inputs: [x1, x2],
      hidden: [],
      outputs: forward.probabilities,
      outputLabels: labels,
      inputOutputWeights: linearModel.map(neuron => [neuron.w1, neuron.w2]),
      outputActivation: 'Softmax'
    });
    $('#networkTitle').textContent = 'Classificador linear · 2 → 3';
    $('#networkReadout').innerHTML = `Entrada (${x1.toFixed(2)}, ${x2.toFixed(2)}) · potenciais [${forward.potentials.map(value => value.toFixed(2)).join(', ')}] · previsão=${labels[predictIndex(x1, x2)]} · alvo=${label}`;
    return;
  }

  const forward = forwardMLP(x1, x2);
  networkView.draw({
    inputs: [x1, x2],
    hidden: forward.hidden.map(neuron => ({ u: neuron.u, a: neuron.activated })),
    outputs: forward.probabilities,
    outputLabels: labels,
    inputHiddenWeights: mlp.hidden.map(neuron => [neuron.w1, neuron.w2]),
    hiddenOutputWeights: mlp.output.map(neuron => neuron.weights),
    hiddenActivation: $('#activation').value,
    outputActivation: 'Softmax'
  });
  $('#networkTitle').textContent = 'Neurônios da MLP · 2 → 8 → 3';
  $('#networkReadout').innerHTML = `Entrada (${x1.toFixed(2)}, ${x2.toFixed(2)}) · h₁: u=${forward.hidden[0].u.toFixed(2)}, a=${forward.hidden[0].activated.toFixed(2)} · P(A)=${forward.probabilities[0].toFixed(2)}, P(B)=${forward.probabilities[1].toFixed(2)}, P(C)=${forward.probabilities[2].toFixed(2)} · alvo=${label}`;
}

function testPoint() {
  const x = Math.max(-1, Math.min(1, Number($('#testX').value)));
  const y = Math.max(-1, Math.min(1, Number($('#testY').value)));
  const probabilities = probabilitiesFor(x, y);
  const prediction = labels[predictIndex(x, y)];
  viewedInput = { x1: x, x2: y, label: '?' };
  $('#testResult').innerHTML = `Previsão: <b>${prediction}</b><br><span class="mono">P(A)=${probabilities[0].toFixed(2)} · P(B)=${probabilities[1].toFixed(2)} · P(C)=${probabilities[2].toFixed(2)}</span>`;
  renderNetwork();
}

canvas.addEventListener('click', event => {
  const rectangle = canvas.getBoundingClientRect();
  const pixelX = (event.clientX - rectangle.left) * canvas.width / rectangle.width;
  const pixelY = (event.clientY - rectangle.top) * canvas.height / rectangle.height;
  addPoint(selectedClass, unmapX(pixelX), unmapY(pixelY));
});

document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => addPoint(button.dataset.add)));
$('#loadPreset').addEventListener('click', loadPreset);
$('#removePoint').addEventListener('click', () => { points.pop(); initializeModels(); });
$('#clearPoints').addEventListener('click', () => { points = []; initializeModels(); });
$('#trainOne').addEventListener('click', trainEpoch);
$('#trainAuto').addEventListener('click', toggleAutoTraining);
$('#resetNet').addEventListener('click', initializeModels);
$('#testButton').addEventListener('click', testPoint);
$('#model').addEventListener('change', initializeModels);
$('#activation').addEventListener('change', initializeModels);
$('#preset').addEventListener('change', loadPreset);
loadPreset();
