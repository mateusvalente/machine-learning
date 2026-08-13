(function () {
  'use strict';

  /* ================================================================
     ÁRVORE DE DECISÃO DIDÁTICA IMPLEMENTADA DO ZERO
     Colunas 0 e 1: numéricas. Colunas 2 e 3: categorias em texto.
     Coluna 4: classe esperada (Sim ou Não).
     ================================================================ */
  var dadosIniciais = [
    [22, 1, 'Básico', 'Norte', 'Não'],
    [25, 2, 'Básico', 'Sul', 'Não'],
    [29, 2, 'Premium', 'Norte', 'Sim'],
    [31, 3, 'Intermediário', 'Sul', 'Sim'],
    [35, 1, 'Premium', 'Leste', 'Não'],
    [38, 5, 'Premium', 'Sul', 'Sim'],
    [41, 2, 'Intermediário', 'Norte', 'Não'],
    [44, 4, 'Intermediário', 'Sul', 'Sim'],
    [48, 6, 'Básico', 'Leste', 'Sim'],
    [52, 1, 'Premium', 'Norte', 'Não'],
    [56, 5, 'Básico', 'Sul', 'Sim'],
    [61, 3, 'Intermediário', 'Leste', 'Não']
  ];
  var nomes = ['idade', 'visitas', 'plano', 'região'];
  var tipos = ['numero', 'numero', 'categoria', 'categoria'];
  var dados = copiarMatriz(dadosIniciais);
  var arvoreCompleta = null;
  var totalDivisoes = 0;
  var divisoesVisiveis = 0;
  var historico = [];
  var noInspecionado = null;
  var canvas = document.getElementById('treeCanvas');
  var canvasHistorico = document.getElementById('treeHistory');
  if (!canvas || !canvasHistorico) return;

  function copiarMatriz(matriz) {
    var copia = [];
    for (var i = 0; i < matriz.length; i++) {
      copia[i] = [];
      for (var j = 0; j < matriz[i].length; j++) copia[i][j] = matriz[i][j];
    }
    return copia;
  }

  function formatar(valor, casas) {
    var seguro = Math.abs(valor) < 0.0000001 ? 0 : valor;
    return seguro.toFixed(casas).replace('.', ',');
  }

  function normalizarClasse(valor) {
    var texto = String(valor).trim().toLowerCase();
    return texto === 'sim' ? 'Sim' : texto === 'não' || texto === 'nao' ? 'Não' : '';
  }

  function contarClasse(linhas, classe) {
    var quantidade = 0;
    for (var i = 0; i < linhas.length; i++) if (linhas[i][4] === classe) quantidade++;
    return quantidade;
  }

  function classeMajoritaria(linhas) {
    var sim = contarClasse(linhas, 'Sim');
    var nao = linhas.length - sim;
    return sim >= nao ? 'Sim' : 'Não';
  }

  /* Gini(S) = 1 - p(Sim)^2 - p(Não)^2. */
  function calcularGini(linhas) {
    if (linhas.length === 0) return 0;
    var sim = contarClasse(linhas, 'Sim');
    var nao = linhas.length - sim;
    var pSim = sim / linhas.length;
    var pNao = nao / linhas.length;
    return 1 - pSim * pSim - pNao * pNao;
  }

  function contem(vetor, valor) {
    for (var i = 0; i < vetor.length; i++) if (vetor[i] === valor) return true;
    return false;
  }

  function ordenarNumeros(vetor) {
    for (var i = 0; i < vetor.length; i++) {
      for (var j = i + 1; j < vetor.length; j++) {
        if (vetor[j] < vetor[i]) {
          var temporario = vetor[i]; vetor[i] = vetor[j]; vetor[j] = temporario;
        }
      }
    }
  }

  /*
     Para números, os candidatos são os pontos médios entre valores distintos.
     Para texto, cada valor distinto gera a pergunta coluna = categoria?
  */
  function criarCandidatos(linhas) {
    var candidatos = [];
    for (var coluna = 0; coluna < 4; coluna++) {
      var valores = [];
      for (var i = 0; i < linhas.length; i++) if (!contem(valores, linhas[i][coluna])) valores[valores.length] = linhas[i][coluna];
      if (tipos[coluna] === 'numero') {
        ordenarNumeros(valores);
        for (i = 0; i < valores.length - 1; i++) {
          var limite = (valores[i] + valores[i + 1]) / 2;
          candidatos[candidatos.length] = [coluna, 'numero', limite];
        }
      } else {
        for (i = 0; i < valores.length; i++) candidatos[candidatos.length] = [coluna, 'categoria', valores[i]];
      }
    }
    return candidatos;
  }

  function atendePergunta(linha, candidato) {
    if (candidato[1] === 'numero') return linha[candidato[0]] <= candidato[2];
    return linha[candidato[0]] === candidato[2];
  }

  function separar(linhas, candidato) {
    var sim = [];
    var nao = [];
    for (var i = 0; i < linhas.length; i++) {
      if (atendePergunta(linhas[i], candidato)) sim[sim.length] = linhas[i];
      else nao[nao.length] = linhas[i];
    }
    return [sim, nao];
  }

  function textoPergunta(candidato) {
    if (candidato[1] === 'numero') return nomes[candidato[0]] + ' ≤ ' + formatar(candidato[2], 1) + '?';
    return nomes[candidato[0]] + ' = “' + candidato[2] + '”?';
  }

  /* Avalia todos os candidatos e guarda as contas para a tabela didática. */
  function melhorDivisao(linhas) {
    var giniPai = calcularGini(linhas);
    var candidatos = criarCandidatos(linhas);
    var avaliacoes = [];
    var melhor = null;
    for (var i = 0; i < candidatos.length; i++) {
      var grupos = separar(linhas, candidatos[i]);
      if (grupos[0].length === 0 || grupos[1].length === 0) continue;
      var giniSim = calcularGini(grupos[0]);
      var giniNao = calcularGini(grupos[1]);
      var pesoSim = grupos[0].length / linhas.length;
      var pesoNao = grupos[1].length / linhas.length;
      var ponderado = pesoSim * giniSim + pesoNao * giniNao;
      var ganho = giniPai - ponderado;
      var avaliacao = [candidatos[i], grupos[0], grupos[1], giniSim, giniNao, ponderado, ganho];
      avaliacoes[avaliacoes.length] = avaliacao;
      if (!melhor || ganho > melhor[6]) melhor = avaliacao;
    }
    return [melhor, avaliacoes, giniPai];
  }

  function criarFolha(linhas, profundidade, motivo) {
    return {
      folha: true,
      classe: classeMajoritaria(linhas),
      linhas: linhas,
      profundidade: profundidade,
      gini: calcularGini(linhas),
      motivo: motivo,
      ordem: -1
    };
  }

  /* Constrói toda a árvore; a propriedade ordem permite revelá-la aos poucos. */
  function construirNo(linhas, profundidade, maxProfundidade, minimo) {
    var gini = calcularGini(linhas);
    if (gini === 0) return criarFolha(linhas, profundidade, 'nó puro');
    if (profundidade >= maxProfundidade) return criarFolha(linhas, profundidade, 'profundidade máxima');
    if (linhas.length < minimo * 2) return criarFolha(linhas, profundidade, 'poucas amostras');
    var busca = melhorDivisao(linhas);
    var melhor = busca[0];
    if (!melhor || melhor[6] <= 0.0000001) return criarFolha(linhas, profundidade, 'sem ganho');
    if (melhor[1].length < minimo || melhor[2].length < minimo) return criarFolha(linhas, profundidade, 'filho menor que o mínimo');
    var no = {
      folha: false,
      linhas: linhas,
      profundidade: profundidade,
      gini: gini,
      candidato: melhor[0],
      esquerda: null,
      direita: null,
      avaliacoes: busca[1],
      melhor: melhor,
      ordem: totalDivisoes
    };
    totalDivisoes++;
    no.esquerda = construirNo(melhor[1], profundidade + 1, maxProfundidade, minimo);
    no.direita = construirNo(melhor[2], profundidade + 1, maxProfundidade, minimo);
    return no;
  }

  function profundidadeDaArvore(no) {
    if (!no || no.folha) return no ? no.profundidade : 0;
    var esquerda = profundidadeDaArvore(no.esquerda);
    var direita = profundidadeDaArvore(no.direita);
    return esquerda > direita ? esquerda : direita;
  }

  /* Quando uma divisão ainda não foi revelada, o nó prevê pela maioria local. */
  function classificarComLimite(linha, limite, caminho) {
    var no = arvoreCompleta;
    while (no && !no.folha && no.ordem < limite) {
      var resposta = atendePergunta(linha, no.candidato);
      if (caminho) caminho[caminho.length] = textoPergunta(no.candidato) + ' ' + (resposta ? 'Sim' : 'Não');
      no = resposta ? no.esquerda : no.direita;
    }
    if (!no) return 'Não';
    if (no.folha) return no.classe;
    return classeMajoritaria(no.linhas);
  }

  function calcularAcuracia(limite) {
    if (!arvoreCompleta || dados.length === 0) return 0;
    var acertos = 0;
    for (var i = 0; i < dados.length; i++) if (classificarComLimite(dados[i], limite, null) === dados[i][4]) acertos++;
    return acertos / dados.length;
  }

  function linhaVazia() {
    return [30, 2, 'Básico', 'Norte', 'Não'];
  }

  function renderizarTabelaDados() {
    var corpo = document.getElementById('treeDataBody');
    var html = '';
    for (var i = 0; i < dados.length; i++) {
      html += '<tr data-row="' + i + '">' +
        '<td><input data-column="0" value="' + dados[i][0] + '" inputmode="decimal"></td>' +
        '<td><input data-column="1" value="' + dados[i][1] + '" inputmode="numeric"></td>' +
        '<td><input data-column="2" value="' + dados[i][2] + '"></td>' +
        '<td><input data-column="3" value="' + dados[i][3] + '"></td>' +
        '<td><select data-column="4"><option' + (dados[i][4] === 'Sim' ? ' selected' : '') + '>Sim</option><option' + (dados[i][4] === 'Não' ? ' selected' : '') + '>Não</option></select></td>' +
        '<td><button class="tree-remove-row" type="button" data-remove="' + i + '" aria-label="Remover linha ' + (i + 1) + '"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button></td></tr>';
    }
    corpo.innerHTML = html;
  }

  function lerTabela() {
    var linhasHtml = document.querySelectorAll('#treeDataBody tr');
    var novosDados = [];
    for (var i = 0; i < linhasHtml.length; i++) {
      var campos = linhasHtml[i].querySelectorAll('input,select');
      var idade = Number(campos[0].value.replace(',', '.'));
      var visitas = Number(campos[1].value.replace(',', '.'));
      var plano = campos[2].value.trim();
      var regiao = campos[3].value.trim();
      var classe = normalizarClasse(campos[4].value);
      if (!isFinite(idade) || !isFinite(visitas) || !plano || !regiao || !classe) {
        document.getElementById('treeValidation').className = 'tree-validation error';
        document.getElementById('treeValidation').textContent = 'Corrija a linha ' + (i + 1) + ': idade e visitas devem ser números; plano, região e classe não podem ficar vazios.';
        return false;
      }
      novosDados[novosDados.length] = [idade, visitas, plano, regiao, classe];
    }
    if (novosDados.length < 4) {
      document.getElementById('treeValidation').className = 'tree-validation error';
      document.getElementById('treeValidation').textContent = 'Use pelo menos quatro linhas para construir uma árvore didática.';
      return false;
    }
    if (contarClasse(novosDados, 'Sim') === 0 || contarClasse(novosDados, 'Não') === 0) {
      document.getElementById('treeValidation').className = 'tree-validation error';
      document.getElementById('treeValidation').textContent = 'Inclua pelo menos um exemplo de cada classe: Sim e Não.';
      return false;
    }
    dados = novosDados;
    document.getElementById('treeValidation').className = 'tree-validation';
    document.getElementById('treeValidation').textContent = dados.length + ' linhas válidas · números usados como limiares · textos comparados por igualdade.';
    return true;
  }

  function prepararArvore() {
    if (!lerTabela()) return false;
    totalDivisoes = 0;
    var maxProfundidade = Number(document.getElementById('treeMaxDepth').value);
    var minimo = Number(document.getElementById('treeMinSamples').value);
    arvoreCompleta = construirNo(dados, 0, maxProfundidade, minimo);
    divisoesVisiveis = 0;
    noInspecionado = arvoreCompleta && !arvoreCompleta.folha ? arvoreCompleta : null;
    historico = [];
    registrarHistorico();
    return true;
  }

  function registrarHistorico() {
    var acuracia = calcularAcuracia(divisoesVisiveis);
    historico[historico.length] = [divisoesVisiveis, 1 - acuracia, acuracia];
  }

  function encontrarNoPorOrdem(no, ordem) {
    if (!no || no.folha) return null;
    if (no.ordem === ordem) return no;
    var esquerda = encontrarNoPorOrdem(no.esquerda, ordem);
    if (esquerda) return esquerda;
    return encontrarNoPorOrdem(no.direita, ordem);
  }

  function treinarUmaDivisao() {
    if (!preparadaOuPreparar()) return;
    if (divisoesVisiveis < totalDivisoes) {
      noInspecionado = encontrarNoPorOrdem(arvoreCompleta, divisoesVisiveis);
      divisoesVisiveis++;
      registrarHistorico();
    }
    renderizarTudo();
  }

  function preparadaOuPreparar() {
    if (arvoreCompleta) return true;
    return prepararArvore();
  }

  function contarNosVisiveis(no) {
    if (!no) return 0;
    if (no.folha || no.ordem >= divisoesVisiveis) return 1;
    return 1 + contarNosVisiveis(no.esquerda) + contarNosVisiveis(no.direita);
  }

  function desenharLinha(ctx, x1, y1, x2, y2, texto, tracejada) {
    ctx.save();
    ctx.strokeStyle = tracejada ? '#aab2c1' : '#808ba0';
    ctx.lineWidth = 2;
    ctx.setLineDash(tracejada ? [8, 7] : []);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#59647a'; ctx.font = '800 14px Manrope'; ctx.textAlign = 'center';
    ctx.fillText(texto, (x1 + x2) / 2 + (texto === 'Sim' ? -13 : 13), (y1 + y2) / 2 - 7);
    ctx.restore();
  }

  function desenharCaixa(ctx, x, y, largura, altura, cor, fundo, titulo, linhas) {
    ctx.save();
    ctx.fillStyle = fundo; ctx.strokeStyle = cor; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(x - largura / 2, y, largura, altura, 12); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#202940'; ctx.font = '850 16px Manrope'; ctx.fillText(titulo, x, y + 27);
    ctx.fillStyle = '#59647a'; ctx.font = '700 13px DM Mono';
    for (var i = 0; i < linhas.length; i++) ctx.fillText(linhas[i], x, y + 51 + i * 18);
    ctx.restore();
  }

  function desenharSubarvore(ctx, no, esquerda, direita, y, passoY) {
    if (!no) return;
    var x = (esquerda + direita) / 2;
    var largura = Math.min(210, Math.max(150, direita - esquerda - 18));
    var aberto = !no.folha && no.ordem < divisoesVisiveis;
    if (no.folha) {
      var corFolha = no.classe === 'Sim' ? '#0fa287' : '#df5278';
      var fundoFolha = no.classe === 'Sim' ? '#e8f8f4' : '#fff0f3';
      desenharCaixa(ctx, x, y, largura, 92, corFolha, fundoFolha, 'Previsão: ' + no.classe, ['n = ' + no.linhas.length, 'Gini = ' + formatar(no.gini, 3)]);
      return;
    }
    if (!aberto) {
      desenharCaixa(ctx, x, y, largura, 92, '#9da6b8', '#f4f5f8', 'Ramo ainda fechado', ['prevê ' + classeMajoritaria(no.linhas), 'n = ' + no.linhas.length]);
      return;
    }
    desenharCaixa(ctx, x, y, largura, 104, '#5b4ee8', '#efefff', textoPergunta(no.candidato), ['n = ' + no.linhas.length, 'Gini = ' + formatar(no.gini, 3), 'ganho = ' + formatar(no.melhor[6], 3)]);
    var meio = (esquerda + direita) / 2;
    var xEsquerda = (esquerda + meio) / 2;
    var xDireita = (meio + direita) / 2;
    desenharLinha(ctx, x - 22, y + 104, xEsquerda, y + passoY, 'Sim', no.esquerda && !no.esquerda.folha && no.esquerda.ordem >= divisoesVisiveis);
    desenharLinha(ctx, x + 22, y + 104, xDireita, y + passoY, 'Não', no.direita && !no.direita.folha && no.direita.ordem >= divisoesVisiveis);
    desenharSubarvore(ctx, no.esquerda, esquerda, meio, y + passoY, passoY);
    desenharSubarvore(ctx, no.direita, meio, direita, y + passoY, passoY);
  }

  function desenharArvore() {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fbfcff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#667087'; ctx.font = '750 14px Manrope'; ctx.textAlign = 'left';
    ctx.fillText('A pergunta direciona “Sim” para a esquerda e “Não” para a direita.', 25, 28);
    if (!arvoreCompleta) {
      ctx.textAlign = 'center'; ctx.font = '850 22px Manrope'; ctx.fillText('Clique em “Treinar 1 divisão” para começar.', canvas.width / 2, canvas.height / 2);
      return;
    }
    desenharSubarvore(ctx, arvoreCompleta, 15, canvas.width - 15, 55, 150);
  }

  function resumoGrupo(linhas) {
    return linhas.length + ' amostras: ' + contarClasse(linhas, 'Sim') + ' Sim e ' + contarClasse(linhas, 'Não') + ' Não';
  }

  function renderizarGini() {
    var caixa = document.getElementById('treeGiniCalculation');
    var status = document.getElementById('treeStepStatus');
    var no = noInspecionado;
    if (!no || no.folha) {
      caixa.innerHTML = '<article class="wide"><b>Nenhuma divisão disponível</b><p>O conjunto pode estar puro ou limitado pelos parâmetros de parada.</p></article>';
      status.textContent = 'Sem divisão';
      return;
    }
    var melhor = no.melhor;
    var total = no.linhas.length;
    var simPai = contarClasse(no.linhas, 'Sim');
    var naoPai = total - simPai;
    status.textContent = 'Divisão ' + (no.ordem + 1) + ' · profundidade ' + no.profundidade;
    caixa.innerHTML =
      '<article><b>1 · Contar as classes do nó</b><p>' + resumoGrupo(no.linhas) + '.</p><code>p(Sim) = ' + simPai + '/' + total + '<br>p(Não) = ' + naoPai + '/' + total + '</code></article>' +
      '<article><b>2 · Gini do nó pai</b><p>Subtraímos de 1 a soma das probabilidades ao quadrado.</p><code>Gini(pai) = 1 − (' + simPai + '/' + total + ')² − (' + naoPai + '/' + total + ')²<br>Gini(pai) = <strong>' + formatar(no.gini, 5) + '</strong></code></article>' +
      '<article><b>3 · Pergunta escolhida</b><p>Foi a candidata que produziu o maior ganho.</p><code>' + textoPergunta(no.candidato) + '<br>Sim → ' + resumoGrupo(melhor[1]) + '<br>Não → ' + resumoGrupo(melhor[2]) + '</code></article>' +
      '<article><b>4 · Gini de cada filho</b><p>Calculamos novamente a mistura dentro de cada grupo.</p><code>Gini(Sim) = ' + formatar(melhor[3], 5) + '<br>Gini(Não) = ' + formatar(melhor[4], 5) + '</code></article>' +
      '<article class="wide"><b>5 · Somatória ponderada e ganho</b><p>Cada Gini filho é multiplicado pela fração de amostras que recebeu. Finalmente, subtraímos esse resultado do Gini do pai.</p><code>Gini_div = (' + melhor[1].length + '/' + total + ') × ' + formatar(melhor[3], 5) + ' + (' + melhor[2].length + '/' + total + ') × ' + formatar(melhor[4], 5) + '<br>Gini_div = <strong>' + formatar(melhor[5], 5) + '</strong><br>ganho = ' + formatar(no.gini, 5) + ' − ' + formatar(melhor[5], 5) + ' = <strong>' + formatar(melhor[6], 5) + '</strong></code></article>';
  }

  function renderizarCandidatos() {
    var corpo = document.getElementById('treeCandidateBody');
    var no = noInspecionado;
    if (!no || no.folha) {
      corpo.innerHTML = '<tr><td colspan="6">Treine uma divisão para ver os candidatos avaliados.</td></tr>';
      return;
    }
    var avaliacoes = no.avaliacoes;
    var html = '';
    for (var i = 0; i < avaliacoes.length; i++) {
      var a = avaliacoes[i];
      var melhor = a === no.melhor;
      html += '<tr' + (melhor ? ' class="best"' : '') + '><td>' + nomes[a[0][0]] + '</td><td>' + textoPergunta(a[0]) + '</td><td>' + a[1].length + ' · Gini ' + formatar(a[3], 3) + '</td><td>' + a[2].length + ' · Gini ' + formatar(a[4], 3) + '</td><td>' + formatar(a[5], 5) + '</td><td>' + formatar(a[6], 5) + (melhor ? ' ✓' : '') + '</td></tr>';
    }
    corpo.innerHTML = html;
  }

  function desenharHistorico() {
    var ctx = canvasHistorico.getContext('2d');
    var esquerda = 68, direita = 30, topo = 28, base = 58;
    ctx.clearRect(0, 0, canvasHistorico.width, canvasHistorico.height);
    ctx.fillStyle = '#fbfcff'; ctx.fillRect(0, 0, canvasHistorico.width, canvasHistorico.height);
    ctx.font = '700 15px Manrope'; ctx.textAlign = 'right';
    for (var i = 0; i <= 4; i++) {
      var nivel = i / 4;
      var y = canvasHistorico.height - base - nivel * (canvasHistorico.height - topo - base);
      ctx.strokeStyle = '#e0e5ef'; ctx.beginPath(); ctx.moveTo(esquerda, y); ctx.lineTo(canvasHistorico.width - direita, y); ctx.stroke();
      ctx.fillStyle = '#667087'; ctx.fillText(formatar(nivel, 2), esquerda - 10, y + 5);
    }
    var maxX = totalDivisoes > 0 ? totalDivisoes : 1;
    ctx.textAlign = 'center';
    for (i = 0; i <= maxX; i++) {
      var x = esquerda + i / maxX * (canvasHistorico.width - esquerda - direita);
      ctx.fillText(String(i), x, canvasHistorico.height - 24);
    }
    function linha(coluna, cor) {
      ctx.beginPath(); ctx.strokeStyle = cor; ctx.lineWidth = 4;
      for (var h = 0; h < historico.length; h++) {
        var px = esquerda + historico[h][0] / maxX * (canvasHistorico.width - esquerda - direita);
        var py = canvasHistorico.height - base - historico[h][coluna] * (canvasHistorico.height - topo - base);
        if (h === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      for (h = 0; h < historico.length; h++) {
        px = esquerda + historico[h][0] / maxX * (canvasHistorico.width - esquerda - direita);
        py = canvasHistorico.height - base - historico[h][coluna] * (canvasHistorico.height - topo - base);
        ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    linha(1, '#df5278'); linha(2, '#0fa287');
    ctx.fillStyle = '#59647a'; ctx.font = '800 14px Manrope'; ctx.fillText('divisões abertas', canvasHistorico.width / 2, canvasHistorico.height - 4);
  }

  function renderizarMetricas() {
    var acuracia = arvoreCompleta ? calcularAcuracia(divisoesVisiveis) : 0;
    document.getElementById('treeVisibleSplits').textContent = String(divisoesVisiveis);
    document.getElementById('treeTotalSplits').textContent = arvoreCompleta ? String(totalDivisoes) : '0';
    document.getElementById('treeDepthMetric').textContent = arvoreCompleta ? String(profundidadeDaArvore(arvoreCompleta)) : '0';
    document.getElementById('treeAccuracy').textContent = arvoreCompleta ? formatar(acuracia * 100, 1) + '%' : '—';
    var status = document.getElementById('treeStatus');
    if (!arvoreCompleta) status.textContent = 'Pronta para treinar';
    else if (divisoesVisiveis >= totalDivisoes) status.textContent = 'Árvore concluída';
    else status.textContent = 'Próxima: divisão ' + (divisoesVisiveis + 1);
    status.className = divisoesVisiveis >= totalDivisoes && arvoreCompleta ? 'tree-status success' : 'tree-status';
    document.getElementById('treeControlReading').innerHTML = arvoreCompleta ?
      '<strong>' + contarNosVisiveis(arvoreCompleta) + '</strong> nós visíveis<br><strong>' + divisoesVisiveis + '/' + totalDivisoes + '</strong> divisões abertas<br>Erro atual: <strong>' + formatar((1 - acuracia) * 100, 1) + '%</strong>' :
      'A árvore ainda não foi construída.';
  }

  function renderizarTudo() {
    renderizarMetricas();
    desenharArvore();
    renderizarGini();
    renderizarCandidatos();
    desenharHistorico();
  }

  function invalidarArvore() {
    arvoreCompleta = null;
    totalDivisoes = 0;
    divisoesVisiveis = 0;
    noInspecionado = null;
    historico = [];
    renderizarTudo();
  }

  document.getElementById('treeAddRow').addEventListener('click', function () {
    if (!lerTabela()) return;
    dados[dados.length] = linhaVazia();
    renderizarTabelaDados(); invalidarArvore();
  });
  document.getElementById('treeDataBody').addEventListener('click', function (evento) {
    var botao = evento.target.closest('[data-remove]');
    if (!botao) return;
    var indice = Number(botao.getAttribute('data-remove'));
    var nova = [];
    for (var i = 0; i < dados.length; i++) if (i !== indice) nova[nova.length] = dados[i];
    dados = nova; renderizarTabelaDados(); invalidarArvore();
  });
  document.getElementById('treeDataBody').addEventListener('input', invalidarArvore);
  document.getElementById('treeMaxDepth').addEventListener('change', invalidarArvore);
  document.getElementById('treeMinSamples').addEventListener('change', invalidarArvore);
  document.getElementById('treeTrainStep').addEventListener('click', treinarUmaDivisao);
  document.getElementById('treeTrainAll').addEventListener('click', function () {
    if (!preparadaOuPreparar()) return;
    while (divisoesVisiveis < totalDivisoes) {
      noInspecionado = encontrarNoPorOrdem(arvoreCompleta, divisoesVisiveis);
      divisoesVisiveis++;
      registrarHistorico();
    }
    renderizarTudo();
  });
  document.getElementById('treeRestartSteps').addEventListener('click', function () {
    if (!lerTabela()) return;
    prepararArvore(); renderizarTudo();
  });
  document.getElementById('treeRestoreData').addEventListener('click', function () {
    dados = copiarMatriz(dadosIniciais); renderizarTabelaDados(); invalidarArvore();
    document.getElementById('treeValidation').className = 'tree-validation';
    document.getElementById('treeValidation').textContent = 'Dados originais restaurados.';
  });
  document.getElementById('treePredict').addEventListener('click', function () {
    if (!arvoreCompleta || divisoesVisiveis === 0) {
      document.getElementById('treePredictionResult').textContent = 'Abra pelo menos uma divisão antes de classificar.';
      return;
    }
    var linha = [Number(document.getElementById('treePredictAge').value), Number(document.getElementById('treePredictVisits').value), document.getElementById('treePredictPlan').value.trim(), document.getElementById('treePredictRegion').value.trim(), 'Não'];
    var caminho = [];
    var classe = classificarComLimite(linha, divisoesVisiveis, caminho);
    document.getElementById('treePredictionResult').innerHTML = 'Previsão: <strong>' + classe + '</strong><span class="path">' + caminho.join('<br>↓<br>') + '</span>';
  });

  renderizarTabelaDados();
  renderizarTudo();
}());
