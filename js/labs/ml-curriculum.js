(function () {
  'use strict';

  function numero(id) {
    return Number(document.getElementById(id).value);
  }

  function texto(id, valor) {
    document.getElementById(id).textContent = valor;
  }

  function iniciarDadosRotulos() {
    var ids = ['idadeExemplo', 'rendaExemplo', 'comprasExemplo', 'rotuloExemplo'];
    function atualizar() {
      texto('vetorX', 'x = [' + numero('idadeExemplo') + ', ' + numero('rendaExemplo') + ', ' + numero('comprasExemplo') + ']');
      texto('valorY', 'y = ' + document.getElementById('rotuloExemplo').value);
      texto('leituraExemplo', 'Uma linha virou um exemplo: os três atributos formam X; a decisão esperada é o rótulo y. ID e nome não entram no vetor porque apenas identificam a pessoa.');
    }
    for (var i = 0; i < ids.length; i++) document.getElementById(ids[i]).addEventListener('input', atualizar);
    atualizar();
  }

  function iniciarTiposDeProblema() {
    var seletor = document.getElementById('cenarioProblema');
    var cenarios = [
      ['preco', 'Preço de uma casa', 'Regressão', 'R$ 438.500', 'A saída é um número contínuo. “R$ 438.500” é a previsão produzida pelo modelo de regressão.'],
      ['spam', 'E-mail é spam?', 'Classificação binária', 'spam · 92%', 'A saída é uma classe. A probabilidade ajuda a decidir entre as classes “spam” e “não spam”.'],
      ['flor', 'Espécie de uma flor', 'Classificação multiclasse', 'setosa · 81%', 'Há mais de duas categorias possíveis; o modelo escolhe a classe com maior evidência.'],
      ['demanda', 'Demanda de energia amanhã', 'Regressão temporal', '18,4 MWh', 'Ainda é regressão porque a saída é numérica. “Amanhã” apenas acrescenta uma ordem temporal ao problema.']
    ];

    function atualizar() {
      var escolhido = cenarios[0];
      for (var i = 0; i < cenarios.length; i++) {
        if (cenarios[i][0] === seletor.value) escolhido = cenarios[i];
      }
      texto('cenarioNome', escolhido[1]);
      texto('cenarioTipo', escolhido[2]);
      texto('cenarioSaida', escolhido[3]);
      texto('cenarioLeitura', escolhido[4]);
    }

    seletor.addEventListener('change', atualizar);
    atualizar();
  }

  function iniciarResumoPreparacao() {
    /* Cada linha: ID, idade, cidade, renda, compras e alvo cancelou. */
    var dadosBrutos = [
      ['C-001', '22', 'Uberaba', '1800', '2', 'não'],
      ['C-002', '', ' uberaba ', '5200', '15', 'sim'],
      ['C-002', '', ' uberaba ', '5200', '15', 'sim'],
      ['C-004', '48', 'FRANCA', '3500', '7', 'não'],
      ['C-005', '29', 'Goiânia', '12000', '3', 'sim'],
      ['C-006', '67', 'goiania ', '7800', '22', 'sim']
    ];
    var controles = document.querySelectorAll('.prepare-option');

    function copiarDados() {
      var copia = [];
      for (var linha = 0; linha < dadosBrutos.length; linha++) {
        copia[linha] = [];
        for (var coluna = 0; coluna < dadosBrutos[linha].length; coluna++) copia[linha][coluna] = dadosBrutos[linha][coluna];
      }
      return copia;
    }

    function existeNaLista(lista, valor) {
      for (var i = 0; i < lista.length; i++) if (lista[i] === valor) return true;
      return false;
    }

    function cidadeCanonica(valor) {
      var cidade = valor.toLowerCase().trim();
      cidade = cidade.replace(/[áàâã]/g, 'a').replace(/[éèê]/g, 'e').replace(/[íìî]/g, 'i').replace(/[óòôõ]/g, 'o').replace(/[úùû]/g, 'u').replace(/ç/g, 'c');
      if (cidade === 'uberaba') return 'Uberaba';
      if (cidade === 'franca') return 'Franca';
      if (cidade === 'goiania') return 'Goiania';
      return cidade;
    }

    function ordenarNumeros(valores) {
      for (var volta = 0; volta < valores.length; volta++) {
        for (var i = 0; i < valores.length - 1; i++) {
          if (valores[i] > valores[i + 1]) {
            var auxiliar = valores[i];
            valores[i] = valores[i + 1];
            valores[i + 1] = auxiliar;
          }
        }
      }
    }

    function medianaIdades(dados) {
      var idades = [];
      for (var linha = 0; linha < dados.length; linha++) if (dados[linha][1] !== '') idades[idades.length] = Number(dados[linha][1]);
      ordenarNumeros(idades);
      var meio = Math.floor(idades.length / 2);
      if (idades.length % 2 === 1) return idades[meio];
      return (idades[meio - 1] + idades[meio]) / 2;
    }

    function limites(dados, indice) {
      var minimo = null;
      var maximo = null;
      for (var linha = 0; linha < dados.length; linha++) {
        if (dados[linha][indice] === '') continue;
        var valor = Number(dados[linha][indice]);
        if (minimo === null || valor < minimo) minimo = valor;
        if (maximo === null || valor > maximo) maximo = valor;
      }
      return [minimo, maximo];
    }

    function normalizar(valor, faixa) {
      if (valor === '') return '?';
      if (faixa[1] === faixa[0]) return '0,000';
      return ((Number(valor) - faixa[0]) / (faixa[1] - faixa[0])).toFixed(3).replace('.', ',');
    }

    function preparar() {
      var limpar = document.getElementById('prepararLimpeza').checked;
      var imputar = document.getElementById('prepararImputacao').checked;
      var codificar = document.getElementById('prepararCategorias').checked;
      var escalar = document.getElementById('prepararEscala').checked;
      var criar = document.getElementById('prepararEngenharia').checked;
      var selecionar = document.getElementById('prepararSelecao').checked;
      var dados = copiarDados();
      var removidas = 0;

      if (limpar) {
        var ids = [];
        var semDuplicatas = [];
        for (var linha = 0; linha < dados.length; linha++) {
          dados[linha][2] = cidadeCanonica(dados[linha][2]);
          if (!existeNaLista(ids, dados[linha][0])) {
            ids[ids.length] = dados[linha][0];
            semDuplicatas[semDuplicatas.length] = dados[linha];
          } else removidas = removidas + 1;
        }
        dados = semDuplicatas;
      }

      var mediana = medianaIdades(dados);
      if (imputar) {
        for (var preencher = 0; preencher < dados.length; preencher++) if (dados[preencher][1] === '') dados[preencher][1] = String(mediana);
      }

      /* Ticket médio é criado antes da escala para manter a unidade original. */
      if (criar) {
        for (var derivar = 0; derivar < dados.length; derivar++) dados[derivar][6] = String(Number(dados[derivar][3]) / Number(dados[derivar][4]));
      }

      var categorias = [];
      if (codificar) {
        for (var achar = 0; achar < dados.length; achar++) if (!existeNaLista(categorias, dados[achar][2])) categorias[categorias.length] = dados[achar][2];
      }

      var faixaIdade = limites(dados, 1);
      var faixaRenda = limites(dados, 3);
      var faixaCompras = limites(dados, 4);
      var faixaTicket = criar ? limites(dados, 6) : [0, 0];
      var cabecalho = [];
      if (!selecionar) cabecalho[cabecalho.length] = 'cliente_id';
      cabecalho[cabecalho.length] = escalar ? 'idade_01' : 'idade';
      if (codificar) {
        for (var categoria = 0; categoria < categorias.length; categoria++) cabecalho[cabecalho.length] = 'cidade_' + categorias[categoria];
      } else cabecalho[cabecalho.length] = 'cidade';
      cabecalho[cabecalho.length] = escalar ? 'renda_01' : 'renda';
      cabecalho[cabecalho.length] = escalar ? 'compras_01' : 'compras';
      if (criar) cabecalho[cabecalho.length] = escalar ? 'ticket_01' : 'ticket_medio';
      cabecalho[cabecalho.length] = codificar ? 'y_cancelou_01' : 'cancelou';

      var saida = [];
      var ausentes = 0;
      for (var montar = 0; montar < dados.length; montar++) {
        var nova = [];
        if (!selecionar) nova[nova.length] = dados[montar][0];
        if (dados[montar][1] === '') ausentes = ausentes + 1;
        nova[nova.length] = escalar ? normalizar(dados[montar][1], faixaIdade) : (dados[montar][1] || '?');
        if (codificar) {
          for (var posicao = 0; posicao < categorias.length; posicao++) nova[nova.length] = dados[montar][2] === categorias[posicao] ? '1' : '0';
        } else nova[nova.length] = dados[montar][2];
        nova[nova.length] = escalar ? normalizar(dados[montar][3], faixaRenda) : dados[montar][3];
        nova[nova.length] = escalar ? normalizar(dados[montar][4], faixaCompras) : dados[montar][4];
        if (criar) nova[nova.length] = escalar ? normalizar(dados[montar][6], faixaTicket) : Number(dados[montar][6]).toFixed(2).replace('.', ',');
        nova[nova.length] = codificar ? (dados[montar][5] === 'sim' ? '1' : '0') : dados[montar][5];
        saida[saida.length] = nova;
      }

      var htmlCabecalho = '<tr>';
      for (var c = 0; c < cabecalho.length; c++) htmlCabecalho = htmlCabecalho + '<th>' + cabecalho[c] + '</th>';
      htmlCabecalho = htmlCabecalho + '</tr>';
      document.getElementById('cabecalhoPreparado').innerHTML = htmlCabecalho;
      var htmlLinhas = '';
      for (var s = 0; s < saida.length; s++) {
        htmlLinhas = htmlLinhas + '<tr>';
        for (var valor = 0; valor < saida[s].length; valor++) htmlLinhas = htmlLinhas + '<td' + (saida[s][valor] === '?' ? ' class="ml-bad-cell"' : '') + '>' + saida[s][valor] + '</td>';
        htmlLinhas = htmlLinhas + '</tr>';
      }
      document.getElementById('corpoPreparado').innerHTML = htmlLinhas;
      texto('preparoLinhas', saida.length);
      texto('preparoColunas', cabecalho.length);
      texto('preparoAusentes', ausentes);
      texto('preparoRemovidas', removidas);
      texto('medianaPreparacao', mediana.toFixed(1).replace('.', ','));

      var estados = [limpar, imputar, codificar, escalar, criar, selecionar];
      var descricoes = [
        'Limpeza: padroniza cidades e remove IDs duplicados.',
        'Imputação: preenche idade ausente com a mediana aprendida.',
        'Codificação: converte cidade em colunas One-Hot e o alvo em 0/1.',
        'Escala: aplica min–max separadamente em cada atributo numérico.',
        'Engenharia: cria ticket_medio = renda ÷ compras.',
        'Seleção: remove cliente_id porque ele identifica a linha, mas não explica o cancelamento.'
      ];
      var log = '';
      for (var etapa = 0; etapa < estados.length; etapa++) log = log + '<li class="' + (estados[etapa] ? '' : 'off') + '"><b>' + (estados[etapa] ? 'Aplicada · ' : 'Desativada · ') + '</b>' + descricoes[etapa] + '</li>';
      document.getElementById('logPreparacao').innerHTML = log;
    }

    for (var i = 0; i < controles.length; i++) controles[i].addEventListener('change', preparar);
    preparar();
  }

  function iniciarDivisao() {
    var ids = ['totalExemplos', 'percentualTreino', 'percentualValidacao'];
    function atualizar() {
      var total = Math.max(10, numero('totalExemplos'));
      var treino = numero('percentualTreino');
      var validacao = numero('percentualValidacao');
      var teste = 100 - treino - validacao;
      if (teste < 5) {
        texto('splitAviso', 'A soma deixa menos de 5% para teste. Reduza treino ou validação.');
        return;
      }
      var nTreino = Math.round(total * treino / 100);
      var nValidacao = Math.round(total * validacao / 100);
      var nTeste = total - nTreino - nValidacao;
      texto('splitTreino', nTreino + ' exemplos');
      texto('splitValidacao', nValidacao + ' exemplos');
      texto('splitTeste', nTeste + ' exemplos');
      document.getElementById('barraTreino').style.width = treino + '%';
      document.getElementById('barraValidacao').style.width = validacao + '%';
      document.getElementById('barraTeste').style.width = teste + '%';
      texto('splitAviso', document.getElementById('preprocessarAntes').checked ? 'Alerta: calcular médias e escalas antes da divisão vaza informação do teste.' : 'Fluxo correto: dividir primeiro; ajustar transformações no treino; apenas transformar validação e teste.');
    }
    for (var i = 0; i < ids.length; i++) document.getElementById(ids[i]).addEventListener('input', atualizar);
    document.getElementById('preprocessarAntes').addEventListener('change', atualizar);
    atualizar();
  }

  function iniciarViesVariancia() {
    var controle = document.getElementById('complexidadeModelo');
    var canvas = document.getElementById('graficoViesVariancia');
    var ctx = canvas.getContext('2d');
    function curvaVies(x) { return 74 * Math.exp(-x / 28) + 5; }
    function curvaVariancia(x) { return 6 + 0.0075 * x * x; }
    function desenhar() {
      var c = numero('complexidadeModelo');
      var vies = curvaVies(c);
      var variancia = curvaVariancia(c);
      var ruido = 8;
      var total = vies + variancia + ruido;
      texto('valorComplexidade', c);
      texto('valorVies', vies.toFixed(1));
      texto('valorVariancia', variancia.toFixed(1));
      texto('valorErroEsperado', total.toFixed(1));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#dfe3ee'; ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) { ctx.beginPath(); ctx.moveTo(48, 20 + g * 55); ctx.lineTo(720, 20 + g * 55); ctx.stroke(); }
      function linha(cor, calculo) {
        ctx.beginPath(); ctx.strokeStyle = cor; ctx.lineWidth = 4;
        for (var x = 0; x <= 100; x++) {
          var y = calculo(x); var px = 48 + x * 6.5; var py = 260 - y * 2.25;
          if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      linha('#4e46e5', curvaVies); linha('#e56d35', curvaVariancia);
      linha('#159b80', function (x) { return curvaVies(x) + curvaVariancia(x) + ruido; });
      var marcadorX = 48 + c * 6.5;
      ctx.strokeStyle = '#172033'; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.moveTo(marcadorX, 18); ctx.lineTo(marcadorX, 270); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#4e46e5'; ctx.font = 'bold 16px Manrope'; ctx.fillText('viés²', 60, 35);
      ctx.fillStyle = '#e56d35'; ctx.fillText('variância', 135, 35);
      ctx.fillStyle = '#159b80'; ctx.fillText('erro esperado', 250, 35);
    }
    controle.addEventListener('input', desenhar); desenhar();
  }

  function iniciarPipeline() {
    var caixas = document.querySelectorAll('[data-pipeline-step]');
    function atualizar() {
      var ativos = 0;
      for (var i = 0; i < caixas.length; i++) {
        caixas[i].closest('article').classList.toggle('active', caixas[i].checked);
        if (caixas[i].checked) ativos++;
      }
      var vazamento = document.getElementById('pipelineLeak').checked;
      texto('pipelineSaida', ativos + ' de ' + caixas.length + ' etapas ativas. ' + (vazamento ? 'Resultado inválido: o teste participou de uma decisão do projeto.' : 'O teste continua isolado e pode estimar o desempenho final.'));
      texto('pipelineConfianca', vazamento ? 'Baixa' : (ativos >= 4 ? 'Alta' : 'Parcial'));
    }
    for (var i = 0; i < caixas.length; i++) caixas[i].addEventListener('change', atualizar);
    document.getElementById('pipelineLeak').addEventListener('change', atualizar); atualizar();
  }

  function iniciarColeta() {
    var ids = ['fonteCrm', 'fonteLoja', 'fonteSuporte'];
    function atualizar() {
      var crm = document.getElementById('fonteCrm').checked;
      var loja = document.getElementById('fonteLoja').checked;
      var suporte = document.getElementById('fonteSuporte').checked;
      var colunas = ['cliente_id'];
      if (crm) { colunas.push('idade'); colunas.push('cidade'); }
      if (loja) { colunas.push('compras_90d'); colunas.push('valor_total'); }
      if (suporte) { colunas.push('chamados'); colunas.push('satisfacao'); }
      texto('colunasIntegradas', colunas.join(' | '));
      var fontes = (crm ? 1 : 0) + (loja ? 1 : 0) + (suporte ? 1 : 0);
      texto('resultadoIntegracao', fontes === 0 ? 'Escolha ao menos uma fonte.' : fontes + ' fonte(s) unidas pela chave cliente_id. A integração preserva uma linha por cliente e exige regras para duplicatas, unidades e conflitos.');
    }
    for (var i = 0; i < ids.length; i++) document.getElementById(ids[i]).addEventListener('change', atualizar); atualizar();
  }

  function iniciarAusentes() {
    var select = document.getElementById('metodoAusente');
    function atualizar() {
      var metodo = select.value;
      var valores = [18, 22, null, 46, 24];
      var preenchido = '';
      if (metodo === 'media') preenchido = '27,5';
      if (metodo === 'mediana') preenchido = '23';
      if (metodo === 'constante') preenchido = '0';
      if (metodo === 'remover') preenchido = 'linha removida';
      texto('valorImputado', preenchido);
      texto('explicacaoImputacao', metodo === 'remover' ? 'Restam 4 exemplos. Remover pode ser razoável quando há poucos casos ausentes e eles não seguem um padrão importante.' : 'O valor ausente é preenchido com ' + preenchido + '. Acrescentar um indicador “idade_ausente = 1” pode preservar a informação de que houve imputação.');
    }
    select.addEventListener('change', atualizar); atualizar();
  }

  function iniciarEscala() {
    var nomes = ['Idade', 'Renda', 'Distância', 'Compras', 'Satisfação'];
    var unidades = ['anos', 'R$', 'km', 'un.', 'nota'];
    var letras = ['A', 'B', 'C', 'D', 'E'];
    var entradas = document.querySelectorAll('.scale-input');
    var seletor = document.getElementById('amostraEscala');

    function lerMatriz() {
      var matriz = [];
      for (var linha = 0; linha < 5; linha++) {
        matriz[linha] = [];
        for (var coluna = 0; coluna < 5; coluna++) {
          matriz[linha][coluna] = Number(document.getElementById('escala-' + linha + '-' + coluna).value);
        }
      }
      return matriz;
    }

    function calcularEstatisticas(matriz) {
      var estatisticas = [];
      for (var coluna = 0; coluna < 5; coluna++) {
        var minimo = matriz[0][coluna];
        var maximo = matriz[0][coluna];
        var soma = 0;
        for (var linha = 0; linha < 5; linha++) {
          var valor = matriz[linha][coluna];
          if (valor < minimo) minimo = valor;
          if (valor > maximo) maximo = valor;
          soma = soma + valor;
        }
        var media = soma / 5;
        var somaQuadrados = 0;
        for (var indice = 0; indice < 5; indice++) {
          var diferenca = matriz[indice][coluna] - media;
          somaQuadrados = somaQuadrados + diferenca * diferenca;
        }
        var desvio = Math.sqrt(somaQuadrados / 5);
        estatisticas[coluna] = [minimo, maximo, media, desvio, somaQuadrados, soma];
      }
      return estatisticas;
    }

    function formatar(valor) {
      if (!isFinite(valor)) return '—';
      return valor.toFixed(3).replace('.', ',');
    }

    function montarTabelaValores(idCorpo, matriz, estatisticas, tipo) {
      var html = '';
      for (var linha = 0; linha < 5; linha++) {
        html = html + '<tr><td>Amostra ' + letras[linha] + '</td>';
        for (var coluna = 0; coluna < 5; coluna++) {
          var valor = matriz[linha][coluna];
          var resultado = valor;
          if (tipo === 'minmax') {
            var amplitude = estatisticas[coluna][1] - estatisticas[coluna][0];
            resultado = amplitude === 0 ? 0 : (valor - estatisticas[coluna][0]) / amplitude;
          }
          if (tipo === 'zscore') {
            var desvio = estatisticas[coluna][3];
            resultado = desvio === 0 ? 0 : (valor - estatisticas[coluna][2]) / desvio;
          }
          html = html + '<td>' + formatar(resultado) + '</td>';
        }
        html = html + '</tr>';
      }
      document.getElementById(idCorpo).innerHTML = html;
    }

    function montarResumo(estatisticas) {
      var html = '';
      for (var coluna = 0; coluna < 5; coluna++) {
        html = html + '<tr><td>' + nomes[coluna] + ' <small>' + unidades[coluna] + '</small></td>' +
          '<td>' + formatar(estatisticas[coluna][0]) + '</td>' +
          '<td>' + formatar(estatisticas[coluna][1]) + '</td>' +
          '<td>' + formatar(estatisticas[coluna][2]) + '</td>' +
          '<td>' + formatar(estatisticas[coluna][3]) + '</td></tr>';
      }
      document.getElementById('resumoEscala').innerHTML = html;
    }

    function montarContas(matriz, estatisticas) {
      var linha = Number(seletor.value);
      var html = '';
      texto('tituloContasEscala', 'Contas da amostra ' + letras[linha]);
      for (var coluna = 0; coluna < 5; coluna++) {
        var x = matriz[linha][coluna];
        var minimo = estatisticas[coluna][0];
        var maximo = estatisticas[coluna][1];
        var media = estatisticas[coluna][2];
        var desvio = estatisticas[coluna][3];
        var somaQuadrados = estatisticas[coluna][4];
        var soma = estatisticas[coluna][5];
        var listaValores = '';
        var parcelasDesvio = '';
        for (var item = 0; item < 5; item++) {
          if (item > 0) {
            listaValores = listaValores + '; ';
            parcelasDesvio = parcelasDesvio + ' + ';
          }
          listaValores = listaValores + formatar(matriz[item][coluna]);
          parcelasDesvio = parcelasDesvio + '(' + formatar(matriz[item][coluna]) + ' − ' + formatar(media) + ')²';
        }
        var amplitude = maximo - minimo;
        var minmax = amplitude === 0 ? 0 : (x - minimo) / amplitude;
        var zscore = desvio === 0 ? 0 : (x - media) / desvio;
        html = html + '<article class="ml-formula-card"><h3>' + nomes[coluna] + '</h3>' +
          '<p>x = ' + formatar(x) + ' ' + unidades[coluna] + ' · mínimo = ' + formatar(minimo) + ' · máximo = ' + formatar(maximo) + '</p>' +
          '<code>valores = [' + listaValores + ']<br>mínimo = ' + formatar(minimo) + '<br>máximo = ' + formatar(maximo) + '</code>' +
          '<code>μ = ' + formatar(soma) + ' ÷ 5 = ' + formatar(media) + '<br>σ = √((' + parcelasDesvio + ') ÷ 5)<br>σ = √(' + formatar(somaQuadrados) + ' ÷ 5) = ' + formatar(desvio) + '</code>' +
          '<code>min–max = (' + formatar(x) + ' − ' + formatar(minimo) + ') ÷ (' + formatar(maximo) + ' − ' + formatar(minimo) + ') = ' + formatar(minmax) + '</code>' +
          '<code>z = (' + formatar(x) + ' − ' + formatar(media) + ') ÷ ' + formatar(desvio) + ' = ' + formatar(zscore) + '</code></article>';
      }
      document.getElementById('contasEscala').innerHTML = html;
    }

    function atualizar() {
      var matriz = lerMatriz();
      var estatisticas = calcularEstatisticas(matriz);
      montarResumo(estatisticas);
      montarTabelaValores('tabelaMinMax', matriz, estatisticas, 'minmax');
      montarTabelaValores('tabelaZscore', matriz, estatisticas, 'zscore');
      montarContas(matriz, estatisticas);
    }

    for (var i = 0; i < entradas.length; i++) entradas[i].addEventListener('input', atualizar);
    seletor.addEventListener('change', atualizar);
    atualizar();
  }

  function iniciarEngenharia() {
    var ids = ['pesoAtributo', 'alturaAtributo', 'horaAtributo', 'usarImc', 'usarHoraCiclica'];
    function atualizar() {
      var peso = numero('pesoAtributo'); var altura = numero('alturaAtributo'); var hora = numero('horaAtributo');
      var vetor = [peso.toFixed(0), altura.toFixed(2), hora.toFixed(0)];
      var explicacao = 'Atributos originais: peso, altura e hora.';
      if (document.getElementById('usarImc').checked) { vetor.push((peso / (altura * altura)).toFixed(2)); explicacao += ' IMC adiciona a relação peso/altura².'; }
      if (document.getElementById('usarHoraCiclica').checked) { vetor.push(Math.sin(2 * Math.PI * hora / 24).toFixed(3)); vetor.push(Math.cos(2 * Math.PI * hora / 24).toFixed(3)); explicacao += ' seno/cosseno tornam 23h próxima de 0h.'; }
      texto('vetorEngenharia', 'x = [' + vetor.join(', ') + ']'); texto('dimensaoEngenharia', vetor.length + ' dimensões'); texto('explicacaoEngenharia', explicacao);
    }
    for (var i = 0; i < ids.length; i++) document.getElementById(ids[i]).addEventListener('input', atualizar); atualizar();
  }

  var tipo = document.body.getAttribute('data-lab');
  if (tipo === 'resumo-preparo') iniciarResumoPreparacao();
  if (tipo === 'problemas') iniciarTiposDeProblema();
  if (tipo === 'dados') iniciarDadosRotulos();
  if (tipo === 'divisao') iniciarDivisao();
  if (tipo === 'vies') iniciarViesVariancia();
  if (tipo === 'pipeline') iniciarPipeline();
  if (tipo === 'coleta') iniciarColeta();
  if (tipo === 'ausentes') iniciarAusentes();
  if (tipo === 'escala') iniciarEscala();
  if (tipo === 'engenharia') iniciarEngenharia();
}());
