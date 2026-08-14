(function () {
  'use strict';

  var page = document.querySelector('[data-evaluation-focus]');
  if (!page) return;

  var focus = page.getAttribute('data-evaluation-focus');
  var labHost = document.querySelector('[data-evaluation-lab]');

  // O mesmo laboratório é montado nas cinco páginas para facilitar manutenção.
  labHost.innerHTML = '<div class="eval-presets">' +
    '<button type="button" data-eval-preset="42,43,8,7">Exemplo equilibrado</button>' +
    '<button type="button" data-eval-preset="0,95,0,5">Classe rara · só negativos</button>' +
    '<button type="button" data-eval-preset="20,70,2,8">Modelo conservador</button>' +
    '<button type="button" data-eval-preset="27,60,13,0">Modelo sensível</button></div>' +
    '<div class="eval-lab-layout"><aside class="eval-controls"><h3>Resultados do classificador</h3><p>Arraste os controles. Os quatro valores representam quantidades de exemplos.</p>' +
    controlHtml('tp', 'VP · verdadeiro positivo', 42) + controlHtml('tn', 'VN · verdadeiro negativo', 43) +
    controlHtml('fp', 'FP · falso positivo', 8) + controlHtml('fn', 'FN · falso negativo', 7) +
    '</aside><article class="eval-output"><h3>Matriz atual</h3><p>Total avaliado: <b data-eval-total>0</b> exemplos.</p>' +
    '<div class="confusion-wrap"><div class="confusion-corner">REAL ↓<br>PREVISTO →</div><div class="predicted-label">Positivo &nbsp;&nbsp;|&nbsp;&nbsp; Negativo</div><div class="actual-label">Classe real</div>' +
    '<div class="confusion-matrix"><div class="confusion-cell good"><span>VP</span><b data-confusion-cell="tp">0</b><small>real + · previsto +</small></div>' +
    '<div class="confusion-cell bad"><span>FN</span><b data-confusion-cell="fn">0</b><small>real + · previsto −</small></div>' +
    '<div class="confusion-cell bad"><span>FP</span><b data-confusion-cell="fp">0</b><small>real − · previsto +</small></div>' +
    '<div class="confusion-cell good"><span>VN</span><b data-confusion-cell="tn">0</b><small>real − · previsto −</small></div></div></div></article></div>' +
    '<div class="eval-metrics">' + metricHtml('accuracy', 'Acurácia') + metricHtml('precision', 'Precisão') + metricHtml('recall', 'Recall') + metricHtml('f1', 'F1-score') + '</div>' +
    '<div class="eval-calculation" data-eval-calculation></div><div class="eval-interpretation" data-eval-interpretation></div>';

  var sliders = document.querySelectorAll('[data-confusion-input]');
  var presetButtons = document.querySelectorAll('[data-eval-preset]');

  function controlHtml(name, label, value) {
    return '<div class="eval-control"><label>' + label + '<output data-confusion-value="' + name + '">' + value + '</output></label>' +
      '<input type="range" min="0" max="100" value="' + value + '" data-confusion-input="' + name + '"></div>';
  }

  function metricHtml(name, label) {
    return '<article class="eval-metric" data-eval-metric="' + name + '"><b>' + label + '</b><strong>—</strong><span><i></i></span></article>';
  }

  function numberFrom(name) {
    return Number(document.querySelector('[data-confusion-input="' + name + '"]').value);
  }

  function divide(numerator, denominator) {
    if (denominator === 0) return null;
    return numerator / denominator;
  }

  function percent(value) {
    if (value === null) return 'indefinida';
    return (value * 100).toFixed(1).replace('.', ',') + '%';
  }

  function decimal(value) {
    if (value === null) return '—';
    return value.toFixed(3).replace('.', ',');
  }

  function updateValue(name, value) {
    var output = document.querySelector('[data-confusion-value="' + name + '"]');
    var cell = document.querySelector('[data-confusion-cell="' + name + '"]');
    output.textContent = value;
    cell.textContent = value;
  }

  function updateMetric(name, value) {
    var card = document.querySelector('[data-eval-metric="' + name + '"]');
    card.querySelector('strong').textContent = percent(value);
    card.querySelector('i').style.width = value === null ? '0%' : (value * 100) + '%';
  }

  function calculationText(tp, tn, fp, fn, accuracy, precision, recall, f1) {
    if (focus === 'accuracy') {
      return 'Acurácia = (VP + VN) ÷ Total\n= (' + tp + ' + ' + tn + ') ÷ ' + (tp + tn + fp + fn) + '\n= <strong>' + percent(accuracy) + '</strong>';
    }
    if (focus === 'precision') {
      return 'Precisão = VP ÷ (VP + FP)\n= ' + tp + ' ÷ (' + tp + ' + ' + fp + ')\n= <strong>' + percent(precision) + '</strong>';
    }
    if (focus === 'recall') {
      return 'Recall = VP ÷ (VP + FN)\n= ' + tp + ' ÷ (' + tp + ' + ' + fn + ')\n= <strong>' + percent(recall) + '</strong>';
    }
    if (focus === 'f1') {
      return 'F1 = 2 × Precisão × Recall ÷ (Precisão + Recall)\n= 2 × ' + decimal(precision) + ' × ' + decimal(recall) + ' ÷ (' + decimal(precision) + ' + ' + decimal(recall) + ')\n= <strong>' + percent(f1) + '</strong>';
    }
    return 'Total = VP + VN + FP + FN\n= ' + tp + ' + ' + tn + ' + ' + fp + ' + ' + fn + '\n= <strong>' + (tp + tn + fp + fn) + ' exemplos</strong>';
  }

  function interpretationText(accuracy, precision, recall, f1, total) {
    if (total === 0) return 'Adicione pelo menos um exemplo para calcular as métricas.';
    if (focus === 'accuracy') return 'O modelo acertou ' + percent(accuracy) + ' de todos os exemplos. Confira as outras métricas antes de concluir que ele é bom.';
    if (focus === 'precision') return precision === null ? 'O modelo não previu nenhum positivo; por isso VP + FP é zero.' : 'Entre todas as previsões positivas, ' + percent(precision) + ' estavam corretas.';
    if (focus === 'recall') return recall === null ? 'Não existem positivos reais neste conjunto; por isso VP + FN é zero.' : 'Entre todos os positivos reais, o modelo encontrou ' + percent(recall) + '.';
    if (focus === 'f1') return f1 === null ? 'F1 não pode ser calculado porque Precisão e Recall não possuem denominador válido.' : 'O equilíbrio harmônico entre Precisão e Recall resultou em ' + percent(f1) + '.';
    return 'A matriz contém os quatro resultados básicos. Todas as métricas desta sequência são calculadas a partir deles.';
  }

  function update() {
    var tp = numberFrom('tp');
    var tn = numberFrom('tn');
    var fp = numberFrom('fp');
    var fn = numberFrom('fn');
    var total = tp + tn + fp + fn;
    var accuracy = divide(tp + tn, total);
    var precision = divide(tp, tp + fp);
    var recall = divide(tp, tp + fn);
    var f1 = precision === null || recall === null ? null : divide(2 * precision * recall, precision + recall);

    updateValue('tp', tp);
    updateValue('tn', tn);
    updateValue('fp', fp);
    updateValue('fn', fn);
    updateMetric('accuracy', accuracy);
    updateMetric('precision', precision);
    updateMetric('recall', recall);
    updateMetric('f1', f1);
    document.querySelector('[data-eval-total]').textContent = total;
    document.querySelector('[data-eval-calculation]').innerHTML = calculationText(tp, tn, fp, fn, accuracy, precision, recall, f1).replace(/\n/g, '<br>');
    document.querySelector('[data-eval-interpretation]').textContent = interpretationText(accuracy, precision, recall, f1, total);
  }

  function applyPreset(valuesText) {
    var values = valuesText.split(',');
    var names = ['tp', 'tn', 'fp', 'fn'];
    for (var i = 0; i < names.length; i++) {
      document.querySelector('[data-confusion-input="' + names[i] + '"]').value = values[i];
    }
    update();
  }

  for (var i = 0; i < sliders.length; i++) sliders[i].addEventListener('input', update);
  for (var j = 0; j < presetButtons.length; j++) {
    presetButtons[j].addEventListener('click', function () {
      applyPreset(this.getAttribute('data-eval-preset'));
    });
  }

  var focusCard = document.querySelector('[data-eval-metric="' + focus + '"]');
  if (focusCard) focusCard.classList.add('focus');
  update();
}());
