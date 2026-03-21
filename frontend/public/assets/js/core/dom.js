export function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

export function setHTML(id, html) {
  const element = document.getElementById(id);
  if (element) {
    element.innerHTML = html;
  }
}

export function showElement(id) {
  const element = document.getElementById(id);
  if (element) {
    element.classList.remove('hidden');
  }
}

export function hideElement(id) {
  const element = document.getElementById(id);
  if (element) {
    element.classList.add('hidden');
  }
}

export function setSelectOptions(id, html, keepFirstOption = false) {
  const element = document.getElementById(id);
  if (!element) return;

  const firstOption = keepFirstOption ? (element.options[0]?.outerHTML || '') : '';
  element.innerHTML = firstOption + html;
}
