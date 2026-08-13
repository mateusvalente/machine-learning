(function () {
  'use strict';

  /* ================================================================
     1. DADOS E PARÂMETROS DA REDE
     Cada linha de dados contém [entrada x, saída desejada y].
     ================================================================ */
  var dados = [];
  var centros = [-3, -2, -1, 0, 1, 2, 3];
  var pesos = [0, 0, 0, 0, 0, 0, 0];
  var bias = 0;
  var gamma = 1.10;
  var taxa = 0.08;
  var epoca = 0;
  var historico = [];
  var mseInicial = 1;
  var ultimoPasso = null;
  var pontoTeste = null;

  for (var x = -3; x <= 3.001; x = x + 0.5) {
    var y = 1.4 * Math.sin(1.25 * x) + 0.25 * x;
    dados[dados.length] = [x, y];
  }

  var curva = document.getElementById('rbfRegressionCurve');
  var bases = document.getElementById('rbfRegressionBases');
  var graficoHistorico = document.getElementById('rbfRegressionHistory');
  if (!curva || !bases || !graficoHistorico) return;

  var coresBases = ['#4f46e5', '#0891b2', '#059669', '#65a30d', '#ea580c', '#dc2626', '#9333ea'];

  /* ================================================================
     2. FUNÇÃO DE ATIVAÇÃO GAUSSIANA
     A resposta vale 1 no centro e cai conforme a distância aumenta.
     ================================================================ */
  function gaussiana(valor, centro) {
    var distancia = valor - centro;
    return Math.exp(-gamma * distancia * distancia);
  }

  /* ================================================================
     3. FORWARD: DA ENTRADA ATÉ A PREVISÃO
     A camada oculta produz sete ativações. A saída soma cada ativação
     multiplicada pelo peso correspondente e acrescenta o bias.
     ================================================================ */
  function forward(valor) {
    var ativacoes = [];
    var previsao = bias;
    var j;

    for (j = 0; j < centros.length; j++) {
      ativacoes[j] = gaussiana(valor, centros[j]);
      previsao = previsao + pesos[j] * ativacoes[j];
    }

    return [previsao, ativacoes];
  }

  /* ================================================================
     4. REGRA DELTA DA CAMADA DE SAÍDA
     e = y - ŷ
     Δw_j = η · e · φ_j(x)
     Δb = η · e
     ================================================================ */
  function treinarAmostra(amostra) {
    var entrada = amostra[0];
    var alvo = amostra[1];
    var resultado = forward(entrada);
    var previsao = resultado[0];
    var ativacoes = resultado[1];
    var erro = alvo - previsao;
    var pesosAntes = [];
    var novosPesos = [];
    var correcoes = [];
    var biasAntes = bias;
    var j;

    for (j = 0; j < pesos.length; j++) {
      pesosAntes[j] = pesos[j];
      correcoes[j] = taxa * erro * ativacoes[j];
      pesos[j] = pesos[j] + correcoes[j];
      novosPesos[j] = pesos[j];
    }
    bias = bias + taxa * erro;

    ultimoPasso = {
      entrada: entrada,
      alvo: alvo,
      previsao: previsao,
      erro: erro,
      ativacoes: ativacoes,
      pesosAntes: pesosAntes,
      correcoes: correcoes,
      novosPesos: novosPesos,
      biasAntes: biasAntes,
      novoBias: bias
    };
  }

  function treinarEpoca() {
    var i;
    for (i = 0; i < dados.length; i++) treinarAmostra(dados[i]);
    epoca = epoca + 1;
    registrarHistorico();
  }

  /* ================================================================
     5. MÉTRICAS DE REGRESSÃO
     MSE mede a média dos erros ao quadrado. R² compara a rede com a
     previsão ingênua que sempre usaria a média dos valores desejados.
     ================================================================ */
  function calcularMetricas() {
    var somaY = 0;
    var somaErroQuadratico = 0;
    var somaTotal = 0;
    var i;

    for (i = 0; i < dados.length; i++) somaY = somaY + dados[i][1];
    var mediaY = somaY / dados.length;

    for (i = 0; i < dados.length; i++) {
      var previsao = forward(dados[i][0])[0];
      var erro = dados[i][1] - previsao;
      var desvio = dados[i][1] - mediaY;
      somaErroQuadratico = somaErroQuadratico + erro * erro;
      somaTotal = somaTotal + desvio * desvio;
    }

    var mse = somaErroQuadratico / dados.length;
    var r2 = 1 - somaErroQuadratico / somaTotal;
    return [mse, Math.sqrt(mse), r2];
  }

  function registrarHistorico() {
    var metricas = calcularMetricas();
    var mseNormalizado = metricas[0] / mseInicial;
    if (mseNormalizado > 1) mseNormalizado = 1;
    if (mseNormalizado < 0) mseNormalizado = 0;
    var r2Grafico = metricas[2];
    if (r2Grafico > 1) r2Grafico = 1;
    if (r2Grafico < 0) r2Grafico = 0;
    historico[historico.length] = [epoca, mseNormalizado, r2Grafico];
  }

  /* ================================================================
     6. FUNÇÕES AUXILIARES DO CANVAS
     ================================================================ */
  function limpar(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function numero(valor, casas) {
    var pequeno = Math.abs(valor) < 0.0005 ? 0 : valor;
    return pequeno.toFixed(casas).replace('.', ',');
  }

  function converterX(valor, largura, margem) {
    return margem + ((valor + 3.5) / 7) * (largura - 2 * margem);
  }

  function converterY(valor, altura, margem) {
    return altura - margem - ((valor + 2.5) / 5) * (altura - 2 * margem);
  }

  function desenharEixos(ctx, canvas, minimoY, maximoY) {
    var margem = 64;
    var larguraUtil = canvas.width - 2 * margem;
    var alturaUtil = canvas.height - 2 * margem;
    var zeroX = converterX(0, canvas.width, margem);
    var zeroY = canvas.height - margem - ((0 - minimoY) / (maximoY - minimoY)) * alturaUtil;
    var valor;

    ctx.strokeStyle = '#d9e0ef';
    ctx.lineWidth = 1;
    ctx.font = '600 16px Inter, Arial';
    ctx.fillStyle = '#59647c';
    ctx.textAlign = 'center';

    for (valor = -3; valor <= 3; valor++) {
      var px = margem + ((valor + 3.5) / 7) * larguraUtil;
      ctx.beginPath(); ctx.moveTo(px, margem); ctx.lineTo(px, canvas.height - margem); ctx.stroke();
      ctx.fillText(String(valor), px, canvas.height - margem + 27);
    }

    ctx.textAlign = 'right';
    for (valor = Math.ceil(minimoY); valor <= Math.floor(maximoY); valor++) {
      var py = canvas.height - margem - ((valor - minimoY) / (maximoY - minimoY)) * alturaUtil;
      ctx.beginPath(); ctx.moveTo(margem, py); ctx.lineTo(canvas.width - margem, py); ctx.stroke();
      ctx.fillText(String(valor), margem - 13, py + 5);
    }

    ctx.strokeStyle = '#182033';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(margem, zeroY); ctx.lineTo(canvas.width - margem, zeroY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(zeroX, margem); ctx.lineTo(zeroX, canvas.height - margem); ctx.stroke();
    ctx.fillStyle = '#182033';
    ctx.textAlign = 'right'; ctx.fillText('x', canvas.width - margem, zeroY - 12);
    ctx.textAlign = 'left'; ctx.fillText('y', zeroX + 12, margem + 5);
  }

  /* ================================================================
     7. GRÁFICO DA CURVA APRENDIDA
     ================================================================ */
  function desenharCurva() {
    var ctx = curva.getContext('2d');
    var margem = 64;
    limpar(ctx, curva);
    desenharEixos(ctx, curva, -2.5, 2.5);

    /* Marcas dos centros no rodapé do gráfico. */
    var j;
    for (j = 0; j < centros.length; j++) {
      var centroX = converterX(centros[j], curva.width, margem);
      ctx.strokeStyle = coresBases[j];
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(centroX, curva.height - margem + 7); ctx.lineTo(centroX, curva.height - margem + 20); ctx.stroke();
    }

    /* Curva contínua produzida pela rede. */
    ctx.beginPath();
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 5;
    var primeiro = true;
    var valor;
    for (valor = -3.5; valor <= 3.501; valor = valor + 0.025) {
      var previsto = forward(valor)[0];
      var px = converterX(valor, curva.width, margem);
      var py = converterY(previsto, curva.height, margem);
      if (primeiro) { ctx.moveTo(px, py); primeiro = false; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    /* Pontos do conjunto de treinamento. */
    var i;
    for (i = 0; i < dados.length; i++) {
      var dx = converterX(dados[i][0], curva.width, margem);
      var dy = converterY(dados[i][1], curva.height, margem);
      ctx.beginPath(); ctx.arc(dx, dy, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = '#0f766e'; ctx.lineWidth = 4; ctx.stroke();
    }

    if (pontoTeste) {
      var tx = converterX(pontoTeste[0], curva.width, margem);
      var ty = converterY(pontoTeste[1], curva.height, margem);
      ctx.beginPath(); ctx.arc(tx, ty, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b'; ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#8a4b00'; ctx.font = '700 16px Inter, Arial'; ctx.textAlign = 'left';
      ctx.fillText('teste', tx + 15, ty - 10);
    }
  }

  /* ================================================================
     8. GRÁFICO DAS FUNÇÕES GAUSSIANAS
     ================================================================ */
  function desenharBases() {
    var ctx = bases.getContext('2d');
    var margem = 64;
    limpar(ctx, bases);

    ctx.strokeStyle = '#d9e0ef'; ctx.lineWidth = 1;
    ctx.fillStyle = '#59647c'; ctx.font = '600 16px Inter, Arial'; ctx.textAlign = 'center';
    var valor;
    for (valor = -3; valor <= 3; valor++) {
      var pxGrade = converterX(valor, bases.width, margem);
      ctx.beginPath(); ctx.moveTo(pxGrade, margem); ctx.lineTo(pxGrade, bases.height - margem); ctx.stroke();
      ctx.fillText(String(valor), pxGrade, bases.height - margem + 27);
    }
    ctx.textAlign = 'right';
    for (valor = 0; valor <= 1.001; valor = valor + 0.25) {
      var pyGrade = bases.height - margem - valor * (bases.height - 2 * margem);
      ctx.beginPath(); ctx.moveTo(margem, pyGrade); ctx.lineTo(bases.width - margem, pyGrade); ctx.stroke();
      ctx.fillText(numero(valor, 2), margem - 12, pyGrade + 5);
    }

    for (var j = 0; j < centros.length; j++) {
      ctx.beginPath(); ctx.strokeStyle = coresBases[j]; ctx.lineWidth = 4;
      var primeiro = true;
      for (valor = -3.5; valor <= 3.501; valor = valor + 0.025) {
        var ativacao = gaussiana(valor, centros[j]);
        var px = converterX(valor, bases.width, margem);
        var py = bases.height - margem - ativacao * (bases.height - 2 * margem);
        if (primeiro) { ctx.moveTo(px, py); primeiro = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.fillStyle = coresBases[j]; ctx.textAlign = 'center'; ctx.font = '700 15px Inter, Arial';
      ctx.fillText('c' + (j + 1), converterX(centros[j], bases.width, margem), margem - 15);
    }
  }

  /* ================================================================
     9. GRÁFICO ERRO × RESPOSTA
     O MSE é normalizado pelo erro inicial para caber na mesma escala.
     ================================================================ */
  function desenharHistorico() {
    var ctx = graficoHistorico.getContext('2d');
    var margemEsquerda = 66;
    var margemDireita = 30;
    var margemTopo = 28;
    var margemBase = 58;
    limpar(ctx, graficoHistorico);

    ctx.font = '600 15px Inter, Arial';
    ctx.strokeStyle = '#d9e0ef'; ctx.fillStyle = '#59647c'; ctx.lineWidth = 1; ctx.textAlign = 'right';
    for (var n = 0; n <= 4; n++) {
      var nivel = n / 4;
      var py = graficoHistorico.height - margemBase - nivel * (graficoHistorico.height - margemTopo - margemBase);
      ctx.beginPath(); ctx.moveTo(margemEsquerda, py); ctx.lineTo(graficoHistorico.width - margemDireita, py); ctx.stroke();
      ctx.fillText(numero(nivel, 2), margemEsquerda - 12, py + 5);
    }

    if (historico.length < 2) {
      ctx.fillStyle = '#6b7280'; ctx.font = '600 18px Inter, Arial'; ctx.textAlign = 'center';
      ctx.fillText('Treine a rede para acompanhar a evolução.', graficoHistorico.width / 2, graficoHistorico.height / 2);
      return;
    }

    var maxEpoca = historico[historico.length - 1][0];
    if (maxEpoca < 1) maxEpoca = 1;
    ctx.textAlign = 'center'; ctx.fillStyle = '#59647c';
    for (n = 0; n <= 5; n++) {
      var epocaMarca = Math.round(maxEpoca * n / 5);
      var marcaX = margemEsquerda + n / 5 * (graficoHistorico.width - margemEsquerda - margemDireita);
      ctx.fillText(String(epocaMarca), marcaX, graficoHistorico.height - 25);
    }
    ctx.fillText('época', graficoHistorico.width / 2, graficoHistorico.height - 5);

    function linha(indice, cor) {
      ctx.beginPath(); ctx.strokeStyle = cor; ctx.lineWidth = 4;
      for (var i = 0; i < historico.length; i++) {
        var px = margemEsquerda + historico[i][0] / maxEpoca * (graficoHistorico.width - margemEsquerda - margemDireita);
        var py = graficoHistorico.height - margemBase - historico[i][indice] * (graficoHistorico.height - margemTopo - margemBase);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    linha(1, '#ef4444');
    linha(2, '#10b981');
  }

  /* ================================================================
     10. CONTAS DO ÚLTIMO AJUSTE
     ================================================================ */
  function mostrarMatematica() {
    var caixa = document.getElementById('rbfRegressionMath');
    if (!ultimoPasso) {
      caixa.innerHTML = '<p>Treine uma época para abrir as contas.</p>';
      return;
    }

    var p = ultimoPasso;
    var termosAtivacao = '';
    var termosSoma = '';
    var ajustes = '';
    var j;

    for (j = 0; j < centros.length; j++) {
      var distancia = p.entrada - centros[j];
      termosAtivacao = termosAtivacao + '<span>φ<sub>' + (j + 1) + '</sub> = e<sup>−1,10(' + numero(p.entrada, 2) + '−(' + numero(centros[j], 0) + '))²</sup> = <strong>' + numero(p.ativacoes[j], 4) + '</strong></span>';
      termosSoma = termosSoma + (j > 0 ? ' + ' : '') + '(' + numero(p.pesosAntes[j], 4) + ' × ' + numero(p.ativacoes[j], 4) + ')';
      ajustes = ajustes + '<span>Δw<sub>' + (j + 1) + '</sub> = ' + numero(taxa, 2) + ' × (' + numero(p.erro, 4) + ') × ' + numero(p.ativacoes[j], 4) + ' = <strong>' + numero(p.correcoes[j], 4) + '</strong><br>w<sub>' + (j + 1) + '</sub> novo = ' + numero(p.pesosAntes[j], 4) + ' + (' + numero(p.correcoes[j], 4) + ') = <strong>' + numero(p.novosPesos[j], 4) + '</strong></span>';
    }

    caixa.innerHTML =
      '<article><b>1 · Amostra e alvo</b><div class="rbf-math-equation">x = ' + numero(p.entrada, 2) + '<br>y = ' + numero(p.alvo, 4) + '</div><p>y é o valor correto que a rede deve aproximar.</p></article>' +
      '<article><b>2 · Distâncias e Gaussianas</b><div class="rbf-math-list">' + termosAtivacao + '</div><p>Cada φ mede a proximidade entre x e um centro.</p></article>' +
      '<article><b>3 · Saída contínua</b><div class="rbf-math-equation">ŷ = b + Σw<sub>j</sub>φ<sub>j</sub>(x)<br>ŷ = ' + numero(p.biasAntes, 4) + ' + ' + termosSoma + '<br><strong>ŷ = ' + numero(p.previsao, 4) + '</strong></div></article>' +
      '<article><b>4 · Erro e custo</b><div class="rbf-math-equation">e = y − ŷ = ' + numero(p.alvo, 4) + ' − (' + numero(p.previsao, 4) + ') = <strong>' + numero(p.erro, 4) + '</strong><br>E = ½e² = ½(' + numero(p.erro, 4) + ')² = <strong>' + numero(0.5 * p.erro * p.erro, 5) + '</strong></div><p>O quadrado impede que erros positivos e negativos se cancelem.</p></article>' +
      '<article class="wide"><b>5 · Ajuste de todos os pesos</b><div class="rbf-math-list two-columns">' + ajustes + '</div></article>' +
      '<article><b>6 · Ajuste do bias</b><div class="rbf-math-equation">Δb = ηe = ' + numero(taxa, 2) + ' × (' + numero(p.erro, 4) + ') = ' + numero(taxa * p.erro, 4) + '<br>b novo = ' + numero(p.biasAntes, 4) + ' + (' + numero(taxa * p.erro, 4) + ') = <strong>' + numero(p.novoBias, 4) + '</strong></div></article>';
  }

  function preencherTabela() {
    var tabela = document.getElementById('rbfRegressionTable');
    var html = '<thead><tr><th>x</th><th>Alvo y</th><th>Previsão ŷ</th><th>Erro y − ŷ</th><th>½e²</th></tr></thead><tbody>';
    for (var i = 0; i < dados.length; i++) {
      var previsao = forward(dados[i][0])[0];
      var erro = dados[i][1] - previsao;
      html = html + '<tr><td>' + numero(dados[i][0], 2) + '</td><td>' + numero(dados[i][1], 4) + '</td><td>' + numero(previsao, 4) + '</td><td>' + numero(erro, 4) + '</td><td>' + numero(0.5 * erro * erro, 5) + '</td></tr>';
    }
    tabela.innerHTML = html + '</tbody>';
  }

  function atualizarTela() {
    var metricas = calcularMetricas();
    document.getElementById('rbfRegressionEpoch').textContent = String(epoca);
    document.getElementById('rbfRegressionMse').textContent = numero(metricas[0], 5);
    document.getElementById('rbfRegressionRmse').textContent = numero(metricas[1], 5);
    document.getElementById('rbfRegressionR2').textContent = numero(metricas[2], 4);

    var status = document.getElementById('rbfRegressionStatus');
    if (epoca === 0) status.textContent = 'Saída não treinada';
    else if (metricas[2] >= 0.95) status.textContent = 'Boa aproximação';
    else status.textContent = 'Curva em ajuste';

    desenharCurva();
    desenharBases();
    desenharHistorico();
    mostrarMatematica();
    preencherTabela();
  }

  function reiniciar() {
    for (var j = 0; j < pesos.length; j++) pesos[j] = 0;
    bias = 0;
    epoca = 0;
    historico = [];
    ultimoPasso = null;
    pontoTeste = null;
    mseInicial = calcularMetricas()[0];
    registrarHistorico();
    document.getElementById('rbfRegressionTestResult').textContent = 'A rede combinará as sete Gaussianas.';
    atualizarTela();
  }

  document.getElementById('rbfRegressionTrainOne').addEventListener('click', function () {
    treinarEpoca();
    atualizarTela();
  });

  document.getElementById('rbfRegressionTrainHundred').addEventListener('click', function () {
    for (var i = 0; i < 100; i++) treinarEpoca();
    atualizarTela();
  });

  document.getElementById('rbfRegressionReset').addEventListener('click', reiniciar);

  document.getElementById('rbfRegressionTest').addEventListener('click', function () {
    var entrada = Number(document.getElementById('rbfRegressionTestX').value);
    if (!Number.isFinite(entrada)) entrada = 0;
    if (entrada < -3.5) entrada = -3.5;
    if (entrada > 3.5) entrada = 3.5;
    var previsao = forward(entrada)[0];
    pontoTeste = [entrada, previsao];
    document.getElementById('rbfRegressionTestResult').innerHTML = 'Para x = <strong>' + numero(entrada, 2) + '</strong>, a rede estima <strong>ŷ = ' + numero(previsao, 4) + '</strong>.';
    desenharCurva();
  });

  reiniciar();
}());
