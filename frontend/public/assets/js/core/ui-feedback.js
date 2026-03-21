let loadingOverlay = null;

export function showToast(message, type = 'ok') {
  const icons = { ok: '?', err: '?', warn: '??' };
  const element = document.createElement('div');
  element.className = `toast ${type}`;
  element.innerHTML = `
    <span class="toast-icon">${icons[type] || '??'}</span>
    <span>${message}</span>
    <button type="button" class="toast-close" aria-label="Fechar">?</button>
  `;

  element.querySelector('.toast-close')?.addEventListener('click', () => {
    element.remove();
  });

  document.getElementById('toast-container')?.appendChild(element);
  setTimeout(() => element.remove(), 4500);
}

export function showLoading() {
  if (loadingOverlay) return;

  loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(loadingOverlay);
}

export function hideLoading() {
  if (!loadingOverlay) return;

  loadingOverlay.remove();
  loadingOverlay = null;
}
