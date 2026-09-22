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

  function escaparHtml(valor) {
    return String(valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Rastreabilidade compartilhada com o portal de Maratona de Programação. */
  function carregarRastreabilidade() {
    if (window.__mlTrackingReady) return;
    window.__mlTrackingReady = true;
    var measurementId = 'G-8ZHFY5QQQG';
    var source = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      page_title: document.title,
      page_path: window.location.pathname + window.location.hash
    });
    if (!document.querySelector('script[src="' + source + '"]')) {
      var tag = document.createElement('script');
      tag.async = true;
      tag.src = source;
      document.head.appendChild(tag);
    }
    window.addEventListener('hashchange', function () {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.hash
      });
    });
  }

  carregarRastreabilidade();

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
    },
    {
      titulo: 'APRENDIZAGEM NÃO SUPERVISIONADA',
      itens: [
        { icone: 'fa-chalkboard-user', titulo: 'Introdução aos Pilares', caminho: 'pages/aprendizagem-nao-supervisionada/introducao.html' },
        { icone: 'fa-object-group', titulo: 'K-Means', caminho: 'pages/aprendizagem-nao-supervisionada/k-means.html' },
        { icone: 'fa-compress', titulo: 'PCA', caminho: 'pages/aprendizagem-nao-supervisionada/pca.html' },
        { icone: 'fa-link', titulo: 'Apriori', caminho: 'pages/aprendizagem-nao-supervisionada/apriori.html' }
      ]
    },
    {
      titulo: 'ATIVIDADES',
      itens: [
        {
          icone: 'fa-list-check', titulo: 'Atividades integradoras', filhos: [
            { icone: 'fa-brain', titulo: '01 · MLP configurável', caminho: 'pages/atividades/desafios-integradores.html#atividade-mlp' },
            { icone: 'fa-broom', titulo: '02 · Dataset sujo', caminho: 'pages/atividades/desafios-integradores.html#atividade-limpeza' },
            { icone: 'fa-shield-halved', titulo: '03 · WAF com IA', caminho: 'pages/atividades/desafios-integradores.html#atividade-waf' },
            { icone: 'fa-chart-pie', titulo: '04 · Avaliação', caminho: 'pages/atividades/desafios-integradores.html#atividade-avaliacao' }
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

  var caminhoRaiz = decodeURIComponent(projectRoot.pathname).replace(/\\/g, '/').toLowerCase();
  var paginaInicialAtual = caminhoAtual() === decodeURIComponent(new URL('index.html', projectRoot).pathname).toLowerCase() ||
    caminhoAtual() === caminhoRaiz || caminhoAtual() === caminhoRaiz.replace(/\/$/, '');

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

  function contarPaginas(itens) {
    var total = 0;
    for (var i = 0; i < itens.length; i++) {
      if (itens[i].caminho) total++;
      if (itens[i].filhos) total += contarPaginas(itens[i].filhos);
    }
    return total;
  }

  function trilhaAtiva(itens, titulos) {
    for (var i = 0; i < itens.length; i++) {
      var proximaTrilha = titulos.concat(itens[i].titulo);
      if (itens[i].caminho && itemAtivo(itens[i])) return proximaTrilha;
      if (itens[i].filhos) {
        var encontrada = trilhaAtiva(itens[i].filhos, proximaTrilha);
        if (encontrada) return encontrada;
      }
    }
    return null;
  }

  function breadcrumbAtual() {
    for (var grupo = 0; grupo < MENU.length; grupo++) {
      var titulos = trilhaAtiva(MENU[grupo].itens, [MENU[grupo].titulo]);
      if (titulos) return titulos;
    }
    var paginaInicial = decodeURIComponent(new URL('index.html', projectRoot).pathname).toLowerCase();
    if (caminhoAtual() === paginaInicial) return [];
    return [document.title.split('|')[0].trim() || 'Página atual'];
  }

  function renderizarBreadcrumb() {
    var partes = breadcrumbAtual();
    if (!partes.length) return '<span aria-current="page">Início</span>';
    var html = '<a href="' + urlDoProjeto('index.html') + '">Início</a>';
    for (var i = 0; i < partes.length; i++) {
      html += '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>' +
        '<span' + (i === partes.length - 1 ? ' aria-current="page"' : '') + '>' + escaparHtml(partes[i]) + '</span>';
    }
    return html;
  }

  function montarLinksDaPagina(sidebar) {
    var grupo = sidebar.querySelector('.ml-sidebar-page-group');
    var alvo = sidebar.querySelector('.ml-sidebar-page-links');
    if (!grupo || !alvo) return;
    var secoes = document.querySelectorAll('main section[id], main article[id]');
    var vistos = {};
    var quantidade = 0;
    for (var i = 0; i < secoes.length && quantidade < 10; i++) {
      var secao = secoes[i];
      var titulo = secao.querySelector('h2, h3');
      if (!titulo || vistos[secao.id]) continue;
      vistos[secao.id] = true;
      var link = document.createElement('a');
      link.href = '#' + secao.id;
      link.textContent = titulo.textContent.trim();
      alvo.appendChild(link);
      quantidade++;
    }
    if (!quantidade) grupo.hidden = true;
  }

  /* Dependências visuais e shell compartilhado, carregados uma única vez. */
  if (!document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"]')) {
    var fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
    fontAwesome.crossOrigin = 'anonymous';
    fontAwesome.referrerPolicy = 'no-referrer';
    document.head.appendChild(fontAwesome);
  }

  var style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = urlDoProjeto('css/navigation.css');
  document.head.appendChild(style);

  var sidebar = document.createElement('aside');
  sidebar.className = 'ml-sidebar';
  sidebar.id = 'menu-do-curso';
  sidebar.setAttribute('aria-label', 'Navegação principal');
  sidebar.innerHTML =
    '<div class="ml-sidebar-head">' +
      '<a class="ml-sidebar-brand" href="' + urlDoProjeto('index.html') + '">' +
        '<span class="ml-sidebar-logo">' + icone('fa-brain') + '</span>' +
        '<span class="ml-sidebar-name"><small>Trilha de aprendizagem</small><strong>Machine Learning Lab</strong></span>' +
      '</a>' +
      '<button class="ml-sidebar-pin" type="button" title="Recolher o menu" aria-label="Recolher o menu" aria-expanded="true">' + icone('fa-angles-left') + '</button>' +
    '</div>' +
    '<div class="ml-sidebar-scroll">' +
      '<div class="ml-sidebar-trail"><button class="ml-sidebar-back" type="button" title="Voltar" aria-label="Voltar">' + icone('fa-arrow-left') + '</button><nav class="ml-sidebar-breadcrumb" aria-label="Localização atual">' + renderizarBreadcrumb() + '</nav></div>' +
      '<div class="ml-sidebar-shortcuts"><a href="' + urlDoProjeto('index.html') + '">' + icone('fa-house') + '<span>Menu principal</span></a><a href="' + urlDoProjeto('pages/atividades/desafios-integradores.html') + '">' + icone('fa-list-check') + '<span>Desafios 01–04</span></a></div>' +
      '<div class="ml-sidebar-menu">' + renderizarGrupos() + '</div>' +
      '<div class="ml-sidebar-page-group"><p>Nesta página</p><nav class="ml-sidebar-page-links" aria-label="Seções desta página"></nav></div>' +
    '</div>' +
    '<div class="ml-sidebar-footer">' + icone('fa-graduation-cap') + '<span><strong>' + contarPaginas([].concat.apply([], MENU.map(function (grupo) { return grupo.itens; }))) + ' conteúdos</strong><small>' + MENU.length + ' trilhas de aprendizagem</small></span></div>';

  var backdrop = document.createElement('div');
  backdrop.className = 'ml-sidebar-backdrop';

  var topbar = document.createElement('header');
  topbar.className = 'ml-topbar';
  topbar.innerHTML =
    '<div class="ml-topbar-inner">' +
      '<a class="ml-topbar-title" href="' + urlDoProjeto('index.html') + '" aria-label="Página inicial do Machine Learning Lab">' +
        '<span class="ml-brand-mark">ML</span><span class="ml-brand-copy"><strong>machine<span>.learning</span></strong><small>Laboratório interativo · Uniube</small></span>' +
      '</a>' +
      '<nav class="ml-topbar-actions" aria-label="Navegação principal">' +
        (paginaInicialAtual ? '' : '<button type="button" class="ml-menu-button" aria-controls="menu-do-curso" aria-expanded="true">' + icone('fa-bars-staggered') + '<span>Conteúdo</span></button>') +
        '<span class="ml-topbar-links">' +
          (paginaInicialAtual
            ? '<a href="#modulos">Módulos</a><a href="#laboratorios">Laboratórios</a><a href="#metodologia">Como estudar</a><a href="#atividades">Atividades</a>'
            : '<a href="' + urlDoProjeto('pages/machine-learning/introducao.html') + '">Fundamentos</a>' +
              '<a href="' + urlDoProjeto('pages/machine-learning/resumo-preparacao-dados.html') + '">Dados</a>' +
              '<a href="' + urlDoProjeto('pages/aprendizagem-supervisionada/introducao.html') + '">Supervisionada</a>' +
              '<a href="' + urlDoProjeto('pages/redes-neurais/introducao.html') + '">Redes neurais</a>' +
              '<a href="' + urlDoProjeto('pages/atividades/desafios-integradores.html') + '">Atividades</a>') +
        '</span>' +
        '<span class="ml-topbar-contact" aria-label="Contato e repositórios de Mateus Valente">' +
          '<a href="mailto:mateus.sousa.valente@gmail.com" aria-label="Enviar e-mail" title="E-mail">' + icone('fa-envelope') + '</a>' +
          '<a href="https://br.linkedin.com/in/mateus-valente-b6978a173" target="_blank" rel="noreferrer" aria-label="Abrir LinkedIn" title="LinkedIn"><i class="fa-brands fa-linkedin-in" aria-hidden="true"></i></a>' +
          '<a href="https://github.com/mateusvalente" target="_blank" rel="noreferrer" aria-label="Abrir GitHub" title="GitHub"><i class="fa-brands fa-github" aria-hidden="true"></i></a>' +
          '<a class="ml-course-repository" href="https://github.com/mateusvalente/machine-learning" target="_blank" rel="noreferrer" aria-label="Abrir repositório do curso" title="Repositório do curso">' + icone('fa-code-branch') + '</a>' +
        '</span>' +
        '<a class="ml-profile-link" href="https://mateusvalente.dev" target="_blank" rel="noreferrer">Portfólio ' + icone('fa-arrow-up-right-from-square') + '</a>' +
      '</nav>' +
    '</div>';

  var oldHeader = document.querySelector('.site-header');
  if (oldHeader) oldHeader.replaceWith(topbar);
  else body.insertBefore(topbar, body.firstChild);
  if (paginaInicialAtual) body.classList.add('ml-home');
  else {
    body.insertBefore(sidebar, body.firstChild);
    body.insertBefore(backdrop, topbar);
  }

  var rodapeAntigo = document.querySelector('.site-footer');
  var fontesAntigas = rodapeAntigo && rodapeAntigo.querySelector('.footer-sources');
  var htmlFontes = fontesAntigas ? fontesAntigas.innerHTML : '';
  if (rodapeAntigo) rodapeAntigo.remove();

  var footer = document.createElement('footer');
  footer.className = 'ml-site-footer';
  footer.innerHTML =
    '<div class="ml-footer-inner">' +
      '<div class="ml-footer-identity"><strong>machine-learning.mateusvalente.dev</strong><small>Material didático e laboratórios interativos · Uniube</small></div>' +
      '<nav class="ml-footer-contact-grid" aria-label="Contato e repositórios">' +
        '<a href="mailto:mateus.sousa.valente@gmail.com"><i class="ml-footer-service-icon fa-solid fa-envelope" aria-hidden="true"></i><span><small>Fale por e-mail</small><strong>E-mail</strong></span><i class="ml-footer-arrow fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>' +
        '<a href="https://br.linkedin.com/in/mateus-valente-b6978a173" target="_blank" rel="noreferrer"><i class="ml-footer-service-icon fa-brands fa-linkedin-in" aria-hidden="true"></i><span><small>Perfil profissional</small><strong>LinkedIn</strong></span><i class="ml-footer-arrow fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>' +
        '<a href="https://github.com/mateusvalente" target="_blank" rel="noreferrer"><i class="ml-footer-service-icon fa-brands fa-github" aria-hidden="true"></i><span><small>Código e projetos</small><strong>GitHub principal</strong></span><i class="ml-footer-arrow fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>' +
        '<a href="https://github.com/mateusvalente/machine-learning" target="_blank" rel="noreferrer"><i class="ml-footer-service-icon fa-solid fa-code-branch" aria-hidden="true"></i><span><small>Material desta disciplina</small><strong>Repositório do curso</strong></span><i class="ml-footer-arrow fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>' +
      '</nav>' +
      (htmlFontes ? '<div class="ml-footer-sources"><strong>Fontes desta página</strong><div>' + htmlFontes + '</div></div>' : '') +
      '<p class="ml-footer-legal">Material de autoria do Professor Mestre Mateus de Sousa Valente, dos cursos de TI da Uniube. Todos os direitos reservados &copy; ' + new Date().getFullYear() + '.</p>' +
    '</div>';
  body.appendChild(footer);

  var skipLink = document.createElement('a');
  var main = document.querySelector('main');
  if (main) {
    if (!main.id) main.id = 'conteudo-pagina';
    skipLink.className = 'ml-skip-link';
    skipLink.href = '#' + main.id;
    skipLink.textContent = 'Ir para o conteúdo';
    body.insertBefore(skipLink, body.firstChild);
  }

  var neuralCanvas = document.createElement('canvas');
  neuralCanvas.id = 'ml-neural-background';
  neuralCanvas.setAttribute('aria-hidden', 'true');
  body.insertBefore(neuralCanvas, body.firstChild);

  if (!paginaInicialAtual) {
    var collapsed = false;
    try {
      collapsed = window.localStorage.getItem('ml-sidebar-collapsed') === 'true';
    } catch (erroArmazenamento) {
      collapsed = false;
    }

    var pinButton = sidebar.querySelector('.ml-sidebar-pin');

    function atualizarEstadoDoMenu(abertoNoMobile) {
      var mobile = window.innerWidth <= 900;
      sidebar.classList.toggle('mobile-open', mobile && abertoNoMobile);
      sidebar.classList.toggle('is-collapsed', !mobile && collapsed);
      backdrop.classList.toggle('visible', mobile && abertoNoMobile);
      body.classList.toggle('sidebar-pinned', !mobile && !collapsed);
      body.classList.toggle('ml-sidebar-mobile-open', mobile && abertoNoMobile);
      var expandido = mobile ? abertoNoMobile : !collapsed;
      pinButton.innerHTML = icone(mobile ? 'fa-xmark' : collapsed ? 'fa-angles-right' : 'fa-angles-left');
      pinButton.title = mobile ? 'Fechar o menu' : collapsed ? 'Expandir o menu' : 'Recolher o menu';
      pinButton.setAttribute('aria-label', pinButton.title);
      pinButton.setAttribute('aria-expanded', String(expandido));
      topbar.querySelector('.ml-menu-button').setAttribute('aria-expanded', String(expandido));
    }

    function fecharMenuMovel() {
      atualizarEstadoDoMenu(false);
    }

    pinButton.addEventListener('click', function () {
      if (window.innerWidth <= 900) return fecharMenuMovel();
      collapsed = !collapsed;
      try {
        window.localStorage.setItem('ml-sidebar-collapsed', String(collapsed));
      } catch (erroArmazenamento) {
        /* O estado continua válido durante a sessão atual. */
      }
      atualizarEstadoDoMenu(false);
    });
    topbar.querySelector('.ml-menu-button').addEventListener('click', function () {
      if (window.innerWidth <= 900) atualizarEstadoDoMenu(!sidebar.classList.contains('mobile-open'));
      else {
        collapsed = !collapsed;
        try {
          window.localStorage.setItem('ml-sidebar-collapsed', String(collapsed));
        } catch (erroArmazenamento) {
          /* O estado continua válido durante a sessão atual. */
        }
        atualizarEstadoDoMenu(false);
      }
    });
    sidebar.querySelector('.ml-sidebar-back').addEventListener('click', function () {
      if (window.history.length > 1) window.history.back();
      else window.location.href = urlDoProjeto('index.html');
    });
    backdrop.addEventListener('click', fecharMenuMovel);
    sidebar.addEventListener('click', function (event) {
      if (event.target.closest('a') && window.innerWidth <= 900) fecharMenuMovel();
    });
    window.addEventListener('resize', function () {
      atualizarEstadoDoMenu(false);
    });
    window.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && sidebar.classList.contains('mobile-open')) fecharMenuMovel();
    });

    montarLinksDaPagina(sidebar);
    atualizarEstadoDoMenu(false);
  }
  body.classList.add('navigation-ready');

  /* Fundo próprio do laboratório: uma rede neural discreta e responsiva. */
  function iniciarFundoNeural(canvas) {
    var contexto = canvas.getContext('2d');
    if (!contexto) return;
    var movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
    var largura = 0;
    var altura = 0;
    var pontos = [];
    var quadro = 0;
    var ultimoQuadro = 0;
    var ponteiro = { x: -1000, y: -1000, ativo: false };

    function criarPontos() {
      var quantidade = largura < 620 ? 30 : Math.min(82, Math.max(52, Math.round(largura / 22)));
      pontos = [];
      for (var i = 0; i < quantidade; i++) {
        var angulo = Math.random() * Math.PI * 2;
        var velocidade = 0.18 + Math.random() * 0.2;
        pontos.push({
          x: Math.random() * largura,
          y: Math.random() * altura,
          vx: Math.cos(angulo) * velocidade,
          vy: Math.sin(angulo) * velocidade,
          raio: 1.8 + Math.random() * 2.1,
          destaque: i % 4 === 0
        });
      }
    }

    function redimensionar() {
      var proporcao = Math.min(window.devicePixelRatio || 1, 1.5);
      largura = window.innerWidth;
      altura = window.innerHeight;
      canvas.width = Math.floor(largura * proporcao);
      canvas.height = Math.floor(altura * proporcao);
      canvas.style.width = largura + 'px';
      canvas.style.height = altura + 'px';
      contexto.setTransform(proporcao, 0, 0, proporcao, 0, 0);
      criarPontos();
      desenhar(true);
    }

    function desenhar(estatico) {
      contexto.clearRect(0, 0, largura, altura);
      for (var i = 0; i < pontos.length; i++) {
        var ponto = pontos[i];
        if (!estatico) {
          ponto.x += ponto.vx;
          ponto.y += ponto.vy;
          if (ponto.x < -10 || ponto.x > largura + 10) ponto.vx *= -1;
          if (ponto.y < -10 || ponto.y > altura + 10) ponto.vy *= -1;
        }
        for (var j = i + 1; j < pontos.length; j++) {
          var outro = pontos[j];
          var distancia = Math.hypot(ponto.x - outro.x, ponto.y - outro.y);
          if (distancia > 185) continue;
          var proximidadeDoPonteiro = ponteiro.ativo &&
            (Math.hypot(ponto.x - ponteiro.x, ponto.y - ponteiro.y) < 160 || Math.hypot(outro.x - ponteiro.x, outro.y - ponteiro.y) < 160);
          var opacidade = (1 - distancia / 185) * (proximidadeDoPonteiro ? 0.48 : 0.22);
          var conexaoEmDestaque = ponto.destaque || outro.destaque;
          contexto.strokeStyle = conexaoEmDestaque
            ? 'rgba(0, 164, 203, ' + opacidade + ')'
            : 'rgba(78, 70, 229, ' + opacidade + ')';
          contexto.lineWidth = proximidadeDoPonteiro ? 1.55 : 0.9;
          contexto.beginPath();
          contexto.moveTo(ponto.x, ponto.y);
          contexto.lineTo(outro.x, outro.y);
          contexto.stroke();
        }
        var perto = ponteiro.ativo && Math.hypot(ponto.x - ponteiro.x, ponto.y - ponteiro.y) < 145;
        contexto.fillStyle = ponto.destaque ? 'rgba(0, 164, 203, ' + (perto ? 0.9 : 0.58) + ')' : 'rgba(78, 70, 229, ' + (perto ? 0.84 : 0.48) + ')';
        contexto.beginPath();
        contexto.arc(ponto.x, ponto.y, ponto.raio + (perto ? 1.4 : 0), 0, Math.PI * 2);
        contexto.fill();
      }
    }

    function animar(timestamp) {
      quadro = window.requestAnimationFrame(animar);
      if (document.hidden || timestamp - ultimoQuadro < 34) return;
      ultimoQuadro = timestamp;
      desenhar(false);
    }

    function atualizarAnimacao() {
      window.cancelAnimationFrame(quadro);
      if (movimentoReduzido.matches) desenhar(true);
      else quadro = window.requestAnimationFrame(animar);
    }

    window.addEventListener('pointermove', function (event) {
      ponteiro.x = event.clientX;
      ponteiro.y = event.clientY;
      ponteiro.ativo = true;
    }, { passive: true });
    window.addEventListener('pointerout', function (event) {
      if (!event.relatedTarget) ponteiro.ativo = false;
    });
    var quadroDeRedimensionamento = 0;
    window.addEventListener('resize', function () {
      window.cancelAnimationFrame(quadroDeRedimensionamento);
      quadroDeRedimensionamento = window.requestAnimationFrame(function () {
        redimensionar();
        atualizarAnimacao();
      });
    }, { passive: true });
    if (movimentoReduzido.addEventListener) movimentoReduzido.addEventListener('change', atualizarAnimacao);
    redimensionar();
    atualizarAnimacao();
  }

  iniciarFundoNeural(neuralCanvas);

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
