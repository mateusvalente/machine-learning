(function () {
  'use strict';

  var cards = Array.prototype.slice.call(document.querySelectorAll('#patternRequests .request-card'));
  var check = document.getElementById('checkPatterns');
  var reset = document.getElementById('resetPatterns');
  var feedback = document.getElementById('patternFeedback');

  if (!cards.length || !check || !reset || !feedback) return;

  function calculate() {
    var correct = 0;
    var falsePositive = 0;
    var falseNegative = 0;

    cards.forEach(function (card) {
      var predicted = card.querySelector('input').checked;
      var actual = card.dataset.suspicious === 'true';
      card.style.borderColor = predicted === actual ? '#8fe4d3' : '#ff9d79';
      if (predicted === actual) correct += 1;
      if (predicted && !actual) falsePositive += 1;
      if (!predicted && actual) falseNegative += 1;
    });

    feedback.className = 'pattern-feedback ' + (correct === cards.length ? 'good' : 'warn');
    feedback.textContent = correct + '/' + cards.length + ' classificações corretas · falsos positivos: ' + falsePositive + ' · falsos negativos: ' + falseNegative + '.';
  }

  check.addEventListener('click', calculate);
  reset.addEventListener('click', function () {
    cards.forEach(function (card) {
      card.querySelector('input').checked = false;
      card.style.borderColor = 'transparent';
    });
    feedback.className = 'pattern-feedback';
    feedback.textContent = '';
  });
}());
