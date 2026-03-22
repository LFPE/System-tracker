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


  function buildFallbackSatMonths() {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
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

    const satMesAtual = document.getElementById('sat-mes-sel')?.value || '';
    const satMeses = [...new Set([
      ...S.satMonths,
      ...S.satRecords.map(r => r.date?.slice(0, 7)).filter(Boolean),
      ...buildFallbackSatMonths(),
    ])].sort().reverse();
    setSelectOptions('sat-mes-sel', '<option value="">Todos os períodos</option>' + satMeses.map(m => `<option value="${m}">${fmtMes(m)}</option>`).join(''), false);
    const satMesSel = document.getElementById('sat-mes-sel');
    if (satMesSel) satMesSel.value = satMesAtual && satMeses.includes(satMesAtual) ? satMesAtual : '';
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
    } else {
      setText('hdr-sat', '—');
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
      <div class="kpi-card kpi-gold"><div class="kpi-icon">RT</div><div class="kpi-val gold">${total}</div><div class="kpi-label">Total de REATs</div></div>
      <div class="kpi-card kpi-green"><div class="kpi-icon">RV</div><div class="kpi-val green">${rev}</div><div class="kpi-label">Revertidos</div></div>
      <div class="kpi-card kpi-yellow"><div class="kpi-icon">TR</div><div class="kpi-val yellow">${trat}</div><div class="kpi-label">Em Tratativa</div></div>
      <div class="kpi-card kpi-red"><div class="kpi-icon">CN</div><div class="kpi-val red">${can}</div><div class="kpi-label">Cancelados</div></div>
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
      <div class="rank-row">
        <div class="rank-row-index">${i + 1}</div>
        <div class="rank-row-name">${t.n}</div>
        <div class="rank-row-value">${t.taxa}%</div>
        <div class="rank-row-meta">${t.total} reg</div>
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
    setText('streak-badge', `Sequência ativa: ${streak} dia${streak !== 1 ? 's' : ''} seguido${streak !== 1 ? 's' : ''}`);

    const alerts = document.getElementById('perf-alerts');
    if (alerts) {
      const low = Object.entries(byC).filter(([, d]) => d.total >= 5 && d.rev / d.total < 0.3);
      alerts.innerHTML = low.map(([n, d]) => `
        <div class="perf-alert"><strong>${n}</strong> está com taxa baixa: ${(d.rev / d.total * 100).toFixed(1)}% (${d.rev}/${d.total})</div>
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
      const tone = taxa >= 40 ? 'is-good' : taxa >= 30 ? 'is-mid' : 'is-low';
      return `<div class="comp-card">
        <div class="comp-card-label">${n.split(' ')[0]}</div>
        <div class="comp-val ${tone}">${taxa}%</div>
        <div class="comp-card-meta">${d.rev}/${d.total}</div>
      </div>`;
    }).join('') || '');
  }

  function renderAchievements(total, rev, taxa, numConss) {
    const el = document.getElementById('dash-achievements');
    if (!el) return;

    const achs = [
      { icon: 'PR', name: 'Primeira Reversão', desc: 'Reverteu o 1º REAT', unlocked: rev >= 1 },
      { icon: 'MT', name: 'Meta Atingida', desc: 'Taxa ≥ 40% de reversão', unlocked: taxa >= 40 },
      { icon: 'CT', name: 'Centenário', desc: '100 REATs importados', unlocked: total >= 100 },
      { icon: 'EL', name: 'Elite', desc: 'Taxa ≥ 60%', unlocked: taxa >= 60 },
      { icon: 'EC', name: 'Equipe Completa', desc: '5+ consultores ativos', unlocked: numConss >= 5 },
      { icon: 'CH', name: 'Em Chamas', desc: '200+ REATs importados', unlocked: total >= 200 },
      { icon: 'LD', name: 'Lenda', desc: 'Taxa ≥ 80%', unlocked: taxa >= 80 },
      { icon: 'CR', name: 'Crescimento', desc: '50+ revertidos', unlocked: rev >= 50 },
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
      <div class="kpi-card kpi-gold"><div class="kpi-icon">RT</div><div class="kpi-val gold">${total}</div><div class="kpi-label">Total</div></div>
      <div class="kpi-card kpi-green"><div class="kpi-icon">RV</div><div class="kpi-val green">${rev}</div><div class="kpi-label">Revertidos</div></div>
      <div class="kpi-card kpi-yellow"><div class="kpi-icon">TR</div><div class="kpi-val yellow">${trat}</div><div class="kpi-label">Em Tratativa</div></div>
      <div class="kpi-card kpi-red"><div class="kpi-icon">CN</div><div class="kpi-val red">${can}</div><div class="kpi-label">Cancelados</div></div>
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
        <div class="alert-banner"><strong>${n}</strong> com taxa baixa: ${(d.rev / d.total * 100).toFixed(1)}% (${d.rev}/${d.total})</div>
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
        <td>${i + 1}</td><td><strong>${n}</strong></td>
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

    el.innerHTML = `<div class="heatmap-grid">
      ${Array.from({ length: 24 }, (_, h) => {
        const v = grid[h] || 0;
        const int = v / max;
        const bg = `rgba(201,168,76,${(0.08 + int * 0.9).toFixed(2)})`;
        const tc = int > 0.55 ? '#fff' : 'rgba(241,245,249,.55)';
        return `<div class="heatmap-cell" style="height:54px;background:${bg};color:${tc}" title="${h}h: ${v} revers?es">
          <div class="heatmap-hour">${String(h).padStart(2, '0')}h</div>
          <div class="heatmap-total">${v || ''}</div>
        </div>`;
      }).join('')}
    </div>`;
      }).join('')}
    </div>`;

    const top = Object.entries(grid).sort((a, b) => b[1] - a[1]).slice(0, 3);
    setHTML('best-hours', top.map(([h, v], i) => `
      <div class="best-hour-row">
        <div class="best-hour-rank">${i + 1}</div>
        <div class="best-hour-time">${String(h).padStart(2, '0')}h</div>
        <div class="best-hour-count">${v} revers?o${v !== 1 ? '?es' : ''}</div>
      </div>`).join(''));

    const turnos = [
      { nome: 'Manhã (06-12)', horas: [6, 7, 8, 9, 10, 11] },
      { nome: 'Tarde (12-18)', horas: [12, 13, 14, 15, 16, 17] },
      { nome: 'Noite (18-24)', horas: [18, 19, 20, 21, 22, 23] },
    ];

    setHTML('shift-stats', turnos.map(t => {
      const total = t.horas.reduce((sum, h) => sum + (grid[h] || 0), 0);
      const pct = recs.length ? Math.round(total / recs.length * 100) : 0;
      return `<div class="shift-stat-row">
        <div class="shift-stat-head">
          <span class="shift-stat-name">${t.nome}</span>
          <span class="shift-stat-value">${total} (${pct}%)</span>
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
      return `<tr>
        <td class="table-cell-center">${i + 1}</td>
        <td><strong>${n}</strong></td>
        <td class="table-cell-center">${d.total}</td>
        <td class="table-cell-center cell-positive">${d.rev}</td>
        <td class="table-cell-center cell-warning">${d.trat}</td>
        <td class="table-cell-center cell-danger">${d.can}</td>
        <td class="table-cell-center"><span class="tag ${taxa >= 40 ? 'tag-rev' : taxa >= 30 ? 'tag-trat' : 'tag-can'}">${taxa}%</span></td>
      </tr>`;
    }).join('');

    if (podium && sorted.length >= 1) {
      const top3 = sorted.slice(0, 3);
      podium.innerHTML = `<div class="g3 ranking-podium-grid">${top3.map(([n, d], i) => {
        const taxa = d.total ? +(d.rev / d.total * 100).toFixed(1) : 0;
        return `<div class="podium-card podium-${i + 1}">
          <div class="podium-rank">${i + 1}</div>
          <div class="podium-name">${n}</div>
          <div class="podium-score">${taxa}%</div>
          <div class="podium-meta">${d.rev} revert. / ${d.total} total</div>
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



