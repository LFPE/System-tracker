export function renderEmptyState(icon, message) {
  return `<div class="empty-state"><div class="ico">${icon}</div><p>${message}</p></div>`;
}

export function renderMutedText(message) {
  return `<p class="text-muted-message">${message}</p>`;
}

export function getPerformanceTone(percent) {
  if (percent >= 80) return 'good';
  if (percent >= 60) return 'warn';
  return 'bad';
}