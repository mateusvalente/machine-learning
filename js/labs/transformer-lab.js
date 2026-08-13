(function () {
  'use strict';

  /* ================================================================
     MINI TRANSFORMER DIDÁTICO
     - Tokens por palavras.
     - Embeddings com 3 dimensões.
     - Uma cabeça causal com WQ = WK = WV = identidade.
     - Somente a camada de saída é treinada.
     ================================================================ */
  var dimensao = 3;
  var taxa = 0.12;
  var vocabulario = [];
  var embeddings = [];
  var pares = [];
  var pesosSaida = [];
  var biasSaida = [];
  var epoca = 0;
  var historico = [];
  var lossInicial = 1;
  var parSelecionado = 0;
  var ultimoPasso = null;

  var corpusInput = document.getElementById('transformerCorpus');
  var canvasHistorico = document.getElementById('transformerHistory');
  if (!corpusInput || !canvasHistorico) return;

  function formatar(valor, casas) {
    var seguro = Math.abs(valor) < 0.0000001 ? 0 : valor;
    return seguro.toFixed(casas).replace('.', ',');
  }

  function normalizarTexto(texto) {
    return texto.toLowerCase().replace(/[^a-záàâãéêíóôõúüç\n ]/g, ' ').replace(/ +/g, ' ').trim();
  }

  function tokenizar(linha) {
    var limpa = normalizarTexto(linha);
    if (!limpa) return [];
    return limpa.split(' ');
  }

  function indiceToken(token) {
    for (var i = 0; i < vocabulario.length; i++) {
      if (vocabulario[i] === token) return i;
    }
    return -1;
  }

  /* Gera números determinísticos: o mesmo token sempre recebe o mesmo vetor. */
  function criarEmbedding(token) {
    var semente = 17;
    for (var i = 0; i < token.length; i++) semente = (semente * 31 + token.charCodeAt(i)) % 9973;
    var vetor = [];
    for (var d = 0; d < dimensao; d++) {
      semente = (semente * 73 + 41) % 9973;
      vetor[d] = (semente / 9973) * 1.6 - 0.8;
    }
    return vetor;
  }

  function vetorPosicao(posicao) {
    return [0.16 * Math.sin(posicao + 1), 0.16 * Math.cos(posicao + 1), 0.16 * Math.sin((posicao + 1) / 2)];
  }

  function representar(token, posicao) {
    var id = indiceToken(token);
    if (id < 0) id = 0;
    var posicaoVetor = vetorPosicao(posicao);
    var resultado = [];
    for (var d = 0; d < dimensao; d++) resultado[d] = embeddings[id][d] + posicaoVetor[d];
    return resultado;
  }

  function produtoEscalar(a, b) {
    var soma = 0;
    for (var i = 0; i < a.length; i++) soma = soma + a[i] * b[i];
    return soma;
  }

  function softmax(valores) {
    var maior = valores[0];
    var i;
    for (i = 1; i < valores.length; i++) if (valores[i] > maior) maior = valores[i];
    var resultado = [];
    var soma = 0;
    for (i = 0; i < valores.length; i++) {
      resultado[i] = Math.exp(valores[i] - maior);
      soma = soma + resultado[i];
    }
    for (i = 0; i < resultado.length; i++) resultado[i] = resultado[i] / soma;
    return resultado;
  }

  /* Calcula todas as linhas da matriz causal de atenção. */
  function calcularAtencao(tokens) {
    var vetores = [];
    var matriz = [];
    var contextos = [];
    var i;
    var j;
    var d;

    for (i = 0; i < tokens.length; i++) vetores[i] = representar(tokens[i], i);

    for (i = 0; i < tokens.length; i++) {
      var escores = [];
      for (j = 0; j <= i; j++) escores[j] = produtoEscalar(vetores[i], vetores[j]) / Math.sqrt(dimensao);
      var pesos = softmax(escores);
      matriz[i] = [];
      for (j = 0; j < tokens.length; j++) matriz[i][j] = j <= i ? pesos[j] : 0;

      var contexto = [0, 0, 0];
      for (j = 0; j <= i; j++) {
        for (d = 0; d < dimensao; d++) contexto[d] = contexto[d] + pesos[j] * vetores[j][d];
      }
      contextos[i] = contexto;
    }

    return [vetores, matriz, contextos];
  }

  function forward(tokens) {
    var atencao = calcularAtencao(tokens);
    var contexto = atencao[2][atencao[2].length - 1];
    var logits = [];
    var k;
    var d;

    for (k = 0; k < vocabulario.length; k++) {
      logits[k] = biasSaida[k];
      for (d = 0; d < dimensao; d++) logits[k] = logits[k] + pesosSaida[k][d] * contexto[d];
    }

    return [softmax(logits), logits, contexto, atencao];
  }

  function copiarVetor(vetor) {
    var copia = [];
    for (var i = 0; i < vetor.length; i++) copia[i] = vetor[i];
    return copia;
  }

  function treinarPar(par, indice) {
    var resultado = forward(par[0]);
    var probabilidades = resultado[0];
    var contexto = resultado[2];
    var alvo = par[1];
    var gradientesLogit = [];
    var pesoAlvoAntes = copiarVetor(pesosSaida[alvo]);
    var biasAlvoAntes = biasSaida[alvo];
    var k;
    var d;

    for (k = 0; k < vocabulario.length; k++) {
      gradientesLogit[k] = probabilidades[k];
      if (k === alvo) gradientesLogit[k] = gradientesLogit[k] - 1;
    }

    for (k = 0; k < vocabulario.length; k++) {
      for (d = 0; d < dimensao; d++) {
        pesosSaida[k][d] = pesosSaida[k][d] - taxa * gradientesLogit[k] * contexto[d];
      }
      biasSaida[k] = biasSaida[k] - taxa * gradientesLogit[k];
    }

    ultimoPasso = [indice, resultado, gradientesLogit, pesoAlvoAntes, biasAlvoAntes, copiarVetor(pesosSaida[alvo]), biasSaida[alvo]];
  }

  function treinarEpoca() {
    for (var i = 0; i < pares.length; i++) treinarPar(pares[i], i);
    epoca = epoca + 1;
    parSelecionado = pares.length - 1;
    registrarHistorico();
  }

  function maiorIndice(valores, ignorarInicio) {
    var melhor = ignorarInicio ? 1 : 0;
    for (var i = melhor + 1; i < valores.length; i++) if (valores[i] > valores[melhor]) melhor = i;
    return melhor;
  }

  function calcularMetricas() {
    var loss = 0;
    var acertos = 0;
    for (var i = 0; i < pares.length; i++) {
      var probabilidades = forward(pares[i][0])[0];
      loss = loss - Math.log(Math.max(0.0000001, probabilidades[pares[i][1]]));
      if (maiorIndice(probabilidades, true) === pares[i][1]) acertos = acertos + 1;
    }
    return [loss / pares.length, acertos / pares.length];
  }

  function registrarHistorico() {
    var metricas = calcularMetricas();
    var lossNormalizada = metricas[0] / lossInicial;
    if (lossNormalizada > 1) lossNormalizada = 1;
    historico[historico.length] = [epoca, lossNormalizada, metricas[1]];
  }

  function inicializarPesos() {
    pesosSaida = [];
    biasSaida = [];
    for (var k = 0; k < vocabulario.length; k++) {
      pesosSaida[k] = [];
      for (var d = 0; d < dimensao; d++) pesosSaida[k][d] = (((k + 3) * (d + 5)) % 11 - 5) * 0.012;
      biasSaida[k] = 0;
    }
    epoca = 0;
    historico = [];
    ultimoPasso = null;
    lossInicial = calcularMetricas()[0];
    registrarHistorico();
  }

  function prepararCorpus() {
    var linhas = corpusInput.value.split(/\n/);
    vocabulario = ['<início>'];
    embeddings = [];
    pares = [];

    for (var l = 0; l < linhas.length; l++) {
      var tokensLinha = tokenizar(linhas[l]);
      for (var t = 0; t < tokensLinha.length; t++) {
        if (indiceToken(tokensLinha[t]) < 0) vocabulario[vocabulario.length] = tokensLinha[t];
      }
    }

    for (var v = 0; v < vocabulario.length; v++) embeddings[v] = criarEmbedding(vocabulario[v]);

    for (l = 0; l < linhas.length; l++) {
      tokensLinha = tokenizar(linhas[l]);
      if (tokensLinha.length === 0) continue;
      var sequencia = ['<início>'];
      for (t = 0; t < tokensLinha.length; t++) sequencia[sequencia.length] = tokensLinha[t];
      for (t = 1; t < sequencia.length; t++) {
        var prefixo = [];
        for (var p = 0; p < t; p++) prefixo[p] = sequencia[p];
        pares[pares.length] = [prefixo, indiceToken(sequencia[t])];
      }
    }

    if (pares.length === 0) {
      corpusInput.value = 'eu gosto de aprender';
      prepararCorpus();
      return;
    }

    parSelecionado = 0;
    inicializarPesos();
    renderizarTudo();
  }

  function renderizarPares() {
    var html = '<thead><tr><th>#</th><th>Prefixo de entrada</th><th>Alvo y</th><th>Previsão ŷ</th></tr></thead><tbody>';
    for (var i = 0; i < pares.length; i++) {
      var probs = forward(pares[i][0])[0];
      var previsto = maiorIndice(probs, true);
      html = html + '<tr data-par="' + i + '"' + (i === parSelecionado ? ' style="background:#efedff"' : '') + '><td>' + (i + 1) + '</td><td>' + pares[i][0].join(' ') + '</td><td>' + vocabulario[pares[i][1]] + '</td><td>' + vocabulario[previsto] + '</td></tr>';
    }
    var tabela = document.getElementById('transformerPairs');
    tabela.innerHTML = html + '</tbody>';
    var linhas = tabela.querySelectorAll('tbody tr');
    for (i = 0; i < linhas.length; i++) {
      linhas[i].style.cursor = 'pointer';
      linhas[i].addEventListener('click', function () {
        parSelecionado = Number(this.getAttribute('data-par'));
        ultimoPasso = null;
        renderizarTudo();
      });
    }
  }

  function renderizarEmbeddings() {
    var tokens = pares[parSelecionado][0];
    var html = '<thead><tr><th>posição</th><th>token</th><th>embedding E</th><th>posição p</th><th>h = E + p</th></tr></thead><tbody>';
    for (var i = 0; i < tokens.length; i++) {
      var id = indiceToken(tokens[i]);
      var pos = vetorPosicao(i);
      var h = representar(tokens[i], i);
      html = html + '<tr><td>' + i + '</td><td><strong>' + tokens[i] + '</strong></td><td>[' + vetorTexto(embeddings[id]) + ']</td><td>[' + vetorTexto(pos) + ']</td><td>[' + vetorTexto(h) + ']</td></tr>';
    }
    document.getElementById('transformerEmbeddings').innerHTML = html + '</tbody>';
  }

  function vetorTexto(vetor) {
    var texto = '';
    for (var i = 0; i < vetor.length; i++) texto = texto + (i ? '; ' : '') + formatar(vetor[i], 3);
    return texto;
  }

  function renderizarAtencao() {
    var tokens = pares[parSelecionado][0];
    var matriz = calcularAtencao(tokens)[1];
    var html = '<table><thead><tr><th>consulta ↓ / chave →</th>';
    var i;
    var j;
    for (j = 0; j < tokens.length; j++) html = html + '<th>' + tokens[j] + '</th>';
    html = html + '</tr></thead><tbody>';
    for (i = 0; i < tokens.length; i++) {
      html = html + '<tr><th>' + tokens[i] + '</th>';
      for (j = 0; j < tokens.length; j++) {
        if (j > i) html = html + '<td style="background:#eef0f5;color:#99a1b2">máscara</td>';
        else {
          var peso = matriz[i][j];
          var alpha = 0.12 + peso * 0.78;
          html = html + '<td style="background:rgba(91,78,232,' + alpha.toFixed(3) + ');color:' + (peso > 0.38 ? '#fff' : '#252d46') + '">' + formatar(peso, 3) + '</td>';
        }
      }
      html = html + '</tr>';
    }
    document.getElementById('transformerAttention').innerHTML = html + '</tbody></table>';
  }

  function renderizarProbabilidades() {
    var probs = forward(pares[parSelecionado][0])[0];
    var indices = [];
    for (var i = 1; i < vocabulario.length; i++) indices[indices.length] = i;
    indices.sort(function (a, b) { return probs[b] - probs[a]; });
    var limite = Math.min(10, indices.length);
    var html = '';
    for (i = 0; i < limite; i++) {
      var id = indices[i];
      html = html + '<div class="probability-row"><b>' + vocabulario[id] + '</b><div class="probability-track"><div class="probability-fill" style="width:' + (probs[id] * 100).toFixed(2) + '%"></div></div><span>' + formatar(probs[id] * 100, 1) + '%</span></div>';
    }
    document.getElementById('transformerProbabilities').innerHTML = html;
  }

  function renderizarMatematica() {
    var par = pares[parSelecionado];
    var resultado = ultimoPasso && ultimoPasso[0] === parSelecionado ? ultimoPasso[1] : forward(par[0]);
    var atencao = resultado[3];
    var ultimaLinha = atencao[1][atencao[1].length - 1];
    var ultimoVetor = atencao[0][atencao[0].length - 1];
    var scoresTexto = '';
    var pesosTexto = '';
    for (var j = 0; j < par[0].length; j++) {
      var score = produtoEscalar(ultimoVetor, atencao[0][j]) / Math.sqrt(dimensao);
      scoresTexto = scoresTexto + (j ? '; ' : '') + formatar(score, 4);
      pesosTexto = pesosTexto + (j ? '; ' : '') + formatar(ultimaLinha[j], 4);
    }
    var probAlvo = resultado[0][par[1]];
    var loss = -Math.log(Math.max(0.0000001, probAlvo));
    var gradLogit = probAlvo - 1;
    var pesoAntes = pesosSaida[par[1]][0];
    var pesoDepois = pesoAntes - taxa * gradLogit * resultado[2][0];
    if (ultimoPasso && ultimoPasso[0] === parSelecionado) {
      pesoAntes = ultimoPasso[3][0];
      pesoDepois = ultimoPasso[5][0];
      gradLogit = ultimoPasso[2][par[1]];
    }

    document.getElementById('transformerMath').innerHTML =
      '<article><b>1 · Prefixo e alvo</b><p>O prefixo é a entrada; y é a próxima palavra correta.</p><code>x = [' + par[0].join('; ') + ']<br>y = <strong>' + vocabulario[par[1]] + '</strong></code></article>' +
      '<article><b>2 · Consulta, chaves e valores</b><p>Neste modelo reduzido, WQ = WK = WV = I.</p><code>q = k = v = h<br>q final = [' + vetorTexto(ultimoVetor) + ']</code></article>' +
      '<article><b>3 · Escores</b><p>Cada produto é dividido por √3.</p><code>sⱼ = q · kⱼ / √3<br>s = [' + scoresTexto + ']</code></article>' +
      '<article><b>4 · Softmax da atenção</b><p>Os pesos α somam 1.</p><code>α = Softmax(s)<br>α = [<strong>' + pesosTexto + '</strong>]</code></article>' +
      '<article><b>5 · Vetor de contexto</b><p>É a soma ponderada dos valores.</p><code>c = Σⱼ αⱼvⱼ<br>c = [<strong>' + vetorTexto(resultado[2]) + '</strong>]</code></article>' +
      '<article><b>6 · Probabilidade e loss</b><p>A cross-entropy observa a probabilidade do alvo.</p><code>P(y) = ' + formatar(probAlvo, 5) + '<br>L = −ln(P(y)) = <strong>' + formatar(loss, 5) + '</strong></code></article>' +
      '<article class="wide"><b>7 · Gradiente e atualização de um peso</b><p>Para o logit do alvo, ∂L/∂zᵧ = P(y) − 1. O mesmo processo ocorre em todos os pesos.</p><code>∂L/∂zᵧ = ' + formatar(probAlvo, 5) + ' − 1 = ' + formatar(gradLogit, 5) + '<br>∂L/∂Wᵧ₁ = (P(y)−1) × c₁ = ' + formatar(gradLogit, 5) + ' × ' + formatar(resultado[2][0], 5) + '<br>Wᵧ₁ novo = ' + formatar(pesoAntes, 5) + ' − ' + formatar(taxa, 2) + ' × (' + formatar(gradLogit * resultado[2][0], 5) + ') = <strong>' + formatar(pesoDepois, 5) + '</strong></code></article>';
  }

  function desenharHistorico() {
    var ctx = canvasHistorico.getContext('2d');
    var esquerda = 64;
    var direita = 28;
    var topo = 25;
    var base = 55;
    ctx.clearRect(0, 0, canvasHistorico.width, canvasHistorico.height);
    ctx.fillStyle = '#fbfcff'; ctx.fillRect(0, 0, canvasHistorico.width, canvasHistorico.height);
    ctx.font = '600 15px Manrope'; ctx.textAlign = 'right';
    for (var n = 0; n <= 4; n++) {
      var nivel = n / 4;
      var y = canvasHistorico.height - base - nivel * (canvasHistorico.height - topo - base);
      ctx.strokeStyle = '#e1e5ee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(esquerda, y); ctx.lineTo(canvasHistorico.width - direita, y); ctx.stroke();
      ctx.fillStyle = '#667087'; ctx.fillText(formatar(nivel, 2), esquerda - 10, y + 5);
    }
    var maxEpoca = historico[historico.length - 1][0];
    if (maxEpoca < 1) maxEpoca = 1;
    ctx.textAlign = 'center';
    for (n = 0; n <= 5; n++) {
      var x = esquerda + n / 5 * (canvasHistorico.width - esquerda - direita);
      ctx.fillText(String(Math.round(maxEpoca * n / 5)), x, canvasHistorico.height - 23);
    }
    function linha(coluna, cor) {
      ctx.beginPath(); ctx.strokeStyle = cor; ctx.lineWidth = 4;
      for (var i = 0; i < historico.length; i++) {
        var px = esquerda + historico[i][0] / maxEpoca * (canvasHistorico.width - esquerda - direita);
        var py = canvasHistorico.height - base - historico[i][coluna] * (canvasHistorico.height - topo - base);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    linha(1, '#df5278'); linha(2, '#0fa287');
  }

  function renderizarMetricas() {
    var metricas = calcularMetricas();
    document.getElementById('transformerEpoch').textContent = String(epoca);
    document.getElementById('transformerLoss').textContent = formatar(metricas[0], 4);
    document.getElementById('transformerPerplexity').textContent = formatar(Math.exp(metricas[0]), 3);
    document.getElementById('transformerVocab').textContent = String(vocabulario.length);
    var status = document.getElementById('transformerStatus');
    status.textContent = epoca === 0 ? 'Saída ainda aleatória' : formatar(metricas[1] * 100, 1) + '% de acerto';
    status.className = metricas[1] > 0.75 ? 'status-pill success' : 'status-pill';
  }

  function renderizarTudo() {
    renderizarMetricas();
    renderizarPares();
    renderizarEmbeddings();
    renderizarAtencao();
    renderizarProbabilidades();
    renderizarMatematica();
    desenharHistorico();
  }

  function gerar() {
    var tokens = tokenizar(document.getElementById('transformerPrompt').value);
    var conhecidos = [];
    for (var i = 0; i < tokens.length; i++) if (indiceToken(tokens[i]) >= 0) conhecidos[conhecidos.length] = tokens[i];
    if (conhecidos.length === 0) conhecidos[0] = '<início>';
    var quantidade = Number(document.getElementById('transformerTokenCount').value);
    var gerados = [];
    for (i = 0; i < quantidade; i++) {
      var probs = forward(conhecidos)[0];
      var proximo = maiorIndice(probs, true);
      conhecidos[conhecidos.length] = vocabulario[proximo];
      gerados[gerados.length] = vocabulario[proximo];
    }
    document.getElementById('transformerPrediction').innerHTML = '<strong>' + tokens.join(' ') + '</strong> <mark>' + gerados.join(' ') + '</mark><br><small>Geração gulosa: escolhe o token mais provável em cada passo.</small>';
  }

  document.getElementById('transformerPrepare').addEventListener('click', prepararCorpus);
  document.getElementById('transformerReset').addEventListener('click', function () { inicializarPesos(); renderizarTudo(); });
  document.getElementById('transformerTrainOne').addEventListener('click', function () { treinarEpoca(); renderizarTudo(); });
  document.getElementById('transformerTrainFifty').addEventListener('click', function () { for (var i = 0; i < 50; i++) treinarEpoca(); renderizarTudo(); });
  document.getElementById('transformerPredict').addEventListener('click', gerar);

  prepararCorpus();
}());
