(function () {
  'use strict';

  var scriptUrl = document.currentScript && document.currentScript.src;
  var projectRoot = scriptUrl ? new URL('../../', scriptUrl) : new URL('../../', window.location.href);

  /* ================================================================
     MINI GAN DIDÁTICA
     Imagem: 7 x 7 = 49 pixels. Vetor latente: 3 valores.
     G: camada Sigmoid. D: regressão logística.
     ================================================================ */
  var tamanho = 7;
  var pixels = 49;
  var dimensaoZ = 3;
  var taxaD = 0.08;
  var taxaG = 0.80;
  var imagens = window.DIDACTIC_DIGITS_7 || [];
  var exemplosReais = [];
  var pesosG = [];
  var biasG = [];
  var pesosD = [];
  var biasD = 0;
  var rodada = 0;
  var digito = 2;
  var semente = 12345;
  var ruidoFixo = [0.35, -0.70, 0.82];
  var historico = [];
  var lossInicial = 1;
  var ultimoPasso = null;
  var ultimoReal = null;
  var estagio0 = null;
  var estagio10 = null;
  var estagio50 = null;
  var imagensCarregadas = imagens.length;

  var canvasHistorico = document.getElementById('ganHistory');
  var canvasRede = document.getElementById('ganNetworkCanvas');
  if (!canvasHistorico) return;

  function formatar(valor, casas) {
    var seguro = Math.abs(valor) < 0.0000001 ? 0 : valor;
    return seguro.toFixed(casas).replace('.', ',');
  }

  function aleatorio() {
    semente = (semente * 1664525 + 1013904223) % 4294967296;
    return semente / 4294967296;
  }

  function sortearRuido() {
    var z = [];
    for (var i = 0; i < dimensaoZ; i++) z[i] = aleatorio() * 2 - 1;
    return z;
  }

  function sigmoid(valor) {
    if (valor > 20) return 1;
    if (valor < -20) return 0;
    return 1 / (1 + Math.exp(-valor));
  }

  function copiar(vetor) {
    var resultado = [];
    for (var i = 0; i < vetor.length; i++) resultado[i] = vetor[i];
    return resultado;
  }

  function gerar(z) {
    var imagem = [];
    for (var i = 0; i < pixels; i++) {
      var a = biasG[i];
      for (var j = 0; j < dimensaoZ; j++) a = a + pesosG[i][j] * z[j];
      imagem[i] = sigmoid(a);
    }
    return imagem;
  }

  function discriminar(imagem) {
    var a = biasD;
    for (var i = 0; i < pixels; i++) a = a + pesosD[i] * imagem[i];
    return sigmoid(a);
  }

  function indiceRepresentativo(real) {
    var melhor = 0;
    for (var i = 1; i < real.length; i++) if (real[i] > real[melhor]) melhor = i;
    return melhor;
  }

  function treinarRodada() {
    var real = exemplosReais[rodada % exemplosReais.length];
    var z = sortearRuido();
    var falso = gerar(z);
    var dReal = discriminar(real);
    var dFalso = discriminar(falso);
    var lossD = -(Math.log(Math.max(0.000001, dReal)) + Math.log(Math.max(0.000001, 1 - dFalso))) / 2;
    var pixelExemplo = indiceRepresentativo(real);
    var pesoDAntes = pesosD[pixelExemplo];
    var gradienteDExemplo = 0;
    var i;

    /* Fase 1: atualiza somente o Discriminador. */
    for (i = 0; i < pixels; i++) {
      var gradienteD = ((dReal - 1) * real[i] + dFalso * falso[i]) / 2;
      if (i === pixelExemplo) gradienteDExemplo = gradienteD;
      pesosD[i] = pesosD[i] - taxaD * gradienteD;
    }
    biasD = biasD - taxaD * ((dReal - 1) + dFalso) / 2;

    /* Fase 2: D fica congelado e o gradiente atravessa D até G. */
    var falsoParaG = gerar(z);
    var dFalsoParaG = discriminar(falsoParaG);
    var lossG = -Math.log(Math.max(0.000001, dFalsoParaG));
    var pesoGAntes = pesosG[pixelExemplo][0];
    var biasPixelAntes = biasG[pixelExemplo];
    var gradienteAtivacaoExemplo = 0;

    for (i = 0; i < pixels; i++) {
      var gradientePixel = (dFalsoParaG - 1) * pesosD[i];
      var gradienteAtivacao = gradientePixel * falsoParaG[i] * (1 - falsoParaG[i]);
      if (i === pixelExemplo) gradienteAtivacaoExemplo = gradienteAtivacao;
      for (var j = 0; j < dimensaoZ; j++) pesosG[i][j] = pesosG[i][j] - taxaG * gradienteAtivacao * z[j];
      biasG[i] = biasG[i] - taxaG * gradienteAtivacao;
    }

    rodada = rodada + 1;
    ultimoReal = copiar(real);
    ultimoPasso = [z, copiar(real), falso, dReal, dFalso, lossD, dFalsoParaG, lossG, pixelExemplo, pesoDAntes, pesosD[pixelExemplo], gradienteDExemplo, pesoGAntes, pesosG[pixelExemplo][0], biasPixelAntes, biasG[pixelExemplo], gradienteAtivacaoExemplo];
    if (rodada === 50) estagio10 = gerar(ruidoFixo);
    if (rodada === 500) estagio50 = gerar(ruidoFixo);
    registrarHistorico();
  }

  function cosseno(a, b) {
    var produto = 0;
    var normaA = 0;
    var normaB = 0;
    for (var i = 0; i < a.length; i++) {
      produto = produto + a[i] * b[i];
      normaA = normaA + a[i] * a[i];
      normaB = normaB + b[i] * b[i];
    }
    return produto / Math.sqrt(Math.max(0.000001, normaA * normaB));
  }

  function metricas() {
    var real = exemplosReais[0];
    var falso = gerar(ruidoFixo);
    var dReal = discriminar(real);
    var dFalso = discriminar(falso);
    var lossD = -(Math.log(Math.max(0.000001, dReal)) + Math.log(Math.max(0.000001, 1 - dFalso))) / 2;
    var lossG = -Math.log(Math.max(0.000001, dFalso));
    return [lossD, lossG, dReal, dFalso, cosseno(real, falso)];
  }

  function registrarHistorico() {
    var m = metricas();
    var loss = (m[0] + m[1]) / 2;
    var normalizada = loss / lossInicial;
    if (normalizada > 1) normalizada = 1;
    historico[historico.length] = [rodada, normalizada, m[4]];
  }

  function deslocar(imagem, dx, dy) {
    var resultado = [];
    for (var i = 0; i < pixels; i++) resultado[i] = 0;
    for (var y = 0; y < tamanho; y++) {
      for (var x = 0; x < tamanho; x++) {
        var origemX = x - dx;
        var origemY = y - dy;
        if (origemX >= 0 && origemX < tamanho && origemY >= 0 && origemY < tamanho) resultado[y * tamanho + x] = imagem[origemY * tamanho + origemX];
      }
    }
    return resultado;
  }

  function prepararExemplos() {
    var base = imagens[digito];
    exemplosReais = [copiar(base), deslocar(base, 1, 0), deslocar(base, -1, 0), deslocar(base, 0, 1), deslocar(base, 0, -1)];
  }

  function reiniciar() {
    semente = 9000 + digito * 97;
    pesosG = [];
    biasG = [];
    pesosD = [];
    for (var i = 0; i < pixels; i++) {
      pesosG[i] = [];
      for (var j = 0; j < dimensaoZ; j++) pesosG[i][j] = (aleatorio() * 2 - 1) * 0.25;
      biasG[i] = -1.2 + (aleatorio() * 2 - 1) * 0.08;
      pesosD[i] = 0;
    }
    biasD = 0;
    rodada = 0;
    historico = [];
    ultimoPasso = null;
    ultimoReal = copiar(exemplosReais[0]);
    estagio0 = gerar(ruidoFixo);
    estagio10 = null;
    estagio50 = null;
    var m = metricas();
    lossInicial = (m[0] + m[1]) / 2;
    registrarHistorico();
    renderizarTudo();
  }

  function carregarImagens() {
    renderizarGaleria();
    prepararExemplos();
    reiniciar();
  }

  function desenharImagem(canvas, imagem, textoVazio) {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!imagem) {
      ctx.fillStyle = '#798298'; ctx.font = '700 16px Manrope'; ctx.textAlign = 'center';
      ctx.fillText(textoVazio || 'ainda não', canvas.width / 2, canvas.height / 2);
      return;
    }
    var tamanhoCelula = canvas.width / tamanho;
    for (var y = 0; y < tamanho; y++) {
      for (var x = 0; x < tamanho; x++) {
        var intensidade = imagem[y * tamanho + x];
        var cinza = Math.round(255 * (1 - intensidade));
        ctx.fillStyle = 'rgb(' + cinza + ',' + cinza + ',' + cinza + ')';
        ctx.fillRect(x * tamanhoCelula, y * tamanhoCelula, tamanhoCelula + 1, tamanhoCelula + 1);
      }
    }
    ctx.strokeStyle = 'rgba(91,100,125,.18)'; ctx.lineWidth = 1;
    for (var i = 0; i <= tamanho; i++) {
      ctx.beginPath(); ctx.moveTo(i * tamanhoCelula, 0); ctx.lineTo(i * tamanhoCelula, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * tamanhoCelula); ctx.lineTo(canvas.width, i * tamanhoCelula); ctx.stroke();
    }
  }

  function renderizarGaleria() {
    var html = '';
    for (var i = 0; i <= 9; i++) html = html + '<button class="digit-card' + (i === digito ? ' active' : '') + '" data-digit="' + i + '"><img data-no-lightbox src="' + new URL('assets/images/digit-' + i + '.png', projectRoot).href + '" alt="Dígito manuscrito ' + i + '"><b>' + i + '</b></button>';
    var galeria = document.getElementById('ganGallery');
    galeria.innerHTML = html;
    var botoes = galeria.querySelectorAll('button');
    for (i = 0; i < botoes.length; i++) botoes[i].addEventListener('click', function () {
      digito = Number(this.getAttribute('data-digit'));
      document.getElementById('ganDigit').value = String(digito);
      prepararExemplos(); reiniciar(); renderizarGaleria();
    });
  }

  function renderizarJogo() {
    var falso = gerar(ruidoFixo);
    var real = ultimoReal || exemplosReais[0];
    desenharImagem(document.getElementById('ganFakeCanvas'), falso);
    desenharImagem(document.getElementById('ganRealCanvas'), real);
    document.getElementById('ganFakeScore').textContent = 'D(G(z)) = ' + formatar(discriminar(falso), 4);
    document.getElementById('ganRealScore').textContent = 'D(xreal) = ' + formatar(discriminar(real), 4);
    desenharImagem(document.getElementById('ganStage0'), estagio0);
    desenharImagem(document.getElementById('ganStage10'), estagio10, 'treine até 50');
    desenharImagem(document.getElementById('ganStage50'), estagio50, 'treine até 500');
    desenharImagem(document.getElementById('ganStageNow'), falso);
  }

  /* Desenha uma seta simples entre duas partes da rede. */
  function desenharSeta(ctx, x1, y1, x2, y2, cor, largura, tracejada) {
    var angulo = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.strokeStyle = cor;
    ctx.fillStyle = cor;
    ctx.lineWidth = largura;
    ctx.setLineDash(tracejada ? [10, 8] : []);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 11 * Math.cos(angulo - Math.PI / 6), y2 - 11 * Math.sin(angulo - Math.PI / 6));
    ctx.lineTo(x2 - 11 * Math.cos(angulo + Math.PI / 6), y2 - 11 * Math.sin(angulo + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* Cor e espessura mostram o sinal e o módulo de um peso real. */
  function desenharPeso(ctx, x1, y1, x2, y2, peso) {
    var modulo = Math.abs(peso);
    var largura = 1 + Math.min(3.5, modulo * 5);
    ctx.save();
    ctx.strokeStyle = peso >= 0 ? 'rgba(83,104,232,.48)' : 'rgba(223,82,120,.48)';
    ctx.lineWidth = largura;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  /* Um círculo representa um neurônio e mostra sua saída atual. */
  function desenharNeuronio(ctx, x, y, raio, titulo, valor, cor) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = cor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, raio, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#202940';
    ctx.textAlign = 'center';
    ctx.font = '800 16px Manrope';
    ctx.fillText(titulo, x, y - 3);
    ctx.fillStyle = '#59647a';
    ctx.font = '700 13px DM Mono';
    ctx.fillText(valor, x, y + 17);
    ctx.restore();
  }

  /* Miniatura 7 x 7 produzida pelos 49 neurônios do Gerador. */
  function desenharGradeDaRede(ctx, imagem, x, y, lado) {
    var celula = lado / tamanho;
    ctx.save();
    for (var linha = 0; linha < tamanho; linha++) {
      for (var coluna = 0; coluna < tamanho; coluna++) {
        var valor = imagem[linha * tamanho + coluna];
        var cinza = Math.round(255 * (1 - valor));
        ctx.fillStyle = 'rgb(' + cinza + ',' + cinza + ',' + cinza + ')';
        ctx.fillRect(x + coluna * celula, y + linha * celula, celula + 1, celula + 1);
      }
    }
    ctx.strokeStyle = '#aeb6c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, lado, lado);
    ctx.restore();
  }

  /*
     Mostra a arquitetura que o código realmente usa:
     3 entradas z -> 49 neurônios Sigmoid de G -> 49 pixels -> 1 Sigmoid de D.
     Exibimos sete neurônios/pesos representativos para manter o desenho legível.
  */
  function desenharRedeAdversaria() {
    if (!canvasRede || pesosG.length !== pixels) return;
    var ctx = canvasRede.getContext('2d');
    var z = ultimoPasso ? ultimoPasso[0] : ruidoFixo;
    var falso = gerar(z);
    var real = ultimoReal || exemplosReais[0];
    var dFalso = discriminar(falso);
    var dReal = discriminar(real);
    var indices = [3, 10, 17, 24, 31, 38, 45];
    var ys = [145, 200, 255, 310, 365, 420, 475];
    var yZ = [210, 310, 410];
    var i;
    var j;

    ctx.clearRect(0, 0, canvasRede.width, canvasRede.height);
    ctx.fillStyle = '#fbfcff';
    ctx.fillRect(0, 0, canvasRede.width, canvasRede.height);

    /* Faixas superiores deixam claro onde começa e termina cada rede. */
    ctx.fillStyle = '#eef0ff'; ctx.fillRect(25, 24, 125, 52);
    ctx.fillStyle = '#fff0f4'; ctx.fillRect(180, 24, 535, 52);
    ctx.fillStyle = '#e8f8f4'; ctx.fillRect(745, 24, 350, 52);
    ctx.textAlign = 'center'; ctx.fillStyle = '#4e46cf'; ctx.font = '850 17px Manrope'; ctx.fillText('ENTRADA', 87, 57);
    ctx.fillStyle = '#c53e67'; ctx.fillText('GERADOR G', 447, 57);
    ctx.fillStyle = '#087c66'; ctx.fillText('DISCRIMINADOR D', 920, 57);

    /* Conexões z -> pixels. A cor é o sinal do peso; a espessura é seu módulo. */
    for (i = 0; i < indices.length; i++) {
      for (j = 0; j < dimensaoZ; j++) desenharPeso(ctx, 125, yZ[j], 260, ys[i], pesosG[indices[i]][j]);
    }

    /* Conexões dos pixels representativos para a saída do Discriminador. */
    for (i = 0; i < indices.length; i++) desenharPeso(ctx, 845, ys[i], 1000, 330, pesosD[indices[i]]);

    /* Entradas latentes e neurônios de pixels do Gerador. */
    for (j = 0; j < dimensaoZ; j++) desenharNeuronio(ctx, 90, yZ[j], 35, 'z' + (j + 1), formatar(z[j], 2), '#5b4ee8');
    for (i = 0; i < indices.length; i++) {
      desenharNeuronio(ctx, 290, ys[i], 28, 'p' + (indices[i] + 1), formatar(falso[indices[i]], 2), '#d84b72');
      desenharSeta(ctx, 321, ys[i], 415, 175 + i * 30, '#d9a2b2', 1.5, false);
    }

    /* Os sete círculos representam uma amostra dos 49 neurônios gerados. */
    ctx.fillStyle = '#69738a'; ctx.textAlign = 'center'; ctx.font = '700 13px Manrope';
    ctx.fillText('7 de 49 neurônios visíveis', 290, 520);
    ctx.fillText('cada pᵢ = σ(bᵢ + Σ Wᵢⱼzⱼ)', 290, 542);

    /* Saída completa de G e amostra de pixels que entram em D. */
    desenharGradeDaRede(ctx, falso, 430, 190, 210);
    ctx.fillStyle = '#202940'; ctx.font = '850 16px Manrope'; ctx.fillText('G(z): imagem falsa', 535, 172);
    ctx.fillStyle = '#69738a'; ctx.font = '700 13px Manrope'; ctx.fillText('49 intensidades entre 0 e 1', 535, 425);
    desenharSeta(ctx, 650, 295, 728, 295, '#8f99ad', 3, false);

    for (i = 0; i < indices.length; i++) {
      desenharNeuronio(ctx, 805, ys[i], 25, 'x' + (indices[i] + 1), formatar(falso[indices[i]], 2), '#10a287');
    }
    ctx.fillStyle = '#69738a'; ctx.font = '700 13px Manrope'; ctx.fillText('7 de 49 entradas visíveis', 805, 520);

    /* O único neurônio de D devolve a probabilidade de a imagem ser real. */
    desenharNeuronio(ctx, 1035, 310, 52, 'D(x)', formatar(dFalso, 3), '#0a987e');
    ctx.fillStyle = '#202940'; ctx.font = '850 15px Manrope'; ctx.fillText('1 neurônio Sigmoid', 1035, 385);
    ctx.fillStyle = '#69738a'; ctx.font = '700 13px Manrope'; ctx.fillText('D(x)=σ(bᴅ+Σwᴅᵢxᵢ)', 1035, 409);

    /* Backpropagation: o erro de G percorre a rede no sentido inverso. */
    desenharSeta(ctx, 1020, 578, 355, 578, '#e47c42', 4, true);
    ctx.fillStyle = '#b75520'; ctx.font = '850 14px Manrope'; ctx.fillText('BACKPROPAGATION DE G: erro (D(G(z)) − 1) volta; D permanece congelado', 687, 563);

    /* Também registramos a entrada real usada apenas para ensinar D. */
    ctx.fillStyle = '#eef8f5'; ctx.fillRect(698, 90, 365, 42);
    ctx.fillStyle = '#087c66'; ctx.font = '800 14px Manrope';
    ctx.fillText('Treino de D: real → alvo 1  |  falso → alvo 0', 880, 117);

    var fase = rodada === 0 ? 'Forward inicial' : 'Rodada ' + rodada + ' · D e G atualizados';
    document.getElementById('ganNetworkPhase').textContent = fase;
    document.getElementById('ganNetworkPhase').className = rodada > 0 ? 'status-pill success' : 'status-pill';
    document.getElementById('ganNetworkReading').innerHTML =
      'z = [' + formatar(z[0], 2) + '; ' + formatar(z[1], 2) + '; ' + formatar(z[2], 2) + '] &nbsp;→&nbsp; G(z) = 49 pixels &nbsp;→&nbsp; D(G(z)) = <strong>' + formatar(dFalso, 4) + '</strong><br>' +
      'D(real) = <strong>' + formatar(dReal, 4) + '</strong> (alvo 1) &nbsp;·&nbsp; D(falso) = <strong>' + formatar(dFalso, 4) + '</strong> (alvo 0 para D e alvo 1 para G).';
  }

  function renderizarMatematica() {
    var caixa = document.getElementById('ganMath');
    if (!ultimoPasso) {
      caixa.innerHTML = '<article class="wide"><b>Treine uma rodada</b><p>As contas do Gerador e do Discriminador aparecerão aqui.</p></article>';
      return;
    }
    var p = ultimoPasso;
    var i = p[8];
    var linha = Math.floor(i / tamanho);
    var coluna = i % tamanho;
    var gradientePesoG = p[16] * p[0][0];
    caixa.innerHTML =
      '<article><b>1 · Ruído e pixel gerado</b><p>Inspecionamos o pixel [' + linha + ',' + coluna + '], forte no exemplo real.</p><code>z = [' + formatar(p[0][0], 3) + '; ' + formatar(p[0][1], 3) + '; ' + formatar(p[0][2], 3) + ']<br>x̂ᵢ = σ(bᵢ + ΣWᵢⱼzⱼ)<br>x̂ᵢ = <strong>' + formatar(p[2][i], 5) + '</strong></code></article>' +
      '<article><b>2 · Palpites de D</b><p>O alvo do real é 1; o alvo do falso é 0.</p><code>D(xreal) = ' + formatar(p[3], 5) + '<br>D(G(z)) = ' + formatar(p[4], 5) + '</code></article>' +
      '<article><b>3 · Perda de D</b><p>Entropia cruzada dos dois exemplos.</p><code>Lᴅ = −[ln(' + formatar(p[3], 5) + ') + ln(1−' + formatar(p[4], 5) + ')]/2<br>Lᴅ = <strong>' + formatar(p[5], 5) + '</strong></code></article>' +
      '<article><b>4 · Ajuste de um peso de D</b><p>O gradiente reúne a contribuição real e a falsa.</p><code>g = [(Dreal−1)xrealᵢ + Dfake·xfakeᵢ]/2<br>g = ' + formatar(p[11], 6) + '<br>wᴅ novo = ' + formatar(p[9], 5) + ' − ' + formatar(taxaD, 2) + '×(' + formatar(p[11], 6) + ') = <strong>' + formatar(p[10], 5) + '</strong></code></article>' +
      '<article><b>5 · Perda de G</b><p>Agora G deseja que o falso seja aceito como real.</p><code>Lɢ = −ln D(G(z))<br>Lɢ = −ln(' + formatar(p[6], 5) + ') = <strong>' + formatar(p[7], 5) + '</strong></code></article>' +
      '<article><b>6 · Gradiente que chega ao pixel</b><p>A Regra da Cadeia atravessa D e a Sigmoid de G.</p><code>∂Lɢ/∂aᵢ = (Dfake−1)·wᴅᵢ·x̂ᵢ(1−x̂ᵢ)<br>∂Lɢ/∂aᵢ = <strong>' + formatar(p[16], 7) + '</strong></code></article>' +
      '<article class="wide"><b>7 · Ajuste de um peso do Gerador</b><p>Como aᵢ depende de Wɢᵢ₁z₁, multiplicamos o gradiente por z₁.</p><code>∂Lɢ/∂Wɢᵢ₁ = ∂Lɢ/∂aᵢ × z₁ = ' + formatar(p[16], 7) + ' × ' + formatar(p[0][0], 5) + ' = ' + formatar(gradientePesoG, 7) + '<br>Wɢ novo = ' + formatar(p[12], 6) + ' − ' + formatar(taxaG, 2) + ' × (' + formatar(gradientePesoG, 7) + ') = <strong>' + formatar(p[13], 6) + '</strong></code></article>';
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
    var maxRodada = historico[historico.length - 1][0];
    if (maxRodada < 1) maxRodada = 1;
    ctx.textAlign = 'center';
    for (n = 0; n <= 5; n++) {
      var x = esquerda + n / 5 * (canvasHistorico.width - esquerda - direita);
      ctx.fillText(String(Math.round(maxRodada * n / 5)), x, canvasHistorico.height - 22);
    }
    function linha(coluna, cor) {
      ctx.beginPath(); ctx.strokeStyle = cor; ctx.lineWidth = 4;
      for (var h = 0; h < historico.length; h++) {
        var px = esquerda + historico[h][0] / maxRodada * (canvasHistorico.width - esquerda - direita);
        var py = canvasHistorico.height - base - historico[h][coluna] * (canvasHistorico.height - topo - base);
        if (h === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    linha(1, '#df5278'); linha(2, '#0fa287');
  }

  function renderizarMetricas() {
    var m = metricas();
    document.getElementById('ganRound').textContent = String(rodada);
    document.getElementById('ganDLoss').textContent = formatar(m[0], 4);
    document.getElementById('ganGLoss').textContent = formatar(m[1], 4);
    document.getElementById('ganSimilarity').textContent = formatar(m[4] * 100, 1) + '%';
    document.getElementById('ganReading').innerHTML = 'D(real) = <strong>' + formatar(m[2], 4) + '</strong><br>D(falso) = <strong>' + formatar(m[3], 4) + '</strong>';
    var status = document.getElementById('ganStatus');
    status.textContent = rodada === 0 ? 'Redes não treinadas' : 'Gerando o dígito ' + digito;
    status.className = rodada >= 50 ? 'status-pill success' : 'status-pill';
  }

  function renderizarTudo() {
    if (imagensCarregadas < 10) return;
    renderizarMetricas();
    renderizarGaleria();
    renderizarJogo();
    desenharRedeAdversaria();
    renderizarMatematica();
    desenharHistorico();
  }

  document.getElementById('ganDigit').addEventListener('change', function () { digito = Number(this.value); prepararExemplos(); reiniciar(); });
  document.getElementById('ganTrainOne').addEventListener('click', function () { if (imagensCarregadas < 10) return; treinarRodada(); renderizarTudo(); });
  document.getElementById('ganTrainMany').addEventListener('click', function () { if (imagensCarregadas < 10) return; for (var i = 0; i < 500; i++) treinarRodada(); renderizarTudo(); });
  document.getElementById('ganReset').addEventListener('click', function () { if (imagensCarregadas === 10) reiniciar(); });
  document.getElementById('ganNewNoise').addEventListener('click', function () { ruidoFixo = sortearRuido(); estagio0 = gerar(ruidoFixo); estagio10 = null; estagio50 = null; renderizarTudo(); });

  carregarImagens();
}());
