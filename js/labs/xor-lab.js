// ============================================================================
// LABORATÓRIO XOR
// Perceptron e MLP permanecem separados para facilitar o estudo do código.
// Em todo o módulo, u representa o potencial de ativação.
// ============================================================================

const $ = selector => document.querySelector(selector);
const canvas = $('#xorPlane');
const ctx = canvas.getContext('2d');
const networkView = new MLPNetworkView($('#mlpNetworkCanvas'));
const samples = [
  { x1: 0, x2: 0, target: 0 },
  { x1: 0, x2: 1, target: 1 },
  { x1: 1, x2: 0, target: 1 },
  { x1: 1, x2: 1, target: 0 }
];

let perceptron;
let mlp;
let epochs = 0;
let loss = 0;
let autoTimer = null;
const historyChart = new TrainingHistoryChart($('#trainingChart'));
let viewedInput = { x1: 0, x2: 0, target: 0 };
let lastMathStep = null;

const randomWeight = () => Math.random() * 1.6 - 0.8;
const sigmoid = value => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));

// ----------------------------------------------------------------------------
// 1. FUNÇÕES DE ATIVAÇÃO DA CAMADA OCULTA
// ----------------------------------------------------------------------------
function activate(u) {
  const type = $('#activation').value;
  if (type === 'tanh') return Math.tanh(u);
  if (type === 'relu') return Math.max(0, u);
  return sigmoid(u);
}

function activationDerivative(u, activated) {
  const type = $('#activation').value;
  if (type === 'tanh') return 1 - activated * activated;
  if (type === 'relu') return u > 0 ? 1 : 0;
  return activated * (1 - activated);
}

// ----------------------------------------------------------------------------
// 2. INICIALIZAÇÃO DOS DOIS MODELOS
// ----------------------------------------------------------------------------
function initializeModels() {
  stopAutoTraining();
  perceptron = { w1: randomWeight(), w2: randomWeight(), b: randomWeight() };
  mlp = {
    hidden: Array.from({ length: 4 }, () => ({ w1: randomWeight(), w2: randomWeight(), b: randomWeight() })),
    output: { weights: Array.from({ length: 4 }, randomWeight), b: randomWeight() }
  };
  epochs = 0;
  loss = 0;
  viewedInput = { ...samples[0] };
  lastMathStep = null;
  historyChart.reset();
  recordTrainingHistory();
  render();
}

// ----------------------------------------------------------------------------
// 3. PERCEPTRON: UMA ÚNICA FRONTEIRA LINEAR
// ----------------------------------------------------------------------------
function perceptronOutput(x1, x2) {
  const u = perceptron.w1 * x1 + perceptron.w2 * x2 + perceptron.b;
  return { u, prediction: u >= 0 ? 1 : 0 };
}

function trainPerceptronSample(sample, learningRate) {
  const before = { ...perceptron };
  const { u, prediction } = perceptronOutput(sample.x1, sample.x2);
  const error = sample.target - prediction;
  perceptron.w1 += learningRate * error * sample.x1;
  perceptron.w2 += learningRate * error * sample.x2;
  perceptron.b += learningRate * error;
  lastMathStep = { type: 'perceptron', sample, learningRate, u, prediction, error, before, after: { ...perceptron } };
  return Math.abs(error);
}

// ----------------------------------------------------------------------------
// 4. MLP: FORWARD PASS E BACKPROPAGATION
// ----------------------------------------------------------------------------
function forwardMLP(x1, x2) {
  const hidden = mlp.hidden.map(neuron => {
    const u = neuron.w1 * x1 + neuron.w2 * x2 + neuron.b;
    return { u, activated: activate(u) };
  });
  const u = mlp.output.b + hidden.reduce((sum, neuron, index) => sum + mlp.output.weights[index] * neuron.activated, 0);
  return { hidden, u, probability: sigmoid(u) };
}

function trainMLPSample(sample, learningRate) {
  const forward = forwardMLP(sample.x1, sample.x2);
  const outputError = forward.probability - sample.target;
  const outputDelta = outputError * forward.probability * (1 - forward.probability);
  const oldOutputWeights = [...mlp.output.weights];
  const before = { outputW0: mlp.output.weights[0], hiddenW00: mlp.hidden[0].w1 };

  const hiddenDeltas = forward.hidden.map((neuron, index) =>
    outputDelta * oldOutputWeights[index] * activationDerivative(neuron.u, neuron.activated)
  );

  mlp.output.weights.forEach((weight, index) => {
    mlp.output.weights[index] = weight - learningRate * outputDelta * forward.hidden[index].activated;
  });
  mlp.output.b -= learningRate * outputDelta;

  mlp.hidden.forEach((neuron, index) => {
    neuron.w1 -= learningRate * hiddenDeltas[index] * sample.x1;
    neuron.w2 -= learningRate * hiddenDeltas[index] * sample.x2;
    neuron.b -= learningRate * hiddenDeltas[index];
  });
  lastMathStep = { type: 'mlp', sample, learningRate, forward, outputError, outputDelta, hiddenDeltas, before, after: { outputW0: mlp.output.weights[0], hiddenW00: mlp.hidden[0].w1 } };
  return outputError * outputError;
}

function predict(x1, x2) {
  return $('#model').value === 'perceptron'
    ? perceptronOutput(x1, x2).prediction
    : (forwardMLP(x1, x2).probability >= 0.5 ? 1 : 0);
}

// ----------------------------------------------------------------------------
// 5. CONTROLES DE TREINAMENTO
// ----------------------------------------------------------------------------
function trainEpoch() {
  const learningRate = Number($('#lr').value) || 0.1;
  const shuffled = [...samples].sort(() => Math.random() - 0.5);
  loss = shuffled.reduce((total, sample) => total + (
    $('#model').value === 'perceptron'
      ? trainPerceptronSample(sample, learningRate)
      : trainMLPSample(sample, learningRate)
  ), 0) / samples.length;
  epochs++;
  viewedInput = { ...shuffled[shuffled.length - 1] };
  recordTrainingHistory();
  render();
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
    for (let i = 0; i < 10; i++) trainEpoch();
    rounds += 10;
    const hits = countHits();
    const limit = $('#model').value === 'perceptron' ? 300 : 5000;
    if ((hits === samples.length && epochs > 50) || rounds >= limit) stopAutoTraining();
  }, 20);
  $('#trainAuto').textContent = 'Pausar treinamento';
}

const countHits = () => samples.filter(sample => predict(sample.x1, sample.x2) === sample.target).length;

function currentMeanError() {
  return samples.reduce((total, sample) => {
    if ($('#model').value === 'perceptron') {
      return total + Math.abs(sample.target - perceptronOutput(sample.x1, sample.x2).prediction);
    }
    const difference = sample.target - forwardMLP(sample.x1, sample.x2).probability;
    return total + difference * difference;
  }, 0) / samples.length;
}

function recordTrainingHistory() {
  historyChart.add(epochs, currentMeanError(), countHits() / samples.length);
}

// ----------------------------------------------------------------------------
// 6. DESENHO DAS REGIÕES E FRONTEIRAS
// ----------------------------------------------------------------------------
const range = { min: -0.16, max: 1.16 };
const margin = 58;
const mapX = x => margin + (x - range.min) * (canvas.width - 2 * margin) / (range.max - range.min);
const mapY = y => canvas.height - margin - (y - range.min) * (canvas.height - 2 * margin) / (range.max - range.min);
const unmapX = pixel => range.min + (pixel - margin) * (range.max - range.min) / (canvas.width - 2 * margin);
const unmapY = pixel => range.min + (canvas.height - margin - pixel) * (range.max - range.min) / (canvas.height - 2 * margin);

function drawDecisionRegions() {
  const size = 9;
  for (let px = margin; px < canvas.width - margin; px += size) {
    for (let py = margin; py < canvas.height - margin; py += size) {
      ctx.fillStyle = predict(unmapX(px), unmapY(py)) ? 'rgba(78,70,229,.13)' : 'rgba(237,106,120,.12)';
      ctx.fillRect(px, py, size, size);
    }
  }
}

function drawPerceptronBoundary() {
  ctx.save();
  ctx.beginPath();
  if (Math.abs(perceptron.w2) > 0.0001) {
    const yStart = (-perceptron.w1 * range.min - perceptron.b) / perceptron.w2;
    const yEnd = (-perceptron.w1 * range.max - perceptron.b) / perceptron.w2;
    ctx.moveTo(mapX(range.min), mapY(yStart));
    ctx.lineTo(mapX(range.max), mapY(yEnd));
  } else {
    const x = -perceptron.b / perceptron.w1;
    ctx.moveTo(mapX(x), mapY(range.min));
    ctx.lineTo(mapX(x), mapY(range.max));
  }
  ctx.strokeStyle = '#172033';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 5]);
  ctx.stroke();
  ctx.restore();
}

function drawMLPBoundary() {
  const cells = 70;
  const step = (range.max - range.min) / cells;
  ctx.save();
  ctx.strokeStyle = '#172033';
  ctx.lineWidth = 2.4;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  for (let column = 0; column < cells; column++) {
    for (let row = 0; row < cells; row++) {
      const x = range.min + column * step;
      const y = range.min + row * step;
      const here = predict(x, y);
      if (predict(x + step, y) !== here) {
        ctx.moveTo(mapX(x + step), mapY(y));
        ctx.lineTo(mapX(x + step), mapY(y + step));
      }
      if (predict(x, y + step) !== here) {
        ctx.moveTo(mapX(x), mapY(y + step));
        ctx.lineTo(mapX(x + step), mapY(y + step));
      }
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawPlane() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fbfbff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawDecisionRegions();

  ctx.strokeStyle = '#d9deeb';
  ctx.lineWidth = 1;
  [0, 0.5, 1].forEach(value => {
    ctx.beginPath();
    ctx.moveTo(mapX(value), mapY(range.min));
    ctx.lineTo(mapX(value), mapY(range.max));
    ctx.moveTo(mapX(range.min), mapY(value));
    ctx.lineTo(mapX(range.max), mapY(value));
    ctx.stroke();
  });

  ctx.fillStyle = '#505b73';
  ctx.font = '600 14px Manrope';
  ctx.textAlign = 'center';
  ctx.fillText('0', mapX(0), mapY(range.min) + 25);
  ctx.fillText('0,5', mapX(0.5), mapY(range.min) + 25);
  ctx.fillText('1', mapX(1), mapY(range.min) + 25);
  ctx.textAlign = 'right';
  ctx.fillText('0', mapX(range.min) - 12, mapY(0) + 5);
  ctx.fillText('0,5', mapX(range.min) - 12, mapY(0.5) + 5);
  ctx.fillText('1', mapX(range.min) - 12, mapY(1) + 5);
  ctx.textAlign = 'left';
  ctx.fillText('x₁', mapX(1.08), mapY(range.min) + 4);
  ctx.fillText('x₂', mapX(range.min), mapY(1.1));

  if ($('#model').value === 'perceptron') drawPerceptronBoundary();
  else drawMLPBoundary();

  samples.forEach(sample => {
    const x = mapX(sample.x1);
    const y = mapY(sample.x2);
    ctx.beginPath();
    ctx.arc(x, y, 19, 0, Math.PI * 2);
    ctx.fillStyle = sample.target ? '#e8e7ff' : '#ffeaec';
    ctx.fill();
    ctx.strokeStyle = sample.target ? '#4e46e5' : '#ed6a78';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#172033';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 15px Manrope';
    ctx.fillText(String(sample.target), x, y + 1);
  });
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

// ----------------------------------------------------------------------------
// 7. ATUALIZAÇÃO DA INTERFACE E TESTE MANUAL
// ----------------------------------------------------------------------------
function render() {
  drawPlane();
  renderNetwork();
  renderMathSteps();
  const hits = countHits();
  const isMLP = $('#model').value === 'mlp';
  $('#epochs').textContent = epochs;
  $('#accuracy').textContent = `${hits}/4`;
  $('#loss').textContent = epochs ? loss.toFixed(4) : '—';
  $('#chartTitle').textContent = isMLP ? 'Decisão da MLP para XOR' : 'Tentativa linear do Perceptron';
  $('#chartStatus').textContent = hits === 4 ? 'XOR aprendido ✓' : `${4 - hits} erro(s)`;
  $('#chartStatus').className = `status ${hits === 4 ? 'success' : (epochs ? 'fail' : '')}`;
  $('#explanationTitle').textContent = isMLP ? 'A camada oculta combina fronteiras' : 'Uma reta não consegue separar XOR';
  $('#explanation').innerHTML = isMLP
    ? 'A MLP calcula vários potenciais <strong>u</strong> na camada oculta. As ativações são combinadas para criar regiões distintas nos dois cantos onde XOR vale 1.'
    : 'O Perceptron possui somente <strong>u = w₁x₁ + w₂x₂ + b</strong>. Como os resultados iguais ocupam cantos opostos, seus pesos continuam alternando e o treinamento não converge para quatro acertos.';
}

function renderMathSteps() {
  const container = $('#xorMathSteps');
  if (!lastMathStep) {
    container.innerHTML = '<p>Treine uma época para visualizar as contas.</p>';
    return;
  }
  const step = lastMathStep;
  if (step.type === 'perceptron') {
    const dw1 = step.learningRate * step.error * step.sample.x1;
    const dw2 = step.learningRate * step.error * step.sample.x2;
    const db = step.learningRate * step.error;
    container.innerHTML = `<div><b>1 · Potencial</b><span>u=${step.before.w1.toFixed(3)}·${step.sample.x1}+${step.before.w2.toFixed(3)}·${step.sample.x2}+${step.before.b.toFixed(3)}=${step.u.toFixed(3)}</span></div><div><b>2 · Step</b><span>ŷ=Step(${step.u.toFixed(3)})=${step.prediction}</span></div><div><b>3 · Erro</b><span>e=${step.sample.target}−${step.prediction}=${step.error}</span></div><div><b>4 · Correções</b><span>Δw₁=${dw1.toFixed(3)} · Δw₂=${dw2.toFixed(3)} · Δb=${db.toFixed(3)}</span></div><div><b>5 · Pesos</b><span>w₁: ${step.before.w1.toFixed(3)} → ${step.after.w1.toFixed(3)}</span></div><div><b>6 · Limitação</b><span>Mesmo atualizando os pesos, uma única reta não converge para XOR.</span></div>`;
    return;
  }
  const h = step.forward.hidden[0];
  container.innerHTML = `<div><b>1 · Potencial h₁</b><span>u₁=w₁₁x₁+w₁₂x₂+b₁=${h.u.toFixed(4)}</span></div><div><b>2 · Ativação h₁</b><span>a₁=g(u₁)=${h.activated.toFixed(4)}</span></div><div><b>3 · Saída</b><span>uₒ=${step.forward.u.toFixed(4)} → ŷ=${step.forward.probability.toFixed(4)}</span></div><div><b>4 · Erro e δo</b><span>ŷ−y=${step.outputError.toFixed(4)} · δo=${step.outputDelta.toFixed(4)}</span></div><div><b>5 · Delta oculto</b><span>δh₁=δo·v₁·g′(u₁)=${step.hiddenDeltas[0].toFixed(4)}</span></div><div><b>6 · Atualização</b><span>v₁: ${step.before.outputW0.toFixed(4)} → ${step.after.outputW0.toFixed(4)} · w₁₁: ${step.before.hiddenW00.toFixed(4)} → ${step.after.hiddenW00.toFixed(4)}</span></div>`;
}

function renderNetwork() {
  const { x1, x2, target } = viewedInput;
  if ($('#model').value === 'perceptron') {
    const result = perceptronOutput(x1, x2);
    networkView.draw({
      inputs: [x1, x2],
      hidden: [],
      outputs: [result.prediction],
      outputLabels: ['ŷ'],
      inputOutputWeights: [[perceptron.w1, perceptron.w2]],
      outputActivation: 'Step(u)'
    });
    $('#networkTitle').textContent = 'Perceptron · 2 → 1';
    $('#networkSubtitle').textContent = 'Sem camada oculta: existe apenas uma combinação linear.';
    $('#networkReadout').innerHTML = `Entrada (${x1}, ${x2}) · <b>u=${result.u.toFixed(3)}</b> · Step(u)=${result.prediction} · alvo=${target}`;
    return;
  }

  const forward = forwardMLP(x1, x2);
  const prediction = forward.probability >= 0.5 ? 1 : 0;
  networkView.draw({
    inputs: [x1, x2],
    hidden: forward.hidden.map(neuron => ({ u: neuron.u, a: neuron.activated })),
    outputs: [forward.probability],
    outputLabels: ['P(1)'],
    inputHiddenWeights: mlp.hidden.map(neuron => [neuron.w1, neuron.w2]),
    hiddenOutputWeights: [mlp.output.weights],
    hiddenActivation: $('#activation').value,
    outputActivation: 'Sigmoid → ŷ'
  });
  $('#networkTitle').textContent = 'Neurônios da MLP · 2 → 4 → 1';
  $('#networkSubtitle').textContent = 'Cada ligação é um peso; cada círculo oculto aplica uma função de ativação.';
  $('#networkReadout').innerHTML = `Entrada (${x1}, ${x2}) · h₁: u=${forward.hidden[0].u.toFixed(3)}, a=${forward.hidden[0].activated.toFixed(3)} · P(1)=${forward.probability.toFixed(3)} · ŷ=${prediction} · alvo=${target}`;
}

function testCurrentInput() {
  const x1 = Number($('#testX1').value);
  const x2 = Number($('#testX2').value);
  const expected = x1 === x2 ? 0 : 1;
  viewedInput = { x1, x2, target: expected };
  const prediction = predict(x1, x2);
  const detail = $('#model').value === 'mlp'
    ? `probabilidade de 1 = ${forwardMLP(x1, x2).probability.toFixed(3)}`
    : `potencial u = ${perceptronOutput(x1, x2).u.toFixed(3)}`;
  $('#testResult').innerHTML = `Para <span class="mono">${x1} ⊕ ${x2}</span>, a rede previu <b>${prediction}</b>; o correto é <b>${expected}</b> (${detail}).`;
  renderNetwork();
}

$('#trainOne').addEventListener('click', trainEpoch);
$('#trainAuto').addEventListener('click', toggleAutoTraining);
$('#resetNet').addEventListener('click', initializeModels);
$('#testButton').addEventListener('click', testCurrentInput);
$('#model').addEventListener('change', initializeModels);
$('#activation').addEventListener('change', initializeModels);
initializeModels();
