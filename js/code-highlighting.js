// Carrega o Highlight.js somente nas páginas que possuem exemplos de código.
// Se a internet estiver indisponível, o estilo básico da página continua ativo.
(function () {
  // Adiciona um botão de cópia a cada exemplo completo da página.
  // O fallback com textarea também funciona quando o site é aberto por file:///.
  function copiarTexto(texto, botao) {
    function confirmarCopia() {
      botao.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
      setTimeout(function () {
        botao.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar código';
      }, 1800);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(confirmarCopia);
      return;
    }

    var auxiliar = document.createElement('textarea');
    auxiliar.value = texto;
    auxiliar.setAttribute('readonly', '');
    auxiliar.style.position = 'fixed';
    auxiliar.style.opacity = '0';
    document.body.appendChild(auxiliar);
    auxiliar.select();
    document.execCommand('copy');
    document.body.removeChild(auxiliar);
    confirmarCopia();
  }

  var blocos = document.querySelectorAll('pre > code');
  for (var i = 0; i < blocos.length; i++) {
    var pre = blocos[i].parentElement;
    if (pre.querySelector('.code-copy-button')) continue;

    pre.classList.add('copyable-code');
    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'code-copy-button';
    botao.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar código';
    botao.setAttribute('aria-label', 'Copiar exemplo de código');
    botao.codigoAlvo = blocos[i];
    botao.addEventListener('click', function () {
      copiarTexto(this.codigoAlvo.textContent, this);
    });
    pre.appendChild(botao);
  }

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
