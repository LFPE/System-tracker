import { setSelectOptions } from '../../assets/js/core/dom.js';
import { renderEmptyState, renderMutedText } from '../../assets/js/shared/templates.js';

export function createDashboardModule({ S, setText, setHTML, _groupByConsultor }) {
  function fmtMes(ym) {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[parseInt(m, 10) - 1]} ${y}`;
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    return `${dias[dt.getDay()]}, ${d} ${meses[parseInt(m, 10) - 1]} ${y}`;
  }


  function populateAllFilters() {
    const consultores = [...new Set(S.records.map(r => r.consultor).filter(Boolean))].sort();
    const meses = [...new Set(S.records.map(r => r.data_ref?.slice(0, 7)).filter(Boolean))].sort().reverse();
    const mesOpts = meses.map(m => `<option value="${m}">${fmtMes(m)}</option>`).join('');
    const consOpts = consultores.map(c => `<option value="${c}">${c}</option>`).join('');
    const allMes = '<option value="">Todo o período</option>' + mesOpts;

    setSelectOptions('f-consultor', consOpts, true);
    setSelectOptions('f-mes', allMes, false);
    setSelectOptions('f-mes-chart', allMes, false);
    setSelectOptions('f-mes-heat', allMes, false);
    setSelectOptions('f-mes-rank', allMes, false);

    const datas = [...new Set(S.records.map(r => r.data_ref).filter(Boolean))].sort().reverse();
    setSelectOptions('f-data', '<option value="">Todas as datas</option>' + datas.map(d => `<option value="${d}">${fmtDate(d)}</option>`).join(''), false);

    const satMeses = [...new Set(S.satRecords.map(r => r.date?.slice(0, 7)).filter(Boolean))].sort().reverse();
    setSelectOptions('sat-mes-sel', '<option value="">Todos os períodos</option>' + satMeses.map(m => `<option value="${m}">${fmtMes(m)}</option>`).join(''), false);
  }

  function updateTopbarKpis() {
    const total = S.records.length;
    const rev = S.records.filter(r => r.status === 'Revertido').length;
    const taxa = total ? Math.round(rev / total * 100) : 0;
    setText('hdr-total', total);
    setText('hdr-taxa', `${taxa}%`);
    if (S.satRecords.length) {
      const bom = S.satRecords.filter(r => r.cat === 'BOM').length;
      setText('hdr-sat', `${Math.round(bom / S.satRecords.length * 100)}%`);
    }
  }

  function renderDashboard() {
    const recs = S.records;
    const total = recs.length;
    const rev = recs.filter(r => r.status === 'Revertido').length;
    const trat = recs.filter(r => r.status === 'Em Tratativa').length;
    const can = recs.filter(r => r.status === 'Cancelado').length;
    const taxa = total ? +(rev / total * 100).toFixed(1) : 0;

    setText('dash-date-sub', new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));

    setHTML('dash-kpis', !total ? renderMutedText('Nenhum dado. Importe um arquivo REAT.') : `
      <div class="kpi-card kpi-gold"><div class="kpi-icon">📋</div><div class="kpi-val gold">${total}</div><div class="kpi-label">Total de REATs</div></div>
      <div class="kpi-card kpi-green"><div class="kpi-icon">✅</div><div class="kpi-val green">${rev}</div><div class="kpi-label">Revertidos</div></div>
      <div class="kpi-card kpi-yellow"><div class="kpi-icon">⏳</div><div class="kpi-val yellow">${trat}</div><div class="kpi-label">Em Tratativa</div></div>
      <div class="kpi-card kpi-red"><div class="kpi-icon">❌</div><div class="kpi-val red">${can}</div><div class="kpi-label">Cancelados</div></div>
    `);

    setText('dash-taxa-val', `${taxa}%`);
    const prog = document.getElementById('dash-prog');
    if (prog) setTimeout(() => { prog.style.width = `${Math.min(taxa / 40 * 100, 100)}%`; }, 100);

    const trend = document.getElementById('dash-meta-trend');
    if (trend) {
      const diff = taxa - 40;
      trend.className = `dash-trend ${diff >= 0 ? 'up' : diff > -10 ? 'neutral' : 'down'}`;
      trend.textContent = `${diff >= 0 ? '▲' : '▼'} ${Math.abs(diff).toFixed(1)}% da meta`;
    }

    const byC = _groupByConsultor(recs);
    const top = Object.entries(byC)
      .map(([n, d]) => ({ n, total: d.total, taxa: d.total ? +(d.rev / d.total * 100).toFixed(1) : 0 }))
      .sort((a, b) => b.taxa - a.taxa)
      .slice(0, 5);

    setHTML('dash-top-cons', top.length ? top.map((t, i) => `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="width:24px;height:24px;border-radius:50%;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${i + 1}</div>
        <div style="flex:1;font-size:12px;font-weight:600">${t.n}</div>
        <div style="font-size:12px;color:var(--green2);font-weight:700">${t.taxa}%</div>
        <div style="font-size:10px;color:var(--text3)">${t.total} reg</div>
      </div>`).join('') : '');

    renderDashComp();

    const datesRev = [...new Set(recs.filter(r => r.status === 'Revertido').map(r => r.data_ref).filter(Boolean))].sort().reverse();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i += 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (datesRev.includes(d.toISOString().slice(0, 10))) streak += 1;
      else if (i > 0) break;
    }
    setText('streak-badge', `🔥 ${streak} dia${streak !== 1 ? 's' : ''} seguido${streak !== 1 ? 's' : ''}`);

    const alerts = document.getElementById('perf-alerts');
    if (alerts) {
      const low = Object.entries(byC).filter(([, d]) => d.total >= 5 && d.rev / d.total < 0.3);
      alerts.innerHTML = low.map(([n, d]) => `
        <div class="perf-alert">⚠️ <strong>${n}</strong> está com taxa baixa: ${(d.rev / d.total * 100).toFixed(1)}% (${d.rev}/${d.total})</div>
      `).join('');
    }

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

    setHTML('dash-comp-cards', rows.map(([n, d]) => {
      const taxa = d.total ? +(d.rev / d.total * 100).toFixed(1) : 0;
      return `<div class="comp-card">
        <div style="font-size:11px;color:var(--text3);margin-bottom:6px">${n.split(' ')[0]}</div>
        <div class="comp-val" style="color:${taxa >= 40 ? 'var(--green2)' : taxa >= 30 ? 'var(--yellow2)' : 'var(--red2)'}">${taxa}%</div>
        <div style="font-size:10px;color:var(--text3);margin-top:4px">${d.rev}/${d.total}</div>
      </div>`;
    }).join('') || '');
  }

  function renderAchievements(total, rev, taxa, numConss) {
    const el = document.getElementById('dash-achievements');
    if (!el) return;

    const achs = [
      { icon: '🌟', name: 'Primeira Reversão', desc: 'Reverteu o 1º REAT', unlocked: rev >= 1 },
      { icon: '🎯', name: 'Meta Atingida', desc: 'Taxa ≥ 40% de reversão', unlocked: taxa >= 40 },
      { icon: '💯', name: 'Centenário', desc: '100 REATs importados', unlocked: total >= 100 },
      { icon: '🏆', name: 'Elite', desc: 'Taxa ≥ 60%', unlocked: taxa >= 60 },
      { icon: '⚡', name: 'Equipe Completa', desc: '5+ consultores ativos', unlocked: numConss >= 5 },
      { icon: '🔥', name: 'Em Chamas', desc: '200+ REATs importados', unlocked: total >= 200 },
      { icon: '👑', name: 'Lenda', desc: 'Taxa ≥ 80%', unlocked: taxa >= 80 },
      { icon: '📈', name: 'Crescimento', desc: '50+ revertidos', unlocked: rev >= 50 },
    ];

    el.innerHTML = achs.map(a => `
      <div class="achievement ${a.unlocked ? 'unlocked' : ''}">
        <div class="ach-icon ${a.unlocked ? '' : 'locked'}">${a.icon}</div>
        <div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div>
        ${a.unlocked ? '<span style="margin-left:auto;color:var(--gold2);font-size:14px;font-weight:700">✓</span>' : ''}
      </div>`).join('');
  }

  function renderStats() {
    const mes = document.getElementById('f-mes')?.value || '';
    const recs = mes ? S.records.filter(r => r.data_ref?.startsWith(mes)) : S.records;
    const total = recs.length;
    const rev = recs.filter(r => r.status === 'Revertido').length;
    const trat = recs.filter(r => r.status === 'Em Tratativa').length;
    const can = recs.filter(r => r.status === 'Cancelado').length;
    const taxa = total ? +(rev / total * 100).toFixed(1) : 0;

    setHTML('big-stats', `
      <div class="kpi-card kpi-gold"><div class="kpi-icon">📋</div><div class="kpi-val gold">${total}</div><div class="kpi-label">Total</div></div>
      <div class="kpi-card kpi-green"><div class="kpi-icon">✅</div><div class="kpi-val green">${rev}</div><div class="kpi-label">Revertidos</div></div>
      <div class="kpi-card kpi-yellow"><div class="kpi-icon">⏳</div><div class="kpi-val yellow">${trat}</div><div class="kpi-label">Em Tratativa</div></div>
      <div class="kpi-card kpi-red"><div class="kpi-icon">❌</div><div class="kpi-val red">${can}</div><div class="kpi-label">Cancelados</div></div>
    `);

    setText('taxa-geral', `${taxa}%`);
    const pf = document.getElementById('prog-fill');
    if (pf) setTimeout(() => { pf.style.width = `${Math.min(taxa / 40 * 100, 100)}%`; }, 100);

    const byC = _groupByConsultor(recs);
    const el = document.getElementById('stats-tbody');
    if (!el) return;

    const alertsEl = document.getElementById('perf-alerts-stats');
    if (alertsEl) {
      const low = Object.entries(byC).filter(([, d]) => d.total >= 5 && d.rev / d.total < 0.3);
      alertsEl.innerHTML = low.map(([n, d]) => `
        <div class="alert-banner">⚠️ <strong>${n}</strong> com taxa baixa: ${(d.rev / d.total * 100).toFixed(1)}% (${d.rev}/${d.total})</div>
      `).join('');
    }

    if (!total) {
      el.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text3)">Sem dados para o período</td></tr>';
      return;
    }

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

  function mkChart(id, type, data, opts = {}) {
    if (S.charts[id]) {
      S.charts[id].destroy();
      delete S.charts[id];
    }
    const canvas = document.getElementById(id);
    if (!canvas || !window.Chart) return;

    const cfg = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: opts.tc,
            font: { family: 'Inter', size: 11 },
            boxWidth: 12,
          },
        },
      },
    };

    if (type !== 'doughnut') {
      cfg.scales = {
        x: { ticks: { color: opts.tc, font: { size: 10 } }, grid: { color: opts.gc } },
        y: { ticks: { color: opts.tc, font: { size: 10 } }, grid: { color: opts.gc }, min: opts.yMin, max: opts.yMax },
      };
      if (opts.stacked) {
        cfg.scales.x.stacked = true;
        cfg.scales.y.stacked = true;
      }
    }

    S.charts[id] = new window.Chart(canvas.getContext('2d'), { type, data, options: cfg });
  }

  function renderCharts() {
    const mes = document.getElementById('f-mes-chart')?.value || '';
    const recs = mes ? S.records.filter(r => r.data_ref?.startsWith(mes)) : S.records;
    if (!recs.length) return;

    const tc = S.theme === 'dark' ? 'rgba(241,245,249,.7)' : 'rgba(15,23,42,.7)';
    const gc = S.theme === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(15,23,42,.07)';

    const byDate = {};
    recs.forEach(r => {
      if (!byDate[r.data_ref]) byDate[r.data_ref] = { total: 0, rev: 0 };
      byDate[r.data_ref].total += 1;
      if (r.status === 'Revertido') byDate[r.data_ref].rev += 1;
    });
    const dates = Object.keys(byDate).sort();
    mkChart('chart-taxa', 'line', {
      labels: dates.map(d => d.slice(5)),
      datasets: [{
        label: 'Taxa %',
        data: dates.map(d => byDate[d].total ? +(byDate[d].rev / byDate[d].total * 100).toFixed(1) : 0),
        borderColor: '#c9a84c',
        backgroundColor: 'rgba(201,168,76,.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#c9a84c',
      }],
    }, { yMin: 0, yMax: 100, tc, gc });

    const rev = recs.filter(r => r.status === 'Revertido').length;
    const trat = recs.filter(r => r.status === 'Em Tratativa').length;
    const can = recs.filter(r => r.status === 'Cancelado').length;
    mkChart('chart-pie', 'doughnut', {
      labels: ['Revertido', 'Em Tratativa', 'Cancelado'],
      datasets: [{ data: [rev, trat, can], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderWidth: 0 }],
    }, { tc });

    const byC = _groupByConsultor(recs);
    const conss = Object.keys(byC).sort();
    mkChart('chart-bar', 'bar', {
      labels: conss.map(c => c.split(' ')[0]),
      datasets: [
        { label: 'Revertido', data: conss.map(c => byC[c].rev), backgroundColor: '#10b981' },
        { label: 'Em Tratativa', data: conss.map(c => byC[c].trat), backgroundColor: '#f59e0b' },
        { label: 'Cancelado', data: conss.map(c => byC[c].can), backgroundColor: '#ef4444' },
      ],
    }, { stacked: true, tc, gc });

    const meses = [...new Set(recs.map(r => r.data_ref?.slice(0, 7)).filter(Boolean))].sort();
    mkChart('chart-comp', 'bar', {
      labels: meses.map(fmtMes),
      datasets: [
        { label: 'Total', data: meses.map(m => recs.filter(r => r.data_ref?.startsWith(m)).length), backgroundColor: 'rgba(37,99,235,.6)' },
        { label: 'Revertidos', data: meses.map(m => recs.filter(r => r.data_ref?.startsWith(m) && r.status === 'Revertido').length), backgroundColor: 'rgba(16,185,129,.6)' },
      ],
    }, { tc, gc });
  }

  function renderHeatmap() {
    const mes = document.getElementById('f-mes-heat')?.value || '';
    const recs = (mes ? S.records.filter(r => r.data_ref?.startsWith(mes)) : S.records)
      .filter(r => r.status === 'Revertido' && r.hora);
    const el = document.getElementById('heatmap-wrap');
    if (!el) return;

    if (!recs.length) {
      el.innerHTML = '';
      setHTML('best-hours', '');
      setHTML('shift-stats', '');
      return;
    }

    const grid = {};
    recs.forEach(r => {
      const h = parseInt(r.hora.split(':')[0], 10);
      if (!Number.isNaN(h)) grid[h] = (grid[h] || 0) + 1;
    });
    const max = Math.max(...Object.values(grid), 1);

    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(12,1fr);gap:5px;margin-bottom:8px">
      ${Array.from({ length: 24 }, (_, h) => {
        const v = grid[h] || 0;
        const int = v / max;
        const bg = `rgba(201,168,76,${(0.08 + int * 0.9).toFixed(2)})`;
        const tc = int > 0.55 ? '#fff' : 'rgba(241,245,249,.55)';
        return `<div class="heatmap-cell" style="height:54px;background:${bg};color:${tc}" title="${h}h: ${v} reversões">
          <div style="font-size:10px;font-weight:700">${String(h).padStart(2, '0')}h</div>
          <div style="font-size:12px;font-weight:800">${v || ''}</div>
        </div>`;
      }).join('')}
    </div>`;

    const top = Object.entries(grid).sort((a, b) => b[1] - a[1]).slice(0, 3);
    setHTML('best-hours', top.map(([h, v], i) => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:20px">${['🥇', '🥈', '🥉'][i]}</div>
        <div style="font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:700;color:var(--gold2)">${String(h).padStart(2, '0')}h</div>
        <div style="font-size:12px;color:var(--text3)">${v} reversão${v !== 1 ? 'ões' : ''}</div>
      </div>`).join(''));

    const turnos = [
      { nome: 'Manhã (06-12)', horas: [6, 7, 8, 9, 10, 11] },
      { nome: 'Tarde (12-18)', horas: [12, 13, 14, 15, 16, 17] },
      { nome: 'Noite (18-24)', horas: [18, 19, 20, 21, 22, 23] },
    ];

    setHTML('shift-stats', turnos.map(t => {
      const total = t.horas.reduce((sum, h) => sum + (grid[h] || 0), 0);
      const pct = recs.length ? Math.round(total / recs.length * 100) : 0;
      return `<div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
          <span style="color:var(--text2)">${t.nome}</span>
          <span style="font-weight:700">${total} (${pct}%)</span>
        </div>
        <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join(''));
  }

  function renderRanking() {
    const mes = document.getElementById('f-mes-rank')?.value || '';
    const recs = mes ? S.records.filter(r => r.data_ref?.startsWith(mes)) : S.records;
    const el = document.getElementById('ranking-tbody');
    const podium = document.getElementById('ranking-podium');
    if (!el) return;

    if (!recs.length) {
      el.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text3)">Sem dados</td></tr>';
      if (podium) podium.innerHTML = '';
      return;
    }

    const byC = _groupByConsultor(recs);
    const sorted = Object.entries(byC).sort((a, b) => {
      const ta = a[1].total ? a[1].rev / a[1].total : 0;
      const tb = b[1].total ? b[1].rev / b[1].total : 0;
      return tb - ta;
    });

    el.innerHTML = sorted.map(([n, d], i) => {
      const taxa = d.total ? +(d.rev / d.total * 100).toFixed(1) : 0;
      const medals = ['🥇', '🥈', '🥉'];
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

    if (podium && sorted.length >= 1) {
      const top3 = sorted.slice(0, 3);
      const bg = ['var(--goldbg)', 'rgba(192,192,192,.1)', 'rgba(205,127,50,.1)'];
      podium.innerHTML = `<div class="g3" style="margin-bottom:18px">${top3.map(([n, d], i) => {
        const taxa = d.total ? +(d.rev / d.total * 100).toFixed(1) : 0;
        return `<div style="background:${bg[i]};border:1px solid var(--border${i === 0 ? '2' : ''});border-radius:var(--rad);padding:24px;text-align:center">
          <div style="font-size:40px;margin-bottom:8px">${['🥇', '🥈', '🥉'][i]}</div>
          <div style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;margin-bottom:8px">${n}</div>
          <div style="font-size:28px;font-weight:800;color:${i === 0 ? 'var(--gold2)' : 'var(--text)'}">${taxa}%</div>
          <div style="font-size:11px;color:var(--text3);margin-top:4px">${d.rev} revert. / ${d.total} total</div>
        </div>`;
      }).join('')}</div>`;
    }
  }

  return {
    fmtMes,
    fmtDate,
    populateAllFilters,
    updateTopbarKpis,
    renderDashboard,
    renderDashComp,
    renderAchievements,
    renderStats,
    renderCharts,
    mkChart,
    renderHeatmap,
    renderRanking,
  };
}


