// Carrega o Highlight.js somente nas páginas que possuem exemplos de código.
// Se a internet estiver indisponível, o estilo básico da página continua ativo.
(function () {
  var theme = document.createElement('link');
  theme.rel = 'stylesheet';
  theme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css';
  document.head.appendChild(theme);

  var library = document.createElement('script');
  library.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js';
  library.onload = function () {
    window.hljs.highlightAll();
  };
  document.body.appendChild(library);
}());
