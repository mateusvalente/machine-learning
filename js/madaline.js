// ============================================================================
// CAPÍTULO E LABORATÓRIO MADALINE
// Arquitetura didática: 2 entradas -> 2 ADALINEs -> lógica OR fixa -> saída.
// O treinamento segue uma versão educacional da MADALINE Rule I (MR-I).
// ============================================================================

const madaline$ = selector => document.querySelector(selector);
const madalineNetworkCanvas = madaline$('#madalineNetwork');
const madalineNetworkContext = madalineNetworkCanvas.getContext('2d');
const madalinePlaneCanvas = madaline$('#madalinePlane');
const madalinePlaneContext = madalinePlaneCanvas.getContext('2d');
const madalineHistory = new TrainingHistoryChart(madaline$('#madalineHistory'));

// O XOR é mostrado como 0/1, mas treinado internamente como -1/+1.
const madalineSamples = [
  { binary: [0, 0], x: [-1, -1], target: -1 },
  { binary: [0, 1], x: [-1, +1], target: +1 },
  { binary: [1, 0], x: [+1, -1], target: +1 },
  { binary: [1, 1], x: [+1, +1], target: -1 }
];

let madalineUnits = [];
let madalineEpoch = 0;
let madalineLastStep = null;
let madalineViewedSample = madalineSamples[0];
let madalineAutoTimer = null;

// ----------------------------------------------------------------------------
// 1. OPERAÇÕES BÁSICAS DA ADALINE
// ----------------------------------------------------------------------------

// O potencial é a combinação linear calculada antes do limitador de sinal.
function madalinePotential(unit, inputs) {
  return unit.weights[0] * inputs[0]
    + unit.weights[1] * inputs[1]
    + unit.bias;
}

// A MADALINE histórica trabalha com decisões bipolares.
function madalineSign(value) {
  return value >= 0 ? +1 : -1;
}

// Cada unidade calcula u_j e z_j. A saída fixa implementa uma lógica OR.
function madalineForward(sample) {
  const hidden = madalineUnits.map(unit => {
    const u = madalinePotential(unit, sample.x);
    return { u, z: madalineSign(u) };
  });
  const output = hidden.some(unit => unit.z === +1) ? +1 : -1;
  return { hidden, output };
}

// ----------------------------------------------------------------------------
// 2. RESPONSABILIDADE SEGUNDO A MADALINE RULE I
// ----------------------------------------------------------------------------

function selectResponsibleUnits(forward, target) {
  // Se a decisão está correta, nenhum parâmetro precisa mudar.
  if (forward.output === target) return [];

  if (target === +1) {
    // Para fazer a lógica OR produzir +1, basta virar uma ADALINE.
    // A menor distância |u| indica quem está mais perto do limiar.
    const closest = forward.hidden.reduce((best, current, index, units) =>
      Math.abs(current.u) < Math.abs(units[best].u) ? index : best, 0);
    return [closest];
  }

  // Para a OR produzir -1, nenhuma unidade pode continuar votando +1.
  return forward.hidden
    .map((unit, index) => unit.z === +1 ? index : -1)
    .filter(index => index >= 0);
}

// ----------------------------------------------------------------------------
// 3. REGRA DELTA/LMS PARA UMA UNIDADE SELECIONADA
// ----------------------------------------------------------------------------

function updateMadalineUnit(unitIndex, sample, desiredResponse, learningRate) {
  const unit = madalineUnits[unitIndex];
  const before = { weights: [...unit.weights], bias: unit.bias };
  const u = madalinePotential(unit, sample.x);
  const linearError = desiredResponse - u;
  const deltas = [
    learningRate * linearError * sample.x[0],
    learningRate * linearError * sample.x[1]
  ];
  const biasDelta = learningRate * linearError;

  unit.weights[0] += deltas[0];
  unit.weights[1] += deltas[1];
  unit.bias += biasDelta;

  return {
    unitIndex,
    desiredResponse,
    u,
    linearError,
    deltas,
    biasDelta,
    before,
    after: { weights: [...unit.weights], bias: unit.bias }
  };
}

// ----------------------------------------------------------------------------
// 4. TREINAMENTO DE UMA AMOSTRA E DE UMA ÉPOCA
// ----------------------------------------------------------------------------

function trainMadalineSample(sample, shouldRender = true) {
  const learningRate = Math.max(0.001, Number(madaline$('#madalineLearningRate').value) || 0.15);
  const beforeForward = madalineForward(sample);
  const responsible = selectResponsibleUnits(beforeForward, sample.target);
  const updates = responsible.map(index =>
    updateMadalineUnit(index, sample, sample.target, learningRate));

  madalineViewedSample = sample;
  madalineLastStep = {
    sample,
    learningRate,
    beforeForward,
    responsible,
    updates,
    afterForward: madalineForward(sample)
  };
  if (shouldRender) {
    recordMadalineHistory();
    renderMadaline();
  }
}

function trainSelectedMadalineSample() {
  trainMadalineSample(getSelectedMadalineSample());
}

function trainMadalineEpoch() {
  // A ordem alterna a cada época sem esconder quais quatro amostras são usadas.
  const order = madalineEpoch % 2 ? [...madalineSamples].reverse() : [...madalineSamples];
  order.forEach(sample => trainMadalineSample(sample, false));
  madalineEpoch++;
  recordMadalineHistory();
  renderMadaline();
}

function toggleMadalineAutoTraining() {
  if (madalineAutoTimer) return stopMadalineAutoTraining();
  let rounds = 0;
  madalineAutoTimer = setInterval(() => {
    trainMadalineEpoch();
    rounds++;
    if (madalineHits() === madalineSamples.length || rounds >= 100) {
      stopMadalineAutoTraining();
      renderMadaline();
    }
  }, 180);
  madaline$('#madalineTrainAuto').textContent = 'Pausar treinamento';
}

function stopMadalineAutoTraining() {
  if (madalineAutoTimer) clearInterval(madalineAutoTimer);
  madalineAutoTimer = null;
  const button = madaline$('#madalineTrainAuto');
  if (button) button.textContent = 'Treinar automaticamente';
}

// ----------------------------------------------------------------------------
// 5. MÉTRICAS E ESTADO INICIAL
// ----------------------------------------------------------------------------

function madalineHits() {
  return madalineSamples.filter(sample => madalineForward(sample).output === sample.target).length;
}

function madalineMeanError() {
  return madalineSamples.reduce((total, sample) =>
    total + (madalineForward(sample).output === sample.target ? 0 : 1), 0) / madalineSamples.length;
}

function recordMadalineHistory() {
  madalineHistory.add(madalineEpoch, madalineMeanError(), madalineHits() / madalineSamples.length);
}

function resetMadaline() {
  stopMadalineAutoTraining();
  // Estes valores começam com erros e convergem de forma reprodutível em poucas épocas.
  madalineUnits = [
    { weights: [0.10, 0.10], bias: 0 },
    { weights: [-0.10, -0.10], bias: 0 }
  ];
  madalineEpoch = 0;
  madalineLastStep = null;
  madalineViewedSample = getSelectedMadalineSample();
  madalineHistory.reset();
  recordMadalineHistory();
  renderMadaline();
}

function getSelectedMadalineSample() {
  const x1 = Number(madaline$('#madalineX1').value);
  const x2 = Number(madaline$('#madalineX2').value);
  return madalineSamples.find(sample => sample.binary[0] === x1 && sample.binary[1] === x2);
}

function inspectMadalineSample() {
  madalineViewedSample = getSelectedMadalineSample();
  renderMadaline();
}

// ----------------------------------------------------------------------------
// 6. CANVAS DA ARQUITETURA
// ----------------------------------------------------------------------------

function drawMadalineNetwork() {
  const ctx = madalineNetworkContext;
  const canvas = madalineNetworkCanvas;
  const forward = madalineForward(madalineViewedSample);
  const inputNodes = [[95, 135], [95, 300]];
  const hiddenNodes = [[390, 125], [390, 310]];
  const logicNode = [625, 215];
  const outputNode = [760, 215];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fafbff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  hiddenNodes.forEach((target, hiddenIndex) => {
    inputNodes.forEach((source, inputIndex) => {
      const weight = madalineUnits[hiddenIndex].weights[inputIndex];
      ctx.beginPath();
      ctx.moveTo(source[0] + 28, source[1]);
      ctx.lineTo(target[0] - 48, target[1]);
      ctx.strokeStyle = weight >= 0 ? '#7770ee' : '#ed8290';
      ctx.lineWidth = 2 + Math.min(2, Math.abs(weight));
      ctx.stroke();
      ctx.fillStyle = weight >= 0 ? '#4e46e5' : '#c94f60';
      ctx.font = '600 11px DM Mono';
      ctx.textAlign = 'center';
      ctx.fillText(`w${hiddenIndex + 1}${inputIndex + 1}=${weight.toFixed(2)}`, (source[0] + target[0]) / 2, (source[1] + target[1]) / 2 - 7);
    });
  });

  hiddenNodes.forEach(source => {
    ctx.beginPath();
    ctx.moveTo(source[0] + 48, source[1]);
    ctx.lineTo(logicNode[0] - 36, logicNode[1]);
    ctx.strokeStyle = '#8a93a8';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.moveTo(logicNode[0] + 36, logicNode[1]);
  ctx.lineTo(outputNode[0] - 27, outputNode[1]);
  ctx.strokeStyle = '#4e46e5';
  ctx.lineWidth = 3;
  ctx.stroke();

  inputNodes.forEach((position, index) => drawMadalineNode(ctx, position, 29, '#ffffff', '#818aa2', `x${index + 1}`, madalineViewedSample.x[index]));
  hiddenNodes.forEach((position, index) => drawMadalineNode(ctx, position, 48, '#eef0ff', '#4e46e5', `ADALINE ${index + 1}`, `u=${forward.hidden[index].u.toFixed(2)} · z=${forward.hidden[index].z > 0 ? '+1' : '−1'}`));
  drawMadalineNode(ctx, logicNode, 36, '#fff2e9', '#e9773e', 'OR', 'fixa');
  drawMadalineNode(ctx, outputNode, 27, '#e3faf4', '#19a987', 'ŷ', forward.output > 0 ? '+1' : '−1');

  ctx.fillStyle = '#59647b';
  ctx.font = '700 10px Manrope';
  ctx.textAlign = 'center';
  ctx.fillText('ENTRADAS BIPOLARES', 95, 55);
  ctx.fillText('UNIDADES ADAPTATIVAS', 390, 55);
  ctx.fillText('LÓGICA FIXA', 625, 55);
  ctx.fillText('SAÍDA', 760, 55);
}

function drawMadalineNode(ctx, position, radius, fill, stroke, label, value) {
  ctx.beginPath();
  ctx.arc(position[0], position[1], radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#172033';
  ctx.textAlign = 'center';
  ctx.font = radius > 35 ? '800 11px Manrope' : '800 14px Manrope';
  ctx.fillText(label, position[0], position[1] - 4);
  ctx.fillStyle = '#59647b';
  ctx.font = '600 10px DM Mono';
  ctx.fillText(String(value), position[0], position[1] + 14);
}

// ----------------------------------------------------------------------------
// 7. CANVAS DAS DUAS FRONTEIRAS
// ----------------------------------------------------------------------------

function drawMadalinePlane() {
  const ctx = madalinePlaneContext;
  const canvas = madalinePlaneCanvas;
  const margin = 62;
  const min = -1.25;
  const max = 1.25;
  const mapX = value => margin + (value - min) * (canvas.width - 2 * margin) / (max - min);
  const mapY = value => canvas.height - margin - (value - min) * (canvas.height - 2 * margin) / (max - min);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fbfbff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cell = 10;
  for (let px = margin; px < canvas.width - margin; px += cell) {
    for (let py = margin; py < canvas.height - margin; py += cell) {
      const x1 = min + (px - margin) * (max - min) / (canvas.width - 2 * margin);
      const x2 = min + (canvas.height - margin - py) * (max - min) / (canvas.height - 2 * margin);
      const output = madalineForward({ x: [x1, x2] }).output;
      ctx.fillStyle = output === +1 ? 'rgba(78,70,229,.11)' : 'rgba(237,106,120,.10)';
      ctx.fillRect(px, py, cell, cell);
    }
  }

  ctx.strokeStyle = '#d9deeb';
  ctx.lineWidth = 1;
  [-1, 0, 1].forEach(value => {
    ctx.beginPath();
    ctx.moveTo(mapX(value), mapY(min));
    ctx.lineTo(mapX(value), mapY(max));
    ctx.moveTo(mapX(min), mapY(value));
    ctx.lineTo(mapX(max), mapY(value));
    ctx.stroke();
  });

  madalineUnits.forEach((unit, index) => {
    ctx.save();
    ctx.beginPath();
    if (Math.abs(unit.weights[1]) > 0.0001) {
      const leftY = (-unit.weights[0] * min - unit.bias) / unit.weights[1];
      const rightY = (-unit.weights[0] * max - unit.bias) / unit.weights[1];
      ctx.moveTo(mapX(min), mapY(leftY));
      ctx.lineTo(mapX(max), mapY(rightY));
    } else {
      const x = -unit.bias / unit.weights[0];
      ctx.moveTo(mapX(x), mapY(min));
      ctx.lineTo(mapX(x), mapY(max));
    }
    ctx.strokeStyle = index === 0 ? '#4e46e5' : '#e06c37';
    ctx.lineWidth = 3;
    ctx.setLineDash(index === 0 ? [9, 5] : [3, 5]);
    ctx.stroke();
    ctx.restore();
  });

  madalineSamples.forEach(sample => {
    const x = mapX(sample.x[0]);
    const y = mapY(sample.x[1]);
    ctx.beginPath();
    ctx.arc(x, y, 19, 0, Math.PI * 2);
    ctx.fillStyle = sample.target === +1 ? '#e8e7ff' : '#ffeaec';
    ctx.fill();
    ctx.strokeStyle = sample.target === +1 ? '#4e46e5' : '#ed6a78';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#172033';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 14px Manrope';
    ctx.fillText(sample.target === +1 ? '1' : '0', x, y + 1);
  });

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#59647b';
  ctx.font = '600 14px Manrope';
  ctx.textAlign = 'center';
  ctx.fillText('−1', mapX(-1), canvas.height - 25);
  ctx.fillText('0', mapX(0), canvas.height - 25);
  ctx.fillText('1', mapX(+1), canvas.height - 25);
  ctx.textAlign = 'right';
  ctx.fillText('−1', 48, mapY(-1) + 4);
  ctx.fillText('0', 48, mapY(0) + 4);
  ctx.fillText('1', 48, mapY(+1) + 4);
  ctx.textAlign = 'left';
  ctx.fillText('x₁', canvas.width - 42, mapY(0) - 8);
  ctx.fillText('x₂', mapX(0) + 8, 30);
}

// ----------------------------------------------------------------------------
// 8. CONTAS E DEMAIS ELEMENTOS DA INTERFACE
// ----------------------------------------------------------------------------

function renderMadalineMath() {
  const container = madaline$('#madalineMathSteps');
  if (!madalineLastStep) {
    container.innerHTML = '<p>Treine uma amostra para visualizar as contas.</p>';
    return;
  }

  const step = madalineLastStep;
  const [x1, x2] = step.sample.x;
  const hidden = step.beforeForward.hidden;
  const targetBinary = step.sample.target === +1 ? 1 : 0;
  const outputBinary = step.beforeForward.output === +1 ? 1 : 0;
  const responsibleText = step.responsible.length
    ? step.responsible.map(index => `ADALINE ${index + 1}`).join(' e ')
    : 'nenhuma unidade';

  let html = `<div><b>1 · Conversão bipolar</b><span>(${step.sample.binary.join(', ')}) → (${x1 > 0 ? '+1' : '−1'}, ${x2 > 0 ? '+1' : '−1'}) · alvo ${targetBinary} → ${step.sample.target > 0 ? '+1' : '−1'}</span></div>`;
  html += `<div><b>2 · Potenciais</b><span>u₁=${hidden[0].u.toFixed(4)} · u₂=${hidden[1].u.toFixed(4)}</span></div>`;
  html += `<div><b>3 · Limitadores</b><span>z₁=${hidden[0].z > 0 ? '+1' : '−1'} · z₂=${hidden[1].z > 0 ? '+1' : '−1'}</span></div>`;
  html += `<div><b>4 · Saída OR</b><span>ŷ=${step.beforeForward.output > 0 ? '+1' : '−1'} (${outputBinary}) · alvo=${step.sample.target > 0 ? '+1' : '−1'} (${targetBinary})</span></div>`;
  html += `<div><b>5 · Responsabilidade MR-I</b><span>${responsibleText}${step.responsible.length ? ' · menor perturbação necessária' : ' · previsão correta'}</span></div>`;

  if (!step.updates.length) {
    html += '<div><b>6 · Atualização</b><span>Como ŷ = alvo, os pesos e bias permanecem iguais.</span></div>';
    container.innerHTML = html;
    return;
  }

  step.updates.forEach((update, updateIndex) => {
    const number = updateIndex + 6;
    html += `<div><b>${number} · LMS da ADALINE ${update.unitIndex + 1}</b><span>e=${update.desiredResponse > 0 ? '+1' : '−1'}−(${update.u.toFixed(4)})=${update.linearError.toFixed(4)}</span></div>`;
    html += `<div><b>${number + 1} · Novos parâmetros</b><span>w₁: ${update.before.weights[0].toFixed(4)} + ${update.deltas[0].toFixed(4)} = ${update.after.weights[0].toFixed(4)}<br>w₂: ${update.before.weights[1].toFixed(4)} + ${update.deltas[1].toFixed(4)} = ${update.after.weights[1].toFixed(4)}<br>b: ${update.before.bias.toFixed(4)} + ${update.biasDelta.toFixed(4)} = ${update.after.bias.toFixed(4)}</span></div>`;
  });
  container.innerHTML = html;
}

function renderMadalineTruthTable() {
  madaline$('#madalineTruthBody').innerHTML = madalineSamples.map(sample => {
    const forward = madalineForward(sample);
    const expected = sample.target === +1 ? 1 : 0;
    const prediction = forward.output === +1 ? 1 : 0;
    const correct = expected === prediction;
    return `<tr><td>${sample.binary[0]}</td><td>${sample.binary[1]}</td><td class="mono">${forward.hidden[0].u.toFixed(3)} → ${forward.hidden[0].z > 0 ? '+1' : '−1'}</td><td class="mono">${forward.hidden[1].u.toFixed(3)} → ${forward.hidden[1].z > 0 ? '+1' : '−1'}</td><td>${expected}</td><td>${prediction}</td><td class="${correct ? 'yes' : 'no'}">${correct ? '✓' : '×'}</td></tr>`;
  }).join('');
}

function renderMadaline() {
  const forward = madalineForward(madalineViewedSample);
  const hits = madalineHits();
  const prediction = forward.output === +1 ? 1 : 0;
  const target = madalineViewedSample.target === +1 ? 1 : 0;

  drawMadalineNetwork();
  drawMadalinePlane();
  renderMadalineMath();
  renderMadalineTruthTable();

  madaline$('#madalineEpochs').textContent = madalineEpoch;
  madaline$('#madalineAccuracy').textContent = `${hits}/4`;
  madaline$('#madalineLoss').textContent = madalineMeanError().toFixed(3);
  madaline$('#madalineStatus').textContent = hits === 4 ? 'XOR aprendido ✓' : `${4 - hits} erro(s)`;
  madaline$('#madalineStatus').className = `status ${hits === 4 ? 'success' : 'fail'}`;
  madaline$('#madalineReadout').innerHTML = `Entrada (${madalineViewedSample.binary.join(', ')}) · u₁=${forward.hidden[0].u.toFixed(3)} → z₁=${forward.hidden[0].z > 0 ? '+1' : '−1'} · u₂=${forward.hidden[1].u.toFixed(3)} → z₂=${forward.hidden[1].z > 0 ? '+1' : '−1'} · <b>ŷ=${prediction}</b> · alvo=${target}`;
}

madaline$('#madalineInspect').addEventListener('click', inspectMadalineSample);
madaline$('#madalineTrainSample').addEventListener('click', trainSelectedMadalineSample);
madaline$('#madalineTrainEpoch').addEventListener('click', trainMadalineEpoch);
madaline$('#madalineTrainAuto').addEventListener('click', toggleMadalineAutoTraining);
madaline$('#madalineReset').addEventListener('click', resetMadaline);
madaline$('#madalineX1').addEventListener('change', inspectMadalineSample);
madaline$('#madalineX2').addEventListener('change', inspectMadalineSample);

resetMadaline();
