// ============================================================================
// CAPÍTULO INTERATIVO: PERCEPTRON MULTICAMADAS
// Todas as etapas foram separadas para acompanhar o fluxo matemático da MLP.
// ============================================================================

const mlp$ = selector => document.querySelector(selector);
const chapterNetwork = new MLPNetworkView(mlp$('#mlpChapterCanvas'));
const chapterHistory = new TrainingHistoryChart(mlp$('#mlpChapterHistory'));
const xorSamples = [
  { x: [0, 0], y: 0 },
  { x: [0, 1], y: 1 },
  { x: [1, 0], y: 1 },
  { x: [1, 1], y: 0 }
];

let chapterNet;
let chapterEpochs = 0;
let chapterLoss = 0;
let chapterTimer = null;
let inspectedSample = xorSamples[0];
let lastTrainingStep = null;

const randomWeight = () => Math.random() * 1.6 - 0.8;
const sigmoid = u => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, u))));

// Retorna a ativação escolhida para a camada oculta.
function hiddenActivation(u) {
  const type = mlp$('#mlpHiddenActivation').value;
  if (type === 'tanh') return Math.tanh(u);
  if (type === 'relu') return Math.max(0, u);
  return sigmoid(u);
}

// Retorna a derivada correspondente, necessária no backpropagation.
function hiddenDerivative(u, activation) {
  const type = mlp$('#mlpHiddenActivation').value;
  if (type === 'tanh') return 1 - activation * activation;
  if (type === 'relu') return u > 0 ? 1 : 0;
  return activation * (1 - activation);
}

// Cria quatro neurônios ocultos e um neurônio de saída.
function createNetwork() {
  return {
    hidden: Array.from({ length: 4 }, () => ({ w: [randomWeight(), randomWeight()], b: randomWeight() })),
    output: { w: Array.from({ length: 4 }, randomWeight), b: randomWeight() }
  };
}

// Calcula o potencial u = Σ(wᵢxᵢ) + b.
function calculatePotential(inputs, weights, bias) {
  return inputs.reduce((sum, input, index) => sum + input * weights[index], bias);
}

// Executa o forward pass completo sem alterar pesos.
function forwardPass(inputs) {
  const hidden = chapterNet.hidden.map(neuron => {
    const u = calculatePotential(inputs, neuron.w, neuron.b);
    const a = hiddenActivation(u);
    return { u, a };
  });
  const outputU = calculatePotential(hidden.map(neuron => neuron.a), chapterNet.output.w, chapterNet.output.b);
  const probability = sigmoid(outputU);
  return { hidden, outputU, probability };
}

// Calcula os deltas da saída e da camada oculta.
function calculateDeltas(sample, forward) {
  const outputDelta = forward.probability - sample.y;
  const oldOutputWeights = [...chapterNet.output.w];
  const hiddenDeltas = forward.hidden.map((neuron, index) =>
    outputDelta * oldOutputWeights[index] * hiddenDerivative(neuron.u, neuron.a)
  );
  return { outputDelta, hiddenDeltas };
}

// Atualiza todos os parâmetros e guarda uma conta completa para a interface.
function trainSample(sample, learningRate) {
  const before = {
    outputW0: chapterNet.output.w[0],
    hiddenW00: chapterNet.hidden[0].w[0]
  };
  const forward = forwardPass(sample.x);
  const deltas = calculateDeltas(sample, forward);

  chapterNet.output.w = chapterNet.output.w.map(
    (weight, index) => weight - learningRate * deltas.outputDelta * forward.hidden[index].a
  );
  chapterNet.output.b -= learningRate * deltas.outputDelta;

  chapterNet.hidden.forEach((neuron, hiddenIndex) => {
    neuron.w = neuron.w.map(
      (weight, inputIndex) => weight - learningRate * deltas.hiddenDeltas[hiddenIndex] * sample.x[inputIndex]
    );
    neuron.b -= learningRate * deltas.hiddenDeltas[hiddenIndex];
  });

  lastTrainingStep = { sample, forward, deltas, before, learningRate };
  return (forward.probability - sample.y) ** 2;
}

// Uma época apresenta as quatro combinações do XOR.
function trainChapterEpoch() {
  const learningRate = Number(mlp$('#mlpLearningRate').value) || 0.7;
  const shuffled = [...xorSamples].sort(() => Math.random() - 0.5);
  chapterLoss = shuffled.reduce((sum, sample) => sum + trainSample(sample, learningRate), 0) / shuffled.length;
  chapterEpochs++;
  inspectedSample = shuffled[shuffled.length - 1];
  recordChapterHistory();
  renderChapter();
}

function predictChapter(inputs) {
  return forwardPass(inputs).probability >= 0.5 ? 1 : 0;
}

function chapterHits() {
  return xorSamples.filter(sample => predictChapter(sample.x) === sample.y).length;
}

function currentChapterError() {
  return xorSamples.reduce((sum, sample) => {
    const difference = sample.y - forwardPass(sample.x).probability;
    return sum + difference * difference;
  }, 0) / xorSamples.length;
}

function recordChapterHistory() {
  chapterHistory.add(chapterEpochs, currentChapterError(), chapterHits() / xorSamples.length);
}

function resetChapterNetwork() {
  if (chapterTimer) clearInterval(chapterTimer);
  chapterTimer = null;
  chapterNet = createNetwork();
  chapterEpochs = 0;
  chapterLoss = 0;
  lastTrainingStep = null;
  inspectedSample = xorSamples[0];
  chapterHistory.reset();
  recordChapterHistory();
  mlp$('#mlpTrainAuto').textContent = 'Treinar automaticamente';
  renderChapter();
}

function toggleChapterAutoTraining() {
  if (chapterTimer) {
    clearInterval(chapterTimer);
    chapterTimer = null;
    mlp$('#mlpTrainAuto').textContent = 'Treinar automaticamente';
    return;
  }
  let rounds = 0;
  chapterTimer = setInterval(() => {
    for (let index = 0; index < 8; index++) trainChapterEpoch();
    rounds += 8;
    if ((chapterHits() === 4 && chapterEpochs > 50) || rounds >= 5000) {
      clearInterval(chapterTimer);
      chapterTimer = null;
      mlp$('#mlpTrainAuto').textContent = 'Treinar automaticamente';
    }
  }, 24);
  mlp$('#mlpTrainAuto').textContent = 'Pausar treinamento';
}

function inspectSelectedInput() {
  const x1 = Number(mlp$('#mlpX1').value);
  const x2 = Number(mlp$('#mlpX2').value);
  inspectedSample = { x: [x1, x2], y: x1 === x2 ? 0 : 1 };
  renderChapter();
}

function renderChapterNetwork() {
  const forward = forwardPass(inspectedSample.x);
  const prediction = forward.probability >= 0.5 ? 1 : 0;
  chapterNetwork.draw({
    inputs: inspectedSample.x,
    hidden: forward.hidden,
    outputs: [forward.probability],
    outputLabels: ['P(1)'],
    inputHiddenWeights: chapterNet.hidden.map(neuron => neuron.w),
    hiddenOutputWeights: [chapterNet.output.w],
    hiddenActivation: mlp$('#mlpHiddenActivation').value,
    outputActivation: 'Sigmoid → ŷ'
  });
  mlp$('#mlpReadout').innerHTML = `Entrada (${inspectedSample.x.join(', ')}) · h₁: u=${forward.hidden[0].u.toFixed(3)}, a=${forward.hidden[0].a.toFixed(3)} · uₒ=${forward.outputU.toFixed(3)} · P(1)=${forward.probability.toFixed(3)} · ŷ=${prediction} · y=${inspectedSample.y}`;
}

function renderChapterMath() {
  if (!lastTrainingStep) {
    mlp$('#mlpMathSteps').innerHTML = '<p>Treine uma época para visualizar potencial, ativação, erro, deltas e atualização.</p>';
    return;
  }
  const step = lastTrainingStep;
  const h = step.forward.hidden[0];
  const newOutputWeight = chapterNet.output.w[0];
  const newHiddenWeight = chapterNet.hidden[0].w[0];
  mlp$('#mlpMathSteps').innerHTML = `
    <div><b>1 · Potencial oculto h₁</b><span>u₁ = w₁₁x₁ + w₁₂x₂ + b₁ = ${h.u.toFixed(4)}</span></div>
    <div><b>2 · Ativação oculta</b><span>a₁ = g(u₁) = ${h.a.toFixed(4)}</span></div>
    <div><b>3 · Saída</b><span>uₒ = ${step.forward.outputU.toFixed(4)} → ŷ = ${step.forward.probability.toFixed(4)}</span></div>
    <div><b>4 · Erro e delta</b><span>ŷ − y = ${step.forward.probability.toFixed(4)} − ${step.sample.y} = ${step.deltas.outputDelta.toFixed(4)}</span></div>
    <div><b>5 · Gradiente oculto</b><span>δh₁ = δo · v₁ · g′(u₁) = ${step.deltas.hiddenDeltas[0].toFixed(4)}</span></div>
    <div><b>6 · Peso da saída</b><span>${step.before.outputW0.toFixed(4)} − ${step.learningRate}·${step.deltas.outputDelta.toFixed(4)}·${h.a.toFixed(4)} = ${newOutputWeight.toFixed(4)}</span></div>
    <div><b>7 · Peso oculto</b><span>${step.before.hiddenW00.toFixed(4)} − ${step.learningRate}·${step.deltas.hiddenDeltas[0].toFixed(4)}·${step.sample.x[0]} = ${newHiddenWeight.toFixed(4)}</span></div>`;
}

function renderChapter() {
  const hits = chapterHits();
  renderChapterNetwork();
  renderChapterMath();
  mlp$('#mlpEpochs').textContent = chapterEpochs;
  mlp$('#mlpAccuracy').textContent = `${hits}/4`;
  mlp$('#mlpLoss').textContent = chapterEpochs ? chapterLoss.toFixed(4) : '—';
  mlp$('#mlpStatus').textContent = hits === 4 ? 'XOR aprendido ✓' : `${4 - hits} erro(s)`;
  mlp$('#mlpStatus').className = `status ${hits === 4 ? 'success' : (chapterEpochs ? 'fail' : '')}`;
}

// Conteúdo das funções de ativação, copiado da introdução e adaptado para u.
const activationDemos = {
  step: ['Step · decisão discreta', 'Retorna 0 ou 1. É útil para explicar o Perceptron clássico, mas não fornece gradiente útil ao backpropagation.', 'Saída: {0, 1}', 'M40 180H230V60H430'],
  linear: ['Linear · relação preservada', 'Mantém a proporcionalidade. É comum na saída de problemas de regressão.', 'Saída: valores reais', 'M40 205L420 35'],
  sigmoid: ['Sigmoid · curva em S', 'Comprime o potencial entre 0 e 1. É comum na saída de classificação binária.', 'Saída: 0 a 1', 'M40 195C125 195 145 170 190 135C220 112 240 90 270 70C315 35 355 30 420 30'],
  tanh: ['Tanh · centrada em zero', 'Produz valores entre −1 e 1 e pode ser usada em camadas ocultas.', 'Saída: −1 a 1', 'M40 200C125 200 145 170 190 135C220 112 240 85 270 56C315 20 355 20 420 20'],
  relu: ['ReLU · retificação linear', 'Zera potenciais negativos e preserva positivos. É frequente em redes profundas.', 'Saída: 0 a ∞', 'M40 180H230L420 25']
};

document.querySelectorAll('[data-activation-demo]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-activation-demo]').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  const [title, description, range, path] = activationDemos[button.dataset.activationDemo];
  mlp$('#mlpActivationTitle').textContent = title;
  mlp$('#mlpActivationDescription').textContent = description;
  mlp$('#mlpActivationRange').textContent = range;
  mlp$('#mlpActivationPath').setAttribute('d', path);
}));

mlp$('#mlpInspect').addEventListener('click', inspectSelectedInput);
mlp$('#mlpTrainEpoch').addEventListener('click', trainChapterEpoch);
mlp$('#mlpTrainAuto').addEventListener('click', toggleChapterAutoTraining);
mlp$('#mlpReset').addEventListener('click', resetChapterNetwork);
mlp$('#mlpHiddenActivation').addEventListener('change', resetChapterNetwork);
resetChapterNetwork();
