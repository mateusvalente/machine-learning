(function () {
  'use strict';

  /* ================================================================
     LABORATÓRIO DE QUALIDADE DOS DADOS

     O código foi escrito com arrays, laços e funções pequenas para que
     cada etapa possa ser acompanhada por alunos iniciantes.
     ================================================================ */

  var cabecalhoOriginal = [
    'cliente_id', 'idade', 'renda', 'renda_anual', 'cidade',
    'pais', 'cor_favorita', 'status_pos_analise', 'aprovado'
  ];

  var dadosOriginais = [
    ['C001', '25', '2500', '30000', 'Uberaba',    'Brasil', 'Azul',     'Não', 'Não'],
    ['C002', '42', '7200', '86400', 'Uberlândia','Brasil', 'Verde',    'Sim', 'Sim'],
    ['C003', '31', '4800', '57600', 'Franca',    'Brasil', 'Azul',     'Sim', 'Sim'],
    ['C004', '20', '1800', '21600', '',          'Brasil', 'Vermelho', 'Não', 'Não'],
    ['C005', '53', '9100', '109200','Uberaba',   'Brasil', 'Verde',    'Sim', 'Sim'],
    ['C006', '37', '6100', '73200', 'Franca',    'Brasil', 'Amarelo',  'Sim', 'Sim'],
    ['C007', '29', '3200', '38400', 'Uberaba',   'Brasil', 'Roxo',     'Não', 'Não'],
    ['C008', '46', '8300', '99600', 'Goiânia',   'Brasil', 'Azul',     'Sim', 'Sim'],
    ['C009', '34', '5000', '60000', 'Goiânia',   'Brasil', 'Vermelho', 'Sim', 'Sim'],
    ['C010', '23', '2100', '25200', '',          'Brasil', 'Verde',    'Não', 'Não'],
    ['C011', '40', '6800', '81600', 'Uberlândia','Brasil', 'Azul',     'Sim', 'Sim'],
    ['C011', '40', '6800', '81600', 'Uberlândia','Brasil', 'Azul',     'Sim', 'Sim']
  ];

  var cabecalho = copiarLinha(cabecalhoOriginal);
  var dados = copiarMatriz(dadosOriginais);
  var colunasAtivas = [];
  var alvo = cabecalho.length - 1;
  var sugestoesSeguras = [];

  var tabela = document.getElementById('qualityTable');
  var relatorio = document.getElementById('qualityReport');
  var duplicatas = document.getElementById('qualityDuplicates');
  var botaoAnalisar = document.getElementById('qualityAnalyze');
  var botaoAplicar = document.getElementById('qualityApply');
  var botaoRestaurar = document.getElementById('qualityRestore');

  // Cria uma cópia de um array sem usar métodos avançados.
  function copiarLinha(linha) {
    var copia = [];
    for (var coluna = 0; coluna < linha.length; coluna++) {
      copia.push(linha[coluna]);
    }
    return copia;
  }

  // Copia a matriz para que o botão Restaurar preserve o exemplo inicial.
  function copiarMatriz(matriz) {
    var copia = [];
    for (var linha = 0; linha < matriz.length; linha++) {
      copia.push(copiarLinha(matriz[linha]));
    }
    return copia;
  }

  // Impede que um texto digitado pelo aluno seja interpretado como HTML.
  function escaparHtml(valor) {
    return String(valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function iniciarColunas() {
    colunasAtivas = [];
    for (var coluna = 0; coluna < cabecalho.length; coluna++) {
      colunasAtivas.push(true);
    }
  }

  function valorEstaAusente(valor) {
    var texto = String(valor).trim().toUpperCase();
    return texto === '' || texto === 'NA' || texto === '?' || texto === 'NULL';
  }

  // Aceita números escritos com vírgula ou ponto decimal.
  function converterParaNumero(valor) {
    if (valorEstaAusente(valor)) return null;
    var texto = String(valor).trim().replace(',', '.');
    var numero = Number(texto);
    if (isNaN(numero)) return null;
    return numero;
  }

  function obterColuna(indice) {
    var coluna = [];
    for (var linha = 0; linha < dados.length; linha++) {
      coluna.push(String(dados[linha][indice]).trim());
    }
    return coluna;
  }

  function contarValoresUnicos(coluna) {
    var unicos = [];
    for (var linha = 0; linha < coluna.length; linha++) {
      if (valorEstaAusente(coluna[linha])) continue;
      if (unicos.indexOf(coluna[linha]) === -1) unicos.push(coluna[linha]);
    }
    return unicos.length;
  }

  function calcularTaxaDeAusencia(coluna) {
    var ausentes = 0;
    for (var linha = 0; linha < coluna.length; linha++) {
      if (valorEstaAusente(coluna[linha])) ausentes = ausentes + 1;
    }
    return ausentes / coluna.length;
  }

  function colunaEhConstante(coluna) {
    return contarValoresUnicos(coluna) <= 1;
  }

  function colunaCopiaOAlvo(coluna, colunaAlvo) {
    var comparacoes = 0;
    for (var linha = 0; linha < coluna.length; linha++) {
      if (valorEstaAusente(coluna[linha]) || valorEstaAusente(colunaAlvo[linha])) continue;
      comparacoes = comparacoes + 1;
      if (coluna[linha] !== colunaAlvo[linha]) return false;
    }
    return comparacoes > 0;
  }

  function pareceIdentificador(nome, coluna) {
    var nomeMinusculo = nome.toLowerCase();
    var nomePareceId = nomeMinusculo.indexOf('_id') >= 0 || nomeMinusculo === 'id' ||
      nomeMinusculo.indexOf('codigo') >= 0 || nomeMinusculo.indexOf('matricula') >= 0;
    var proporcaoUnica = contarValoresUnicos(coluna) / coluna.length;
    return nomePareceId && proporcaoUnica >= 0.9;
  }

  function colunaEhNumerica(coluna) {
    var validos = 0;
    var numericos = 0;
    for (var linha = 0; linha < coluna.length; linha++) {
      if (valorEstaAusente(coluna[linha])) continue;
      validos = validos + 1;
      if (converterParaNumero(coluna[linha]) !== null) numericos = numericos + 1;
    }
    return validos > 0 && numericos === validos;
  }

  // Correlação de Pearson calculada passo a passo para dois vetores numéricos.
  function calcularCorrelacao(colunaA, colunaB) {
    var valoresA = [];
    var valoresB = [];
    var somaA = 0;
    var somaB = 0;

    for (var linha = 0; linha < colunaA.length; linha++) {
      var a = converterParaNumero(colunaA[linha]);
      var b = converterParaNumero(colunaB[linha]);
      if (a === null || b === null) continue;
      valoresA.push(a);
      valoresB.push(b);
      somaA = somaA + a;
      somaB = somaB + b;
    }

    if (valoresA.length < 3) return 0;

    var mediaA = somaA / valoresA.length;
    var mediaB = somaB / valoresB.length;
    var numerador = 0;
    var quadradosA = 0;
    var quadradosB = 0;

    for (var indice = 0; indice < valoresA.length; indice++) {
      var desvioA = valoresA[indice] - mediaA;
      var desvioB = valoresB[indice] - mediaB;
      numerador = numerador + desvioA * desvioB;
      quadradosA = quadradosA + desvioA * desvioA;
      quadradosB = quadradosB + desvioB * desvioB;
    }

    if (quadradosA === 0 || quadradosB === 0) return 0;
    return numerador / Math.sqrt(quadradosA * quadradosB);
  }

  // Lê de volta as células editadas antes de executar uma análise.
  function lerTabelaEditada() {
    var linhasHtml = tabela.tBodies[0].rows;
    for (var linha = 0; linha < linhasHtml.length; linha++) {
      var celulas = linhasHtml[linha].cells;
      var posicaoVisivel = 0;
      for (var coluna = 0; coluna < cabecalho.length; coluna++) {
        if (!colunasAtivas[coluna]) continue;
        dados[linha][coluna] = celulas[posicaoVisivel].textContent.trim();
        posicaoVisivel = posicaoVisivel + 1;
      }
    }
  }

  function desenharTabela() {
    var htmlCabecalho = '<tr>';
    for (var coluna = 0; coluna < cabecalho.length; coluna++) {
      if (!colunasAtivas[coluna]) continue;
      htmlCabecalho += '<th>' + escaparHtml(cabecalho[coluna]) + (coluna === alvo ? ' · y' : '') + '</th>';
    }
    htmlCabecalho += '</tr>';
    tabela.tHead.innerHTML = htmlCabecalho;

    var htmlCorpo = '';
    for (var linha = 0; linha < dados.length; linha++) {
      htmlCorpo += '<tr>';
      for (var indice = 0; indice < cabecalho.length; indice++) {
        if (!colunasAtivas[indice]) continue;
        htmlCorpo += '<td contenteditable="true">' + escaparHtml(dados[linha][indice]) + '</td>';
      }
      htmlCorpo += '</tr>';
    }
    tabela.tBodies[0].innerHTML = htmlCorpo;
  }

  function contarEntradasAtivas() {
    var quantidade = 0;
    for (var coluna = 0; coluna < alvo; coluna++) {
      if (colunasAtivas[coluna]) quantidade = quantidade + 1;
    }
    return quantidade;
  }

  function atualizarCustos() {
    var custoOriginal = dadosOriginais.length * (cabecalhoOriginal.length - 1);
    var custoAtual = dados.length * contarEntradasAtivas();
    var economia = 100 * (custoOriginal - custoAtual) / custoOriginal;
    document.getElementById('qualityRows').textContent = dados.length;
    document.getElementById('qualityColumns').textContent = contarEntradasAtivas();
    document.getElementById('qualityCells').textContent = custoAtual;
    document.getElementById('qualitySaving').textContent = economia.toFixed(1).replace('.', ',') + '%';
  }

  // Cada resultado usa um array simples:
  // [índice, nível, título, evidência, orientação, remoção segura]
  function analisarColunas() {
    var resultados = [];
    var colunaAlvo = obterColuna(alvo);
    sugestoesSeguras = [];

    for (var indice = 0; indice < alvo; indice++) {
      if (!colunasAtivas[indice]) continue;
      var coluna = obterColuna(indice);
      var ausentes = calcularTaxaDeAusencia(coluna);
      var unicos = contarValoresUnicos(coluna);
      var resultado;

      if (colunaCopiaOAlvo(coluna, colunaAlvo)) {
        resultado = [indice, 'danger', 'Vazamento do alvo', 'Os valores disponíveis são iguais ao alvo em 100% das comparações.', 'Remover de X e verificar quando essa informação passa a existir.', true];
      } else if (colunaEhConstante(coluna)) {
        resultado = [indice, 'warning', 'Coluna constante', 'Existe apenas ' + unicos + ' valor válido diferente.', 'Pode ser removida: não separa nenhum exemplo.', true];
      } else if (pareceIdentificador(cabecalho[indice], coluna)) {
        resultado = [indice, 'warning', 'Possível identificador', unicos + ' valores únicos em ' + coluna.length + ' linhas.', 'Investigar a semântica; IDs puros geralmente saem de X.', false];
      } else if (ausentes >= 0.4) {
        resultado = [indice, 'danger', 'Muitos valores ausentes', formatarPercentual(ausentes) + ' da coluna está ausente.', 'Comparar coleta, imputação e remoção em validação.', false];
      } else if (ausentes > 0) {
        resultado = [indice, 'warning', 'Valores ausentes', formatarPercentual(ausentes) + ' da coluna está ausente.', 'Definir uma estratégia usando apenas estatísticas do treino.', false];
      } else {
        resultado = [indice, 'neutral', 'Sem regra direta', unicos + ' valores distintos e nenhuma falha estrutural simples.', 'A relevância precisa ser medida com validação ou ablação.', false];
      }

      resultados.push(resultado);
    }

    // Procura pares numéricos quase perfeitamente correlacionados.
    for (var atual = 0; atual < alvo; atual++) {
      if (!colunasAtivas[atual]) continue;
      var colunaAtual = obterColuna(atual);
      if (!colunaEhNumerica(colunaAtual)) continue;

      for (var anterior = 0; anterior < atual; anterior++) {
        if (!colunasAtivas[anterior]) continue;
        var colunaAnterior = obterColuna(anterior);
        if (!colunaEhNumerica(colunaAnterior)) continue;
        var correlacao = calcularCorrelacao(colunaAnterior, colunaAtual);
        if (Math.abs(correlacao) >= 0.98) {
          substituirResultado(resultados, atual, [atual, 'warning', 'Redundância numérica', 'Correlação com ' + cabecalho[anterior] + ': r = ' + correlacao.toFixed(3) + '.', 'Avaliar manter uma coluna, combinar ou regularizar. Correlação não basta para remoção automática.', false]);
          break;
        }
      }
    }

    for (var posicao = 0; posicao < resultados.length; posicao++) {
      if (resultados[posicao][5]) sugestoesSeguras.push(resultados[posicao][0]);
    }
    return resultados;
  }

  function substituirResultado(resultados, indice, novoResultado) {
    for (var posicao = 0; posicao < resultados.length; posicao++) {
      if (resultados[posicao][0] === indice) {
        // Não substitui um vazamento ou uma coluna constante por correlação.
        if (resultados[posicao][1] !== 'danger' && resultados[posicao][2] !== 'Coluna constante') {
          resultados[posicao] = novoResultado;
        }
        return;
      }
    }
  }

  function formatarPercentual(valor) {
    return (valor * 100).toFixed(1).replace('.', ',') + '%';
  }

  function desenharRelatorio(resultados) {
    var html = '';
    for (var posicao = 0; posicao < resultados.length; posicao++) {
      var item = resultados[posicao];
      html += '<article class="report-item ' + item[1] + '">';
      html += '<div class="report-top"><b>' + escaparHtml(cabecalho[item[0]]) + '</b><span class="report-badge">' + escaparHtml(item[2]) + '</span></div>';
      html += '<p><strong>Evidência:</strong> ' + escaparHtml(item[3]) + '<br><strong>Decisão:</strong> ' + escaparHtml(item[4]) + '</p>';
      html += '<button type="button" data-remove-column="' + item[0] + '"><i class="fa-solid fa-eye-slash"></i> Remover manualmente</button>';
      html += '</article>';
    }
    relatorio.innerHTML = html;
  }

  function criarAssinaturaDaLinha(linha) {
    var partes = [];
    for (var coluna = 0; coluna < cabecalho.length; coluna++) {
      if (colunasAtivas[coluna]) partes.push(String(linha[coluna]).trim());
    }
    return partes.join('||');
  }

  function encontrarDuplicatas() {
    var assinaturas = [];
    var indicesDuplicados = [];
    for (var linha = 0; linha < dados.length; linha++) {
      var assinatura = criarAssinaturaDaLinha(dados[linha]);
      if (assinaturas.indexOf(assinatura) >= 0) indicesDuplicados.push(linha);
      else assinaturas.push(assinatura);
    }
    return indicesDuplicados;
  }

  function desenharDuplicatas(indices) {
    if (indices.length === 0) {
      duplicatas.innerHTML = '<b>Duplicatas exatas:</b> nenhuma encontrada nas colunas ativas.';
      return;
    }
    duplicatas.innerHTML = '<b>Duplicatas exatas:</b> ' + indices.length + ' linha(s) repetida(s). ' +
      'Confirme se são cópias indevidas ou eventos reais. <button class="button secondary" id="qualityDeduplicate">Remover cópias</button>';
  }

  function analisar() {
    lerTabelaEditada();
    var resultados = analisarColunas();
    desenharRelatorio(resultados);
    desenharDuplicatas(encontrarDuplicatas());
    atualizarCustos();
  }

  function removerColuna(indice) {
    if (indice === alvo) return;
    colunasAtivas[indice] = false;
    desenharTabela();
    analisar();
  }

  function aplicarSugestoesSeguras() {
    lerTabelaEditada();
    analisarColunas();
    for (var indice = 0; indice < sugestoesSeguras.length; indice++) {
      colunasAtivas[sugestoesSeguras[indice]] = false;
    }
    desenharTabela();
    analisar();
  }

  function removerDuplicatas() {
    lerTabelaEditada();
    var assinaturas = [];
    var dadosSemDuplicatas = [];
    for (var linha = 0; linha < dados.length; linha++) {
      var assinatura = criarAssinaturaDaLinha(dados[linha]);
      if (assinaturas.indexOf(assinatura) === -1) {
        assinaturas.push(assinatura);
        dadosSemDuplicatas.push(copiarLinha(dados[linha]));
      }
    }
    dados = dadosSemDuplicatas;
    desenharTabela();
    analisar();
  }

  function restaurar() {
    cabecalho = copiarLinha(cabecalhoOriginal);
    dados = copiarMatriz(dadosOriginais);
    alvo = cabecalho.length - 1;
    iniciarColunas();
    desenharTabela();
    analisar();
  }

  botaoAnalisar.addEventListener('click', analisar);
  botaoAplicar.addEventListener('click', aplicarSugestoesSeguras);
  botaoRestaurar.addEventListener('click', restaurar);

  relatorio.addEventListener('click', function (evento) {
    var botao = evento.target.closest('[data-remove-column]');
    if (!botao) return;
    removerColuna(Number(botao.getAttribute('data-remove-column')));
  });

  duplicatas.addEventListener('click', function (evento) {
    if (evento.target.closest('#qualityDeduplicate')) removerDuplicatas();
  });

  iniciarColunas();
  desenharTabela();
  analisar();
}());
