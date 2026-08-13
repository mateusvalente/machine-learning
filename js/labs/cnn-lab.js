(function () {
  'use strict';

  var scriptUrl = document.currentScript && document.currentScript.src;
  var projectRoot = scriptUrl ? new URL('../../', scriptUrl) : new URL('../../', window.location.href);

  /* ================================================================
     MINI CNN DIDÁTICA
     Entrada 12 x 12 -> 4 convoluções 3 x 3 -> ReLU -> Max Pooling
     2 x 2 -> 100 características -> camada densa com 10 saídas.
     ================================================================ */
  var entradaTamanho = 12;
  var mapaTamanho = 10;
  var poolTamanho = 5;
  var quantidadeFiltros = 4;
  var quantidadeCaracteristicas = 100;
  var taxa = 0.035;
  var filtros = [
    [[-1/3,2/3,-1/3],[-1/3,2/3,-1/3],[-1/3,2/3,-1/3]],
    [[-1/3,-1/3,-1/3],[2/3,2/3,2/3],[-1/3,-1/3,-1/3]],
    [[2/3,-1/3,-1/3],[-1/3,2/3,-1/3],[-1/3,-1/3,2/3]],
    [[-1/3,-1/3,2/3],[-1/3,2/3,-1/3],[2/3,-1/3,-1/3]]
  ];
  var imagens = window.DIDACTIC_DIGITS_12 || [];
  var dataset = [];
  var pesos = [];
  var biases = [];
  var epoca = 0;
  var historico = [];
  var lossInicial = 1;
  var imagensCarregadas = imagens.length;
  var desenho = matrizZeros(entradaTamanho, entradaTamanho);
  var alvoDesenho = 2;
  var desenhando = false;
  var ultimoPasso = null;
  var semente = 7781;

  var canvasDesenho = document.getElementById('cnnDrawing');
  var canvasHistorico = document.getElementById('cnnHistory');
  if (!canvasDesenho || !canvasHistorico) return;

  function formatar(valor, casas) {
    var seguro = Math.abs(valor) < 0.0000001 ? 0 : valor;
    return seguro.toFixed(casas).replace('.', ',');
  }

  function matrizZeros(linhas, colunas) {
    var matriz = [];
    for (var r = 0; r < linhas; r++) {
      matriz[r] = [];
      for (var c = 0; c < colunas; c++) matriz[r][c] = 0;
    }
    return matriz;
  }

  function copiarMatriz(matriz) {
    var copia = [];
    for (var r = 0; r < matriz.length; r++) {
      copia[r] = [];
      for (var c = 0; c < matriz[r].length; c++) copia[r][c] = matriz[r][c];
    }
    return copia;
  }

  function aleatorio() {
    semente = (semente * 1664525 + 1013904223) % 4294967296;
    return semente / 4294967296;
  }

  function convoluir(imagem, filtro) {
    var mapa = matrizZeros(mapaTamanho, mapaTamanho);
    for (var linha = 0; linha < mapaTamanho; linha++) {
      for (var coluna = 0; coluna < mapaTamanho; coluna++) {
        var soma = 0;
        for (var r = 0; r < 3; r++) {
          for (var c = 0; c < 3; c++) soma = soma + imagem[linha + r][coluna + c] * filtro[r][c];
        }
        mapa[linha][coluna] = Math.max(0, soma);
      }
    }
    return mapa;
  }

  function maxPooling(mapa) {
    var resultado = matrizZeros(poolTamanho, poolTamanho);
    for (var linha = 0; linha < poolTamanho; linha++) {
      for (var coluna = 0; coluna < poolTamanho; coluna++) {
        var maior = mapa[linha * 2][coluna * 2];
        for (var r = 0; r < 2; r++) {
          for (var c = 0; c < 2; c++) {
            var valor = mapa[linha * 2 + r][coluna * 2 + c];
            if (valor > maior) maior = valor;
          }
        }
        resultado[linha][coluna] = maior;
      }
    }
    return resultado;
  }

  function extrairCaracteristicas(imagem) {
    var mapas = [];
    var pools = [];
    var vetor = [];
    for (var f = 0; f < quantidadeFiltros; f++) {
      mapas[f] = convoluir(imagem, filtros[f]);
      pools[f] = maxPooling(mapas[f]);
      for (var r = 0; r < poolTamanho; r++) {
        for (var c = 0; c < poolTamanho; c++) vetor[vetor.length] = Math.min(1, pools[f][r][c] / 2);
      }
    }
    return [vetor, mapas, pools];
  }

  function softmax(valores) {
    var maior = valores[0];
    var i;
    for (i = 1; i < valores.length; i++) if (valores[i] > maior) maior = valores[i];
    var resultado = [];
    var soma = 0;
    for (i = 0; i < valores.length; i++) { resultado[i] = Math.exp(valores[i] - maior); soma = soma + resultado[i]; }
    for (i = 0; i < valores.length; i++) resultado[i] = resultado[i] / soma;
    return resultado;
  }

  function forward(imagem) {
    var extracao = extrairCaracteristicas(imagem);
    var caracteristicas = extracao[0];
    var logits = [];
    for (var k = 0; k < 10; k++) {
      logits[k] = biases[k];
      for (var j = 0; j < quantidadeCaracteristicas; j++) logits[k] = logits[k] + pesos[k][j] * caracteristicas[j];
    }
    return [softmax(logits), logits, caracteristicas, extracao[1], extracao[2]];
  }

  function maiorIndice(valores) {
    var melhor = 0;
    for (var i = 1; i < valores.length; i++) if (valores[i] > valores[melhor]) melhor = i;
    return melhor;
  }

  function treinarAmostra(amostra) {
    var resultado = forward(amostra[0]);
    var probabilidades = resultado[0];
    var caracteristicas = resultado[2];
    var alvo = amostra[1];
    var indiceCaracteristica = 0;
    for (var j = 1; j < caracteristicas.length; j++) if (caracteristicas[j] > caracteristicas[indiceCaracteristica]) indiceCaracteristica = j;
    var pesoAntes = pesos[alvo][indiceCaracteristica];
    var gradienteAlvo = probabilidades[alvo] - 1;

    for (var k = 0; k < 10; k++) {
      var erroLogit = probabilidades[k];
      if (k === alvo) erroLogit = erroLogit - 1;
      for (j = 0; j < quantidadeCaracteristicas; j++) pesos[k][j] = pesos[k][j] - taxa * erroLogit * caracteristicas[j];
      biases[k] = biases[k] - taxa * erroLogit;
    }

    ultimoPasso = [copiarMatriz(amostra[0]), alvo, resultado, indiceCaracteristica, pesoAntes, pesos[alvo][indiceCaracteristica], gradienteAlvo];
  }

  function treinarEpoca() {
    for (var i = 0; i < dataset.length; i++) treinarAmostra(dataset[i]);
    epoca = epoca + 1;
    desenho = copiarMatriz(ultimoPasso[0]);
    alvoDesenho = ultimoPasso[1];
    registrarHistorico();
  }

  function metricas() {
    var loss = 0;
    var acertos = 0;
    for (var numero = 0; numero <= 9; numero++) {
      var probs = forward(imagens[numero])[0];
      loss = loss - Math.log(Math.max(0.000001, probs[numero]));
      if (maiorIndice(probs) === numero) acertos = acertos + 1;
    }
    return [loss / 10, acertos / 10];
  }

  function registrarHistorico() {
    var m = metricas();
    var normalizada = m[0] / lossInicial;
    if (normalizada > 1) normalizada = 1;
    historico[historico.length] = [epoca, normalizada, m[1]];
  }

  function inicializarSaida() {
    semente = 7781;
    pesos = [];
    biases = [];
    for (var k = 0; k < 10; k++) {
      pesos[k] = [];
      for (var j = 0; j < quantidadeCaracteristicas; j++) pesos[k][j] = (aleatorio() * 2 - 1) * 0.025;
      biases[k] = 0;
    }
    epoca = 0;
    historico = [];
    ultimoPasso = null;
    lossInicial = metricas()[0];
    registrarHistorico();
    renderizarTudo();
  }

  function deslocar(imagem, dx, dy) {
    var resultado = matrizZeros(entradaTamanho, entradaTamanho);
    for (var y = 0; y < entradaTamanho; y++) {
      for (var x = 0; x < entradaTamanho; x++) {
        var origemX = x - dx;
        var origemY = y - dy;
        if (origemX >= 0 && origemX < entradaTamanho && origemY >= 0 && origemY < entradaTamanho) resultado[y][x] = imagem[origemY][origemX];
      }
    }
    return resultado;
  }

  function montarDataset() {
    dataset = [];
    var deslocamentos = [[0,0],[1,0],[-1,0],[0,1],[0,-1]];
    for (var d = 0; d < deslocamentos.length; d++) {
      for (var numero = 0; numero <= 9; numero++) dataset[dataset.length] = [deslocar(imagens[numero], deslocamentos[d][0], deslocamentos[d][1]), numero];
    }
  }

  function carregarImagens() {
    renderizarGaleria();
    montarDataset();
    desenho = copiarMatriz(imagens[2]);
    alvoDesenho = 2;
    inicializarSaida();
  }

  function renderizarGaleria() {
    var html = '';
    for (var i = 0; i <= 9; i++) html = html + '<button class="digit-card' + (i === alvoDesenho ? ' active' : '') + '" data-digit="' + i + '"><img data-no-lightbox src="' + new URL('assets/images/digit-' + i + '.png', projectRoot).href + '" alt="Dígito manuscrito ' + i + '"><b>' + i + '</b></button>';
    var galeria = document.getElementById('cnnGallery');
    galeria.innerHTML = html;
    var botoes = galeria.querySelectorAll('button');
    for (i = 0; i < botoes.length; i++) botoes[i].addEventListener('click', function () {
      if (imagensCarregadas < 10) return;
      alvoDesenho = Number(this.getAttribute('data-digit'));
      desenho = copiarMatriz(imagens[alvoDesenho]);
      ultimoPasso = null;
      renderizarTudo();
    });
  }

  function desenharEntrada() {
    var ctx = canvasDesenho.getContext('2d');
    var celula = canvasDesenho.width / entradaTamanho;
    ctx.clearRect(0, 0, canvasDesenho.width, canvasDesenho.height);
    for (var y = 0; y < entradaTamanho; y++) {
      for (var x = 0; x < entradaTamanho; x++) {
        var cinza = Math.round(255 * (1 - desenho[y][x]));
        ctx.fillStyle = 'rgb(' + cinza + ',' + cinza + ',' + cinza + ')';
        ctx.fillRect(x * celula, y * celula, celula + 1, celula + 1);
      }
    }
    ctx.strokeStyle = 'rgba(81,92,119,.18)'; ctx.lineWidth = 1;
    for (var i = 0; i <= entradaTamanho; i++) {
      ctx.beginPath(); ctx.moveTo(i * celula, 0); ctx.lineTo(i * celula, canvasDesenho.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * celula); ctx.lineTo(canvasDesenho.width, i * celula); ctx.stroke();
    }
  }

  function desenharMapa(canvas, mapa, cor) {
    var ctx = canvas.getContext('2d');
    var celula = canvas.width / mapaTamanho;
    var maximo = 0.0001;
    for (var r = 0; r < mapaTamanho; r++) for (var c = 0; c < mapaTamanho; c++) if (mapa[r][c] > maximo) maximo = mapa[r][c];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (r = 0; r < mapaTamanho; r++) {
      for (c = 0; c < mapaTamanho; c++) {
        var intensidade = mapa[r][c] / maximo;
        var vermelho = Math.round(255 - (255 - cor[0]) * intensidade);
        var verde = Math.round(255 - (255 - cor[1]) * intensidade);
        var azul = Math.round(255 - (255 - cor[2]) * intensidade);
        ctx.fillStyle = 'rgb(' + vermelho + ',' + verde + ',' + azul + ')';
        ctx.fillRect(c * celula, r * celula, celula + 1, celula + 1);
      }
    }
  }

  function matrizTexto(matriz) {
    var texto = '';
    for (var r = 0; r < matriz.length; r++) {
      texto = texto + (r ? '<br>' : '');
      for (var c = 0; c < matriz[r].length; c++) texto = texto + (c ? ' &nbsp;' : '') + formatar(matriz[r][c], 2);
    }
    return texto;
  }

  function renderizarMapas(resultado) {
    var cores = [[79,70,229],[9,145,178],[5,150,105],[226,105,58]];
    for (var f = 0; f < quantidadeFiltros; f++) {
      desenharMapa(document.getElementById('cnnMap' + f), resultado[3][f], cores[f]);
      document.getElementById('cnnFilter' + f).innerHTML = matrizTexto(filtros[f]);
    }
  }

  function renderizarProbabilidades(probs) {
    var html = '';
    for (var k = 0; k < 10; k++) html = html + '<div class="probability-row"><b>dígito ' + k + '</b><div class="probability-track"><div class="probability-fill" style="width:' + (probs[k] * 100).toFixed(2) + '%"></div></div><span>' + formatar(probs[k] * 100, 1) + '%</span></div>';
    document.getElementById('cnnProbabilities').innerHTML = html;
  }

  function melhorPosicao(mapa) {
    var melhor = [0, 0];
    for (var r = 0; r < mapa.length; r++) for (var c = 0; c < mapa[r].length; c++) if (mapa[r][c] > mapa[melhor[0]][melhor[1]]) melhor = [r, c];
    return melhor;
  }

  function renderizarMatematica(resultado) {
    var posicao = melhorPosicao(resultado[3][0]);
    var patch = matrizZeros(3, 3);
    var soma = 0;
    var produtos = '';
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        patch[r][c] = desenho[posicao[0] + r][posicao[1] + c];
        var produto = patch[r][c] * filtros[0][r][c];
        soma = soma + produto;
        produtos = produtos + (produtos ? ' + ' : '') + '(' + formatar(patch[r][c], 2) + '×' + formatar(filtros[0][r][c], 2) + ')';
      }
    }
    var ativacao = Math.max(0, soma);
    var poolLinha = Math.floor(posicao[0] / 2);
    var poolColuna = Math.floor(posicao[1] / 2);
    if (poolLinha > 4) poolLinha = 4;
    if (poolColuna > 4) poolColuna = 4;
    var valoresPool = [];
    for (r = 0; r < 2; r++) for (c = 0; c < 2; c++) valoresPool[valoresPool.length] = resultado[3][0][poolLinha * 2 + r][poolColuna * 2 + c];
    var maiorPool = valoresPool[0];
    for (var i = 1; i < valoresPool.length; i++) if (valoresPool[i] > maiorPool) maiorPool = valoresPool[i];
    var alvo = alvoDesenho >= 0 ? alvoDesenho : maiorIndice(resultado[0]);
    var probAlvo = resultado[0][alvo];
    var loss = -Math.log(Math.max(0.000001, probAlvo));
    var indiceCaracteristica = 0;
    for (i = 1; i < resultado[2].length; i++) if (resultado[2][i] > resultado[2][indiceCaracteristica]) indiceCaracteristica = i;
    var pesoAntes = pesos[alvo][indiceCaracteristica];
    var gradLogit = probAlvo - 1;
    var pesoDepois = pesoAntes - taxa * gradLogit * resultado[2][indiceCaracteristica];
    if (ultimoPasso && ultimoPasso[1] === alvo) {
      indiceCaracteristica = ultimoPasso[3];
      pesoAntes = ultimoPasso[4];
      pesoDepois = ultimoPasso[5];
      gradLogit = ultimoPasso[6];
    }
    document.getElementById('cnnMath').innerHTML =
      '<article><b>1 · Patch 3 × 3</b><p>Região de maior resposta do filtro vertical, começando em [' + posicao[0] + ',' + posicao[1] + '].</p><code>' + matrizTexto(patch) + '</code></article>' +
      '<article><b>2 · Filtro 3 × 3</b><p>Os mesmos nove pesos são usados em todas as posições.</p><code>' + matrizTexto(filtros[0]) + '</code></article>' +
      '<article class="wide"><b>3 · Convolução e ReLU</b><p>Multiplicação posição por posição seguida da somatória.</p><code>u = ' + produtos + '<br>u = ' + formatar(soma, 5) + '<br>ReLU(u) = max(0,u) = <strong>' + formatar(ativacao, 5) + '</strong></code></article>' +
      '<article><b>4 · Max Pooling 2 × 2</b><p>O maior valor representa o bloco.</p><code>max[' + formatar(valoresPool[0], 3) + '; ' + formatar(valoresPool[1], 3) + '; ' + formatar(valoresPool[2], 3) + '; ' + formatar(valoresPool[3], 3) + ']<br>pool = <strong>' + formatar(maiorPool, 5) + '</strong></code></article>' +
      '<article><b>5 · Logits e Softmax</b><p>A camada densa combina as 100 características.</p><code>zᵧ = bᵧ + ΣⱼWᵧⱼfⱼ = ' + formatar(resultado[1][alvo], 5) + '<br>P(y=' + alvo + ') = <strong>' + formatar(probAlvo, 5) + '</strong></code></article>' +
      '<article><b>6 · Cross-entropy</b><p>Quanto menor P da classe correta, maior a penalidade.</p><code>L = −ln P(y) = −ln(' + formatar(probAlvo, 5) + ')<br>L = <strong>' + formatar(loss, 5) + '</strong></code></article>' +
      '<article><b>7 · Gradiente da saída</b><p>Para o logit correto, previsão menos alvo.</p><code>∂L/∂zᵧ = P(y)−1 = <strong>' + formatar(gradLogit, 6) + '</strong></code></article>' +
      '<article class="wide"><b>8 · Atualização de um peso denso</b><p>A característica f' + (indiceCaracteristica + 1) + ' multiplica o gradiente do logit.</p><code>∂L/∂W = (P(y)−1)×f = ' + formatar(gradLogit, 6) + '×' + formatar(resultado[2][indiceCaracteristica], 6) + '<br>W novo = ' + formatar(pesoAntes, 6) + ' − ' + formatar(taxa, 3) + '×(' + formatar(gradLogit * resultado[2][indiceCaracteristica], 6) + ') = <strong>' + formatar(pesoDepois, 6) + '</strong></code></article>';
  }

  function renderizarResultados() {
    var html = '<thead><tr><th>Classe real</th><th>Previsão</th><th>Confiança</th><th>Correto?</th></tr></thead><tbody>';
    for (var numero = 0; numero <= 9; numero++) {
      var probs = forward(imagens[numero])[0];
      var previsto = maiorIndice(probs);
      html = html + '<tr><td>' + numero + '</td><td>' + previsto + '</td><td>' + formatar(probs[previsto] * 100, 2) + '%</td><td>' + (previsto === numero ? 'sim' : 'não') + '</td></tr>';
    }
    document.getElementById('cnnResults').innerHTML = html + '</tbody>';
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
      ctx.strokeStyle = '#e1e5ee'; ctx.beginPath(); ctx.moveTo(esquerda, y); ctx.lineTo(canvasHistorico.width - direita, y); ctx.stroke();
      ctx.fillStyle = '#667087'; ctx.fillText(formatar(nivel, 2), esquerda - 10, y + 5);
    }
    var maxEpoca = historico[historico.length - 1][0];
    if (maxEpoca < 1) maxEpoca = 1;
    ctx.textAlign = 'center';
    for (n = 0; n <= 5; n++) {
      var x = esquerda + n / 5 * (canvasHistorico.width - esquerda - direita);
      ctx.fillText(String(Math.round(maxEpoca * n / 5)), x, canvasHistorico.height - 22);
    }
    function linha(coluna, cor) {
      ctx.beginPath(); ctx.strokeStyle = cor; ctx.lineWidth = 4;
      for (var h = 0; h < historico.length; h++) {
        var px = esquerda + historico[h][0] / maxEpoca * (canvasHistorico.width - esquerda - direita);
        var py = canvasHistorico.height - base - historico[h][coluna] * (canvasHistorico.height - topo - base);
        if (h === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    linha(1, '#df5278'); linha(2, '#0fa287');
  }

  function renderizarMetricas(resultado) {
    var m = metricas();
    var previsto = maiorIndice(resultado[0]);
    document.getElementById('cnnEpoch').textContent = String(epoca);
    document.getElementById('cnnLoss').textContent = formatar(m[0], 4);
    document.getElementById('cnnAccuracy').textContent = formatar(m[1] * 100, 1) + '%';
    document.getElementById('cnnPrediction').textContent = String(previsto);
    document.getElementById('cnnBigPrediction').textContent = String(previsto);
    document.getElementById('cnnConfidence').textContent = formatar(resultado[0][previsto] * 100, 2) + '% de confiança';
    document.getElementById('cnnReading').innerHTML = 'Previsão: <strong>' + previsto + '</strong><br>Classe selecionada: <strong>' + (alvoDesenho >= 0 ? alvoDesenho : 'desenho livre') + '</strong>';
    var status = document.getElementById('cnnStatus');
    status.textContent = epoca === 0 ? 'Saída não treinada' : formatar(m[1] * 100, 1) + '% nos exemplos-base';
    status.className = m[1] >= 0.9 ? 'status-pill success' : 'status-pill';
  }

  function renderizarTudo() {
    if (imagensCarregadas < 10) return;
    var resultado = forward(desenho);
    renderizarGaleria();
    desenharEntrada();
    renderizarMetricas(resultado);
    renderizarProbabilidades(resultado[0]);
    renderizarMapas(resultado);
    renderizarMatematica(resultado);
    desenharHistorico();
    renderizarResultados();
  }

  function desenharNoEvento(evento) {
    var retangulo = canvasDesenho.getBoundingClientRect();
    var x = Math.floor((evento.clientX - retangulo.left) / retangulo.width * entradaTamanho);
    var y = Math.floor((evento.clientY - retangulo.top) / retangulo.height * entradaTamanho);
    if (x < 0 || y < 0 || x >= entradaTamanho || y >= entradaTamanho) return;
    desenho[y][x] = 1;
    if (x > 0) desenho[y][x - 1] = Math.max(desenho[y][x - 1], 0.45);
    if (x < entradaTamanho - 1) desenho[y][x + 1] = Math.max(desenho[y][x + 1], 0.45);
    if (y > 0) desenho[y - 1][x] = Math.max(desenho[y - 1][x], 0.45);
    if (y < entradaTamanho - 1) desenho[y + 1][x] = Math.max(desenho[y + 1][x], 0.45);
    alvoDesenho = -1;
    ultimoPasso = null;
    renderizarTudo();
  }

  canvasDesenho.addEventListener('pointerdown', function (evento) { desenhando = true; canvasDesenho.setPointerCapture(evento.pointerId); desenharNoEvento(evento); });
  canvasDesenho.addEventListener('pointermove', function (evento) { if (desenhando) desenharNoEvento(evento); });
  canvasDesenho.addEventListener('pointerup', function () { desenhando = false; });
  canvasDesenho.addEventListener('pointercancel', function () { desenhando = false; });

  document.getElementById('cnnTrainOne').addEventListener('click', function () { if (imagensCarregadas < 10) return; treinarEpoca(); renderizarTudo(); });
  document.getElementById('cnnTrainHundred').addEventListener('click', function () { if (imagensCarregadas < 10) return; for (var i = 0; i < 100; i++) treinarEpoca(); renderizarTudo(); });
  document.getElementById('cnnReset').addEventListener('click', function () { if (imagensCarregadas === 10) inicializarSaida(); });
  document.getElementById('cnnClassify').addEventListener('click', renderizarTudo);
  document.getElementById('cnnClear').addEventListener('click', function () { desenho = matrizZeros(entradaTamanho, entradaTamanho); alvoDesenho = -1; ultimoPasso = null; renderizarTudo(); });

  carregarImagens();
}());
