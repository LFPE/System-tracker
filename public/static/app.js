// ══════════════════════════════════════════════
// TRACKER — Coobrastur — Frontend App (API mode)
// v2.0 — Sincronizado com IDs do index.html
// ══════════════════════════════════════════════
'use strict';

// ─── Estado Global ────────────────────────────
const S = {
  user: null,
  records: [],
  satRecords: [],
  editingId: null,
  charts: {},
  theme: localStorage.getItem('theme') || 'dark',
  parsedImport: null,
  parsedSat: null,
};

// ─── API Helper ───────────────────────────────
const api = {
  async req(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const r = await fetch('/api' + path, opts);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `Erro ${r.status}`);
    return d;
  },
  get:  (p)    => api.req('GET',    p),
  post: (p, b) => api.req('POST',   p, b),
  put:  (p, b) => api.req('PUT',    p, b),
  del:  (p)    => api.req('DELETE', p),
};

// ─── Toast ────────────────────────────────────
function showToast(msg, type = 'ok') {
  const icons = { ok: '✅', err: '❌', warn: '⚠️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${msg}</span><span class="toast-close" onclick="this.parentNode.remove()">✕</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

// ─── Loading ──────────────────────────────────
let _loadEl = null;
function showLoading() {
  if (_loadEl) return;
  _loadEl = document.createElement('div');
  _loadEl.className = 'loading-overlay';
  _loadEl.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(_loadEl);
}
function hideLoading() {
  if (_loadEl) { _loadEl.remove(); _loadEl = null; }
}

// ─── Relógio ──────────────────────────────────
function updateClock() {
  const now = new Date();
  const el = document.getElementById('clock');
  if (el) el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}
setInterval(updateClock, 1000);
updateClock();

// ─── Tema ─────────────────────────────────────
function applyTheme(t) {
  S.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
  const btn = document.getElementById('theme-icon');
  if (btn) btn.textContent = t === 'dark' ? '🌙' : '☀️';
}
function toggleTheme() { applyTheme(S.theme === 'dark' ? 'light' : 'dark'); }
applyTheme(S.theme);

// ─── Confetti ─────────────────────────────────
function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width, y: -20,
    vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4 + 2,
    color: ['#c9a84c','#3b82f6','#10b981','#f59e0b','#ef4444'][Math.floor(Math.random() * 5)],
    size: Math.random() * 9 + 4, rot: Math.random() * 360, vrot: (Math.random() - 0.5) * 9
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
      ctx.restore();
      p.x += p.vx; p.y += p.vy; p.rot += p.vrot; p.vy += 0.08;
    });
    if (++frame < 220) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

// ─── Spotlight ────────────────────────────────
const PAGES = [
  { id:'dashboard', icon:'🏠', label:'Dashboard',      sub:'Visão geral' },
  { id:'import',    icon:'📥', label:'Importar REATs', sub:'Processar novo arquivo' },
  { id:'history',   icon:'📋', label:'Histórico',      sub:'Todos os registros' },
  { id:'stats',     icon:'📊', label:'Estatísticas',   sub:'Rankings e métricas' },
  { id:'charts',    icon:'📈', label:'Gráficos',       sub:'Análise visual' },
  { id:'heatmap',   icon:'🔥', label:'Heatmap',        sub:'Horários de reversão' },
  { id:'sat',       icon:'⭐', label:'Satisfação',     sub:'Avaliações dos clientes' },
  { id:'ranking',   icon:'🏆', label:'Ranking',        sub:'Pódio da equipe' },
  { id:'users',     icon:'⚙️', label:'Usuários',       sub:'Gerenciar acessos' },
];
let _spotIdx = 0;
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
  const pages = PAGES.filter(p => !q || p.label.toLowerCase().includes(q.toLowerCase()));
  _spotIdx = 0;
  document.getElementById('spotlight-results').innerHTML =
    '<div class="spotlight-section">Navegação</div>' +
    pages.map((p, i) => `
      <div class="spotlight-item${i === 0 ? ' active' : ''}" onclick="switchTab('${p.id}',null);closeSpotlight()">
        <div class="spotlight-item-icon" style="background:var(--surface2)">${p.icon}</div>
        <div><div class="spotlight-item-text">${p.label}</div><div class="spotlight-item-sub">${p.sub}</div></div>
      </div>`).join('');
}
function spotlightKey(e) {
  const items = document.querySelectorAll('.spotlight-item');
  if (e.key === 'ArrowDown')  _spotIdx = Math.min(_spotIdx + 1, items.length - 1);
  else if (e.key === 'ArrowUp') _spotIdx = Math.max(_spotIdx - 1, 0);
  else if (e.key === 'Enter') { items[_spotIdx]?.click(); return; }
  else if (e.key === 'Escape') { closeSpotlight(); return; }
  items.forEach((el, i) => el.classList.toggle('active', i === _spotIdx));
}
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSpotlight(); }
});

// ─── Tabs ─────────────────────────────────────
function switchTab(id, btn) {
  document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const tab = document.getElementById('tab-' + id);
  if (tab) tab.classList.remove('hidden');
  if (btn) btn.classList.add('active');
  else { const nb = document.getElementById('nav-' + id); if (nb) nb.classList.add('active'); }
  setBottomNav(id);
  const renders = {
    dashboard: renderDashboard,
    history:   renderHistory,
    stats:     renderStats,
    charts:    renderCharts,
    heatmap:   renderHeatmap,
    sat:       () => renderSat(),
    ranking:   renderRanking,
    users:     renderUsers,
  };
  if (renders[id]) renders[id]();
}
function setBottomNav(id) {
  document.querySelectorAll('.bn-item').forEach(el =>
    el.classList.toggle('active', el.id === 'bn-' + id));
}

// ─── Modais ───────────────────────────────────
function closeModal() {
  document.querySelectorAll('.modal-bg').forEach(el => el.classList.remove('open'));
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ─── AUTH ─────────────────────────────────────
async function doLogin() {
  const login = document.getElementById('li-user').value.trim();
  const pass  = document.getElementById('li-pass').value;
  const errEl = document.getElementById('login-err');
  const btn   = document.getElementById('btn-login-submit');
  errEl.classList.remove('show');
  btn.disabled = true; btn.textContent = 'Entrando…';
  try {
    const d = await api.post('/auth/login', { login, pass });
    S.user = d.user;
    onLoginSuccess();
  } catch (e) {
    errEl.textContent = '⚠️ ' + e.message;
    errEl.classList.add('show');
  } finally {
    btn.disabled = false; btn.textContent = 'Entrar →';
  }
}

async function checkSession() {
  try {
    const d = await api.get('/auth/me');
    S.user = d.user;
    onLoginSuccess();
  } catch { showLoginScreen(); }
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
  loadAllData();
}

function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

async function doLogout() {
  await api.post('/auth/logout', {}).catch(() => {});
  S.user = null; S.records = []; S.satRecords = [];
  closeModal();
  showLoginScreen();
}

function openAccModal() {
  document.getElementById('acc-name').textContent = S.user?.name || '—';
  document.getElementById('acc-login-lbl').textContent = '@' + (S.user?.login || '');
  document.getElementById('acc-pass').value = '';
  document.getElementById('acc-modal').classList.add('open');
}

async function changeMyPass() {
  const p = document.getElementById('acc-pass').value;
  if (!p) { closeModal(); return; }
  try {
    await api.put('/users/me/password', { pass: p });
    showToast('Senha atualizada!');
    closeModal();
  } catch (e) { showToast(e.message, 'err'); }
}

// ─── Carregar dados ───────────────────────────
async function loadAllData() {
  showLoading();
  try {
    const [reatsData, satData] = await Promise.all([
      api.get('/reats'),
      api.get('/sat'),
    ]);
    S.records    = reatsData.records  || [];
    S.satRecords = satData.records    || [];
    populateAllFilters();
    renderDashboard();
    updateTopbarKpis();
  } catch (e) {
    showToast('Erro ao carregar dados: ' + e.message, 'err');
  } finally {
    hideLoading();
  }
}

// ─── Helpers de data ──────────────────────────
function fmtMes(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
}
function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const dias  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  return `${dias[dt.getDay()]}, ${d} ${meses[parseInt(m) - 1]} ${y}`;
}

// ─── Popular filtros ──────────────────────────
function populateAllFilters() {
  const consultores = [...new Set(S.records.map(r => r.consultor).filter(Boolean))].sort();
  const meses = [...new Set(S.records.map(r => r.data_ref?.slice(0, 7)).filter(Boolean))].sort().reverse();
  const mesOpts = meses.map(m => `<option value="${m}">${fmtMes(m)}</option>`).join('');
  const consOpts = consultores.map(c => `<option value="${c}">${c}</option>`).join('');
  const allMes = '<option value="">Todo o período</option>' + mesOpts;

  _setSelect('f-consultor', consOpts, true);
  _setSelect('f-mes',       allMes,  false);
  _setSelect('f-mes-chart', allMes,  false);
  _setSelect('f-mes-heat',  allMes,  false);
  _setSelect('f-mes-rank',  allMes,  false);

  // Datas para filtro de histórico
  const datas = [...new Set(S.records.map(r => r.data_ref).filter(Boolean))].sort().reverse();
  _setSelect('f-data', '<option value="">Todas as datas</option>' + datas.map(d => `<option value="${d}">${fmtDate(d)}</option>`).join(''), false);

  // Satisfação
  const satMeses = [...new Set(S.satRecords.map(r => r.date?.slice(0, 7)).filter(Boolean))].sort().reverse();
  _setSelect('sat-mes-sel', '<option value="">Todos os períodos</option>' + satMeses.map(m => `<option value="${m}">${fmtMes(m)}</option>`).join(''), false);
}

function _setSelect(id, html, keepFirst) {
  const el = document.getElementById(id);
  if (!el) return;
  const first = keepFirst ? (el.options[0]?.outerHTML || '') : '';
  el.innerHTML = first + html;
}

// ─── KPIs topbar ─────────────────────────────
function updateTopbarKpis() {
  const total = S.records.length;
  const rev   = S.records.filter(r => r.status === 'Revertido').length;
  const taxa  = total ? Math.round(rev / total * 100) : 0;
  _setText('hdr-total', total);
  _setText('hdr-taxa',  taxa + '%');
  if (S.satRecords.length) {
    const bom = S.satRecords.filter(r => r.cat === 'BOM').length;
    _setText('hdr-sat', Math.round(bom / S.satRecords.length * 100) + '%');
  }
}
function _setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

// ═══════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════
function renderDashboard() {
  const recs = S.records;
  const total = recs.length;
  const rev   = recs.filter(r => r.status === 'Revertido').length;
  const trat  = recs.filter(r => r.status === 'Em Tratativa').length;
  const can   = recs.filter(r => r.status === 'Cancelado').length;
  const taxa  = total ? +(rev / total * 100).toFixed(1) : 0;

  // Data
  _setText('dash-date-sub', new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

  // KPI cards
  _setHTML('dash-kpis', !total ? '<p style="color:var(--text3);font-size:13px">Nenhum dado. Importe um arquivo REAT.</p>' : `
    <div class="kpi-card kpi-gold"><div class="kpi-icon">📋</div><div class="kpi-val gold">${total}</div><div class="kpi-label">Total de REATs</div></div>
    <div class="kpi-card kpi-green"><div class="kpi-icon">✅</div><div class="kpi-val green">${rev}</div><div class="kpi-label">Revertidos</div></div>
    <div class="kpi-card kpi-yellow"><div class="kpi-icon">⏳</div><div class="kpi-val yellow">${trat}</div><div class="kpi-label">Em Tratativa</div></div>
    <div class="kpi-card kpi-red"><div class="kpi-icon">❌</div><div class="kpi-val red">${can}</div><div class="kpi-label">Cancelados</div></div>
  `);

  // Meta de reversão
  _setText('dash-taxa-val', taxa + '%');
  const prog = document.getElementById('dash-prog');
  if (prog) setTimeout(() => prog.style.width = Math.min(taxa / 40 * 100, 100) + '%', 100);
  const trend = document.getElementById('dash-meta-trend');
  if (trend) {
    const diff = taxa - 40;
    trend.className = 'dash-trend ' + (diff >= 0 ? 'up' : diff > -10 ? 'neutral' : 'down');
    trend.textContent = (diff >= 0 ? '▲ ' : '▼ ') + Math.abs(diff).toFixed(1) + '% da meta';
  }

  // Top consultores
  const byC = _groupByConsultor(recs);
  const top = Object.entries(byC)
    .map(([n, d]) => ({ n, total: d.total, taxa: d.total ? +(d.rev / d.total * 100).toFixed(1) : 0 }))
    .sort((a, b) => b.taxa - a.taxa).slice(0, 5);
  _setHTML('dash-top-cons', top.length ? top.map((t, i) => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div style="width:24px;height:24px;border-radius:50%;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${i + 1}</div>
      <div style="flex:1;font-size:12px;font-weight:600">${t.n}</div>
      <div style="font-size:12px;color:var(--green2);font-weight:700">${t.taxa}%</div>
      <div style="font-size:10px;color:var(--text3)">${t.total} reg</div>
    </div>`).join('') : '<p style="color:var(--text3);font-size:12px">Sem dados</p>');

  // Comparativo mensal
  renderDashComp();

  // Streak
  const datesRev = [...new Set(recs.filter(r => r.status === 'Revertido').map(r => r.data_ref).filter(Boolean))].sort().reverse();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (datesRev.includes(d.toISOString().slice(0, 10))) streak++;
    else if (i > 0) break;
  }
  _setText('streak-badge', `🔥 ${streak} dia${streak !== 1 ? 's' : ''} seguido${streak !== 1 ? 's' : ''}`);

  // Alertas de performance
  const alerts = document.getElementById('perf-alerts');
  if (alerts) {
    const low = Object.entries(byC).filter(([, d]) => d.total >= 5 && d.rev / d.total < 0.3);
    alerts.innerHTML = low.map(([n, d]) => `
      <div class="perf-alert">⚠️ <strong>${n}</strong> está com taxa baixa: ${(d.rev / d.total * 100).toFixed(1)}% (${d.rev}/${d.total})</div>
    `).join('');
  }

  // Conquistas
  renderAchievements(total, rev, taxa, Object.keys(byC).length);
}

function renderDashComp() {
  const meses = [...new Set(S.records.map(r => r.data_ref?.slice(0, 7)).filter(Boolean))].sort().reverse();
  const selEl = document.getElementById('dash-comp-mes');
  if (selEl && selEl.options.length <= 1) {
    selEl.innerHTML = '<option value="">Todos os meses</option>' + meses.map(m => `<option value="${m}">${fmtMes(m)}</option>`).join('');
  }
  const mes = selEl?.value || '';
  const recs = mes ? S.records.filter(r => r.data_ref?.startsWith(mes)) : S.records;
  const byC = _groupByConsultor(recs);
  const rows = Object.entries(byC).sort((a, b) => b[1].rev - a[1].rev);
  _setHTML('dash-comp-cards', rows.map(([n, d]) => {
    const taxa = d.total ? +(d.rev / d.total * 100).toFixed(1) : 0;
    return `<div class="comp-card">
      <div style="font-size:11px;color:var(--text3);margin-bottom:6px">${n.split(' ')[0]}</div>
      <div class="comp-val" style="color:${taxa >= 40 ? 'var(--green2)' : taxa >= 30 ? 'var(--yellow2)' : 'var(--red2)'}">${taxa}%</div>
      <div style="font-size:10px;color:var(--text3);margin-top:4px">${d.rev}/${d.total}</div>
    </div>`;
  }).join('') || '<p style="color:var(--text3);font-size:12px">Sem dados</p>');
}

function renderAchievements(total, rev, taxa, numConss) {
  const el = document.getElementById('dash-achievements');
  if (!el) return;
  const achs = [
    { icon: '🌟', name: 'Primeira Reversão',   desc: 'Reverteu o 1º REAT',      unlocked: rev >= 1 },
    { icon: '🎯', name: 'Meta Atingida',        desc: 'Taxa ≥ 40% de reversão', unlocked: taxa >= 40 },
    { icon: '💯', name: 'Centenário',           desc: '100 REATs importados',   unlocked: total >= 100 },
    { icon: '🏆', name: 'Elite',                desc: 'Taxa ≥ 60%',             unlocked: taxa >= 60 },
    { icon: '⚡', name: 'Equipe Completa',      desc: '5+ consultores ativos',  unlocked: numConss >= 5 },
    { icon: '🔥', name: 'Em Chamas',            desc: '200+ REATs importados',  unlocked: total >= 200 },
    { icon: '👑', name: 'Lenda',                desc: 'Taxa ≥ 80%',             unlocked: taxa >= 80 },
    { icon: '📈', name: 'Crescimento',          desc: '50+ revertidos',         unlocked: rev >= 50 },
  ];
  el.innerHTML = achs.map(a => `
    <div class="achievement ${a.unlocked ? 'unlocked' : ''}">
      <div class="ach-icon ${a.unlocked ? '' : 'locked'}">${a.icon}</div>
      <div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div>
      ${a.unlocked ? '<span style="margin-left:auto;color:var(--gold2);font-size:14px;font-weight:700">✓</span>' : ''}
    </div>`).join('');
}

// ═══════════════════════════════════════════════
// IMPORTAR REATs
// ═══════════════════════════════════════════════
function _setImportStep(n) {
  // dots: sc1, sc2, sc3 | labels: sl1, sl2, sl3 | lines: ln1, ln2
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById('sc' + i);
    if (dot) dot.className = i <= n ? 'step-dot done' : 'step-dot idle';
    const lbl = document.getElementById('sl' + i);
    if (lbl) { lbl.style.fontWeight = i === n ? '700' : '400'; lbl.style.color = i <= n ? 'var(--text)' : 'var(--text3)'; }
  }
  const ln1 = document.getElementById('ln1');
  const ln2 = document.getElementById('ln2');
  if (ln1) ln1.className = 'step-line' + (n > 1 ? ' done' : '');
  if (ln2) ln2.className = 'step-line' + (n > 2 ? ' done' : '');
}

function clearForm() {
  document.getElementById('raw-text').value = '';
  document.getElementById('date-input').value = '';
  _setHTML('prev-stats', '');
  _setHTML('prev-list', '');
  _show('prev-empty'); _hide('prev-content');
  _setText('prev-title', '👀 Preview dos registros');
}

function resetImport() {
  clearForm();
  _show('step-form'); _hide('step-success');
  _setImportStep(1);
}

// Parser de REATs
function _parseREATs(text, dataRef) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const records = [];

  function normName(n) {
    if (!n) return '-';
    const l = n.toLowerCase();
    if (l.includes('amanda'))                          return 'Amanda Neves';
    if (l.includes('vitoria') || l.includes('vitória')) return 'Vitoria Calixto';
    if (l.includes('martin'))                          return 'Martin Silva';
    if (l.includes('nobean') || l.includes('nôbean'))  return 'Nôbean Silva';
    if (l.includes('jenifer') || l.includes('jennifer')) return 'Jenifer Afonso';
    if (l.includes('tamires'))                         return 'Tamires Perotto';
    if (l.includes('rebeca'))                          return 'Rebeca Silva';
    if (l.includes('beatriz') && (l.includes('andrea') || l.includes('andréa'))) return 'Beatriz/Andréa';
    if (l.includes('beatriz'))                         return 'Beatriz S.';
    if (l.includes('andrea') || l.includes('andréa')) return 'Beatriz/Andréa';
    return n.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  const CONS = ['amanda','vitoria','vitória','martin','nobean','nôbean','jenifer','jennifer','tamires','rebeca','beatriz','andrea','andréa'];
  const reData   = /\b(\d{2}\/\d{2}\/\d{4})\b/;
  const reHora   = /\b(\d{2}:\d{2})\b/;
  const reStatus = /\b(revertid[oa]|cancelad[oa]|em tratativa|tratativa)\b/i;
  const reMotivo = /\b(financeiro|financeira|falecimento|mudança|transferência|desistência|viagem|doença|inadimplência|inadimplente|outros?)\b/i;
  const rePlano  = /\b(bronze|prata|ouro|diamante|premium|essencial|básico|básica)\b/i;
  const reTipo   = /\b(cancelamento|solicitação|pedido|reat)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const mData = reData.exec(line);
    const mHora = reHora.exec(line);
    if (!mData || !mHora) continue;

    const ctx = line + ' ' + (lines[i + 1] || '') + ' ' + (lines[i + 2] || '');

    // Status
    let status = 'Em Tratativa', revertido = '-';
    const mS = reStatus.exec(ctx);
    if (mS) {
      const s = mS[1].toLowerCase();
      if (s.startsWith('revert'))  { status = 'Revertido';    revertido = 'Sim'; }
      else if (s.startsWith('cancel')) { status = 'Cancelado'; }
    }

    // Consultor
    let consultor = '-';
    for (let j = i; j <= Math.min(i + 3, lines.length - 1); j++) {
      const ll = lines[j].toLowerCase();
      if (CONS.some(cn => ll.includes(cn))) { consultor = normName(lines[j]); break; }
    }

    // Outros campos
    const mMotivo = reMotivo.exec(ctx);
    const mPlano  = rePlano.exec(ctx);
    const mTipo   = reTipo.exec(line);
    const motivo  = mMotivo ? mMotivo[1].charAt(0).toUpperCase() + mMotivo[1].slice(1) : '-';
    const plano   = mPlano  ? mPlano[1].charAt(0).toUpperCase()  + mPlano[1].slice(1)  : '-';
    const tipo    = mTipo   ? mTipo[1].charAt(0).toUpperCase()   + mTipo[1].slice(1)   : 'Cancelamento';

    let analise = '';
    if (status === 'Revertido') analise = 'REAT revertido com sucesso.';
    else if (status === 'Cancelado') analise = 'Cancelamento efetivado.';
    else analise = 'Em acompanhamento.';

    records.push({ data_ref: dataRef, tipo, data: mData[1], hora: mHora[1], consultor, status, revertido, motivo, plano_em_dia: '-', plano, analise, texto: line });
  }
  return records;
}

function hdlParse() {
  const txt  = document.getElementById('raw-text').value.trim();
  const date = document.getElementById('date-input').value;
  if (!txt)  { showToast('Cole o texto do REAT', 'warn'); return; }
  if (!date) { showToast('Selecione a data', 'warn'); return; }

  const records = _parseREATs(txt, date);
  S.parsedImport = { date, records };

  if (!records.length) {
    showToast('Nenhum registro identificado. Verifique o texto.', 'warn');
    return;
  }

  // KPIs de preview
  const rev  = records.filter(r => r.status === 'Revertido').length;
  const can  = records.filter(r => r.status === 'Cancelado').length;
  const trat = records.filter(r => r.status === 'Em Tratativa').length;
  const taxa = records.length ? Math.round(rev / records.length * 100) : 0;
  _setHTML('prev-stats', `
    <div class="kpi-card kpi-gold" style="padding:14px"><div class="kpi-val gold" style="font-size:22px">${records.length}</div><div class="kpi-label">Total</div></div>
    <div class="kpi-card kpi-green" style="padding:14px"><div class="kpi-val green" style="font-size:22px">${rev}</div><div class="kpi-label">Revertidos</div></div>
    <div class="kpi-card kpi-blue" style="padding:14px"><div class="kpi-val blue" style="font-size:22px">${taxa}%</div><div class="kpi-label">Taxa</div></div>
  `);
  _setHTML('prev-list', records.map(r => `
    <div class="prev-item">
      <span class="prev-tag ${r.status === 'Revertido' ? 'tag-rev' : r.status === 'Cancelado' ? 'tag-can' : 'tag-trat'}">${r.status}</span>
      <strong>${r.hora}</strong> — ${r.consultor} | ${r.motivo} | ${r.plano}
    </div>`).join(''));

  _setText('prev-title', `👀 ${records.length} registros identificados`);
  _hide('prev-empty'); _show('prev-content');
  _setImportStep(2);
}

async function hdlSave() {
  if (!S.parsedImport?.records?.length) return;
  showLoading();
  try {
    await api.post('/reats', { data_ref: S.parsedImport.date, records: S.parsedImport.records });
    const d = await api.get('/reats');
    S.records = d.records || [];
    populateAllFilters();
    updateTopbarKpis();
    _hide('step-form'); _show('step-success');
    _setImportStep(3);
    _setText('succ-msg', `${S.parsedImport.records.length} registros salvos para ${fmtDate(S.parsedImport.date)}`);
    fireConfetti();
    showToast(`${S.parsedImport.records.length} registros importados!`);
    S.parsedImport = null;
  } catch (e) {
    showToast('Erro ao salvar: ' + e.message, 'err');
  } finally {
    hideLoading();
  }
}

// ═══════════════════════════════════════════════
// HISTÓRICO
// ═══════════════════════════════════════════════
let _histDebounce = null;
function debouncedHistory() {
  clearTimeout(_histDebounce);
  _histDebounce = setTimeout(renderHistory, 250);
}

function clearFilters() {
  ['f-consultor','f-status-h','f-data'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const s = document.getElementById('f-search'); if (s) s.value = '';
  renderHistory();
}

function renderHistory() {
  let recs = S.records;
  const fc = document.getElementById('f-consultor')?.value || '';
  const fs = document.getElementById('f-status-h')?.value  || '';
  const fd = document.getElementById('f-data')?.value       || '';
  const fq = document.getElementById('f-search')?.value?.toLowerCase() || '';

  if (fc) recs = recs.filter(r => r.consultor === fc);
  if (fs) recs = recs.filter(r => r.status    === fs);
  if (fd) recs = recs.filter(r => r.data_ref  === fd);
  if (fq) recs = recs.filter(r => (r.consultor + r.motivo + r.analise + r.plano + r.texto).toLowerCase().includes(fq));

  _setText('filter-count', recs.length + ' registros');
  const el = document.getElementById('hist-list');
  if (!el) return;

  if (!S.records.length) { _show('hist-empty'); el.innerHTML = ''; return; }
  _hide('hist-empty');

  if (!recs.length) { el.innerHTML = '<div class="empty-state"><div class="ico">🔍</div><p>Nenhum resultado para os filtros aplicados.</p></div>'; return; }

  const sub = document.getElementById('hist-subtitle');
  if (sub) sub.textContent = `${S.records.length} registros totais`;

  const byDate = {};
  recs.forEach(r => { if (!byDate[r.data_ref]) byDate[r.data_ref] = []; byDate[r.data_ref].push(r); });

  el.innerHTML = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, items]) => `
    <div class="hist-day">
      <div class="hist-day-hdr">
        <div class="hist-day-label">📅 ${fmtDate(date)}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="hist-day-count">${items.length} registros</div>
          ${S.user?.role === 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteDay('${date}')">🗑 Apagar dia</button>` : ''}
        </div>
      </div>
      ${items.map(r => `
        <div class="hist-item ${r.status === 'Revertido' ? 'rev' : r.status === 'Cancelado' ? 'can' : 'trat'}" onclick="openEdit(${r.id})">
          <div>
            <div class="hist-main">${r.hora} — <strong>${r.consultor}</strong></div>
            <div class="hist-meta"><span>${r.tipo}</span><span>${r.motivo}</span><span>Plano: ${r.plano}</span></div>
            ${r.analise ? `<div class="hist-analise">${r.analise}</div>` : ''}
          </div>
          <span class="tag ${r.status === 'Revertido' ? 'tag-rev' : r.status === 'Cancelado' ? 'tag-can' : 'tag-trat'}">${r.status}</span>
        </div>`).join('')}
    </div>`).join('');
}

function openEdit(id) {
  const r = S.records.find(x => x.id === id);
  if (!r) return;
  S.editingId = id;
  _setHTML('edit-info', `<strong>${r.hora}</strong> — ${r.consultor}<br>${r.tipo} | ${r.motivo} | Plano: ${r.plano}`);
  document.getElementById('edit-status').value  = r.status;
  document.getElementById('edit-analise').value = r.analise || '';
  document.getElementById('edit-modal').classList.add('open');
}

async function saveEdit() {
  if (!S.editingId) return;
  const status  = document.getElementById('edit-status').value;
  const analise = document.getElementById('edit-analise').value;
  try {
    await api.put(`/reats/${S.editingId}`, { status, analise });
    const rec = S.records.find(r => r.id === S.editingId);
    if (rec) { rec.status = status; rec.analise = analise; }
    closeModal();
    renderHistory();
    renderDashboard();
    updateTopbarKpis();
    showToast('Registro atualizado!');
  } catch (e) { showToast(e.message, 'err'); }
}

async function deleteDay(dataRef) {
  if (!confirm(`Apagar TODOS os registros de ${fmtDate(dataRef)}?`)) return;
  try {
    await api.del(`/reats/date/${dataRef}`);
    S.records = S.records.filter(r => r.data_ref !== dataRef);
    populateAllFilters(); renderHistory(); renderDashboard(); updateTopbarKpis();
    showToast('Dia removido.');
  } catch (e) { showToast(e.message, 'err'); }
}

// ═══════════════════════════════════════════════
// ESTATÍSTICAS
// ═══════════════════════════════════════════════
function renderStats() {
  const mes  = document.getElementById('f-mes')?.value || '';
  const recs = mes ? S.records.filter(r => r.data_ref?.startsWith(mes)) : S.records;
  const total = recs.length;
  const rev   = recs.filter(r => r.status === 'Revertido').length;
  const trat  = recs.filter(r => r.status === 'Em Tratativa').length;
  const can   = recs.filter(r => r.status === 'Cancelado').length;
  const taxa  = total ? +(rev / total * 100).toFixed(1) : 0;

  // KPIs grandes
  _setHTML('big-stats', `
    <div class="kpi-card kpi-gold"><div class="kpi-icon">📋</div><div class="kpi-val gold">${total}</div><div class="kpi-label">Total</div></div>
    <div class="kpi-card kpi-green"><div class="kpi-icon">✅</div><div class="kpi-val green">${rev}</div><div class="kpi-label">Revertidos</div></div>
    <div class="kpi-card kpi-yellow"><div class="kpi-icon">⏳</div><div class="kpi-val yellow">${trat}</div><div class="kpi-label">Em Tratativa</div></div>
    <div class="kpi-card kpi-red"><div class="kpi-icon">❌</div><div class="kpi-val red">${can}</div><div class="kpi-label">Cancelados</div></div>
  `);

  _setText('taxa-geral', taxa + '%');
  const pf = document.getElementById('prog-fill');
  if (pf) setTimeout(() => pf.style.width = Math.min(taxa / 40 * 100, 100) + '%', 100);

  const byC = _groupByConsultor(recs);
  const el  = document.getElementById('stats-tbody');
  if (!el) return;

  // Alertas de stats
  const alertsEl = document.getElementById('perf-alerts-stats');
  if (alertsEl) {
    const low = Object.entries(byC).filter(([, d]) => d.total >= 5 && d.rev / d.total < 0.3);
    alertsEl.innerHTML = low.map(([n, d]) => `
      <div class="alert-banner">⚠️ <strong>${n}</strong> com taxa baixa: ${(d.rev / d.total * 100).toFixed(1)}% (${d.rev}/${d.total})</div>
    `).join('');
  }

  if (!total) { el.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text3)">Sem dados para o período</td></tr>'; return; }

  el.innerHTML = Object.entries(byC).sort((a, b) => {
    const ta = a[1].total ? a[1].rev / a[1].total : 0;
    const tb = b[1].total ? b[1].rev / b[1].total : 0;
    return tb - ta;
  }).map(([n, d], i) => {
    const tx = d.total ? +(d.rev / d.total * 100).toFixed(1) : 0;
    return `<tr>
      <td>${i + 1}</td><td><strong>${d.total >= 5 && tx < 30 ? '⚠️ ' : ''}${n}</strong></td>
      <td style="text-align:center">${d.total}</td>
      <td style="text-align:center;color:var(--green2)">${d.rev}</td>
      <td style="text-align:center;color:var(--yellow2)">${d.trat}</td>
      <td style="text-align:center;color:var(--red2)">${d.can}</td>
      <td style="text-align:center"><span class="tag ${tx >= 40 ? 'tag-rev' : tx >= 30 ? 'tag-trat' : 'tag-can'}">${tx}%</span></td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════
// GRÁFICOS
// ═══════════════════════════════════════════════
function renderCharts() {
  const mes  = document.getElementById('f-mes-chart')?.value || '';
  const recs = mes ? S.records.filter(r => r.data_ref?.startsWith(mes)) : S.records;
  if (!recs.length) return;

  const tc = S.theme === 'dark' ? 'rgba(241,245,249,.7)' : 'rgba(15,23,42,.7)';
  const gc = S.theme === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(15,23,42,.07)';

  // Taxa por dia
  const byDate = {};
  recs.forEach(r => {
    if (!byDate[r.data_ref]) byDate[r.data_ref] = { total: 0, rev: 0 };
    byDate[r.data_ref].total++;
    if (r.status === 'Revertido') byDate[r.data_ref].rev++;
  });
  const dates = Object.keys(byDate).sort();
  mkChart('chart-taxa', 'line', {
    labels: dates.map(d => d.slice(5)),
    datasets: [{ label: 'Taxa %', data: dates.map(d => byDate[d].total ? +(byDate[d].rev / byDate[d].total * 100).toFixed(1) : 0), borderColor: '#c9a84c', backgroundColor: 'rgba(201,168,76,.1)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#c9a84c' }]
  }, { yMin: 0, yMax: 100, tc, gc });

  // Distribuição status
  const rev  = recs.filter(r => r.status === 'Revertido').length;
  const trat = recs.filter(r => r.status === 'Em Tratativa').length;
  const can  = recs.filter(r => r.status === 'Cancelado').length;
  mkChart('chart-pie', 'doughnut', {
    labels: ['Revertido', 'Em Tratativa', 'Cancelado'],
    datasets: [{ data: [rev, trat, can], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderWidth: 0 }]
  }, { tc });

  // Volume por consultor
  const byC   = _groupByConsultor(recs);
  const conss = Object.keys(byC).sort();
  mkChart('chart-bar', 'bar', {
    labels: conss.map(c => c.split(' ')[0]),
    datasets: [
      { label: 'Revertido',    data: conss.map(c => byC[c].rev),  backgroundColor: '#10b981' },
      { label: 'Em Tratativa', data: conss.map(c => byC[c].trat), backgroundColor: '#f59e0b' },
      { label: 'Cancelado',    data: conss.map(c => byC[c].can),  backgroundColor: '#ef4444' },
    ]
  }, { stacked: true, tc, gc });

  // Comparativo mês a mês
  const meses  = [...new Set(recs.map(r => r.data_ref?.slice(0, 7)).filter(Boolean))].sort();
  mkChart('chart-comp', 'bar', {
    labels: meses.map(fmtMes),
    datasets: [
      { label: 'Total',      data: meses.map(m => recs.filter(r => r.data_ref?.startsWith(m)).length),                               backgroundColor: 'rgba(37,99,235,.6)' },
      { label: 'Revertidos', data: meses.map(m => recs.filter(r => r.data_ref?.startsWith(m) && r.status === 'Revertido').length), backgroundColor: 'rgba(16,185,129,.6)' },
    ]
  }, { tc, gc });
}

function mkChart(id, type, data, opts = {}) {
  if (S.charts[id]) { S.charts[id].destroy(); delete S.charts[id]; }
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const cfg = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: opts.tc, font: { family: 'Inter', size: 11 }, boxWidth: 12 } } },
  };
  if (type !== 'doughnut') {
    cfg.scales = {
      x: { ticks: { color: opts.tc, font: { size: 10 } }, grid: { color: opts.gc } },
      y: { ticks: { color: opts.tc, font: { size: 10 } }, grid: { color: opts.gc }, min: opts.yMin, max: opts.yMax }
    };
    if (opts.stacked) { cfg.scales.x.stacked = true; cfg.scales.y.stacked = true; }
  }
  S.charts[id] = new Chart(canvas.getContext('2d'), { type, data, options: cfg });
}

// ═══════════════════════════════════════════════
// HEATMAP
// ═══════════════════════════════════════════════
function renderHeatmap() {
  const mes  = document.getElementById('f-mes-heat')?.value || '';
  const recs = (mes ? S.records.filter(r => r.data_ref?.startsWith(mes)) : S.records).filter(r => r.status === 'Revertido' && r.hora);
  const el   = document.getElementById('heatmap-wrap');
  if (!el) return;

  if (!recs.length) {
    el.innerHTML = '<div class="empty-state"><div class="ico">🔥</div><p>Sem dados de reversão para o heatmap.</p></div>';
    _setHTML('best-hours', ''); _setHTML('shift-stats', '');
    return;
  }

  const grid = {};
  recs.forEach(r => { const h = parseInt(r.hora.split(':')[0], 10); if (!isNaN(h)) grid[h] = (grid[h] || 0) + 1; });
  const max = Math.max(...Object.values(grid), 1);

  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(12,1fr);gap:5px;margin-bottom:8px">
    ${Array.from({ length: 24 }, (_, h) => {
      const v   = grid[h] || 0;
      const int = v / max;
      const bg  = `rgba(201,168,76,${(0.08 + int * 0.9).toFixed(2)})`;
      const tc  = int > 0.55 ? '#fff' : 'rgba(241,245,249,.55)';
      return `<div class="heatmap-cell" style="height:54px;background:${bg};color:${tc}" title="${h}h: ${v} reversões">
        <div style="font-size:10px;font-weight:700">${String(h).padStart(2,'0')}h</div>
        <div style="font-size:12px;font-weight:800">${v || ''}</div>
      </div>`;
    }).join('')}
  </div>`;

  // Top 3 melhores horas
  const top = Object.entries(grid).sort((a, b) => b[1] - a[1]).slice(0, 3);
  _setHTML('best-hours', top.map(([h, v], i) => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:20px">${['🥇','🥈','🥉'][i]}</div>
      <div style="font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:700;color:var(--gold2)">${String(h).padStart(2,'0')}h</div>
      <div style="font-size:12px;color:var(--text3)">${v} reversão${v !== 1 ? 'ões' : ''}</div>
    </div>`).join(''));

  // Performance por turno
  const turnos = [
    { nome: 'Manhã (06-12)',  horas: [6,7,8,9,10,11] },
    { nome: 'Tarde (12-18)', horas: [12,13,14,15,16,17] },
    { nome: 'Noite (18-24)', horas: [18,19,20,21,22,23] },
  ];
  _setHTML('shift-stats', turnos.map(t => {
    const total = t.horas.reduce((s, h) => s + (grid[h] || 0), 0);
    const pct   = recs.length ? Math.round(total / recs.length * 100) : 0;
    return `<div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span style="color:var(--text2)">${t.nome}</span>
        <span style="font-weight:700">${total} (${pct}%)</span>
      </div>
      <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join(''));
}

// ═══════════════════════════════════════════════
// SATISFAÇÃO
// ═══════════════════════════════════════════════
function switchSatTab(tab) {
  ['import','mensal','consultores','charts'].forEach(t => {
    const btn = document.getElementById('sat-tab-' + t);
    const pan = document.getElementById('sat-panel-' + t);
    if (btn) btn.className = t === tab ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
    if (pan) pan.classList.toggle('hidden', t !== tab);
  });
  if (tab === 'mensal')      renderSatMensal();
  else if (tab === 'consultores') renderSatCards();
  else if (tab === 'charts') renderSatCharts();
  else                       renderSatImportPanel();
}

function renderSat() {
  // Descobre aba ativa
  const active = ['import','mensal','consultores','charts'].find(t => {
    const btn = document.getElementById('sat-tab-' + t);
    return btn && btn.classList.contains('btn-primary');
  }) || 'import';
  switchSatTab(active);
}

function renderSatImportPanel() {
  // Lista consultores monitorados
  const CONS = ['Amanda Neves','Vitoria Calixto','Martin Silva','Nôbean Silva','Jenifer Afonso','Beatriz/Andréa','Beatriz S.','Tamires Perotto','Rebeca Silva'];
  _setHTML('sat-cons-list', CONS.map(c => `
    <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--green2)"></div>
      <span style="font-size:12px">${c}</span>
    </div>`).join(''));
}

// Parser TSV de satisfação
function parseSatData() {
  const txt = document.getElementById('sat-raw')?.value?.trim();
  const mes = document.getElementById('sat-mes-sel')?.value;
  if (!txt) { showToast('Cole os dados TSV', 'warn'); return; }
  if (!mes)  { showToast('Selecione o mês no filtro acima', 'warn'); return; }

  const [y, m] = mes.split('-').map(Number);
  const lines   = txt.split('\n').map(l => l.trim()).filter(Boolean);
  const records = [];

  function normSatName(n) {
    if (!n) return null;
    const l = n.toLowerCase().trim();
    if (l.includes('amanda'))                              return 'Amanda Neves';
    if (l.includes('vitoria') || l.includes('vitória'))   return 'Vitoria Calixto';
    if (l.includes('martin'))                             return 'Martin Silva';
    if (l.includes('nobean') || l.includes('nôbean'))     return 'Nôbean Silva';
    if (l.includes('jenifer') || l.includes('jennifer'))  return 'Jenifer Afonso';
    if (l.includes('tamires'))                            return 'Tamires Perotto';
    if (l.includes('rebeca'))                             return 'Rebeca Silva';
    if (l.includes('beatriz') && (l.includes('andrea') || l.includes('andréa'))) return 'Beatriz/Andréa';
    if (l.includes('beatriz'))                            return 'Beatriz S.';
    return null;
  }

  for (const line of lines) {
    const cols  = line.split('\t');
    if (cols.length < 3) continue;
    const ramal = parseInt(cols[0], 10);
    const name  = normSatName(cols[1]);
    if (!name) continue;
    const day   = parseInt(cols[2], 10);
    const phone = cols[3] || '';
    const score = parseFloat(cols[4] || '0');
    if (isNaN(ramal) || isNaN(day) || isNaN(score)) continue;
    const cat     = score >= 4 ? 'BOM' : score >= 2 ? 'ATENÇÃO' : 'RUIM';
    const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    records.push({ ramal, name, date: dateStr, day, phone, score, cat });
  }

  if (!records.length) { showToast('Nenhum registro válido encontrado', 'warn'); return; }

  S.parsedSat = { mes, records };

  const bom  = records.filter(r => r.cat === 'BOM').length;
  const aten = records.filter(r => r.cat === 'ATENÇÃO').length;
  const ruim = records.filter(r => r.cat === 'RUIM').length;
  const pct  = Math.round(bom / records.length * 100);

  _setHTML('sat-prev-kpis', `
    <div class="kpi-card kpi-green" style="padding:14px"><div class="kpi-val green" style="font-size:22px">${bom}</div><div class="kpi-label">BOM</div></div>
    <div class="kpi-card kpi-yellow" style="padding:14px"><div class="kpi-val yellow" style="font-size:22px">${aten}</div><div class="kpi-label">ATENÇÃO</div></div>
    <div class="kpi-card kpi-red" style="padding:14px"><div class="kpi-val red" style="font-size:22px">${ruim}</div><div class="kpi-label">RUIM</div></div>
  `);
  _setHTML('sat-prev-list', records.slice(0, 30).map(r => `
    <div class="prev-item" style="border-left-color:${r.cat === 'BOM' ? 'var(--green2)' : r.cat === 'ATENÇÃO' ? 'var(--yellow2)' : 'var(--red2)'}">
      <strong>${r.name.split(' ')[0]}</strong> — Dia ${r.day} | Nota: ${r.score} |
      <span style="font-weight:700;color:${r.cat === 'BOM' ? 'var(--green2)' : r.cat === 'ATENÇÃO' ? 'var(--yellow2)' : 'var(--red2)'}">${r.cat}</span>
    </div>`).join('') + (records.length > 30 ? `<div style="color:var(--text3);font-size:11px;padding:8px">...e mais ${records.length - 30} registros</div>` : ''));

  _setText('sat-prev-title', `📊 ${records.length} avaliações — ${pct}% satisfação`);
  _hide('sat-prev-empty'); _show('sat-prev-content');
}

async function saveSatData() {
  if (!S.parsedSat?.records?.length) return;
  showLoading();
  try {
    await api.post('/sat', { records: S.parsedSat.records });
    const d = await api.get('/sat');
    S.satRecords = d.records || [];
    populateAllFilters();
    updateTopbarKpis();
    showToast(`${S.parsedSat.records.length} avaliações salvas!`);
    S.parsedSat = null;
    _hide('sat-prev-content'); _show('sat-prev-empty');
    document.getElementById('sat-raw').value = '';
    switchSatTab('mensal');
  } catch (e) {
    showToast('Erro: ' + e.message, 'err');
  } finally {
    hideLoading();
  }
}

function renderSatMensal() {
  const mes  = document.getElementById('sat-mes-sel')?.value || '';
  const recs = mes ? S.satRecords.filter(r => r.date?.startsWith(mes)) : S.satRecords;
  const el   = document.getElementById('sat-grid-wrap');
  if (!el) return;
  if (!recs.length) { el.innerHTML = '<div class="empty-state"><div class="ico">⭐</div><p>Sem dados de satisfação.<br>Importe na aba "Importar".</p></div>'; return; }

  const month = mes || recs[0]?.date?.slice(0, 7) || '';
  const [y, m] = month.split('-').map(Number);
  const dias  = new Date(y, m, 0).getDate();
  const conss = [...new Set(recs.map(r => r.name).filter(Boolean))].sort();
  const grid  = {};
  recs.forEach(r => {
    const k = `${r.name}|${r.day}`;
    if (!grid[k]) grid[k] = { bom: 0, aten: 0, ruim: 0 };
    if (r.cat === 'BOM') grid[k].bom++;
    else if (r.cat === 'ATENÇÃO') grid[k].aten++;
    else grid[k].ruim++;
  });

  const COLORS = ['#c9a84c','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899'];
  const dArr = Array.from({ length: dias }, (_, i) => i + 1);

  el.innerHTML = `<table style="border-collapse:collapse;font-size:11px;min-width:100%">
    <thead><tr>
      <th style="text-align:left;padding:8px 12px;min-width:130px;position:sticky;left:0;background:var(--bg2);z-index:2">Consultor</th>
      ${dArr.map(d => {
        const dow = new Date(y, m - 1, d).getDay();
        const wknd = dow === 0 || dow === 6;
        return `<th style="min-width:30px;padding:4px 2px;text-align:center;${wknd ? 'opacity:.35' : ''}">
          <div style="font-size:9px;color:var(--text3)">${['D','S','T','Q','Q','S','S'][dow]}</div>
          <div style="font-weight:700">${d}</div></th>`;
      }).join('')}
      <th style="padding:8px;text-align:center">%</th>
    </tr></thead>
    <tbody>
    ${conss.map((cons, ci) => {
      const color = COLORS[ci % COLORS.length];
      let totB = 0, totA = 0, totR = 0;
      const cells = dArr.map(d => {
        const dow  = new Date(y, m - 1, d).getDay();
        const wknd = dow === 0 || dow === 6;
        const k    = `${cons}|${d}`;
        const v    = grid[k];
        if (wknd) return `<td class="sat-cell sc-weekend">—</td>`;
        if (!v)   return `<td class="sat-cell sc-empty">·</td>`;
        totB += v.bom; totA += v.aten; totR += v.ruim;
        const cls = v.ruim > 0 ? 'sc-ruim' : v.aten > 0 ? 'sc-aten' : 'sc-bom';
        const tip = `B:${v.bom} A:${v.aten} R:${v.ruim}`;
        return `<td class="sat-cell ${cls}" title="${tip}">${v.bom ? v.bom : ''}${v.aten ? '<br>⚠' : ''}${v.ruim ? '❌' : ''}</td>`;
      }).join('');
      const tot = totB + totA + totR;
      const pct = tot ? Math.round(totB / tot * 100) : 0;
      return `<tr>
        <td style="padding:8px 12px;position:sticky;left:0;background:var(--bg2);z-index:1">
          <div class="sat-name"><div class="sat-name-avatar" style="background:${color}">${cons.charAt(0)}</div>${cons.split(' ')[0]}</div>
        </td>
        ${cells}
        <td style="text-align:center;font-weight:700;padding:4px 8px;color:${pct >= 80 ? 'var(--green2)' : pct >= 60 ? 'var(--yellow2)' : 'var(--red2)'}">${pct}%</td>
      </tr>`;
    }).join('')}
    </tbody></table>`;
}

function renderSatCards() {
  const mes  = document.getElementById('sat-mes-sel')?.value || '';
  const recs = mes ? S.satRecords.filter(r => r.date?.startsWith(mes)) : S.satRecords;
  const el   = document.getElementById('sat-cons-cards');
  if (!el) return;
  const byC = {};
  recs.forEach(r => {
    if (!byC[r.name]) byC[r.name] = { bom: 0, aten: 0, ruim: 0 };
    if (r.cat === 'BOM') byC[r.name].bom++;
    else if (r.cat === 'ATENÇÃO') byC[r.name].aten++;
    else byC[r.name].ruim++;
  });
  if (!Object.keys(byC).length) { el.innerHTML = '<div class="empty-state"><div class="ico">⭐</div><p>Sem dados</p></div>'; return; }
  el.innerHTML = Object.entries(byC).map(([n, d]) => {
    const tot = d.bom + d.aten + d.ruim;
    const pct = tot ? Math.round(d.bom / tot * 100) : 0;
    return `<div class="sat-cons-card">
      <div class="sat-cons-name">${n}</div>
      <div class="sat-pct-badge" style="color:${pct >= 80 ? 'var(--green2)' : pct >= 60 ? 'var(--yellow2)' : 'var(--red2)'}">${pct}%</div>
      <div class="sat-bar-row"><span class="lbl" style="color:var(--green2)">BOM</span><div class="bar"><div class="bar-fill" style="width:${tot ? d.bom / tot * 100 : 0}%;background:var(--green2)"></div></div><span class="val" style="color:var(--green2)">${d.bom}</span></div>
      <div class="sat-bar-row"><span class="lbl" style="color:var(--yellow2)">ATENÇÃO</span><div class="bar"><div class="bar-fill" style="width:${tot ? d.aten / tot * 100 : 0}%;background:var(--yellow2)"></div></div><span class="val" style="color:var(--yellow2)">${d.aten}</span></div>
      <div class="sat-bar-row"><span class="lbl" style="color:var(--red2)">RUIM</span><div class="bar"><div class="bar-fill" style="width:${tot ? d.ruim / tot * 100 : 0}%;background:var(--red2)"></div></div><span class="val" style="color:var(--red2)">${d.ruim}</span></div>
    </div>`;
  }).join('');
}

function renderSatCharts() {
  const mes  = document.getElementById('sat-mes-sel')?.value || '';
  const recs = mes ? S.satRecords.filter(r => r.date?.startsWith(mes)) : S.satRecords;
  if (!recs.length) return;
  const byC  = {};
  recs.forEach(r => {
    if (!byC[r.name]) byC[r.name] = { bom: 0, aten: 0, ruim: 0 };
    if (r.cat === 'BOM') byC[r.name].bom++;
    else if (r.cat === 'ATENÇÃO') byC[r.name].aten++;
    else byC[r.name].ruim++;
  });
  const conss = Object.keys(byC);
  const tc    = S.theme === 'dark' ? 'rgba(241,245,249,.7)' : 'rgba(15,23,42,.7)';
  const gc    = S.theme === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(15,23,42,.07)';

  mkChart('sat-chart-bar', 'bar', {
    labels: conss.map(c => c.split(' ')[0]),
    datasets: [
      { label: 'BOM',     data: conss.map(c => byC[c].bom),  backgroundColor: 'rgba(16,185,129,.7)' },
      { label: 'ATENÇÃO', data: conss.map(c => byC[c].aten), backgroundColor: 'rgba(245,158,11,.7)' },
      { label: 'RUIM',    data: conss.map(c => byC[c].ruim), backgroundColor: 'rgba(239,68,68,.7)' },
    ]
  }, { stacked: true, tc, gc });

  const totB = recs.filter(r => r.cat === 'BOM').length;
  const totA = recs.filter(r => r.cat === 'ATENÇÃO').length;
  const totR = recs.filter(r => r.cat === 'RUIM').length;
  mkChart('sat-chart-pie', 'doughnut', {
    labels: ['BOM','ATENÇÃO','RUIM'],
    datasets: [{ data: [totB, totA, totR], backgroundColor: ['#10b981','#f59e0b','#ef4444'], borderWidth: 0 }]
  }, { tc });

  mkChart('sat-chart-pct', 'bar', {
    labels: conss.map(c => c.split(' ')[0]),
    datasets: [{
      label: '% Satisfação',
      data: conss.map(c => { const t = byC[c].bom + byC[c].aten + byC[c].ruim; return t ? Math.round(byC[c].bom / t * 100) : 0; }),
      backgroundColor: conss.map(c => { const t = byC[c].bom + byC[c].aten + byC[c].ruim; const p = t ? byC[c].bom / t : 0; return p >= 0.8 ? 'rgba(16,185,129,.7)' : p >= 0.6 ? 'rgba(245,158,11,.7)' : 'rgba(239,68,68,.7)'; })
    }]
  }, { tc, gc, yMin: 0, yMax: 100 });
}

async function hdlExcelSat() {
  if (!S.satRecords.length) { showToast('Sem dados de satisfação', 'warn'); return; }
  try {
    const wb = new ExcelJS.Workbook();
    // Aba 1: dados brutos
    const ws1 = wb.addWorksheet('Dados');
    ws1.columns = [
      { header: 'Data',      key: 'date',  width: 12 },
      { header: 'Consultor', key: 'name',  width: 22 },
      { header: 'Ramal',     key: 'ramal', width: 10 },
      { header: 'Dia',       key: 'day',   width: 6  },
      { header: 'Telefone',  key: 'phone', width: 16 },
      { header: 'Nota',      key: 'score', width: 8  },
      { header: 'Categoria', key: 'cat',   width: 12 },
    ];
    ws1.getRow(1).font = { bold: true };
    S.satRecords.forEach(r => ws1.addRow(r));

    // Aba 2: resumo por consultor
    const ws2 = wb.addWorksheet('Resumo');
    ws2.columns = [
      { header: 'Consultor', key: 'name',  width: 22 },
      { header: 'BOM',       key: 'bom',   width: 8  },
      { header: 'ATENÇÃO',   key: 'aten',  width: 10 },
      { header: 'RUIM',      key: 'ruim',  width: 8  },
      { header: 'Total',     key: 'total', width: 8  },
      { header: '% BOM',     key: 'pct',   width: 10 },
    ];
    ws2.getRow(1).font = { bold: true };
    const byC = {};
    S.satRecords.forEach(r => {
      if (!byC[r.name]) byC[r.name] = { bom: 0, aten: 0, ruim: 0 };
      if (r.cat === 'BOM') byC[r.name].bom++;
      else if (r.cat === 'ATENÇÃO') byC[r.name].aten++;
      else byC[r.name].ruim++;
    });
    Object.entries(byC).forEach(([name, d]) => {
      const total = d.bom + d.aten + d.ruim;
      ws2.addRow({ name, ...d, total, pct: total ? Math.round(d.bom / total * 100) + '%' : '0%' });
    });

    const buf = await wb.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const a = document.createElement('a'); a.href = url; a.download = `tracker_satisfacao_${new Date().toISOString().slice(0,10)}.xlsx`; a.click();
    URL.revokeObjectURL(url);
    showToast('Excel de satisfação exportado!');
  } catch (e) { showToast('Erro: ' + e.message, 'err'); }
}

// ═══════════════════════════════════════════════
// RANKING
// ═══════════════════════════════════════════════
function renderRanking() {
  const mes  = document.getElementById('f-mes-rank')?.value || '';
  const recs = mes ? S.records.filter(r => r.data_ref?.startsWith(mes)) : S.records;
  const el   = document.getElementById('ranking-tbody');
  const podium = document.getElementById('ranking-podium');
  if (!el) return;

  if (!recs.length) {
    el.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text3)">Sem dados</td></tr>';
    if (podium) podium.innerHTML = '';
    return;
  }

  const byC    = _groupByConsultor(recs);
  const sorted = Object.entries(byC).sort((a, b) => {
    const ta = a[1].total ? a[1].rev / a[1].total : 0;
    const tb = b[1].total ? b[1].rev / b[1].total : 0;
    return tb - ta;
  });

  el.innerHTML = sorted.map(([n, d], i) => {
    const taxa   = d.total ? +(d.rev / d.total * 100).toFixed(1) : 0;
    const medals = ['🥇','🥈','🥉'];
    return `<tr>
      <td>${medals[i] || i + 1}</td>
      <td><strong>${n}</strong></td>
      <td style="text-align:center">${d.total}</td>
      <td style="text-align:center;color:var(--green2)">${d.rev}</td>
      <td style="text-align:center;color:var(--yellow2)">${d.trat}</td>
      <td style="text-align:center;color:var(--red2)">${d.can}</td>
      <td style="text-align:center"><span class="tag ${taxa >= 40 ? 'tag-rev' : taxa >= 30 ? 'tag-trat' : 'tag-can'}">${taxa}%</span></td>
    </tr>`;
  }).join('');

  // Pódio
  if (podium && sorted.length >= 1) {
    const top3 = sorted.slice(0, 3);
    const bg   = ['var(--goldbg)','rgba(192,192,192,.1)','rgba(205,127,50,.1)'];
    podium.innerHTML = `<div class="g3" style="margin-bottom:18px">${top3.map(([n, d], i) => {
      const taxa = d.total ? +(d.rev / d.total * 100).toFixed(1) : 0;
      return `<div style="background:${bg[i]};border:1px solid var(--border${i===0?'2':''});border-radius:var(--rad);padding:24px;text-align:center">
        <div style="font-size:40px;margin-bottom:8px">${['🥇','🥈','🥉'][i]}</div>
        <div style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;margin-bottom:8px">${n}</div>
        <div style="font-size:28px;font-weight:800;color:${i===0?'var(--gold2)':'var(--text)'}">${taxa}%</div>
        <div style="font-size:11px;color:var(--text3);margin-top:4px">${d.rev} revert. / ${d.total} total</div>
      </div>`;
    }).join('')}</div>`;
  }
}

// ═══════════════════════════════════════════════
// USUÁRIOS
// ═══════════════════════════════════════════════
async function renderUsers() {
  const el = document.getElementById('users-tbody');
  if (!el) return;
  if (S.user?.role !== 'admin') {
    el.innerHTML = '<tr><td colspan="4" style="color:var(--text3);text-align:center;padding:20px">Apenas administradores podem gerenciar usuários.</td></tr>';
    return;
  }
  try {
    const d = await api.get('/users');
    el.innerHTML = d.users.map(u => `
      <tr>
        <td><code style="background:var(--surface2);padding:2px 7px;border-radius:4px;font-size:11px">${u.login}</code></td>
        <td>${u.name}</td>
        <td style="text-align:center"><span class="tag ${u.role === 'admin' ? 'tag-rev' : 'tag-trat'}">${u.role}</span></td>
        <td style="text-align:center">
          ${u.login !== 'admin'
            ? `<button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id},'${u.login}')">🗑 Remover</button>`
            : '<span style="color:var(--text3);font-size:11px">—</span>'}
        </td>
      </tr>`).join('');
  } catch (e) { showToast(e.message, 'err'); }
}

function openAddUser() {
  ['m-login','m-name','m-pass'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('m-role').value = 'user';
  document.getElementById('user-modal').classList.add('open');
}

async function saveUser() {
  const login = document.getElementById('m-login').value.trim();
  const name  = document.getElementById('m-name').value.trim();
  const pass  = document.getElementById('m-pass').value;
  const role  = document.getElementById('m-role').value;
  if (!login || !name || !pass) { showToast('Preencha todos os campos', 'warn'); return; }
  try {
    await api.post('/users', { login, name, pass, role });
    closeModal(); renderUsers(); showToast('Usuário criado!');
  } catch (e) { showToast(e.message, 'err'); }
}

async function deleteUser(id, login) {
  if (!confirm(`Remover usuário "${login}"?`)) return;
  try {
    await api.del(`/users/${id}`);
    renderUsers(); showToast('Usuário removido.');
  } catch (e) { showToast(e.message, 'err'); }
}

// ═══════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════
async function hdlExcel() {
  if (!S.records.length) { showToast('Sem dados para exportar', 'warn'); return; }
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('REATs');
    ws.columns = [
      { header: 'Data',      key: 'data_ref',   width: 12 },
      { header: 'Hora',      key: 'hora',        width: 8  },
      { header: 'Consultor', key: 'consultor',   width: 22 },
      { header: 'Status',    key: 'status',      width: 16 },
      { header: 'Motivo',    key: 'motivo',      width: 20 },
      { header: 'Plano',     key: 'plano',       width: 14 },
      { header: 'Análise',   key: 'analise',     width: 45 },
    ];
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    S.records.forEach(r => ws.addRow(r));
    const buf = await wb.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const a = document.createElement('a'); a.href = url; a.download = `tracker_reats_${new Date().toISOString().slice(0,10)}.xlsx`; a.click();
    URL.revokeObjectURL(url);
    showToast('Excel exportado!');
  } catch (e) { showToast('Erro: ' + e.message, 'err'); }
}

async function hdlPDF() {
  if (!S.records.length) { showToast('Sem dados para exportar', 'warn'); return; }
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('TRACKER — Coobrastur — Relatório REATs', 14, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 22);
    doc.autoTable({
      startY: 28,
      head: [['Data', 'Hora', 'Consultor', 'Status', 'Motivo', 'Plano', 'Análise']],
      body: S.records.map(r => [r.data_ref, r.hora, r.consultor, r.status, r.motivo, r.plano, (r.analise || '').slice(0, 60)]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    doc.save(`tracker_reats_${new Date().toISOString().slice(0,10)}.pdf`);
    showToast('PDF exportado!');
  } catch (e) { showToast('Erro: ' + e.message, 'err'); }
}

async function hdlExportBackup() {
  try {
    const d       = await api.get('/reats');
    const grouped = {};
    (d.records || []).forEach(r => {
      if (!grouped[r.data_ref]) grouped[r.data_ref] = [];
      grouped[r.data_ref].push(r);
    });
    const json = JSON.stringify({ version: 2, exported: new Date().toISOString(), records: grouped }, null, 2);
    const url  = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `tracker_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado!');
  } catch (e) { showToast('Erro: ' + e.message, 'err'); }
}

async function hdlImportBackup(input) {
  const file = input.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const records = data.records || data;
    if (!records || typeof records !== 'object') throw new Error('Formato de backup inválido');
    showLoading();
    await api.post('/reats/import-backup', { records });
    const d = await api.get('/reats');
    S.records = d.records || [];
    populateAllFilters(); renderDashboard(); updateTopbarKpis();
    showToast('Backup importado com sucesso!');
  } catch (e) {
    showToast('Erro: ' + e.message, 'err');
  } finally {
    hideLoading();
    input.value = '';
  }
}

// ═══════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════
function _groupByConsultor(recs) {
  const byC = {};
  recs.forEach(r => {
    if (!byC[r.consultor]) byC[r.consultor] = { total: 0, rev: 0, trat: 0, can: 0 };
    byC[r.consultor].total++;
    if (r.status === 'Revertido')    byC[r.consultor].rev++;
    else if (r.status === 'Em Tratativa') byC[r.consultor].trat++;
    else                              byC[r.consultor].can++;
  });
  return byC;
}
function _setHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function _show(id)  { const el = document.getElementById(id); if (el) el.classList.remove('hidden'); }
function _hide(id)  { const el = document.getElementById(id); if (el) el.classList.add('hidden'); }

// Partículas de login
function _initParticles() {
  const canvas = document.getElementById('login-particles');
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const pts = Array.from({ length: 35 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 2.2 + 0.8, a: Math.random() * 0.35 + 0.08
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Linhas entre pontos próximos
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = `rgba(201,168,76,${0.06 * (1 - dist / 120)})`; ctx.stroke();
      }
    }
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,168,76,${p.a})`; ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  _initParticles();
  checkSession();

  // Fechar modais clicando no fundo
  document.querySelectorAll('.modal-bg').forEach(el =>
    el.addEventListener('click', e => { if (e.target === el) closeModal(); }));
});
