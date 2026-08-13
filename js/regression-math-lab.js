// ============================================================================
// LABORATÓRIO MATEMÁTICO DE REGRESSÃO
// Atende à reta (linear) e à parábola (polinomial de grau 2).
// Usa arrays, laços e funções separadas para facilitar a leitura em aula.
// ============================================================================
(function iniciarLaboratoriosDeRegressao() {
  'use strict';

  var laboratorios = document.querySelectorAll('[data-regression-lab]');
  for (var indice = 0; indice < laboratorios.length; indice++) prepararLaboratorio(laboratorios[indice]);

  function prepararLaboratorio(laboratorio) {
    var modo = laboratorio.getAttribute('data-regression-lab');
    var canvas = laboratorio.querySelector('canvas');
    var contexto = canvas.getContext('2d');
    var arrastando = -1;
    var parametros;
    var pontosIniciais;
    var limites;

    if (modo === 'linear') {
      parametros = [0.60, 0.40]; // [m, b]
      pontosIniciais = [[-4,-2.4],[-3,-0.8],[-2,-1.1],[-1,0.3],[0,0.8],[1,0.7],[2,2.1],[3,2.4],[4,3.2]];
      limites = [-5, 5, -6, 7];
    } else {
      parametros = [0.35, -0.55, 0.50]; // [a, b, c]
      pontosIniciais = [[-4,8.4],[-3,5.3],[-2,3.1],[-1,1.8],[0,0.8],[1,0.3],[2,1.2],[3,2.7],[4,5.4]];
      limites = [-5, 5, -2, 12];
    }

    var pontos = copiarPontos(pontosIniciais);
    var entradas = laboratorio.querySelectorAll('[data-param]');

    function copiarPontos(origem) {
      var copia = [];
      for (var i = 0; i < origem.length; i++) copia.push([origem[i][0], origem[i][1]]);
      return copia;
    }

    function limitar(valor, minimo, maximo) {
      if (valor < minimo) return minimo;
      if (valor > maximo) return maximo;
      return valor;
    }

    function numero(valor, casas) {
      return Number(valor).toLocaleString('pt-BR', {minimumFractionDigits: casas, maximumFractionDigits: casas});
    }

    // Forward: aplica a função matemática atual e produz ŷ.
    function prever(x) {
      if (modo === 'linear') return parametros[0] * x + parametros[1];
      return parametros[0] * x * x + parametros[1] * x + parametros[2];
    }

    function lerParametrosDaTela() {
      for (var i = 0; i < entradas.length; i++) {
        var posicao = Number(entradas[i].getAttribute('data-param'));
        parametros[posicao] = Number(entradas[i].value);
      }
    }

    function escreverParametrosNaTela() {
      for (var i = 0; i < entradas.length; i++) {
        var posicao = Number(entradas[i].getAttribute('data-param'));
        // Se OLS encontrar um valor fora do slider original, ampliamos o
        // controle em vez de alterar a resposta matemática calculada.
        if (parametros[posicao] < Number(entradas[i].min)) entradas[i].min = parametros[posicao];
        if (parametros[posicao] > Number(entradas[i].max)) entradas[i].max = parametros[posicao];
        entradas[i].value = parametros[posicao];
        laboratorio.querySelector('[data-param-value="' + posicao + '"]').textContent = numero(parametros[posicao], 2);
      }
    }

    // Soma os resíduos quadráticos e calcula MSE e R².
    function calcularMetricas() {
      var somaY = 0;
      var i;
      for (i = 0; i < pontos.length; i++) somaY += pontos[i][1];
      var mediaY = somaY / pontos.length;
      var sse = 0;
      var somaTotal = 0;
      for (i = 0; i < pontos.length; i++) {
        var erro = pontos[i][1] - prever(pontos[i][0]);
        sse += erro * erro;
        var distanciaMedia = pontos[i][1] - mediaY;
        somaTotal += distanciaMedia * distanciaMedia;
      }
      return [sse, sse / pontos.length, somaTotal === 0 ? 1 : 1 - sse / somaTotal];
    }

    function atualizarResultados() {
      escreverParametrosNaTela();
      var metricas = calcularMetricas();
      laboratorio.querySelector('[data-metric="sse"]').textContent = numero(metricas[0], 3);
      laboratorio.querySelector('[data-metric="mse"]').textContent = numero(metricas[1], 3);
      laboratorio.querySelector('[data-metric="r2"]').textContent = numero(metricas[2], 3);
      if (modo === 'linear') laboratorio.querySelector('[data-current-equation]').textContent = 'ŷ = ' + numero(parametros[0], 2) + 'x + (' + numero(parametros[1], 2) + ')';
      else laboratorio.querySelector('[data-current-equation]').textContent = 'ŷ = ' + numero(parametros[0], 2) + 'x² + (' + numero(parametros[1], 2) + ')x + (' + numero(parametros[2], 2) + ')';
      atualizarTabela();
      desenhar();
    }

    function atualizarTabela() {
      var corpo = laboratorio.querySelector('[data-points-table]');
      while (corpo.firstChild) corpo.removeChild(corpo.firstChild);
      for (var i = 0; i < pontos.length; i++) {
        var estimativa = prever(pontos[i][0]);
        var residuo = pontos[i][1] - estimativa;
        var valores = [i + 1, numero(pontos[i][0],1), numero(pontos[i][1],1), numero(estimativa,2), numero(residuo,2), numero(residuo*residuo,3)];
        var linha = corpo.insertRow();
        for (var coluna = 0; coluna < valores.length; coluna++) linha.insertCell().textContent = valores[coluna];
      }
    }

    // Converte coordenadas matemáticas em pixels e vice-versa.
    function criarEscala(largura, altura) {
      var margem = [24, 25, 48, 58];
      var areaLargura = largura - margem[1] - margem[3];
      var areaAltura = altura - margem[0] - margem[2];
      return {
        xParaPixel: function (x) { return margem[3] + (x - limites[0]) * areaLargura / (limites[1] - limites[0]); },
        yParaPixel: function (y) { return margem[0] + (limites[3] - y) * areaAltura / (limites[3] - limites[2]); },
        pixelParaX: function (pixel) { return limites[0] + (pixel - margem[3]) * (limites[1] - limites[0]) / areaLargura; },
        pixelParaY: function (pixel) { return limites[3] - (pixel - margem[0]) * (limites[3] - limites[2]) / areaAltura; }
      };
    }

    function ajustarCanvas() {
      var proporcao = window.devicePixelRatio || 1;
      var largura = canvas.clientWidth;
      var altura = canvas.clientHeight;
      canvas.width = Math.round(largura * proporcao);
      canvas.height = Math.round(altura * proporcao);
      contexto.setTransform(proporcao, 0, 0, proporcao, 0, 0);
      return [largura, altura];
    }

    function desenhar() {
      var tamanho = ajustarCanvas();
      var largura = tamanho[0];
      var altura = tamanho[1];
      var escala = criarEscala(largura, altura);
      contexto.clearRect(0, 0, largura, altura);
      contexto.fillStyle = '#fbfcff';
      contexto.fillRect(0, 0, largura, altura);
      contexto.font = '12px Manrope, Arial';

      // Grade, eixos e números de x.
      contexto.textAlign = 'center'; contexto.textBaseline = 'top';
      for (var x = Math.ceil(limites[0]); x <= limites[1]; x++) {
        var px = escala.xParaPixel(x);
        contexto.strokeStyle = x === 0 ? '#59647a' : '#e1e5ef'; contexto.lineWidth = x === 0 ? 2 : 1;
        contexto.beginPath(); contexto.moveTo(px, 24); contexto.lineTo(px, altura - 48); contexto.stroke();
        contexto.fillStyle = '#59647a'; contexto.fillText(String(x), px, altura - 39);
      }

      // Grade, eixos e números de y.
      contexto.textAlign = 'right'; contexto.textBaseline = 'middle';
      var passoY = modo === 'linear' ? 1 : 2;
      for (var y = Math.ceil(limites[2] / passoY) * passoY; y <= limites[3]; y += passoY) {
        var py = escala.yParaPixel(y);
        contexto.strokeStyle = y === 0 ? '#59647a' : '#e1e5ef'; contexto.lineWidth = y === 0 ? 2 : 1;
        contexto.beginPath(); contexto.moveTo(58, py); contexto.lineTo(largura - 25, py); contexto.stroke();
        contexto.fillStyle = '#59647a'; contexto.fillText(String(y), 48, py);
      }

      // Linha tracejada = resíduo eᵢ = yᵢ − ŷᵢ.
      contexto.setLineDash([5, 4]); contexto.strokeStyle = '#e06c37'; contexto.lineWidth = 2;
      for (var i = 0; i < pontos.length; i++) {
        var pontoX = escala.xParaPixel(pontos[i][0]);
        contexto.beginPath(); contexto.moveTo(pontoX, escala.yParaPixel(pontos[i][1])); contexto.lineTo(pontoX, escala.yParaPixel(prever(pontos[i][0]))); contexto.stroke();
      }
      contexto.setLineDash([]);

      // Desenha a reta ou a parábola prevista.
      contexto.strokeStyle = '#4e46e5'; contexto.lineWidth = 4; contexto.beginPath();
      for (var pixel = 58; pixel <= largura - 25; pixel += 2) {
        var valorY = escala.yParaPixel(prever(escala.pixelParaX(pixel)));
        if (pixel === 58) contexto.moveTo(pixel, valorY); else contexto.lineTo(pixel, valorY);
      }
      contexto.stroke();

      // Desenha os pontos que podem ser arrastados.
      for (var p = 0; p < pontos.length; p++) {
        contexto.beginPath(); contexto.arc(escala.xParaPixel(pontos[p][0]), escala.yParaPixel(pontos[p][1]), p === arrastando ? 9 : 7, 0, Math.PI * 2);
        contexto.fillStyle = p === arrastando ? '#e06c37' : '#ffffff'; contexto.fill();
        contexto.strokeStyle = p === arrastando ? '#b8582e' : '#4e46e5'; contexto.lineWidth = 4; contexto.stroke();
      }
    }

    function posicaoDoEvento(evento) {
      var retangulo = canvas.getBoundingClientRect();
      return [evento.clientX - retangulo.left, evento.clientY - retangulo.top];
    }

    function encontrarPonto(pixelX, pixelY) {
      var escala = criarEscala(canvas.clientWidth, canvas.clientHeight);
      var menorDistancia = 18;
      var escolhido = -1;
      for (var i = 0; i < pontos.length; i++) {
        var dx = escala.xParaPixel(pontos[i][0]) - pixelX;
        var dy = escala.yParaPixel(pontos[i][1]) - pixelY;
        var distancia = Math.sqrt(dx * dx + dy * dy);
        if (distancia < menorDistancia) { menorDistancia = distancia; escolhido = i; }
      }
      return escolhido;
    }

    canvas.addEventListener('pointerdown', function (evento) {
      var posicao = posicaoDoEvento(evento);
      arrastando = encontrarPonto(posicao[0], posicao[1]);
      if (arrastando >= 0) { canvas.setPointerCapture(evento.pointerId); evento.preventDefault(); desenhar(); }
    });
    canvas.addEventListener('pointermove', function (evento) {
      if (arrastando < 0) return;
      var posicao = posicaoDoEvento(evento);
      var escala = criarEscala(canvas.clientWidth, canvas.clientHeight);
      pontos[arrastando][0] = Math.round(limitar(escala.pixelParaX(posicao[0]), limites[0], limites[1]) * 10) / 10;
      pontos[arrastando][1] = Math.round(limitar(escala.pixelParaY(posicao[1]), limites[2], limites[3]) * 10) / 10;
      atualizarResultados();
    });
    function terminarArraste() { arrastando = -1; desenhar(); }
    canvas.addEventListener('pointerup', terminarArraste);
    canvas.addEventListener('pointercancel', terminarArraste);

    // Fórmulas diretas da regressão linear simples.
    function calcularOlsLinear() {
      var somaX = 0, somaY = 0, i;
      for (i = 0; i < pontos.length; i++) { somaX += pontos[i][0]; somaY += pontos[i][1]; }
      var mediaX = somaX / pontos.length;
      var mediaY = somaY / pontos.length;
      var numerador = 0, denominador = 0;
      for (i = 0; i < pontos.length; i++) {
        numerador += (pontos[i][0] - mediaX) * (pontos[i][1] - mediaY);
        denominador += (pontos[i][0] - mediaX) * (pontos[i][0] - mediaX);
      }
      if (denominador === 0) return;
      parametros[0] = numerador / denominador;
      parametros[1] = mediaY - parametros[0] * mediaX;
      laboratorio.querySelector('[data-calculation]').innerHTML = '<b>OLS com todos os pontos:</b><br>x̄ = ' + numero(mediaX,3) + ' · ȳ = ' + numero(mediaY,3) + '<br>Σ(xᵢ−x̄)(yᵢ−ȳ) = ' + numero(numerador,3) + '<br>Σ(xᵢ−x̄)² = ' + numero(denominador,3) + '<br>m = ' + numero(numerador,3) + ' ÷ ' + numero(denominador,3) + ' = <strong>' + numero(parametros[0],3) + '</strong><br>b = ȳ − m·x̄ = <strong>' + numero(parametros[1],3) + '</strong>';
    }

    // Eliminação de Gauss para resolver o sistema 3 × 3 da parábola.
    function resolverSistema(matriz) {
      for (var coluna = 0; coluna < 3; coluna++) {
        var maior = coluna;
        for (var linha = coluna + 1; linha < 3; linha++) if (Math.abs(matriz[linha][coluna]) > Math.abs(matriz[maior][coluna])) maior = linha;
        var temporaria = matriz[coluna]; matriz[coluna] = matriz[maior]; matriz[maior] = temporaria;
        var pivo = matriz[coluna][coluna];
        if (Math.abs(pivo) < 0.0000001) return null;
        for (var item = coluna; item <= 3; item++) matriz[coluna][item] /= pivo;
        for (linha = 0; linha < 3; linha++) {
          if (linha === coluna) continue;
          var fator = matriz[linha][coluna];
          for (item = coluna; item <= 3; item++) matriz[linha][item] -= fator * matriz[coluna][item];
        }
      }
      return [matriz[0][3], matriz[1][3], matriz[2][3]];
    }

    // Equações normais para ŷ = ax² + bx + c.
    function calcularOlsQuadratico() {
      var n = pontos.length;
      var sx=0, sx2=0, sx3=0, sx4=0, sy=0, sxy=0, sx2y=0;
      for (var i = 0; i < n; i++) {
        var x=pontos[i][0], y=pontos[i][1];
        sx+=x; sx2+=x*x; sx3+=x*x*x; sx4+=x*x*x*x; sy+=y; sxy+=x*y; sx2y+=x*x*y;
      }
      var solucao = resolverSistema([[sx4,sx3,sx2,sx2y],[sx3,sx2,sx,sxy],[sx2,sx,n,sy]]);
      if (!solucao) return;
      parametros[0]=solucao[0]; parametros[1]=solucao[1]; parametros[2]=solucao[2];
      laboratorio.querySelector('[data-calculation]').innerHTML = '<b>OLS polinomial:</b> criamos a coluna x² e resolvemos três equações normais simultaneamente.<br><span class="reg-matrix">['+numero(sx4,2)+' &nbsp; '+numero(sx3,2)+' &nbsp; '+numero(sx2,2)+'] [a] &nbsp; ['+numero(sx2y,2)+']<br>['+numero(sx3,2)+' &nbsp; '+numero(sx2,2)+' &nbsp; '+numero(sx,2)+'] [b] = ['+numero(sxy,2)+']<br>['+numero(sx2,2)+' &nbsp; '+numero(sx,2)+' &nbsp; '+n+'] [c] &nbsp; ['+numero(sy,2)+']</span><br>Resultado: a = <strong>'+numero(parametros[0],3)+'</strong>, b = <strong>'+numero(parametros[1],3)+'</strong>, c = <strong>'+numero(parametros[2],3)+'</strong>.';
    }

    // Uma atualização: derivadas do MSE e correção dos coeficientes.
    function passoDoGradiente(taxa) {
      var gradientes = modo === 'linear' ? [0,0] : [0,0,0];
      for (var i = 0; i < pontos.length; i++) {
        var x = pontos[i][0];
        var erro = prever(x) - pontos[i][1];
        if (modo === 'linear') {
          gradientes[0] += 2 * erro * x / pontos.length;
          gradientes[1] += 2 * erro / pontos.length;
        } else {
          gradientes[0] += 2 * erro * x * x / pontos.length;
          gradientes[1] += 2 * erro * x / pontos.length;
          gradientes[2] += 2 * erro / pontos.length;
        }
      }
      for (var parametro = 0; parametro < parametros.length; parametro++) parametros[parametro] -= taxa * gradientes[parametro];
    }

    function executarGradiente(quantidade) {
      var taxa = Number(laboratorio.querySelector('[data-learning-rate]').value);
      for (var passo = 0; passo < quantidade; passo++) passoDoGradiente(taxa);
      laboratorio.querySelector('[data-calculation]').innerHTML = '<b>Gradiente descendente:</b> ' + quantidade + ' atualização(ões) com η = ' + numero(taxa,4) + '. Cada coeficiente caminhou na direção contrária à derivada para reduzir o MSE.';
    }

    function executarAteConvergir() {
      var taxa = Number(laboratorio.querySelector('[data-learning-rate]').value);
      var mseAnterior = calcularMetricas()[1];
      var estavel = 0;
      var passo;
      for (passo = 1; passo <= 5000; passo++) {
        passoDoGradiente(taxa);
        var mseAtual = calcularMetricas()[1];
        if (!isFinite(mseAtual)) break;
        if (Math.abs(mseAnterior - mseAtual) < 0.00000001) estavel++;
        else estavel = 0;
        mseAnterior = mseAtual;
        if (estavel >= 20) break;
      }
      laboratorio.querySelector('[data-calculation]').innerHTML = '<b>Treino até convergir:</b> ' + passo + ' atualizações com η = ' + numero(taxa,4) + '. O processo parou quando a variação do MSE permaneceu menor que 0,00000001 por 20 passos, ou ao atingir o limite de segurança.';
    }

    for (var entrada = 0; entrada < entradas.length; entrada++) {
      entradas[entrada].addEventListener('input', function () {
        lerParametrosDaTela();
        laboratorio.querySelector('[data-calculation]').innerHTML = '<b>Ajuste manual:</b> os coeficientes mudaram. Compare a função, os resíduos e o MSE.';
        atualizarResultados();
      });
    }
    laboratorio.querySelector('[data-action="ols"]').addEventListener('click', function () { if (modo === 'linear') calcularOlsLinear(); else calcularOlsQuadratico(); atualizarResultados(); });
    laboratorio.querySelector('[data-action="gradient-one"]').addEventListener('click', function () { executarGradiente(1); atualizarResultados(); });
    laboratorio.querySelector('[data-action="gradient-many"]').addEventListener('click', function () { executarGradiente(100); atualizarResultados(); });
    laboratorio.querySelector('[data-action="gradient-converge"]').addEventListener('click', function () { executarAteConvergir(); atualizarResultados(); });
    laboratorio.querySelector('[data-action="add-point"]').addEventListener('click', function () {
      if (pontos.length >= 15) return;
      var novoX = -4 + Math.random() * 8;
      var novoY = prever(novoX) + (-1 + Math.random() * 2);
      pontos.push([Math.round(novoX*10)/10, Math.round(limitar(novoY,limites[2],limites[3])*10)/10]);
      atualizarResultados();
    });
    laboratorio.querySelector('[data-action="remove-point"]').addEventListener('click', function () { if (pontos.length > (modo === 'linear' ? 2 : 3)) pontos.pop(); atualizarResultados(); });
    laboratorio.querySelector('[data-action="reset"]').addEventListener('click', function () {
      pontos = copiarPontos(pontosIniciais);
      parametros = modo === 'linear' ? [0.60,0.40] : [0.35,-0.55,0.50];
      laboratorio.querySelector('[data-calculation]').innerHTML = '<b>Exemplo reiniciado.</b> Arraste os pontos, altere os coeficientes ou escolha um método de cálculo.';
      atualizarResultados();
    });
    window.addEventListener('resize', desenhar);
    atualizarResultados();
  }
}());
