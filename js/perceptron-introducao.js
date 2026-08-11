// Sandbox introdutório: os controles representam um único Perceptron.
const home$ = selector => document.querySelector(selector);
const sandboxDefaults = { x1: 1, x2: 0, w1: 0.6, w2: 0.4, bias: -0.2 };
const sandbox = { ...sandboxDefaults };
const sliders = { x1: home$('#x1Slider'), x2: home$('#x2Slider'), w1: home$('#w1Slider'), w2: home$('#w2Slider'), bias: home$('#biasSlider') };
const classPoints = [[-.78,.65,'A'],[-.55,.42,'A'],[-.35,.68,'A'],[.38,.58,'A'],[.67,.24,'A'],[-.62,-.55,'B'],[-.28,-.38,'B'],[.08,-.65,'B'],[.39,-.35,'B'],[.68,-.12,'B']];

function format(value) { return `${value < 0 ? '−' : ''}${Math.abs(value).toFixed(1)}`; }
function potential() { return sandbox.w1 * sandbox.x1 + sandbox.w2 * sandbox.x2 + sandbox.bias; }
function updateSandbox() {
  Object.entries(sliders).forEach(([key, input]) => { sandbox[key] = Number(input.value); home$(`#${key}Out`).textContent = format(sandbox[key]); });
  const u = potential(), output = u >= 0 ? 1 : 0;
  home$('#valueX1').textContent = format(sandbox.x1); home$('#valueX2').textContent = format(sandbox.x2); home$('#valueB').textContent = format(sandbox.bias);
  home$('#potentialValue').textContent = u.toFixed(2); home$('#outputValue').textContent = output; home$('#stepText').textContent = `g(${u.toFixed(2)}) = ${output}`;
  home$('#activationMarker').style.left = `${Math.max(2, Math.min(98, 50 + u * 22))}%`;
  // Mostra de onde vem cada número usado para desenhar a fronteira.
  home$('#boundaryVariables').textContent = `w₁ = ${format(sandbox.w1)} · w₂ = ${format(sandbox.w2)} · b = ${format(sandbox.bias)}`;
  home$('#boundarySubstitution').textContent = `(${format(sandbox.w1)} × x₁) + (${format(sandbox.w2)} × x₂) + (${format(sandbox.bias)}) = 0`;
  home$('#boundaryEquation').textContent = `${format(sandbox.w1)}x₁ ${sandbox.w2 >= 0 ? '+' : '−'} ${Math.abs(sandbox.w2).toFixed(1)}x₂ ${sandbox.bias >= 0 ? '+' : '−'} ${Math.abs(sandbox.bias).toFixed(1)} = 0`;

  // Forma reduzida: x₂ = inclinação*x₁ + intercepto.
  if (Math.abs(sandbox.w2) > 0.001) {
    const slope = -sandbox.w1 / sandbox.w2;
    const intercept = -sandbox.bias / sandbox.w2;
    const oppositeW1 = -sandbox.w1;
    const oppositeBias = -sandbox.bias;
    home$('#boundaryIsolation').textContent = `${format(sandbox.w2)}x₂ = ${format(oppositeW1)}x₁ ${oppositeBias >= 0 ? '+' : '−'} ${Math.abs(oppositeBias).toFixed(1)}`;
    home$('#boundarySlopeEquation').innerHTML = `x₂ = (${format(oppositeW1)} ÷ ${format(sandbox.w2)})x₁ ${oppositeBias >= 0 ? '+' : '−'} (${Math.abs(oppositeBias).toFixed(1)} ÷ ${format(sandbox.w2)})<br>x₂ = ${slope.toFixed(2)}x₁ ${intercept >= 0 ? '+' : '−'} ${Math.abs(intercept).toFixed(2)}`;
  } else if (Math.abs(sandbox.w1) > 0.001) {
    const verticalPosition = -sandbox.bias / sandbox.w1;
    home$('#boundaryIsolation').textContent = `${format(sandbox.w1)}x₁ = ${format(-sandbox.bias)}`;
    home$('#boundarySlopeEquation').textContent = `reta vertical: x₁ = ${verticalPosition.toFixed(2)}`;
  } else {
    home$('#boundaryIsolation').textContent = '0x₁ + 0x₂ + b = 0';
    home$('#boundarySlopeEquation').textContent = 'w₁ e w₂ são zero: não existe uma reta definida';
  }
  drawBoundary();
}

function drawBoundary() {
  const canvas = home$('#homeBoundary'), ctx = canvas.getContext('2d'), width = canvas.width, height = canvas.height, margin = 52;
  const mapX = x => margin + (x + 1) * (width - 2 * margin) / 2, mapY = y => height - margin - (y + 1) * (height - 2 * margin) / 2;
  ctx.clearRect(0, 0, width, height); ctx.fillStyle = '#fafbff'; ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#dfe4ef'; ctx.lineWidth = 1;
  for (let tick = -1; tick <= 1; tick += .5) { ctx.beginPath(); ctx.moveTo(mapX(tick), mapY(-1)); ctx.lineTo(mapX(tick), mapY(1)); ctx.moveTo(mapX(-1), mapY(tick)); ctx.lineTo(mapX(1), mapY(tick)); ctx.stroke(); }
  ctx.strokeStyle = '#29324a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mapX(-1), mapY(0)); ctx.lineTo(mapX(1), mapY(0)); ctx.moveTo(mapX(0), mapY(-1)); ctx.lineTo(mapX(0), mapY(1)); ctx.stroke();
  // Numera os dois eixos para relacionar a reta às coordenadas dos pontos.
  ctx.save();
  ctx.fillStyle = '#4b5870';
  ctx.font = '600 14px Manrope';
  for (let tick = -1; tick <= 1.001; tick += 0.5) {
    const label = Number.isInteger(tick) ? String(tick) : tick.toFixed(1).replace('.', ',');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, mapX(tick), mapY(0) + 8);
    if (Math.abs(tick) > 0.001) {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, mapX(0) - 8, mapY(tick));
    }
  }
  ctx.restore();
  if (Math.abs(sandbox.w2) > .001) { ctx.beginPath(); ctx.moveTo(mapX(-1.15), mapY((-sandbox.w1 * -1.15 - sandbox.bias) / sandbox.w2)); ctx.lineTo(mapX(1.15), mapY((-sandbox.w1 * 1.15 - sandbox.bias) / sandbox.w2)); ctx.strokeStyle = '#4e46e5'; ctx.lineWidth = 3; ctx.stroke(); }
  classPoints.forEach(([x, y, label]) => { ctx.beginPath(); ctx.arc(mapX(x), mapY(y), 13, 0, Math.PI * 2); ctx.fillStyle = label === 'A' ? '#e8e7ff' : '#ffebe2'; ctx.fill(); ctx.strokeStyle = label === 'A' ? '#4e46e5' : '#e77d37'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#172033'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 13px Manrope'; ctx.fillText(label, mapX(x), mapY(y) + 1); });
  ctx.textAlign = 'left'; ctx.fillStyle = '#4b5870'; ctx.font = '13px Manrope'; ctx.fillText('x₁', mapX(.95), mapY(-.09)); ctx.fillText('x₂', mapX(.06), mapY(.92));
}

document.querySelectorAll('[data-part]').forEach(node => node.addEventListener('click', () => { document.querySelectorAll('[data-part]').forEach(item => item.classList.remove('selected')); node.classList.add('selected'); home$('#inspectorTitle').textContent = node.dataset.title; home$('#inspectorText').textContent = node.dataset.copy; }));
Object.values(sliders).forEach(slider => slider.addEventListener('input', updateSandbox));
home$('#resetSandbox').addEventListener('click', () => { Object.entries(sandboxDefaults).forEach(([key, value]) => { sliders[key].value = value; }); updateSandbox(); });
// Clicar no plano transforma a posição escolhida em novas entradas x₁ e x₂.
home$('#homeBoundary').addEventListener('click', event => {
  const canvas = home$('#homeBoundary');
  const area = canvas.getBoundingClientRect();
  const margin = 52;
  const localX = (event.clientX - area.left) * canvas.width / area.width;
  const localY = (event.clientY - area.top) * canvas.height / area.height;
  sliders.x1.value = Math.max(-1, Math.min(1, ((localX - margin) * 2 / (canvas.width - 2 * margin)) - 1)).toFixed(1);
  sliders.x2.value = Math.max(-1, Math.min(1, ((canvas.height - margin - localY) * 2 / (canvas.height - 2 * margin)) - 1)).toFixed(1);
  updateSandbox();
});
updateSandbox();

// Fórmulas-resumo dos seis componentes do Perceptron.
// Elas são inseridas ao final de cada card para ligar a explicação verbal
// à notação matemática usada no restante do capítulo.
const perceptronComponentFormulas = [
  { label: 'Vetor de entrada', formula: 'x = [x₁, x₂, …, xₙ]ᵀ' },
  { label: 'Entrada ponderada', formula: 'sᵢ = wᵢ · xᵢ' },
  { label: 'Soma ponderada', formula: 'Σᵢ₌₁ⁿ wᵢ · xᵢ' },
  { label: 'Relação entre as notações', formula: 'b = −θ' },
  { label: 'Potencial de ativação', formula: 'u = Σᵢ₌₁ⁿ wᵢ · xᵢ + b' },
  { label: 'Função degrau', formula: 'ŷ = g(u) = 1 se u ≥ 0; 0 se u < 0' }
];

const perceptronComponentCards = document.querySelectorAll('#modelo > .concept-grid .concept-card');
const inputsCardTitle = perceptronComponentCards[0]?.querySelector('h3');
if (inputsCardTitle) inputsCardTitle.textContent = '1. Entradas: x₁ … xₙ';

perceptronComponentCards.forEach((card, index) => {
  const item = perceptronComponentFormulas[index];
  if (!item) return;

  const formulaBox = document.createElement('div');
  const formulaLabel = document.createElement('span');
  const formulaText = document.createElement('strong');
  formulaBox.className = 'concept-formula';
  formulaLabel.textContent = item.label;
  formulaText.textContent = item.formula;
  formulaBox.append(formulaLabel, formulaText);
  card.appendChild(formulaBox);
});

// Exemplo único usado nos quatro passos do treinamento.
// Assim, o estudante acompanha os mesmos valores do forward até a atualização.
const trainingProcess = document.querySelector('#treinamento > .process');
const trainingSteps = [
  {
    title: '1. Forward pass',
    explanation: 'Use as entradas e os parâmetros atuais para calcular o potencial u. Depois aplique Step para obter ŷ.',
    lines: [
      'u = (0,40 × 1) + (−0,20 × 0) − 0,10',
      'u = 0,30  →  ŷ = Step(0,30) = 1'
    ]
  },
  {
    title: '2. Cálculo do erro',
    explanation: 'Compare a resposta correta y com a previsão ŷ. Neste exemplo, o alvo era 0, mas o Perceptron respondeu 1.',
    lines: [
      'erro = y − ŷ',
      'erro = 0 − 1 = −1'
    ]
  },
  {
    title: '3. Ajuste · Regra do Perceptron',
    explanation: 'Use η = 0,20 para corrigir cada peso e o bias. A entrada x₂ vale zero, portanto w₂ não muda nesta amostra.',
    lines: [
      'w₁ = 0,40 + (0,20 × −1 × 1) = 0,20',
      'w₂ = −0,20 + (0,20 × −1 × 0) = −0,20',
      'b = −0,10 + (0,20 × −1) = −0,30'
    ]
  },
  {
    title: '4. Época e convergência',
    explanation: 'Repita os passos 1, 2 e 3 para todas as amostras. Uma passagem completa pelo conjunto corresponde a uma época.',
    lines: [
      'erro da época = |e₁| + |e₂| + … + |eₙ|',
      'se erro da época = 0  →  convergiu'
    ]
  }
];

if (trainingProcess) {
  const processIntroduction = document.createElement('p');
  processIntroduction.className = 'training-process-intro';
  processIntroduction.textContent = 'Os quatro cards abaixo formam um ciclo: calcular, comparar, corrigir e repetir. Todos usam o mesmo exemplo: x₁ = 1, x₂ = 0, y = 0, w₁ = 0,40, w₂ = −0,20, b = −0,10 e η = 0,20.';
  trainingProcess.before(processIntroduction);

  trainingProcess.querySelectorAll(':scope > div').forEach((card, index) => {
    const step = trainingSteps[index];
    if (!step) return;
    card.replaceChildren();

    const title = document.createElement('b');
    const explanation = document.createElement('p');
    const calculation = document.createElement('div');
    title.textContent = step.title;
    explanation.textContent = step.explanation;
    calculation.className = 'training-step-calculation';
    step.lines.forEach(line => {
      const expression = document.createElement('span');
      expression.textContent = line;
      calculation.appendChild(expression);
    });
    card.append(title, explanation, calculation);
  });

  const methodNote = document.createElement('aside');
  methodNote.className = 'note training-method-note';
  methodNote.innerHTML = '<b>O passo 3 é backpropagation?</b> No Perceptron clássico, não. Ele é a <b>Regra de Aprendizagem do Perceptron</b>: o erro da saída corrige diretamente pesos e bias. Em uma MLP, o ajuste inclui <b>backpropagation</b>, que usa derivadas e a regra da cadeia para levar o erro da saída até as camadas ocultas.';
  trainingProcess.after(methodNote);
}

// A matemática deve ser estudada antes dos experimentos interativos.
// Evita repetir, nesta parte teórica, o passo a passo completo que já aparece
// no experimento matemático logo abaixo.
const perceptronTraining = document.querySelector('#treinamento');
if (perceptronTraining) {
  perceptronTraining.querySelector('.eyebrow').textContent = '02 · REGRA DO PERCEPTRON';
  perceptronTraining.querySelector('h2').textContent = 'Correção direta em um único neurônio';
  perceptronTraining.querySelector('h2 + p').innerHTML = 'O Perceptron clássico não possui camada oculta. Por isso, o erro <span class="mono">y − ŷ</span> corrige diretamente os pesos ligados às entradas e o bias. Essa atualização é a <b>Regra de Aprendizagem do Perceptron</b> — não é backpropagation.';

  const repeatedProcess = perceptronTraining.querySelector('.process');
  const repeatedIntroduction = perceptronTraining.querySelector('.training-process-intro');
  const repeatedNote = perceptronTraining.querySelector('.training-method-note');
  if (repeatedIntroduction) repeatedIntroduction.remove();
  if (repeatedNote) repeatedNote.remove();

  // ADALINE possui capítulo próprio e não deve interromper esta explicação.
  const trainingHeadings = perceptronTraining.querySelectorAll(':scope > h3');
  for (let index = 0; index < trainingHeadings.length; index += 1) {
    const heading = trainingHeadings[index];
    if (heading.textContent.trim() === 'ADALINE e Regra Delta') {
      const description = heading.nextElementSibling;
      if (description && description.tagName === 'P') description.remove();
      heading.remove();
      break;
    }
  }

  // Ordem didática: conceito do erro e bias primeiro; os quatro passos depois.
  const errorExplanation = perceptronTraining.querySelector('.error-explanation');
  const biasExplanation = document.querySelector('#bias');
  if (errorExplanation && repeatedProcess) {
    if (biasExplanation) {
      errorExplanation.after(biasExplanation);
      biasExplanation.after(repeatedProcess);
    } else {
      errorExplanation.after(repeatedProcess);
    }

    const completeCalculation = document.createElement('section');
    completeCalculation.className = 'training-total-explanation';
    completeCalculation.innerHTML = `
      <header>
        <p class="eyebrow">JUNTANDO TODA A MATEMÁTICA</p>
        <h3>Da somatória à nova previsão</h3>
        <p>Vamos reunir os quatro passos usando <span class="mono">x₁ = 1</span>, <span class="mono">x₂ = 0</span>, <span class="mono">y = 0</span>, <span class="mono">w₁ = 0,40</span>, <span class="mono">w₂ = −0,20</span>, <span class="mono">b = −0,10</span> e <span class="mono">η = 0,20</span>.</p>
      </header>
      <div class="training-total-grid">
        <article>
          <b>1 · Somatória ponderada</b>
          <p>O símbolo Σ manda somar todas as multiplicações entre entrada e peso.</p>
          <div class="math-expression">
            <small>Forma geral</small><strong>u = Σᵢ(wᵢxᵢ) + b</strong>
            <small>Abrindo a somatória</small><strong>u = (w₁x₁) + (w₂x₂) + b</strong>
            <small>Com números</small><strong>u = (0,40 × 1) + (−0,20 × 0) − 0,10<br>u = 0,40 + 0 − 0,10 = 0,30</strong>
          </div>
        </article>
        <article>
          <b>2 · Erro e correção dos pesos</b>
          <p>Primeiro calculamos o erro. Depois ele é multiplicado pela taxa η e pela entrada ligada a cada peso.</p>
          <div class="math-expression">
            <small>Erro</small><strong>e = y − ŷ = 0 − 1 = −1</strong>
            <small>Peso w₁</small><strong>Δw₁ = η × e × x₁<br>Δw₁ = 0,20 × (−1) × 1 = −0,20</strong>
            <small>Peso w₂</small><strong>Δw₂ = η × e × x₂<br>Δw₂ = 0,20 × (−1) × 0 = 0</strong>
          </div>
        </article>
        <article>
          <b>3 · Ajuste do bias</b>
          <p>O bias equivale a um peso ligado a uma entrada fixa igual a 1. Por isso sua correção não precisa escrever x.</p>
          <div class="math-expression">
            <small>Correção</small><strong>Δb = η × e × 1<br>Δb = 0,20 × (−1) × 1 = −0,20</strong>
            <small>Novo bias</small><strong>b<sub>novo</sub> = b<sub>atual</sub> + Δb<br>b<sub>novo</sub> = −0,10 + (−0,20) = −0,30</strong>
          </div>
        </article>
        <article>
          <b>4 · Parâmetros novos e conferência</b>
          <p>Somamos cada correção ao valor anterior e repetimos o forward com os novos parâmetros.</p>
          <div class="math-expression">
            <small>Atualização completa</small><strong>w₁ = 0,40 + (−0,20) = 0,20<br>w₂ = −0,20 + 0 = −0,20<br>b = −0,10 + (−0,20) = −0,30</strong>
            <small>Nova somatória</small><strong>u<sub>novo</sub> = (0,20 × 1) + (−0,20 × 0) − 0,30<br>u<sub>novo</sub> = −0,10 → ŷ = 0</strong>
          </div>
        </article>
      </div>
      <aside class="note"><b>Resultado:</b> antes da correção, o modelo respondeu <span class="mono">ŷ = 1</span> quando o alvo era <span class="mono">y = 0</span>. Depois de aplicar todas as multiplicações e atualizar pesos e bias, a mesma entrada passou a produzir <span class="mono">ŷ = 0</span>.</aside>
    `;
    repeatedProcess.after(completeCalculation);
  }
}

const mathematicalJourney = document.querySelector('.math-learning-journey');
const firstExperiment = document.querySelector('#explorar');
if (mathematicalJourney && firstExperiment) {
  firstExperiment.before(mathematicalJourney);
}
