// ============================================================================
// VISUALIZADOR DE IMAGENS
// Torna ampliáveis todas as imagens de conteúdo sem alterar o HTML de cada uma.
// ============================================================================

(function enableImageLightbox() {
  const images = [...document.querySelectorAll('main img')];
  if (!images.length) return;

  // O visualizador é criado uma única vez e reutilizado por todas as imagens.
  const overlay = document.createElement('div');
  overlay.className = 'image-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Imagem ampliada');
  overlay.hidden = true;
  overlay.innerHTML = `
    <button class="image-lightbox-close" type="button" aria-label="Fechar imagem ampliada">×</button>
    <figure>
      <img class="image-lightbox-content" alt="">
      <figcaption class="image-lightbox-caption"></figcaption>
    </figure>
  `;
  document.body.appendChild(overlay);

  const expandedImage = overlay.querySelector('.image-lightbox-content');
  const caption = overlay.querySelector('.image-lightbox-caption');
  const closeButton = overlay.querySelector('.image-lightbox-close');
  let previouslyFocused = null;

  function openImage(image) {
    previouslyFocused = document.activeElement;
    expandedImage.src = image.currentSrc || image.src;
    expandedImage.alt = image.alt || 'Imagem ampliada';
    caption.textContent = image.closest('figure')?.querySelector('figcaption')?.textContent?.trim() || image.alt || '';
    overlay.hidden = false;
    document.body.classList.add('lightbox-open');
    closeButton.focus();
  }

  function closeImage() {
    overlay.hidden = true;
    expandedImage.removeAttribute('src');
    document.body.classList.remove('lightbox-open');
    previouslyFocused?.focus();
  }

  images.forEach(image => {
    image.classList.add('zoomable-image');
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', `Ampliar imagem: ${image.alt || 'visualização'}`);
    image.title = 'Clique para ampliar';

    image.addEventListener('click', () => openImage(image));
    image.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openImage(image);
      }
    });
  });

  closeButton.addEventListener('click', closeImage);
  overlay.addEventListener('click', event => {
    if (event.target === overlay) closeImage();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !overlay.hidden) closeImage();
  });
})();
