import { createApiClient } from './core/api-client.js';
import { hideElement, setHTML, setText, showElement } from './core/dom.js';
import { hideLoading, showLoading, showToast } from './core/ui-feedback.js';
import { createDashboardModule } from '../../pages/dashboard/dashboard.page.js';
import { createReatsModule } from '../../pages/chamados/chamados.page.js';
import { createSatModule } from '../../pages/satisfacao/satisfacao.page.js';
import { createAdminModule } from '../../pages/usuarios/usuarios.page.js';
import { createExportModule } from '../../pages/relatorios/relatorios.page.js';

'use strict';

const S = {
  user: null,
  records: [],
  satRecords: [],
  satMonths: [],
  editingId: null,
  charts: {},
  theme: localStorage.getItem('theme') || 'light',
  parsedImport: null,
  parsedSat: null,
};

const api = createApiClient();


function updateClock() {
  const now = new Date();
  const el = document.getElementById('clock');
  if (el) el.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}
setInterval(updateClock, 1000);
updateClock();

function applyTheme(t) {
  S.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
  const btn = document.getElementById('theme-icon');
  if (btn) btn.textContent = t === 'dark' ? '\u{1F319}' : '\u2600\uFE0F';
}

function toggleTheme() {
  applyTheme(S.theme === 'dark' ? 'light' : 'dark');
}
applyTheme(S.theme);

function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    vx: (Math.random() - 0.5) * 5,
    vy: Math.random() * 4 + 2,
    color: ['#c9a84c', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)],
    size: Math.random() * 9 + 4,
    rot: Math.random() * 360,
    vrot: (Math.random() - 0.5) * 9,
  }));

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
    });
    frame += 1;
    if (frame < 180) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}



function _groupByConsultor(recs) {
  const byC = {};
  recs.forEach(r => {
    if (!byC[r.consultor]) byC[r.consultor] = { total: 0, rev: 0, trat: 0, can: 0 };
    byC[r.consultor].total += 1;
    if (r.status === 'Revertido') byC[r.consultor].rev += 1;
    else if (r.status === 'Em Tratativa') byC[r.consultor].trat += 1;
    else byC[r.consultor].can += 1;
  });
  return byC;
}

const dashboardModule = createDashboardModule({ S, setText, setHTML, _groupByConsultor });
const {
  fmtDate,
  populateAllFilters,
  updateTopbarKpis,
  renderDashboard,
  renderDashComp,
  renderStats,
  renderCharts,
  mkChart,
  renderHeatmap,
  renderRanking,
} = dashboardModule;

function closeModal() {
  document.querySelectorAll('.modal-bg').forEach(el => el.classList.remove('open'));
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

const reatsModule = createReatsModule({
  S,
  api,
  showToast,
  showLoading,
  hideLoading,
  populateAllFilters,
  updateTopbarKpis,
  renderDashboard,
  fmtDate,
  fireConfetti,
  closeModal,
  setText,
  setHTML,
  showElement,
  hideElement,
});
const {
  clearForm,
  resetImport,
  hdlParse,
  hdlSave,
  debouncedHistory,
  clearFilters,
  renderHistory,
  openEdit,
  saveEdit,
  deleteDay,
} = reatsModule;

const satModule = createSatModule({
  S,
  api,
  showToast,
  showLoading,
  hideLoading,
  populateAllFilters,
  updateTopbarKpis,
  setText,
  setHTML,
  showElement,
  hideElement,
  mkChart,
});
const {
  switchSatTab,
  renderSat,
  parseSatData,
  saveSatData,
  hdlExcelSat,
} = satModule;

const adminModule = createAdminModule({ S, api, showToast, closeModal });
const { renderUsers, openAddUser, saveUser, deleteUser } = adminModule;

const exportModule = createExportModule({
  S,
  api,
  showToast,
  showLoading,
  hideLoading,
  populateAllFilters,
  renderDashboard,
  updateTopbarKpis,
});
const { hdlExcel, hdlPDF, hdlExportBackup, hdlImportBackup } = exportModule;

const SPOTLIGHT_PAGES = [
  { id: 'dashboard', icon: '\u{1F3E0}', label: 'Dashboard', sub: 'Vis\u00e3o geral' },
  { id: 'import', icon: '\u{1F4E5}', label: 'Importar REATs', sub: 'Processar novo arquivo' },
  { id: 'history', icon: '\u{1F4CB}', label: 'Hist\u00f3rico', sub: 'Todos os registros' },
  { id: 'stats', icon: '\u{1F4CA}', label: 'Estat\u00edsticas', sub: 'Rankings e m\u00e9tricas' },
  { id: 'charts', icon: '\u{1F4C8}', label: 'Gr\u00e1ficos', sub: 'An\u00e1lise visual' },
  { id: 'heatmap', icon: '\u{1F525}', label: 'Heatmap', sub: 'Hor\u00e1rios de revers\u00e3o' },
  { id: 'sat', icon: '\u2B50', label: 'Satisfa\u00e7\u00e3o', sub: 'Avalia\u00e7\u00f5es dos clientes' },
  { id: 'ranking', icon: '\u{1F3C6}', label: 'Ranking', sub: 'P\u00f3dio da equipe' },
  { id: 'users', icon: '\u2699\uFE0F', label: 'Usu\u00e1rios', sub: 'Gerenciar acessos' },
];
let spotIdx = 0;

function openSpotlight() {
  document.getElementById('spotlight-bg').classList.add('open');
  const inp = document.getElementById('spotlight-input');
  inp.value = '';
  filterSpotlight('');
  setTimeout(() => inp.focus(), 50);
}

function closeSpotlight() {
  document.getElementById('spotlight-bg').classList.remove('open');
}

function filterSpotlight(q) {
  const pages = SPOTLIGHT_PAGES.filter(p => !q || p.label.toLowerCase().includes(q.toLowerCase()));
  spotIdx = 0;
  document.getElementById('spotlight-results').innerHTML =
    '<div class="spotlight-section">Navega\u00e7\u00e3o</div>' +
    pages.map((p, i) => `
      <div class="spotlight-item${i === 0 ? ' active' : ''}" onclick="switchTab('${p.id}',null);closeSpotlight()">
        <div class="spotlight-item-icon" style="background:var(--surface2)">${p.icon}</div>
        <div><div class="spotlight-item-text">${p.label}</div><div class="spotlight-item-sub">${p.sub}</div></div>
      </div>`).join('');
}

function spotlightKey(e) {
  const items = document.querySelectorAll('.spotlight-item');
  if (e.key === 'ArrowDown') spotIdx = Math.min(spotIdx + 1, items.length - 1);
  else if (e.key === 'ArrowUp') spotIdx = Math.max(spotIdx - 1, 0);
  else if (e.key === 'Enter') {
    items[spotIdx]?.click();
    return;
  } else if (e.key === 'Escape') {
    closeSpotlight();
    return;
  }
  items.forEach((el, i) => el.classList.toggle('active', i === spotIdx));
}

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openSpotlight();
  }
});

function switchTab(id, btn) {
  document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const tab = document.getElementById(`tab-${id}`);
  if (tab) tab.classList.remove('hidden');
  if (btn) btn.classList.add('active');
  else {
    const nb = document.getElementById(`nav-${id}`);
    if (nb) nb.classList.add('active');
  }

  setBottomNav(id);
  const renders = {
    dashboard: renderDashboard,
    history: renderHistory,
    stats: renderStats,
    charts: renderCharts,
    heatmap: renderHeatmap,
    sat: renderSat,
    ranking: renderRanking,
    users: renderUsers,
  };
  if (renders[id]) renders[id]();
}

function setBottomNav(id) {
  document.querySelectorAll('.bn-item').forEach(el => el.classList.toggle('active', el.id === `bn-${id}`));
}

async function doLogin() {
  const login = document.getElementById('li-user').value.trim();
  const pass = document.getElementById('li-pass').value;
  const errEl = document.getElementById('login-err');
  const btn = document.getElementById('btn-login-submit');
  errEl.classList.remove('show');
  btn.disabled = true;
  btn.textContent = 'Entrando\u2026';
  try {
    const d = await api.post('/auth/login', { login, pass });
    S.user = d.user;
    onLoginSuccess();
  } catch (e) {
    errEl.textContent = `\u26A0\uFE0F ${e.message}`;
    errEl.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar \u2192';
  }
}

async function checkSession() {
  try {
    const d = await api.get('/auth/me');
    S.user = d.user;
    onLoginSuccess();
  } catch {
    showLoginScreen();
  }
}

function onLoginSuccess() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';

  const av = document.getElementById('user-av');
  const ud = document.getElementById('user-disp');
  if (av) av.textContent = S.user.name.charAt(0).toUpperCase();
  if (ud) ud.textContent = S.user.name;

  const dn = document.getElementById('dash-name');
  if (dn) dn.textContent = S.user.name.split(' ')[0];

  const btnAddUser = document.getElementById('btn-add-user');
  if (btnAddUser) btnAddUser.style.display = S.user.role === 'admin' ? 'inline-flex' : 'none';
  const btnBackupTop = document.getElementById('btn-backup-top');
  if (btnBackupTop) btnBackupTop.style.display = S.user.role === 'admin' ? 'inline-flex' : 'none';
  const btnBackupSide = document.getElementById('btn-backup-side');
  if (btnBackupSide) btnBackupSide.style.display = S.user.role === 'admin' ? 'inline-flex' : 'none';
  const btnImportBackup = document.getElementById('btn-import-backup');
  if (btnImportBackup) btnImportBackup.style.display = S.user.role === 'admin' ? 'inline-flex' : 'none';

  loadAllData();
}

function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

function handleUnauthorized() {
  const hadSession = Boolean(S.user);
  S.user = null;
  S.records = [];
  S.satRecords = [];
  S.satMonths = [];
  closeModal();
  showLoginScreen();

  if (hadSession) {
    showToast('Sua sessao expirou. Faca login novamente.', 'warn');
  }
}

window.addEventListener('tracker:unauthorized', handleUnauthorized);

async function doLogout() {
  await api.post('/auth/logout', {}).catch(() => {});
  S.user = null;
  S.records = [];
  S.satRecords = [];
  S.satMonths = [];
  closeModal();
  showLoginScreen();
}

function openAccModal() {
  document.getElementById('acc-name').textContent = S.user?.name || '\u2014';
  document.getElementById('acc-login-lbl').textContent = `@${S.user?.login || ''}`;
  document.getElementById('acc-current-pass').value = '';
  document.getElementById('acc-pass').value = '';
  document.getElementById('acc-modal').classList.add('open');
}

async function changeMyPass() {
  const currentPass = document.getElementById('acc-current-pass').value;
  const p = document.getElementById('acc-pass').value;
  if (!p) {
    closeModal();
    return;
  }
  if (!currentPass) {
    showToast('Informe a senha atual.', 'warn');
    return;
  }
  try {
    await api.put('/users/me/password', { current_pass: currentPass, pass: p });
    showToast('Senha atualizada!');
    closeModal();
  } catch (e) {
    showToast(e.message, 'err');
  }
}

async function loadAllData() {
  showLoading();
  try {
    const [reatsData, satData, satMonthsData] = await Promise.all([
      api.get('/reats'),
      api.get('/sat'),
      api.get('/sat/months'),
    ]);
    S.records = reatsData.records || [];
    S.satRecords = satData.records || [];
    S.satMonths = satMonthsData.months || [];
    populateAllFilters();
    renderDashboard();
    updateTopbarKpis();
  } catch (e) {
    if (e?.status !== 401) {
      showToast(`Erro ao carregar dados: ${e.message}`, 'err');
    }
  } finally {
    hideLoading();
  }
}

function initParticles() {
  const canvas = document.getElementById('login-particles');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const pts = Array.from({ length: 35 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 2.2 + 0.8,
    a: Math.random() * 0.35 + 0.08,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < pts.length; i += 1) {
      for (let j = i + 1; j < pts.length; j += 1) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(201,168,76,${0.06 * (1 - dist / 120)})`;
          ctx.stroke();
        }
      }
    }

    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,168,76,${p.a})`;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });
    requestAnimationFrame(draw);
  }
  draw();
}

Object.assign(window, {
  showToast,
  toggleTheme,
  openSpotlight,
  closeSpotlight,
  filterSpotlight,
  spotlightKey,
  switchTab,
  setBottomNav,
  closeModal,
  doLogin,
  doLogout,
  openAccModal,
  changeMyPass,
  renderDashComp,
  hdlParse,
  clearForm,
  resetImport,
  hdlSave,
  debouncedHistory,
  clearFilters,
  renderHistory,
  openEdit,
  saveEdit,
  deleteDay,
  renderStats,
  renderCharts,
  renderHeatmap,
  switchSatTab,
  renderSat,
  parseSatData,
  saveSatData,
  hdlExcelSat,
  renderRanking,
  renderUsers,
  openAddUser,
  saveUser,
  deleteUser,
  hdlExcel,
  hdlPDF,
  hdlExportBackup,
  hdlImportBackup,
});

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  checkSession();
  document.querySelectorAll('.modal-bg').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target === el) closeModal();
    });
  });
});






