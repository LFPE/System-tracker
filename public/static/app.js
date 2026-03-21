// ══════════════════════════════════════════════
// TRACKER — Coobrastur — Frontend App (API mode)
// ══════════════════════════════════════════════
'use strict';

// ─── Estado Global ────────────────────────────
const S = {
  user: null,          // { id, login, name, role }
  records: [],         // todos os REATs carregados
  satRecords: [],      // avaliações de satisfação
  editingId: null,     // id do registro sendo editado
  charts: {},          // instâncias Chart.js
  theme: localStorage.getItem('theme') || 'dark',
  filterConsultor: '',
  filterStatus: '',
  filterData: '',
  filterQ: '',
  satMonth: '',
  rankMonth: '',
  statsMonth: '',
  chartsMonth: '',
};

// ─── API Helper ───────────────────────────────
const api = {
  async req(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const r = await fetch('/api' + path, opts);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
    return d;
  },
  get: (p) => api.req('GET', p),
  post: (p, b) => api.req('POST', p, b),
  put: (p, b) => api.req('PUT', p, b),
  del: (p) => api.req('DELETE', p),
};

// ─── Toast ────────────────────────────────────
function showToast(msg, type = 'ok') {
  const icons = { ok: '✅', err: '❌', warn: '⚠️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span>${msg}</span><span class="toast-close" onclick="this.parentNode.remove()">✕</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

// ─── Loading Overlay ─────────────────────────
let loadingEl = null;
function showLoading() {
  if (loadingEl) return;
  loadingEl = document.createElement('div');
  loadingEl.className = 'loading-overlay';
  loadingEl.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(loadingEl);
}
function hideLoading() {
  if (loadingEl) { loadingEl.remove(); loadingEl = null; }
}

// ─── Relógio ──────────────────────────────────
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  const el = document.getElementById('clock');
  if (el) el.textContent = `${h}:${m}`;
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
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const pieces = Array.from({length:120}, () => ({
    x: Math.random()*canvas.width, y: -20,
    vx: (Math.random()-0.5)*4, vy: Math.random()*4+2,
    color: ['#c9a84c','#3b82f6','#10b981','#f59e0b','#ef4444'][Math.floor(Math.random()*5)],
    size: Math.random()*8+4, rot: Math.random()*360, vrot: (Math.random()-0.5)*8
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p => {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle = p.color; ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size/2);
      ctx.restore();
      p.x+=p.vx; p.y+=p.vy; p.rot+=p.vrot; p.vy+=0.08;
    });
    if (++frame < 200) requestAnimationFrame(draw);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  draw();
}

// ─── Spotlight ────────────────────────────────
const PAGES = [
  {id:'dashboard',icon:'🏠',label:'Dashboard',sub:'Visão geral'},
  {id:'import',icon:'📥',label:'Importar REATs',sub:'Processar novo arquivo'},
  {id:'history',icon:'📋',label:'Histórico',sub:'Todos os registros'},
  {id:'stats',icon:'📊',label:'Estatísticas',sub:'Rankings e métricas'},
  {id:'charts',icon:'📈',label:'Gráficos',sub:'Análise visual'},
  {id:'heatmap',icon:'🔥',label:'Heatmap',sub:'Horários de reversão'},
  {id:'sat',icon:'⭐',label:'Satisfação',sub:'Avaliações dos clientes'},
  {id:'ranking',icon:'🏆',label:'Ranking',sub:'Pódio da equipe'},
  {id:'users',icon:'⚙️',label:'Usuários',sub:'Gerenciar acessos'},
];
let spotIdx = 0;
function openSpotlight() {
  document.getElementById('spotlight-bg').classList.add('open');
  document.getElementById('spotlight-input').value = '';
  filterSpotlight('');
  setTimeout(() => document.getElementById('spotlight-input').focus(), 50);
}
function closeSpotlight() { document.getElementById('spotlight-bg').classList.remove('open'); }
function filterSpotlight(q) {
  const res = document.getElementById('spotlight-results');
  const pages = PAGES.filter(p => !q || p.label.toLowerCase().includes(q.toLowerCase()));
  spotIdx = 0;
  res.innerHTML = '<div class="spotlight-section">Navegação</div>' +
    pages.map((p,i) => `<div class="spotlight-item${i===0?' active':''}" onclick="switchTab('${p.id}',null);closeSpotlight()">
      <div class="spotlight-item-icon" style="background:var(--surface2)">${p.icon}</div>
      <div><div class="spotlight-item-text">${p.label}</div><div class="spotlight-item-sub">${p.sub}</div></div>
    </div>`).join('');
}
function spotlightKey(e) {
  const items = document.querySelectorAll('.spotlight-item');
  if (e.key==='ArrowDown') { spotIdx=Math.min(spotIdx+1,items.length-1); }
  else if (e.key==='ArrowUp') { spotIdx=Math.max(spotIdx-1,0); }
  else if (e.key==='Enter') { items[spotIdx]?.click(); return; }
  else if (e.key==='Escape') { closeSpotlight(); return; }
  items.forEach((el,i)=>el.classList.toggle('active',i===spotIdx));
}
document.addEventListener('keydown', e => {
  if ((e.metaKey||e.ctrlKey) && e.key==='k') { e.preventDefault(); openSpotlight(); }
});

// ─── Tabs ─────────────────────────────────────
function switchTab(id, btn) {
  document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const tab = document.getElementById('tab-'+id);
  if (tab) tab.classList.remove('hidden');
  if (btn) btn.classList.add('active');
  else {
    const nb = document.getElementById('nav-'+id);
    if (nb) nb.classList.add('active');
  }
  setBottomNav(id);
  // Renderizar ao abrir aba
  const renders = {
    dashboard: renderDashboard,
    history: renderHistory,
    stats: renderStats,
    charts: renderCharts,
    heatmap: renderHeatmap,
    sat: () => renderSat(),
    ranking: renderRanking,
    users: renderUsers,
  };
  if (renders[id]) renders[id]();
}
function setBottomNav(id) {
  document.querySelectorAll('.bn-item').forEach(el => {
    el.classList.toggle('active', el.id==='bn-'+id);
  });
}

// ─── Modal helpers ────────────────────────────
function closeModal() {
  document.querySelectorAll('.modal-bg').forEach(el => el.classList.remove('open'));
}
document.querySelectorAll('.modal-bg').forEach(el => {
  el.addEventListener('click', e => { if (e.target===el) closeModal(); });
});
document.addEventListener('keydown', e => { if (e.key==='Escape') closeModal(); });

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
  } catch {
    showLoginScreen();
  }
}

function onLoginSuccess() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  // Atualizar UI
  const av = document.getElementById('user-av');
  const ud = document.getElementById('user-disp');
  if (av) av.textContent = S.user.name.charAt(0).toUpperCase();
  if (ud) ud.textContent = S.user.name;
  document.getElementById('dash-name').textContent = S.user.name.split(' ')[0];
  // Ocultar botão de usuários se não for admin
  const btnAddUser = document.getElementById('btn-add-user');
  if (btnAddUser) btnAddUser.style.display = S.user.role==='admin' ? 'inline-flex' : 'none';
  // Carregar dados
  loadAllData();
}

function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

async function doLogout() {
  await api.post('/auth/logout', {}).catch(()=>{});
  S.user = null;
  S.records = [];
  S.satRecords = [];
  closeModal();
  showLoginScreen();
}

// Conta modal
function openAccModal() {
  const el = document.getElementById('acc-modal');
  document.getElementById('acc-name').textContent = S.user?.name || '—';
  document.getElementById('acc-login-lbl').textContent = '@' + (S.user?.login||'');
  document.getElementById('acc-pass').value = '';
  el.classList.add('open');
}
async function changeMyPass() {
  const p = document.getElementById('acc-pass').value;
  if (!p) { closeModal(); return; }
  try {
    await api.put('/users/me/password', { pass: p });
    showToast('Senha atualizada!');
    closeModal();
  } catch(e) { showToast(e.message,'err'); }
}

// ─── Carregar dados ───────────────────────────
async function loadAllData() {
  showLoading();
  try {
    const [reatsData, satData] = await Promise.all([
      api.get('/reats'),
      api.get('/sat'),
    ]);
    S.records = reatsData.records || [];
    S.satRecords = satData.records || [];
    populateFilters();
    renderDashboard();
    updateTopbarKpis();
  } catch(e) {
    showToast('Erro ao carregar dados: ' + e.message, 'err');
  } finally {
    hideLoading();
  }
}

// ─── Populate filter selects ──────────────────
function populateFilters() {
  const consultores = [...new Set(S.records.map(r=>r.consultor).filter(Boolean))].sort();
  const meses = [...new Set(S.records.map(r=>r.data_ref?.slice(0,7)).filter(Boolean))].sort().reverse();
  const mesOpts = meses.map(m => `<option value="${m}">${fmtMes(m)}</option>`).join('');

  // Filtro histórico
  _fillSelect('f-consultor', consultores.map(c=>`<option value="${c}">${c}</option>`).join(''));
  // Filtro stats
  _fillSelect('f-mes-stats', '<option value="">Todo o período</option>' + mesOpts, false);
  // Filtro charts
  _fillSelect('f-mes-charts', '<option value="">Todo o período</option>' + mesOpts, false);
  // Filtro ranking
  _fillSelect('f-mes-rank', '<option value="">Todo o período</option>' + mesOpts, false);
  // Filtro satisfação
  const satMeses = [...new Set(S.satRecords.map(r=>r.date?.slice(0,7)).filter(Boolean))].sort().reverse();
  _fillSelect('f-mes-sat', '<option value="">Todo o período</option>' + satMeses.map(m=>`<option value="${m}">${fmtMes(m)}</option>`).join(''), false);
}

function _fillSelect(id, html, keepFirst=true) {
  const el = document.getElementById(id);
  if (!el) return;
  const first = keepFirst ? el.options[0]?.outerHTML||'' : '';
  el.innerHTML = first + html;
}

function fmtMes(ym) {
  if (!ym) return '';
  const [y,m] = ym.split('-');
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${meses[parseInt(m,10)-1]} ${y}`;
}

// ─── KPIs header ─────────────────────────────
function updateTopbarKpis() {
  const total = S.records.length;
  const rev   = S.records.filter(r=>r.status==='Revertido').length;
  const taxa  = total ? Math.round(rev/total*100) : 0;
  document.getElementById('hdr-total').textContent = total;
  document.getElementById('hdr-taxa').textContent  = taxa + '%';
  // Satisfação
  if (S.satRecords.length) {
    const bom = S.satRecords.filter(r=>r.cat==='BOM').length;
    const pct = Math.round(bom/S.satRecords.length*100);
    document.getElementById('hdr-sat').textContent = pct + '%';
  }
}

// ─── DASHBOARD ────────────────────────────────
function renderDashboard() {
  const recs = S.records;
  if (!recs.length) {
    document.getElementById('dash-kpis').innerHTML = '<p style="color:var(--text3);font-size:13px">Nenhum dado. Importe um arquivo REAT.</p>';
    document.getElementById('perf-alerts').innerHTML = '';
    return;
  }
  const total = recs.length;
  const rev   = recs.filter(r=>r.status==='Revertido').length;
  const trat  = recs.filter(r=>r.status==='Em Tratativa').length;
  const can   = recs.filter(r=>r.status==='Cancelado').length;
  const taxa  = total ? +(rev/total*100).toFixed(1) : 0;

  // KPI cards
  document.getElementById('dash-kpis').innerHTML = `
    <div class="kpi-card kpi-gold"><div class="kpi-icon">📋</div><div class="kpi-val gold">${total}</div><div class="kpi-label">Total de REATs</div></div>
    <div class="kpi-card kpi-green"><div class="kpi-icon">✅</div><div class="kpi-val green">${rev}</div><div class="kpi-label">Revertidos</div></div>
    <div class="kpi-card kpi-yellow"><div class="kpi-icon">⏳</div><div class="kpi-val yellow">${trat}</div><div class="kpi-label">Em Tratativa</div></div>
    <div class="kpi-card kpi-red"><div class="kpi-icon">❌</div><div class="kpi-val red">${can}</div><div class="kpi-label">Cancelados</div></div>
  `;

  // Meta
  document.getElementById('dash-taxa-val').textContent = taxa + '%';
  const prog = document.getElementById('dash-prog');
  if (prog) { setTimeout(() => prog.style.width = Math.min(taxa/40*100,100) + '%', 100); }
  const trend = document.getElementById('dash-meta-trend');
  if (trend) {
    const diff = taxa - 40;
    trend.className = 'dash-trend ' + (diff>=0?'up':diff>-10?'neutral':'down');
    trend.textContent = (diff>=0?'▲ ':'▼ ') + Math.abs(diff).toFixed(1) + '%';
  }

  // Top consultores
  const byC = {};
  recs.forEach(r => {
    if (!byC[r.consultor]) byC[r.consultor] = {total:0,rev:0};
    byC[r.consultor].total++;
    if (r.status==='Revertido') byC[r.consultor].rev++;
  });
  const top = Object.entries(byC).map(([n,d])=>({n,total:d.total,taxa:d.total?+(d.rev/d.total*100).toFixed(1):0})).sort((a,b)=>b.taxa-a.taxa).slice(0,5);
  const topEl = document.getElementById('dash-top-cons');
  if (topEl) topEl.innerHTML = top.map((t,i)=>`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <div style="width:22px;height:22px;border-radius:50%;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700">${i+1}</div>
      <div style="flex:1;font-size:12px;font-weight:500">${t.n}</div>
      <div style="font-size:11px;color:var(--green2);font-weight:700">${t.taxa}%</div>
      <div style="font-size:10px;color:var(--text3)">${t.total} reg</div>
    </div>`).join('') || '<p style="color:var(--text3);font-size:12px">Sem dados</p>';

  // Comparação mensal
  const meses = [...new Set(recs.map(r=>r.data_ref?.slice(0,7)).filter(Boolean))].sort().reverse();
  const comp = document.getElementById('dash-comparison');
  if (comp && meses.length>=2) {
    const m1 = meses[0], m2 = meses[1];
    const r1 = recs.filter(r=>r.data_ref?.startsWith(m1));
    const r2 = recs.filter(r=>r.data_ref?.startsWith(m2));
    const t1 = r1.length, t2 = r2.length;
    const rev1 = r1.filter(r=>r.status==='Revertido').length;
    const rev2 = r2.filter(r=>r.status==='Revertido').length;
    const tx1 = t1 ? +(rev1/t1*100).toFixed(1) : 0;
    const tx2 = t2 ? +(rev2/t2*100).toFixed(1) : 0;
    const diff = tx1 - tx2;
    comp.innerHTML = `
      <div class="g2">
        <div class="comp-card"><div style="font-size:11px;color:var(--text3);margin-bottom:8px">${fmtMes(m1)} (atual)</div>
          <div class="comp-val">${tx1}%</div><div style="font-size:11px;color:var(--text3);margin-top:4px">${t1} registros • ${rev1} revertidos</div></div>
        <div class="comp-card"><div style="font-size:11px;color:var(--text3);margin-bottom:8px">${fmtMes(m2)} (anterior)</div>
          <div class="comp-val">${tx2}%</div><div style="font-size:11px;color:var(--text3);margin-top:4px">${t2} registros • ${rev2} revertidos</div></div>
      </div>
      <div style="margin-top:14px;display:flex;align-items:center;gap:10px">
        <span style="font-size:12px;color:var(--text3)">Variação:</span>
        <span class="comp-arrow ${diff>0?'up':diff<0?'down':'eq'}">${diff>0?'▲':diff<0?'▼':'='} ${Math.abs(diff).toFixed(1)}%</span>
      </div>`;
  }

  // Streak
  const datesWithData = [...new Set(recs.filter(r=>r.status==='Revertido').map(r=>r.data_ref).filter(Boolean))].sort().reverse();
  let streak = 0;
  const today = new Date();
  for (let i=0; i<30; i++) {
    const d = new Date(today); d.setDate(d.getDate()-i);
    const k = d.toISOString().slice(0,10);
    if (datesWithData.includes(k)) streak++;
    else if (i>0) break;
  }
  const sb = document.getElementById('streak-badge');
  if (sb) sb.innerHTML = `🔥 ${streak} dia${streak!==1?'s':''} seguido${streak!==1?'s':''}`;

  // Alertas
  const alerts = document.getElementById('perf-alerts');
  if (alerts) {
    const lowPerf = Object.entries(byC).filter(([,d])=>d.total>=5 && d.rev/d.total<0.3);
    alerts.innerHTML = lowPerf.map(([n,d])=>`
      <div class="perf-alert">⚠️ <strong>${n}</strong> está com taxa baixa: ${(d.rev/d.total*100).toFixed(1)}% (${d.rev}/${d.total} revertidos)</div>
    `).join('');
  }

  // Data
  const ds = document.getElementById('dash-date-sub');
  if (ds) ds.textContent = new Date().toLocaleDateString('pt-BR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  // Conquistas
  renderAchievements(total, rev, taxa, Object.keys(byC).length);
}

function renderAchievements(total, rev, taxa, numConss) {
  const el = document.getElementById('dash-achievements');
  if (!el) return;
  const achs = [
    {icon:'🌟',name:'Primeira Reversão',desc:'Reverteu o 1º REAT',unlocked:rev>=1},
    {icon:'🎯',name:'Meta Atingida',desc:'Taxa ≥ 40% de reversão',unlocked:taxa>=40},
    {icon:'💯',name:'Campeão',desc:'100 REATs importados',unlocked:total>=100},
    {icon:'🏆',name:'Elite',desc:'Taxa ≥ 60%',unlocked:taxa>=60},
    {icon:'⚡',name:'Equipe Completa',desc:'5+ consultores ativos',unlocked:numConss>=5},
  ];
  el.innerHTML = achs.map(a=>`
    <div class="achievement ${a.unlocked?'unlocked':''}">
      <div class="ach-icon ${a.unlocked?'':'locked'}">${a.icon}</div>
      <div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div>
      ${a.unlocked?'<span style="margin-left:auto;color:var(--gold2);font-size:12px">✓</span>':''}
    </div>`).join('');
}

// ─── IMPORTAR REATs ───────────────────────────
let importStep = 0;
let importData = null;
let importDate = null;

function initImport() {
  importStep = 0; importData = null;
  setImportStep(1);
  document.getElementById('import-txt').value = '';
  document.getElementById('import-date').value = '';
  document.getElementById('import-preview').innerHTML = '';
  document.getElementById('import-step2').classList.add('hidden');
  document.getElementById('import-step3').classList.add('hidden');
  document.getElementById('import-step1').classList.remove('hidden');
}

function setImportStep(n) {
  for (let i=1;i<=3;i++) {
    const dot = document.getElementById(`import-dot-${i}`);
    const lbl = document.getElementById(`import-lbl-${i}`);
    if (!dot) continue;
    if (i < n) { dot.className='step-dot done'; }
    else if (i===n) { dot.className='step-dot done'; }
    else { dot.className='step-dot idle'; }
  }
  const line = document.getElementById('import-line-1');
  const line2 = document.getElementById('import-line-2');
  if (line) line.className = 'step-line' + (n>1?' done':'');
  if (line2) line2.className = 'step-line' + (n>2?' done':'');
}

function parseREATs(text, dataRef) {
  const lines = text.split('\n').map(l=>l.trim()).filter(Boolean);
  const records = [];

  const CONSULTORES = [
    'amanda neves','vitoria calixto','martin silva','nobean silva','nôbean silva',
    'jenifer afonso','beatriz andréa','beatriz s','tamires perotto','rebeca silva',
    'beatriz silva','andrea','beatriz'
  ];

  function normalizeName(n) {
    if (!n) return '-';
    const l = n.toLowerCase().replace(/[^a-záéíóúàâêôãõüç ]/g,'').trim();
    if (l.includes('amanda')) return 'Amanda Neves';
    if (l.includes('vitoria')||l.includes('vitória')) return 'Vitoria Calixto';
    if (l.includes('martin')) return 'Martin Silva';
    if (l.includes('nobean')||l.includes('nôbean')) return 'Nôbean Silva';
    if (l.includes('jenifer')||l.includes('jennifer')) return 'Jenifer Afonso';
    if (l.includes('tamires')) return 'Tamires Perotto';
    if (l.includes('rebeca')) return 'Rebeca Silva';
    if (l.includes('beatriz') && (l.includes('andrée')||l.includes('andrea')||l.includes('andréa'))) return 'Beatriz/Andréa';
    if (l.includes('beatriz')) return 'Beatriz S.';
    if (l.includes('andrea')||l.includes('andréa')) return 'Beatriz/Andréa';
    return n.split(' ').slice(0,2).map(w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(' ');
  }

  const reBlock = /\b(\d{2}\/\d{2}\/\d{4})\b.*?(\d{2}:\d{2})/;
  const reStatus = /\b(revertid[oa]|cancelad[oa]|em tratativa|tratativa)\b/i;
  const reMotivo = /\b(financeiro|financeira|falecimento|mudança|transferência|desistência|viagem|doença|inadimplência|inadimplente|outros?)\b/i;
  const rePlano = /\b(bronze|prata|ouro|diamante|premium|essencial|básico|básica)\b/i;
  const reTipo = /\b(cancelamento|solicitação|pedido|reat)\b/i;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const mBlock = reBlock.exec(line);
    if (!mBlock) { i++; continue; }

    const data = mBlock[1];
    const hora = mBlock[2];

    // Status
    let status = 'Em Tratativa', revertido = '-';
    const mStatus = reStatus.exec(line + ' ' + (lines[i+1]||''));
    if (mStatus) {
      const s = mStatus[1].toLowerCase();
      if (s.startsWith('revert')) { status = 'Revertido'; revertido = 'Sim'; }
      else if (s.startsWith('cancel')) { status = 'Cancelado'; }
    }

    // Consultor
    let consultor = '-';
    for (let j=i; j<=Math.min(i+3,lines.length-1); j++) {
      const ll = lines[j].toLowerCase();
      for (const cn of CONSULTORES) {
        if (ll.includes(cn.split(' ')[0].toLowerCase())) {
          consultor = normalizeName(lines[j]);
          break;
        }
      }
      if (consultor !== '-') break;
    }

    // Motivo
    let motivo = '-';
    const mMotivo = reMotivo.exec(line + ' ' + (lines[i+1]||''));
    if (mMotivo) motivo = mMotivo[1].charAt(0).toUpperCase() + mMotivo[1].slice(1).toLowerCase();

    // Plano
    let plano = '-';
    const mPlano = rePlano.exec(line + ' ' + (lines[i+1]||''));
    if (mPlano) plano = mPlano[1].charAt(0).toUpperCase() + mPlano[1].slice(1).toLowerCase();

    // Tipo
    let tipo = 'Cancelamento';
    const mTipo = reTipo.exec(line);
    if (mTipo) tipo = mTipo[1].charAt(0).toUpperCase() + mTipo[1].slice(1).toLowerCase();

    // Análise automática
    let analise = '';
    if (status==='Revertido') analise = 'REAT revertido com sucesso.';
    else if (status==='Cancelado') analise = 'Cancelamento efetivado.';
    else analise = 'Em acompanhamento.';

    records.push({ data_ref: dataRef, tipo, data, hora, consultor, status, revertido, motivo, plano_em_dia: '-', plano, analise, texto: line });
    i++;
  }

  return records;
}

function processImport() {
  const txt = document.getElementById('import-txt').value.trim();
  importDate = document.getElementById('import-date').value;
  if (!txt) { showToast('Cole o texto do REAT', 'warn'); return; }
  if (!importDate) { showToast('Selecione a data', 'warn'); return; }

  importData = parseREATs(txt, importDate);
  if (!importData.length) { showToast('Nenhum registro identificado. Verifique o formato.', 'warn'); return; }

  // Preview
  const prev = document.getElementById('import-preview');
  prev.innerHTML = importData.map(r=>`
    <div class="prev-item">
      <span class="prev-tag ${r.status==='Revertido'?'tag-rev':r.status==='Cancelado'?'tag-can':'tag-trat'}">${r.status}</span>
      <strong>${r.hora}</strong> — ${r.consultor} | ${r.motivo} | ${r.plano}
    </div>`).join('');

  document.getElementById('import-step1').classList.add('hidden');
  document.getElementById('import-step2').classList.remove('hidden');
  setImportStep(2);
}

function backImport() {
  document.getElementById('import-step2').classList.add('hidden');
  document.getElementById('import-step1').classList.remove('hidden');
  setImportStep(1);
}

async function confirmImport() {
  if (!importData?.length) return;
  showLoading();
  try {
    await api.post('/reats', { data_ref: importDate, records: importData });
    // Recarregar dados
    const reatsData = await api.get('/reats');
    S.records = reatsData.records || [];
    populateFilters();
    updateTopbarKpis();

    document.getElementById('import-step2').classList.add('hidden');
    document.getElementById('import-step3').classList.remove('hidden');
    setImportStep(3);
    fireConfetti();
    showToast(`${importData.length} registros importados!`);
  } catch(e) {
    showToast('Erro ao salvar: ' + e.message, 'err');
  } finally {
    hideLoading();
  }
}

// ─── HISTÓRICO ────────────────────────────────
function getFilteredRecords() {
  let recs = S.records;
  const fc = document.getElementById('f-consultor')?.value || '';
  const fs = document.getElementById('f-status')?.value || '';
  const fd = document.getElementById('f-data')?.value || '';
  const fq = document.getElementById('f-search')?.value?.toLowerCase() || '';
  if (fc) recs = recs.filter(r=>r.consultor===fc);
  if (fs) recs = recs.filter(r=>r.status===fs);
  if (fd) recs = recs.filter(r=>r.data_ref===fd);
  if (fq) recs = recs.filter(r=>(r.consultor+r.motivo+r.analise+r.plano+r.texto).toLowerCase().includes(fq));
  return recs;
}

function renderHistory() {
  const recs = getFilteredRecords();
  const el = document.getElementById('history-list');
  if (!el) return;

  // Filtro datas disponíveis
  const datas = [...new Set(S.records.map(r=>r.data_ref).filter(Boolean))].sort().reverse();
  const fdEl = document.getElementById('f-data');
  if (fdEl && fdEl.options.length <= 1) {
    fdEl.innerHTML = '<option value="">Todas as datas</option>' + datas.map(d=>`<option value="${d}">${fmtDate(d)}</option>`).join('');
  }

  const count = document.getElementById('filter-count');
  if (count) count.textContent = recs.length + ' registros';

  if (!recs.length) {
    el.innerHTML = '<div class="empty-state"><div class="ico">📭</div><p>Nenhum registro encontrado.<br>Ajuste os filtros ou importe dados.</p></div>';
    return;
  }

  // Agrupar por data
  const byDate = {};
  recs.forEach(r => {
    if (!byDate[r.data_ref]) byDate[r.data_ref] = [];
    byDate[r.data_ref].push(r);
  });

  el.innerHTML = Object.entries(byDate).sort((a,b)=>b[0].localeCompare(a[0])).map(([date, items])=>`
    <div class="hist-day">
      <div class="hist-day-hdr">
        <div class="hist-day-label">📅 ${fmtDate(date)}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="hist-day-count">${items.length} registros</div>
          ${S.user?.role==='admin'?`<button class="btn btn-danger btn-sm" onclick="deleteDay('${date}')">🗑 Apagar dia</button>`:''}
        </div>
      </div>
      ${items.map(r=>`
        <div class="hist-item ${r.status==='Revertido'?'rev':r.status==='Cancelado'?'can':'trat'}" onclick="openEdit(${r.id})">
          <div>
            <div class="hist-main">${r.hora} — <strong>${r.consultor}</strong></div>
            <div class="hist-meta">
              <span>${r.tipo}</span><span>${r.motivo}</span><span>Plano: ${r.plano}</span>
            </div>
            ${r.analise?`<div class="hist-analise">${r.analise}</div>`:''}
          </div>
          <span class="tag ${r.status==='Revertido'?'tag-rev':r.status==='Cancelado'?'tag-can':'tag-trat'}">${r.status}</span>
        </div>`).join('')}
    </div>`).join('');
}

function fmtDate(iso) {
  if (!iso) return '';
  const [y,m,d] = iso.split('-');
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const dt = new Date(parseInt(y),parseInt(m)-1,parseInt(d));
  return `${dias[dt.getDay()]}, ${d} ${meses[parseInt(m)-1]} ${y}`;
}

function openEdit(id) {
  const r = S.records.find(x=>x.id===id);
  if (!r) return;
  S.editingId = id;
  document.getElementById('edit-info').innerHTML = `
    <strong>${r.hora}</strong> — ${r.consultor}<br>
    ${r.tipo} | ${r.motivo} | Plano: ${r.plano}`;
  document.getElementById('edit-status').value = r.status;
  document.getElementById('edit-analise').value = r.analise || '';
  document.getElementById('edit-modal').classList.add('open');
}

async function saveEdit() {
  if (!S.editingId) return;
  const status  = document.getElementById('edit-status').value;
  const analise = document.getElementById('edit-analise').value;
  try {
    await api.put(`/reats/${S.editingId}`, { status, analise });
    const rec = S.records.find(r=>r.id===S.editingId);
    if (rec) { rec.status = status; rec.analise = analise; }
    closeModal();
    renderHistory();
    renderDashboard();
    updateTopbarKpis();
    showToast('Registro atualizado!');
  } catch(e) { showToast(e.message,'err'); }
}

async function deleteDay(dataRef) {
  if (!confirm(`Apagar TODOS os registros de ${fmtDate(dataRef)}?`)) return;
  try {
    await api.del(`/reats/date/${dataRef}`);
    S.records = S.records.filter(r=>r.data_ref!==dataRef);
    renderHistory();
    renderDashboard();
    updateTopbarKpis();
    populateFilters();
    showToast('Dia removido.');
  } catch(e) { showToast(e.message,'err'); }
}

// ─── ESTATÍSTICAS ─────────────────────────────
function renderStats() {
  const mes = document.getElementById('f-mes-stats')?.value || '';
  const recs = mes ? S.records.filter(r=>r.data_ref?.startsWith(mes)) : S.records;

  const el = document.getElementById('stats-table-body');
  if (!el) return;

  if (!recs.length) {
    el.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text3)">Sem dados para o período</td></tr>';
    return;
  }

  const byC = {};
  recs.forEach(r => {
    if (!byC[r.consultor]) byC[r.consultor] = {total:0,rev:0,trat:0,can:0};
    byC[r.consultor].total++;
    if (r.status==='Revertido') byC[r.consultor].rev++;
    else if (r.status==='Em Tratativa') byC[r.consultor].trat++;
    else byC[r.consultor].can++;
  });

  const rows = Object.entries(byC).sort((a,b)=>b[1].rev-a[1].rev);
  el.innerHTML = rows.map(([n,d],i)=>{
    const taxa = d.total ? +(d.rev/d.total*100).toFixed(1) : 0;
    const alert = d.total>=5 && taxa<30 ? '⚠️ ' : '';
    return `<tr>
      <td>${i+1}</td><td><strong>${alert}${n}</strong></td>
      <td style="text-align:center">${d.total}</td>
      <td style="text-align:center;color:var(--green2)">${d.rev}</td>
      <td style="text-align:center;color:var(--yellow2)">${d.trat}</td>
      <td style="text-align:center;color:var(--red2)">${d.can}</td>
      <td style="text-align:center"><span class="tag ${taxa>=40?'tag-rev':taxa>=30?'tag-trat':'tag-can'}">${taxa}%</span></td>
    </tr>`;
  }).join('');

  // KPIs
  const total = recs.length;
  const rev = recs.filter(r=>r.status==='Revertido').length;
  const taxa = total ? +(rev/total*100).toFixed(1) : 0;
  const statsKpis = document.getElementById('stats-kpis');
  if (statsKpis) statsKpis.innerHTML = `
    <div class="kpi-card kpi-gold"><div class="kpi-icon">📋</div><div class="kpi-val gold">${total}</div><div class="kpi-label">Total</div></div>
    <div class="kpi-card kpi-green"><div class="kpi-icon">✅</div><div class="kpi-val green">${rev}</div><div class="kpi-label">Revertidos</div></div>
    <div class="kpi-card kpi-yellow"><div class="kpi-icon">⏳</div><div class="kpi-val yellow">${recs.filter(r=>r.status==='Em Tratativa').length}</div><div class="kpi-label">Em Tratativa</div></div>
    <div class="kpi-card kpi-blue"><div class="kpi-icon">📊</div><div class="kpi-val blue">${taxa}%</div><div class="kpi-label">Taxa de Reversão</div></div>
  `;
}

// ─── GRÁFICOS ─────────────────────────────────
function renderCharts() {
  const mes = document.getElementById('f-mes-charts')?.value || '';
  const recs = mes ? S.records.filter(r=>r.data_ref?.startsWith(mes)) : S.records;
  if (!recs.length) return;

  const isDark = S.theme === 'dark';
  const textColor = isDark ? 'rgba(241,245,249,0.7)' : 'rgba(15,23,42,0.7)';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)';

  // Chart 1: Taxa por dia
  const byDate = {};
  recs.forEach(r => {
    if (!byDate[r.data_ref]) byDate[r.data_ref] = {total:0,rev:0};
    byDate[r.data_ref].total++;
    if (r.status==='Revertido') byDate[r.data_ref].rev++;
  });
  const dates = Object.keys(byDate).sort();
  const taxas = dates.map(d => byDate[d].total ? +(byDate[d].rev/byDate[d].total*100).toFixed(1) : 0);

  mkChart('chart-rate', 'line', {
    labels: dates.map(d=>d.slice(5)),
    datasets: [{
      label: 'Taxa %', data: taxas, borderColor: '#c9a84c', backgroundColor: 'rgba(201,168,76,0.1)',
      tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#c9a84c'
    }]
  }, { yMin: 0, yMax: 100, textColor, gridColor });

  // Chart 2: Distribuição status
  const rev = recs.filter(r=>r.status==='Revertido').length;
  const trat = recs.filter(r=>r.status==='Em Tratativa').length;
  const can = recs.filter(r=>r.status==='Cancelado').length;
  mkChart('chart-status', 'doughnut', {
    labels: ['Revertido','Em Tratativa','Cancelado'],
    datasets: [{ data: [rev,trat,can], backgroundColor: ['#10b981','#f59e0b','#ef4444'], borderWidth: 0 }]
  }, { textColor });

  // Chart 3: Volume por consultor
  const byC = {};
  recs.forEach(r=>{
    if (!byC[r.consultor]) byC[r.consultor]={rev:0,trat:0,can:0};
    if (r.status==='Revertido') byC[r.consultor].rev++;
    else if (r.status==='Em Tratativa') byC[r.consultor].trat++;
    else byC[r.consultor].can++;
  });
  const conss = Object.keys(byC).sort();
  mkChart('chart-volume', 'bar', {
    labels: conss.map(c=>c.split(' ')[0]),
    datasets: [
      {label:'Revertido',data:conss.map(c=>byC[c].rev),backgroundColor:'#10b981'},
      {label:'Em Tratativa',data:conss.map(c=>byC[c].trat),backgroundColor:'#f59e0b'},
      {label:'Cancelado',data:conss.map(c=>byC[c].can),backgroundColor:'#ef4444'},
    ]
  }, { stacked: true, textColor, gridColor });

  // Chart 4: Comparação mensal
  const meses = [...new Set(recs.map(r=>r.data_ref?.slice(0,7)).filter(Boolean))].sort();
  const mTotals = meses.map(m=>recs.filter(r=>r.data_ref?.startsWith(m)).length);
  const mRevs   = meses.map(m=>recs.filter(r=>r.data_ref?.startsWith(m)&&r.status==='Revertido').length);
  mkChart('chart-monthly', 'bar', {
    labels: meses.map(fmtMes),
    datasets: [
      {label:'Total',data:mTotals,backgroundColor:'rgba(37,99,235,0.6)'},
      {label:'Revertidos',data:mRevs,backgroundColor:'rgba(16,185,129,0.6)'},
    ]
  }, { textColor, gridColor });
}

function mkChart(canvasId, type, data, opts={}) {
  if (S.charts[canvasId]) { S.charts[canvasId].destroy(); delete S.charts[canvasId]; }
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const defaults = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: opts.textColor, font: { family: 'Inter', size: 11 }, boxWidth: 12 } }
    }
  };
  if (type !== 'doughnut') {
    defaults.scales = {
      x: { ticks: { color: opts.textColor, font: { size: 10 } }, grid: { color: opts.gridColor } },
      y: { ticks: { color: opts.textColor, font: { size: 10 } }, grid: { color: opts.gridColor },
           min: opts.yMin, max: opts.yMax }
    };
    if (opts.stacked) { defaults.scales.x.stacked = true; defaults.scales.y.stacked = true; }
  }
  S.charts[canvasId] = new Chart(canvas.getContext('2d'), { type, data, options: defaults });
}

// ─── HEATMAP ─────────────────────────────────
function renderHeatmap() {
  const el = document.getElementById('heatmap-grid');
  if (!el) return;
  const recs = S.records.filter(r=>r.status==='Revertido' && r.hora);
  if (!recs.length) {
    el.innerHTML = '<div class="empty-state"><div class="ico">🔥</div><p>Sem dados de reversão para o heatmap.</p></div>';
    return;
  }
  const grid = {};
  recs.forEach(r=>{
    const h = parseInt(r.hora.split(':')[0],10);
    if (!isNaN(h)) grid[h] = (grid[h]||0)+1;
  });
  const max = Math.max(...Object.values(grid),1);
  let html = '<div style="display:grid;grid-template-columns:repeat(12,1fr);gap:6px">';
  for (let h=0;h<24;h++) {
    const v = grid[h]||0;
    const int = v/max;
    const alpha = 0.1 + int*0.9;
    const textC = int>0.6?'#fff':'rgba(241,245,249,0.6)';
    html += `<div class="heatmap-cell" style="height:52px;background:rgba(201,168,76,${alpha.toFixed(2)});color:${textC}" title="${h}h: ${v} reversões">
      <div>${String(h).padStart(2,'0')}h</div><div style="font-size:11px">${v||''}</div></div>`;
  }
  html += '</div>';
  // Top horários
  const top = Object.entries(grid).sort((a,b)=>b[1]-a[1]).slice(0,3);
  html += `<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
    ${top.map(([h,v],i)=>`<div class="card" style="flex:1;min-width:120px;text-align:center">
      <div style="font-size:24px">⏰</div>
      <div style="font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:700;color:var(--gold2)">${String(h).padStart(2,'0')}h</div>
      <div style="font-size:11px;color:var(--text3)">${v} reversões</div>
    </div>`).join('')}
  </div>`;
  el.innerHTML = html;
}

// ─── SATISFAÇÃO ───────────────────────────────
function renderSat(panel) {
  const mes = document.getElementById('f-mes-sat')?.value || '';
  const recs = mes ? S.satRecords.filter(r=>r.date?.startsWith(mes)) : S.satRecords;

  const tabs = document.querySelectorAll('.sat-tab');
  const panels = document.querySelectorAll('[id^="sat-panel"]');
  panels.forEach(p=>p.classList.add('hidden'));

  const active = panel || (document.querySelector('.sat-tab.active')?.dataset.panel) || 'grid';
  const panelEl = document.getElementById('sat-panel-'+active);
  if (panelEl) panelEl.classList.remove('hidden');

  if (active==='grid') renderSatGrid(recs, mes);
  else if (active==='cards') renderSatCards(recs);
  else if (active==='charts') renderSatCharts(recs);
}

function switchSatPanel(panel, el) {
  document.querySelectorAll('.sat-tab').forEach(t=>t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderSat(panel);
}

function renderSatGrid(recs, mes) {
  const el = document.getElementById('sat-grid-container');
  if (!el) return;
  if (!recs.length) {
    el.innerHTML = '<div class="empty-state"><div class="ico">⭐</div><p>Sem dados de satisfação.<br>Importe um arquivo TSV.</p></div>';
    return;
  }

  const month = mes || recs[0]?.date?.slice(0,7) || '';
  const [y,m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const consultores = [...new Set(recs.map(r=>r.name).filter(Boolean))].sort();

  // Mapa: consultor+dia -> {bom,atencao,ruim}
  const grid = {};
  recs.forEach(r=>{
    const k = `${r.name}|${r.day}`;
    if (!grid[k]) grid[k] = {bom:0,atencao:0,ruim:0};
    if (r.cat==='BOM') grid[k].bom++;
    else if (r.cat==='ATENÇÃO') grid[k].atencao++;
    else if (r.cat==='RUIM') grid[k].ruim++;
  });

  const dias = Array.from({length:daysInMonth},(_,i)=>i+1);
  const COLORS = ['#c9a84c','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899'];

  let html = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px">
    <thead><tr><th style="width:120px;text-align:left;padding:8px">Consultor</th>
    ${dias.map(d=>{
      const dt = new Date(y,m-1,d);
      const dow = dt.getDay();
      const isWknd = dow===0||dow===6;
      return `<th style="padding:4px 2px;text-align:center;min-width:28px;${isWknd?'opacity:.4':''}"><div style="font-size:9px;color:var(--text3)">${['D','S','T','Q','Q','S','S'][dow]}</div><div>${d}</div></th>`;
    }).join('')}
    <th style="text-align:center;padding:8px">Total</th></tr></thead>
    <tbody>`;

  consultores.forEach((cons,ci)=>{
    const color = COLORS[ci%COLORS.length];
    html += `<tr><td class="sat-name"><div class="sat-name-avatar" style="background:${color}">${cons.charAt(0)}</div>${cons.split(' ')[0]}</td>`;
    let totalBom=0,totalAten=0,totalRuim=0;
    dias.forEach(d=>{
      const dt = new Date(y,m-1,d);
      const isWknd = dt.getDay()===0||dt.getDay()===6;
      const k = `${cons}|${d}`;
      const v = grid[k];
      if (isWknd) { html += `<td class="sat-cell sc-weekend">—</td>`; return; }
      if (!v) { html += `<td class="sat-cell sc-empty">·</td>`; return; }
      totalBom+=v.bom; totalAten+=v.atencao; totalRuim+=v.ruim;
      const cls = v.ruim>0?'sc-ruim':v.atencao>0?'sc-aten':'sc-bom';
      html += `<td class="sat-cell ${cls}" title="B:${v.bom} A:${v.atencao} R:${v.ruim}">${v.bom||''}<br>${v.atencao?'⚠':''}${v.ruim?'❌':''}</td>`;
    });
    const tot = totalBom+totalAten+totalRuim;
    const pct = tot ? Math.round(totalBom/tot*100) : 0;
    html += `<td style="text-align:center;font-weight:700;color:${pct>=80?'var(--green2)':pct>=60?'var(--yellow2)':'var(--red2)'}">${pct}%</td></tr>`;
  });
  html += '</tbody></table></div>';
  el.innerHTML = html;
}

function renderSatCards(recs) {
  const el = document.getElementById('sat-cards-container');
  if (!el) return;
  const byC = {};
  recs.forEach(r=>{
    if (!byC[r.name]) byC[r.name]={bom:0,atencao:0,ruim:0};
    if (r.cat==='BOM') byC[r.name].bom++;
    else if (r.cat==='ATENÇÃO') byC[r.name].atencao++;
    else byC[r.name].ruim++;
  });
  if (!Object.keys(byC).length) { el.innerHTML='<div class="empty-state"><div class="ico">⭐</div><p>Sem dados</p></div>'; return; }
  el.innerHTML = `<div class="g3">${Object.entries(byC).map(([n,d])=>{
    const tot = d.bom+d.atencao+d.ruim;
    const pct = tot ? Math.round(d.bom/tot*100) : 0;
    return `<div class="sat-cons-card">
      <div class="sat-cons-name">${n}</div>
      <div class="sat-pct-badge" style="color:${pct>=80?'var(--green2)':pct>=60?'var(--yellow2)':'var(--red2)'}">${pct}%</div>
      <div class="sat-bar-row"><span class="lbl" style="color:var(--green2)">BOM</span><div class="bar"><div class="bar-fill" style="width:${tot?d.bom/tot*100:0}%;background:var(--green2)"></div></div><span class="val" style="color:var(--green2)">${d.bom}</span></div>
      <div class="sat-bar-row"><span class="lbl" style="color:var(--yellow2)">ATENÇÃO</span><div class="bar"><div class="bar-fill" style="width:${tot?d.atencao/tot*100:0}%;background:var(--yellow2)"></div></div><span class="val" style="color:var(--yellow2)">${d.atencao}</span></div>
      <div class="sat-bar-row"><span class="lbl" style="color:var(--red2)">RUIM</span><div class="bar"><div class="bar-fill" style="width:${tot?d.ruim/tot*100:0}%;background:var(--red2)"></div></div><span class="val" style="color:var(--red2)">${d.ruim}</span></div>
    </div>`;
  }).join('')}</div>`;
}

function renderSatCharts(recs) {
  const byC = {};
  recs.forEach(r=>{
    if (!byC[r.name]) byC[r.name]={bom:0,atencao:0,ruim:0};
    if (r.cat==='BOM') byC[r.name].bom++;
    else if (r.cat==='ATENÇÃO') byC[r.name].atencao++;
    else byC[r.name].ruim++;
  });
  const conss = Object.keys(byC);
  const isDark = S.theme==='dark';
  const tc = isDark?'rgba(241,245,249,0.7)':'rgba(15,23,42,0.7)';
  const gc = isDark?'rgba(255,255,255,0.06)':'rgba(15,23,42,0.07)';

  mkChart('sat-chart-bar','bar',{
    labels: conss.map(c=>c.split(' ')[0]),
    datasets:[
      {label:'BOM',data:conss.map(c=>byC[c].bom),backgroundColor:'rgba(16,185,129,0.7)'},
      {label:'ATENÇÃO',data:conss.map(c=>byC[c].atencao),backgroundColor:'rgba(245,158,11,0.7)'},
      {label:'RUIM',data:conss.map(c=>byC[c].ruim),backgroundColor:'rgba(239,68,68,0.7)'},
    ]
  },{stacked:true,textColor:tc,gridColor:gc});

  const totBom = recs.filter(r=>r.cat==='BOM').length;
  const totAten = recs.filter(r=>r.cat==='ATENÇÃO').length;
  const totRuim = recs.filter(r=>r.cat==='RUIM').length;
  mkChart('sat-chart-pie','doughnut',{
    labels:['BOM','ATENÇÃO','RUIM'],
    datasets:[{data:[totBom,totAten,totRuim],backgroundColor:['#10b981','#f59e0b','#ef4444'],borderWidth:0}]
  },{textColor:tc});

  mkChart('sat-chart-pct','bar',{
    labels: conss.map(c=>c.split(' ')[0]),
    datasets:[{
      label:'% Satisfação',
      data: conss.map(c=>{ const t=byC[c].bom+byC[c].atencao+byC[c].ruim; return t?Math.round(byC[c].bom/t*100):0; }),
      backgroundColor: conss.map(c=>{
        const t=byC[c].bom+byC[c].atencao+byC[c].ruim;
        const p=t?byC[c].bom/t:0;
        return p>=0.8?'rgba(16,185,129,0.7)':p>=0.6?'rgba(245,158,11,0.7)':'rgba(239,68,68,0.7)';
      })
    }]
  },{textColor:tc,gridColor:gc,yMin:0,yMax:100});
}

// Importar TSV satisfação
async function importSatTSV() {
  const txt = document.getElementById('sat-tsv')?.value?.trim();
  const mes = document.getElementById('sat-import-month')?.value;
  if (!txt) { showToast('Cole o conteúdo TSV','warn'); return; }
  if (!mes) { showToast('Selecione o mês','warn'); return; }

  const [y,m] = mes.split('-').map(Number);
  const lines = txt.split('\n').map(l=>l.trim()).filter(Boolean);
  const records = [];

  function normalizeSatName(n) {
    if (!n) return null;
    const l = n.toLowerCase().trim();
    if (l.includes('amanda')) return 'Amanda Neves';
    if (l.includes('vitoria')||l.includes('vitória')) return 'Vitoria Calixto';
    if (l.includes('martin')) return 'Martin Silva';
    if (l.includes('nobean')||l.includes('nôbean')) return 'Nôbean Silva';
    if (l.includes('jenifer')||l.includes('jennifer')) return 'Jenifer Afonso';
    if (l.includes('tamires')) return 'Tamires Perotto';
    if (l.includes('rebeca')) return 'Rebeca Silva';
    if (l.includes('beatriz')&&(l.includes('andrea')||l.includes('andréa'))) return 'Beatriz/Andréa';
    if (l.includes('beatriz')) return 'Beatriz S.';
    return null;
  }

  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 3) continue;
    const ramal = parseInt(cols[0],10);
    const name = normalizeSatName(cols[1]);
    if (!name) continue;
    const day = parseInt(cols[2],10);
    const phone = cols[3]||'';
    const score = parseFloat(cols[4]||'0');
    if (isNaN(ramal)||isNaN(day)||isNaN(score)) continue;
    const cat = score>=4?'BOM':score>=2?'ATENÇÃO':'RUIM';
    const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    records.push({ ramal, name, date: dateStr, day, phone, score, cat });
  }

  if (!records.length) { showToast('Nenhum registro válido encontrado','warn'); return; }

  showLoading();
  try {
    await api.post('/sat', { records });
    const satData = await api.get('/sat');
    S.satRecords = satData.records || [];
    populateFilters();
    updateTopbarKpis();
    renderSat();
    showToast(`${records.length} avaliações importadas!`);
    document.getElementById('sat-tsv').value = '';
  } catch(e) {
    showToast('Erro: '+e.message,'err');
  } finally {
    hideLoading();
  }
}

// ─── RANKING ──────────────────────────────────
function renderRanking() {
  const mes = document.getElementById('f-mes-rank')?.value || '';
  const recs = mes ? S.records.filter(r=>r.data_ref?.startsWith(mes)) : S.records;
  const el = document.getElementById('ranking-tbody');
  const podium = document.getElementById('ranking-podium');
  if (!el) return;

  if (!recs.length) {
    el.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text3)">Sem dados</td></tr>';
    if (podium) podium.innerHTML = '';
    return;
  }

  const byC = {};
  recs.forEach(r=>{
    if (!byC[r.consultor]) byC[r.consultor]={total:0,rev:0,trat:0,can:0};
    byC[r.consultor].total++;
    if (r.status==='Revertido') byC[r.consultor].rev++;
    else if (r.status==='Em Tratativa') byC[r.consultor].trat++;
    else byC[r.consultor].can++;
  });
  const sorted = Object.entries(byC).sort((a,b)=>{
    const ta = a[1].total?a[1].rev/a[1].total:0;
    const tb = b[1].total?b[1].rev/b[1].total:0;
    return tb-ta;
  });

  el.innerHTML = sorted.map(([n,d],i)=>{
    const taxa = d.total?+(d.rev/d.total*100).toFixed(1):0;
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
    return `<tr>
      <td>${medal||i+1}</td><td><strong>${n}</strong></td>
      <td style="text-align:center">${d.total}</td>
      <td style="text-align:center;color:var(--green2)">${d.rev}</td>
      <td style="text-align:center;color:var(--yellow2)">${d.trat}</td>
      <td style="text-align:center;color:var(--red2)">${d.can}</td>
      <td style="text-align:center"><span class="tag ${taxa>=40?'tag-rev':taxa>=30?'tag-trat':'tag-can'}">${taxa}%</span></td>
    </tr>`;
  }).join('');

  // Pódio
  if (podium && sorted.length>=1) {
    const medals = ['🥇','🥈','🥉'];
    const bg = ['var(--goldbg)','rgba(192,192,192,0.1)','rgba(205,127,50,0.1)'];
    const top = sorted.slice(0,3);
    podium.innerHTML = `<div class="g3">${top.map(([n,d],i)=>{
      const taxa = d.total?+(d.rev/d.total*100).toFixed(1):0;
      return `<div style="background:${bg[i]};border:1px solid var(--border);border-radius:var(--rad);padding:20px;text-align:center">
        <div style="font-size:36px">${medals[i]}</div>
        <div style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;margin:8px 0">${n}</div>
        <div style="font-size:22px;font-weight:800;color:${i===0?'var(--gold2)':'var(--text)'}">${taxa}%</div>
        <div style="font-size:11px;color:var(--text3)">${d.rev}/${d.total} revertidos</div>
      </div>`;
    }).join('')}</div>`;
  }
}

// ─── USUÁRIOS ─────────────────────────────────
async function renderUsers() {
  if (S.user?.role !== 'admin') {
    document.getElementById('users-tbody').innerHTML =
      '<tr><td colspan="4" style="color:var(--text3);text-align:center">Apenas administradores podem ver usuários</td></tr>';
    return;
  }
  try {
    const d = await api.get('/users');
    const el = document.getElementById('users-tbody');
    if (!el) return;
    el.innerHTML = d.users.map(u=>`
      <tr>
        <td><code>${u.login}</code></td>
        <td>${u.name}</td>
        <td style="text-align:center"><span class="tag ${u.role==='admin'?'tag-rev':'tag-trat'}">${u.role}</span></td>
        <td style="text-align:center">
          ${u.login!=='admin'?`<button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id},'${u.login}')">🗑</button>`:'<span style="color:var(--text3);font-size:11px">—</span>'}
        </td>
      </tr>`).join('');
  } catch(e) {
    showToast(e.message,'err');
  }
}

function openAddUser() {
  document.getElementById('m-login').value = '';
  document.getElementById('m-name').value = '';
  document.getElementById('m-pass').value = '';
  document.getElementById('m-role').value = 'user';
  document.getElementById('user-modal').classList.add('open');
}

async function saveUser() {
  const login = document.getElementById('m-login').value.trim();
  const name  = document.getElementById('m-name').value.trim();
  const pass  = document.getElementById('m-pass').value;
  const role  = document.getElementById('m-role').value;
  if (!login||!name||!pass) { showToast('Preencha todos os campos','warn'); return; }
  try {
    await api.post('/users', { login, name, pass, role });
    closeModal();
    renderUsers();
    showToast('Usuário criado!');
  } catch(e) { showToast(e.message,'err'); }
}

async function deleteUser(id, login) {
  if (!confirm(`Remover usuário "${login}"?`)) return;
  try {
    await api.del(`/users/${id}`);
    renderUsers();
    showToast('Usuário removido.');
  } catch(e) { showToast(e.message,'err'); }
}

// ─── EXPORTAR ─────────────────────────────────
async function hdlExcel() {
  if (!S.records.length) { showToast('Sem dados para exportar','warn'); return; }
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('REATs');
    ws.columns = [
      {header:'Data',key:'data_ref',width:12},
      {header:'Hora',key:'hora',width:8},
      {header:'Consultor',key:'consultor',width:20},
      {header:'Status',key:'status',width:16},
      {header:'Motivo',key:'motivo',width:18},
      {header:'Plano',key:'plano',width:14},
      {header:'Análise',key:'analise',width:40},
    ];
    ws.getRow(1).font = {bold:true};
    S.records.forEach(r=>ws.addRow(r));
    const buf = await wb.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
    const a = document.createElement('a'); a.href=url; a.download='tracker_reats.xlsx'; a.click();
    URL.revokeObjectURL(url);
    showToast('Excel exportado!');
  } catch(e) { showToast('Erro ao exportar: '+e.message,'err'); }
}

async function hdlPDF() {
  if (!S.records.length) { showToast('Sem dados para exportar','warn'); return; }
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
    doc.setFont('helvetica','bold');
    doc.text('TRACKER — Coobrastur — Relatório REATs', 14, 16);
    doc.setFontSize(9);
    doc.autoTable({
      startY: 22,
      head: [['Data','Hora','Consultor','Status','Motivo','Plano','Análise']],
      body: S.records.map(r=>[r.data_ref,r.hora,r.consultor,r.status,r.motivo,r.plano,(r.analise||'').slice(0,60)]),
      styles: {fontSize:7, cellPadding:2},
      headStyles: {fillColor:[15,23,42]},
    });
    doc.save('tracker_reats.pdf');
    showToast('PDF exportado!');
  } catch(e) { showToast('Erro ao exportar: '+e.message,'err'); }
}

async function hdlExportBackup() {
  try {
    const d = await api.get('/reats');
    const grouped = {};
    (d.records||[]).forEach(r=>{
      if (!grouped[r.data_ref]) grouped[r.data_ref]=[];
      grouped[r.data_ref].push(r);
    });
    const json = JSON.stringify({version:2,exported:new Date().toISOString(),records:grouped},null,2);
    const url = URL.createObjectURL(new Blob([json],{type:'application/json'}));
    const a = document.createElement('a'); a.href=url; a.download=`tracker_backup_${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado!');
  } catch(e) { showToast('Erro: '+e.message,'err'); }
}

async function hdlImportBackup(input) {
  const file = input.files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    const records = data.records || data;
    if (!records || typeof records !== 'object') throw new Error('Formato inválido');
    showLoading();
    await api.post('/reats/import-backup', { records });
    const reatsData = await api.get('/reats');
    S.records = reatsData.records || [];
    populateFilters();
    renderDashboard();
    updateTopbarKpis();
    showToast('Backup importado com sucesso!');
  } catch(e) {
    showToast('Erro: '+e.message,'err');
  } finally {
    hideLoading();
    input.value = '';
  }
}

// ─── Partículas login ─────────────────────────
function initParticles() {
  const canvas = document.getElementById('login-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const particles = Array.from({length:30},()=>({
    x: Math.random()*canvas.width, y: Math.random()*canvas.height,
    vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4,
    size: Math.random()*2+1, alpha: Math.random()*0.4+0.1
  }));
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fillStyle=`rgba(201,168,76,${p.alpha})`; ctx.fill();
      p.x+=p.vx; p.y+=p.vy;
      if (p.x<0||p.x>canvas.width) p.vx*=-1;
      if (p.y<0||p.y>canvas.height) p.vy*=-1;
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  checkSession();

  // Event listeners filtros
  document.getElementById('f-consultor')?.addEventListener('change', renderHistory);
  document.getElementById('f-status')?.addEventListener('change', renderHistory);
  document.getElementById('f-data')?.addEventListener('change', renderHistory);
  document.getElementById('f-search')?.addEventListener('input', renderHistory);
  document.getElementById('f-mes-stats')?.addEventListener('change', renderStats);
  document.getElementById('f-mes-charts')?.addEventListener('change', renderCharts);
  document.getElementById('f-mes-rank')?.addEventListener('change', renderRanking);
  document.getElementById('f-mes-sat')?.addEventListener('change', ()=>renderSat());

  // Import steps
  document.getElementById('btn-process-import')?.addEventListener('click', processImport);
  document.getElementById('btn-back-import')?.addEventListener('click', backImport);
  document.getElementById('btn-confirm-import')?.addEventListener('click', confirmImport);
  document.getElementById('btn-new-import')?.addEventListener('click', () => { initImport(); switchTab('import',null); });

  // Sat import
  document.getElementById('btn-import-sat')?.addEventListener('click', importSatTSV);

  // Inicializar abas de import
  initImport();
});
