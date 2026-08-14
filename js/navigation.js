(function () {
  'use strict';

  /* ================================================================
     NAVEGAÇÃO COMPARTILHADA

     Para adicionar, remover ou reorganizar uma página, altere somente
     a constante MENU abaixo. O HTML do menu é gerado automaticamente.
     O caminho raiz é descoberto pelo endereço deste próprio arquivo,
     por isso o componente funciona em páginas de qualquer subpasta.
     ================================================================ */
  var body = document.body;
  var scriptUrl = document.currentScript && document.currentScript.src;
  var projectRoot = scriptUrl ? new URL('../', scriptUrl) : new URL('../', window.location.href);

  var MENU = [
    {
      titulo: 'MACHINE LEARNING',
      itens: [
        {
          icone: 'fa-book-open', titulo: '5.1 Fundamentos', filhos: [
            { icone: 'fa-house', titulo: 'Introdução', caminho: 'pages/machine-learning/introducao.html' },
            { icone: 'fa-shapes', titulo: 'Regressão, classificação e previsão', caminho: 'pages/machine-learning/regressao-classificacao-previsao.html' },
            { icone: 'fa-table-columns', titulo: 'Dados, atributos e rótulos', caminho: 'pages/machine-learning/dados-atributos-rotulos.html' },
            { icone: 'fa-list-ol', titulo: 'Tipos de variáveis e análises', caminho: 'pages/machine-learning/tipos-variaveis.html' },
            { icone: 'fa-scissors', titulo: 'Treino, validação e teste', caminho: 'pages/machine-learning/divisao-dados.html' },
            { icone: 'fa-earth-americas', titulo: 'Generalização', caminho: 'pages/machine-learning/generalizacao.html' },
            { icone: 'fa-chart-area', titulo: 'Underfitting e overfitting', caminho: 'pages/machine-learning/generalizacao.html#tres-situacoes' },
            { icone: 'fa-scale-unbalanced-flip', titulo: 'Viés e variância', caminho: 'pages/machine-learning/vies-variancia.html' },
            { icone: 'fa-chart-line', titulo: 'Convergência', caminho: 'pages/machine-learning/convergencia.html' },
            { icone: 'fa-diagram-project', titulo: 'Pipeline de Machine Learning', caminho: 'pages/machine-learning/pipeline-machine-learning.html' }
          ]
        },
        {
          icone: 'fa-database', titulo: '5.2 Preparação dos Dados', filhos: [
            { icone: 'fa-table-list', titulo: 'Resumo e comparação', caminho: 'pages/machine-learning/resumo-preparacao-dados.html' },
            { icone: 'fa-plug-circle-plus', titulo: 'Coleta e integração', caminho: 'pages/machine-learning/coleta-integracao.html' },
            { icone: 'fa-broom', titulo: 'Limpeza dos dados', caminho: 'pages/machine-learning/qualidade-dados.html' },
            { icone: 'fa-circle-question', titulo: 'Valores ausentes', caminho: 'pages/machine-learning/valores-ausentes.html' },
            { icone: 'fa-font', titulo: 'Dados categóricos', caminho: 'pages/machine-learning/codificacao-categorias.html' },
            { icone: 'fa-arrows-left-right-to-line', titulo: 'Normalização e padronização', caminho: 'pages/machine-learning/normalizacao-padronizacao.html' },
            { icone: 'fa-wand-magic-sparkles', titulo: 'Engenharia de atributos', caminho: 'pages/machine-learning/engenharia-atributos.html' }
          ]
        }
      ]
    },
    {
      titulo: 'APRENDIZAGEM SUPERVISIONADA',
      itens: [
        { icone: 'fa-chalkboard-user', titulo: 'Visão geral', caminho: 'pages/aprendizagem-supervisionada/introducao.html' },
        {
          icone: 'fa-chart-simple', titulo: 'Regressão', filhos: [
            { icone: 'fa-slash', titulo: 'Regressão linear', caminho: 'pages/aprendizagem-supervisionada/regressao-linear.html' },
            { icone: 'fa-bezier-curve', titulo: 'Regressão não linear', caminho: 'pages/aprendizagem-supervisionada/regressao-nao-linear.html' }
          ]
        },
        {
          icone: 'fa-code-branch', titulo: 'Árvore de decisão', filhos: [
            { icone: 'fa-book-open', titulo: 'Teoria · Gini e divisões', caminho: 'pages/aprendizagem-supervisionada/arvore-decisao.html' },
            { icone: 'fa-flask', titulo: 'Laboratório · Dados mistos', caminho: 'pages/aprendizagem-supervisionada/arvore-decisao.html#laboratorio-arvore' }
          ]
        },
        {
          icone: 'fa-tree', titulo: 'Random Forest · Ensemble', filhos: [
            { icone: 'fa-book-open', titulo: 'Teoria Random Forest', caminho: 'pages/aprendizagem-supervisionada/random-forest.html' },
            { icone: 'fa-flask', titulo: 'Laboratório Random Forest', caminho: 'pages/aprendizagem-supervisionada/random-forest-laboratorio.html' }
          ]
        },
        {
          icone: 'fa-people-arrows', titulo: 'k-NN · Vizinhos próximos', filhos: [
            { icone: 'fa-book-open', titulo: 'Teoria k-NN', caminho: 'pages/aprendizagem-supervisionada/knn.html' },
            { icone: 'fa-flask', titulo: 'Laboratório k-NN', caminho: 'pages/aprendizagem-supervisionada/knn-laboratorio.html' }
          ]
        },
        {
          icone: 'fa-maximize', titulo: 'SVM · Margem máxima', filhos: [
            { icone: 'fa-book-open', titulo: 'Teoria SVM', caminho: 'pages/aprendizagem-supervisionada/svm.html' },
            { icone: 'fa-flask', titulo: 'Laboratório SVM', caminho: 'pages/aprendizagem-supervisionada/svm-laboratorio.html' }
          ]
        },
        {
          icone: 'fa-location-crosshairs', titulo: 'LVQ · Vetores protótipo', filhos: [
            { icone: 'fa-book-open', titulo: 'Teoria LVQ', caminho: 'pages/aprendizagem-supervisionada/lvq.html' },
            { icone: 'fa-flask', titulo: 'Laboratório LVQ', caminho: 'pages/aprendizagem-supervisionada/lvq-laboratorio.html' }
          ]
        },
        {
          icone: 'fa-circle-nodes', titulo: 'Redes Neurais', filhos: [
            { icone: 'fa-brain', titulo: 'Introdução', caminho: 'pages/redes-neurais/introducao.html' },
            { icone: 'fa-circle-dot', titulo: 'Perceptron', caminho: 'pages/redes-neurais/perceptron-introducao.html' },
            { icone: 'fa-diagram-project', titulo: 'Perceptron Multicamadas', caminho: 'pages/redes-neurais/perceptron-multicamadas.html' },
            { icone: 'fa-wave-square', titulo: 'ADALINE', caminho: 'pages/redes-neurais/adaline.html' },
            { icone: 'fa-network-wired', titulo: 'MADALINE', caminho: 'pages/redes-neurais/madaline.html' },
            {
              icone: 'fa-bullseye', titulo: 'Rede de Base Radial · RBF', filhos: [
                { icone: 'fa-book-open', titulo: 'Teoria RBF', caminho: 'pages/redes-neurais/rbf.html' },
                { icone: 'fa-shapes', titulo: 'Laboratório · Classificação', caminho: 'pages/redes-neurais/rbf-classificacao.html' },
                { icone: 'fa-chart-line', titulo: 'Laboratório · Regressão', caminho: 'pages/redes-neurais/rbf-regressao.html' }
              ]
            },
            {
              icone: 'fa-language', titulo: 'Transformers', filhos: [
                { icone: 'fa-book-open', titulo: 'Teoria · Self-Attention', caminho: 'pages/redes-neurais/transformers.html' },
                { icone: 'fa-flask', titulo: 'Laboratório · Tokens', caminho: 'pages/redes-neurais/transformer-laboratorio.html' }
              ]
            },
            {
              icone: 'fa-wand-magic-sparkles', titulo: 'GANs · Redes Generativas', filhos: [
                { icone: 'fa-book-open', titulo: 'Teoria · Jogo adversário', caminho: 'pages/redes-neurais/gans.html' },
                { icone: 'fa-flask', titulo: 'Laboratório · Dígitos', caminho: 'pages/redes-neurais/gan-laboratorio.html' }
              ]
            },
            {
              icone: 'fa-eye', titulo: 'CNNs · Convolucionais', filhos: [
                { icone: 'fa-book-open', titulo: 'Teoria · Convolução', caminho: 'pages/redes-neurais/cnns.html' },
                { icone: 'fa-flask', titulo: 'Laboratório · Dígitos', caminho: 'pages/redes-neurais/cnn-laboratorio.html' }
              ]
            },
            {
              icone: 'fa-flask-vial', titulo: 'Laboratórios', filhos: [
                { icone: 'fa-table-cells-large', titulo: 'Visão geral', caminho: 'pages/redes-neurais/laboratorios.html' },
                { icone: 'fa-toggle-on', titulo: 'Portas lógicas', caminho: 'pages/redes-neurais/perceptron.html' },
                { icone: 'fa-slash', titulo: 'Separação A e B', caminho: 'pages/redes-neurais/separacao.html' },
                { icone: 'fa-network-wired', titulo: 'MADALINE e XOR', caminho: 'pages/redes-neurais/madaline.html#experimento-madaline' },
                { icone: 'fa-xmark', titulo: 'XOR com MLP', caminho: 'pages/redes-neurais/xor.html' },
                { icone: 'fa-object-group', titulo: 'Três grupos', caminho: 'pages/redes-neurais/multiclasse.html' },
                { icone: 'fa-sliders', titulo: 'Rede configurável', caminho: 'pages/redes-neurais/rede-configuravel.html' },
                { icone: 'fa-chart-line', titulo: 'Regressão linear', caminho: 'pages/redes-neurais/regressao-linear.html' }
              ]
            }
          ]
        },
        {
          icone: 'fa-chart-pie', titulo: 'Avaliação de modelos', filhos: [
            { icone: 'fa-table-cells', titulo: 'Matriz de confusão', caminho: 'pages/aprendizagem-supervisionada/matriz-confusao.html' },
            { icone: 'fa-bullseye', titulo: 'Acurácia', caminho: 'pages/aprendizagem-supervisionada/acuracia.html' },
            { icone: 'fa-crosshairs', titulo: 'Precisão', caminho: 'pages/aprendizagem-supervisionada/precisao.html' },
            { icone: 'fa-magnifying-glass', titulo: 'Recall', caminho: 'pages/aprendizagem-supervisionada/recall.html' },
            { icone: 'fa-scale-balanced', titulo: 'F1-score', caminho: 'pages/aprendizagem-supervisionada/f1-score.html' }
          ]
        }
      ]
    }
  ];

  function urlDoProjeto(caminho) {
    return new URL(caminho, projectRoot).href;
  }

  function icone(nome) {
    return '<i class="fa-solid ' + nome + '" aria-hidden="true"></i>';
  }

  function caminhoAtual() {
    return decodeURIComponent(window.location.pathname).replace(/\\/g, '/').toLowerCase();
  }

  function existeLinkParaAncoraAtual(itens) {
    for (var i = 0; i < itens.length; i++) {
      if (itens[i].caminho) {
        var destino = new URL(itens[i].caminho, projectRoot);
        if (destino.hash && destino.hash === window.location.hash && caminhoAtual() === decodeURIComponent(destino.pathname).toLowerCase()) return true;
      }
      if (itens[i].filhos && existeLinkParaAncoraAtual(itens[i].filhos)) return true;
    }
    return false;
  }

  var ancoraAtualRepresentada = false;
  for (var grupoIndice = 0; grupoIndice < MENU.length; grupoIndice++) {
    if (existeLinkParaAncoraAtual(MENU[grupoIndice].itens)) ancoraAtualRepresentada = true;
  }

  function itemAtivo(item) {
    if (item.caminho) {
      var destino = new URL(item.caminho, projectRoot);
      var mesmaPagina = caminhoAtual() === decodeURIComponent(destino.pathname).toLowerCase();
      if (!mesmaPagina) return false;
      if (destino.hash) return window.location.hash === destino.hash;
      return !ancoraAtualRepresentada;
    }
    if (item.filhos) {
      for (var i = 0; i < item.filhos.length; i++) if (itemAtivo(item.filhos[i])) return true;
    }
    return false;
  }

  function renderizarLink(item) {
    var ativo = itemAtivo(item);
    return '<a class="ml-menu-link' + (ativo ? ' active' : '') + '" href="' + urlDoProjeto(item.caminho) + '">' +
      '<span class="ml-menu-icon">' + icone(item.icone) + '</span>' +
      '<span class="ml-menu-label">' + item.titulo + '</span>' +
    '</a>';
  }

  function renderizarItem(item, nivel) {
    if (!item.filhos) return renderizarLink(item);
    var ativo = itemAtivo(item);
    var html = '<details class="ml-lab-branch ml-menu-level-' + nivel + (ativo ? ' active' : '') + '"' + (ativo ? ' open' : '') + '>' +
      '<summary><span class="ml-menu-icon">' + icone(item.icone) + '</span><span class="ml-menu-label">' + item.titulo + '</span><i class="fa-solid fa-chevron-down ml-submenu-arrow" aria-hidden="true"></i></summary>' +
      '<div class="ml-lab-submenu">';
    for (var i = 0; i < item.filhos.length; i++) html += renderizarItem(item.filhos[i], nivel + 1);
    return html + '</div></details>';
  }

  function renderizarGrupos() {
    var html = '';
    for (var grupo = 0; grupo < MENU.length; grupo++) {
      html += '<section class="ml-menu-group"><h2 class="ml-menu-heading">' + MENU[grupo].titulo + '</h2>';
      for (var item = 0; item < MENU[grupo].itens.length; item++) html += renderizarItem(MENU[grupo].itens[item], 0);
      html += '</section>';
    }
    return html;
  }

  /* Font Awesome e o CSS da navegação são carregados uma única vez por página. */
  var fontAwesome = document.createElement('link');
  fontAwesome.rel = 'stylesheet';
  fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
  fontAwesome.crossOrigin = 'anonymous';
  fontAwesome.referrerPolicy = 'no-referrer';
  document.head.appendChild(fontAwesome);

  var style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = urlDoProjeto('css/navigation.css');
  document.head.appendChild(style);

  var sidebar = document.createElement('aside');
  sidebar.className = 'ml-sidebar';
  sidebar.setAttribute('aria-label', 'Navegação principal');
  sidebar.innerHTML =
    '<div class="ml-sidebar-head">' +
      '<div class="ml-sidebar-logo"><img src="' + urlDoProjeto('assets/images/logo.png') + '" alt=""></div>' +
      '<div class="ml-sidebar-name">Machine Learning Lab</div>' +
      '<button class="ml-sidebar-pin" type="button" title="Fixar a barra lateral" aria-label="Fixar a barra lateral">' + icone('fa-thumbtack') + '</button>' +
    '</div>' +
    '<div class="ml-sidebar-scroll">' + renderizarGrupos() + '</div>';

  var backdrop = document.createElement('div');
  backdrop.className = 'ml-sidebar-backdrop';

  var topbar = document.createElement('header');
  topbar.className = 'ml-topbar';
  topbar.innerHTML =
    '<a class="ml-topbar-title" href="' + urlDoProjeto('index.html') + '" aria-label="Prof. Mateus Valente · Machine Learning Lab">' +
      '<span class="ml-topbar-brand-crop"><img src="' + urlDoProjeto('assets/images/logo.png') + '" alt="Prof. Mateus Valente · Machine Learning"></span>' +
    '</a>' +
    '<nav class="ml-topbar-actions" aria-label="Ações da página">' +
      '<button type="button" class="ml-menu-button" aria-label="Abrir menu lateral">' + icone('fa-bars') + '<span class="ml-action-text">Menu</span></button>' +
      '<button type="button" class="ml-back-button">' + icone('fa-arrow-left') + '<span class="ml-action-text">Voltar</span></button>' +
      '<a href="' + urlDoProjeto('index.html') + '">' + icone('fa-house') + '<span class="ml-action-text">Home</span></a>' +
    '</nav>';

  var oldHeader = document.querySelector('.site-header');
  if (oldHeader) oldHeader.replaceWith(topbar);
  else body.insertBefore(topbar, body.firstChild);
  body.insertBefore(sidebar, body.firstChild);
  body.insertBefore(backdrop, topbar);

  var pinned = window.localStorage.getItem('ml-sidebar-pinned') === 'true';
  if (pinned && window.innerWidth > 900) {
    sidebar.classList.add('is-pinned');
    body.classList.add('sidebar-pinned');
  }

  var pinButton = sidebar.querySelector('.ml-sidebar-pin');

  function atualizarBotaoFixacao(fixado) {
    pinButton.innerHTML = fixado ? icone('fa-angles-left') : icone('fa-thumbtack');
    pinButton.title = fixado ? 'Recolher a barra lateral' : 'Fixar a barra lateral';
    pinButton.setAttribute('aria-label', pinButton.title);
  }

  atualizarBotaoFixacao(pinned && window.innerWidth > 900);

  function fecharMenuMovel() {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('visible');
  }

  pinButton.addEventListener('click', function () {
    var fixado = !sidebar.classList.contains('is-pinned');
    sidebar.classList.toggle('is-pinned', fixado);
    sidebar.classList.toggle('is-collapsing', !fixado);
    body.classList.toggle('sidebar-pinned', fixado);
    window.localStorage.setItem('ml-sidebar-pinned', String(fixado));
    atualizarBotaoFixacao(fixado);
  });
  sidebar.addEventListener('mouseleave', function () {
    /* Depois que o recolhimento termina, o hover volta a poder abrir o menu. */
    sidebar.classList.remove('is-collapsing');
  });
  topbar.querySelector('.ml-menu-button').addEventListener('click', function () {
    sidebar.classList.toggle('mobile-open');
    backdrop.classList.toggle('visible');
  });
  topbar.querySelector('.ml-back-button').addEventListener('click', function () {
    if (window.history.length > 1) window.history.back();
    else window.location.href = urlDoProjeto('index.html');
  });
  backdrop.addEventListener('click', fecharMenuMovel);
  sidebar.addEventListener('click', function (event) {
    if (event.target.closest('a') && window.innerWidth <= 900) fecharMenuMovel();
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) fecharMenuMovel();
  });

  body.classList.add('navigation-ready');

  /*
     Ícones de ações comuns. Este aprimoramento também alcança botões que os
     laboratórios criam depois do carregamento da página.
  */
  function escolherIconeDoControle(controle) {
    var texto = (controle.textContent || '').toLowerCase().trim();
    var rotulo = (controle.getAttribute('aria-label') || '').toLowerCase();
    var leitura = texto + ' ' + rotulo;

    if (leitura.indexOf('fechar') >= 0 || leitura === '×') return 'fa-xmark';
    if (leitura.indexOf('treinar até convergir') >= 0) return 'fa-forward-fast';
    if (leitura.indexOf('treinar') >= 0 || leitura.indexOf('executar') >= 0) return 'fa-play';
    if (leitura.indexOf('reiniciar') >= 0 || leitura.indexOf('restaurar') >= 0 || leitura.indexOf('voltar ao') >= 0 || leitura.indexOf('reset') >= 0) return 'fa-rotate-left';
    if (leitura.indexOf('limpar') >= 0 || leitura.indexOf('excluir') >= 0 || leitura.indexOf('remover') >= 0) return 'fa-trash-can';
    if (leitura.indexOf('adicionar') >= 0 || texto.charAt(0) === '+') return 'fa-plus';
    if (leitura.indexOf('testar') >= 0 || leitura.indexOf('classificar') >= 0 || leitura.indexOf('prever') >= 0) return 'fa-magnifying-glass-chart';
    if (leitura.indexOf('gerar') >= 0 || leitura.indexOf('criar') >= 0) return 'fa-wand-magic-sparkles';
    if (leitura.indexOf('sortear') >= 0 || leitura.indexOf('aleat') >= 0) return 'fa-shuffle';
    if (leitura.indexOf('preparar') >= 0) return 'fa-gears';
    if (leitura.indexOf('carregar') >= 0) return 'fa-folder-open';
    if (leitura.indexOf('calcular') >= 0) return 'fa-calculator';
    if (leitura.indexOf('comparar') >= 0) return 'fa-scale-balanced';
    if (leitura.indexOf('repetir') >= 0) return 'fa-repeat';
    if (leitura.indexOf('próxim') >= 0 || leitura.indexOf('avançar') >= 0) return 'fa-arrow-right';
    if (leitura.indexOf('anterior') >= 0) return 'fa-arrow-left';
    return '';
  }

  function aplicarIconesDeInterface(raiz) {
    var seletor = 'main button, main a.button, .image-lightbox button';
    var controles = [];
    if (raiz.matches && raiz.matches(seletor)) controles.push(raiz);
    if (raiz.querySelectorAll) {
      var descendentes = raiz.querySelectorAll(seletor);
      for (var indice = 0; indice < descendentes.length; indice++) controles.push(descendentes[indice]);
    }
    for (var i = 0; i < controles.length; i++) {
      var controle = controles[i];
      if (controle.querySelector('.fa-solid, .fa-regular')) continue;
      var nome = escolherIconeDoControle(controle);
      if (!nome) continue;
      var elemento = document.createElement('i');
      elemento.className = 'fa-solid ' + nome;
      elemento.setAttribute('aria-hidden', 'true');
      controle.insertBefore(elemento, controle.firstChild);
      controle.classList.add('fa-ui-enhanced');
    }
  }

  aplicarIconesDeInterface(document);
  var observer = new MutationObserver(function (mudancas) {
    for (var i = 0; i < mudancas.length; i++) {
      for (var j = 0; j < mudancas[i].addedNodes.length; j++) {
        var no = mudancas[i].addedNodes[j];
        if (no.nodeType === 1) aplicarIconesDeInterface(no);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  /* Controlador compartilhado dos laboratórios. */
  var convergenceController = document.createElement('script');
  convergenceController.src = urlDoProjeto('js/lab-convergence.js');
  document.body.appendChild(convergenceController);
}());
