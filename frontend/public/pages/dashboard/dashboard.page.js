
import { setSelectOptions } from '../../assets/js/core/dom.js';
import { renderMutedText } from '../../assets/js/core/templates.js';

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
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    return `${dias[dt.getDay()]}, ${d} ${meses[parseInt(m, 10) - 1]} ${y}`;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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

  function getLatestMonthRef(recs) {
    return [...new Set(recs.map(r => r.data_ref?.slice(0, 7)).filter(Boolean))].sort().reverse()[0] || '';
  }

  function getPeriodLabel(recs) {
    const ref = getLatestMonthRef(recs);
    if (ref) return fmtMes(ref);
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());
  }

  function getThemeTone() {
    return S.theme === 'dark'
      ? {
          text: 'rgba(241,245,249,.9)',
          muted: 'rgba(148,163,184,.76)',
          grid: 'rgba(255,255,255,.07)',
          surface: 'rgba(10,20,38,.78)',
        }
      : {
          text: 'rgba(15,23,42,.9)',
          muted: 'rgba(71,85,105,.8)',
          grid: 'rgba(15,23,42,.08)',
          surface: 'rgba(255,255,255,.96)',
        };
  }

  function populateAllFilters() {
    const consultores = [...new Set(S.records.map(r => r.consultor).filter(Boolean))].sort();
    const meses = [...new Set(S.records.map(r => r.data_ref?.slice(0, 7)).filter(Boolean))].sort().reverse();
    const mesOpts = meses.map(m => `<option value="${m}">${fmtMes(m)}</option>`).join('');
    const consOpts = consultores.map(c => `<option value="${c}">${c}</option>`).join('');
    const allMes = '<option value="">Todo o periodo</option>' + mesOpts;

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
    setSelectOptions('sat-mes-sel', '<option value="">Todos os periodos</option>' + satMeses.map(m => `<option value="${m}">${fmtMes(m)}</option>`).join(''), false);
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
      setText('hdr-sat', '\u2014');
    }
  }

  function renderKpis(total, rev, trat, can, taxa) {
    const cards = [
      {
        tone: 'kpi-blue',
        accent: 'linear-gradient(90deg,#38bdf8,#2563eb)',
        label: 'Recebidas',
        value: total,
        sub: 'atendimentos',
      },
      {
        tone: 'kpi-green',
        accent: 'linear-gradient(90deg,#34d399,#0f9d58)',
        label: 'Reversoes',
        value: rev,
        sub: 'revertidas',
      },
      {
        tone: 'kpi-red',
        accent: 'linear-gradient(90deg,#ff7ab6,#f472b6)',
        label: 'Cancelamentos',
        value: can,
        sub: 'cancelados',
      },
      {
        tone: 'kpi-gold',
        accent: 'linear-gradient(90deg,#8b5cf6,#6366f1)',
        label: 'Taxa Reversao',
        value: `${taxa}%`,
        sub: 'media geral',
      },
    ];

    return cards.map(card => `
      <div class="kpi-card ${card.tone}" style="display:flex;flex-direction:column;gap:12px;min-height:146px">
        <div style="height:4px;border-radius:999px;background:${card.accent}"></div>
        <div style="display:flex;flex-direction:column;gap:4px">
          <div style="color:var(--text3);font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase">${card.label}</div>
          <div class="kpi-val ${card.tone.includes('green') ? 'green' : card.tone.includes('red') ? 'red' : card.tone.includes('gold') ? 'gold' : 'blue'}" style="font-size:36px;line-height:1">${card.value}</div>
          <div class="kpi-label">${card.sub}</div>
        </div>
      </div>
    `).join('');
  }
  function renderTopConsultorasTable(recs) {
    const byC = _groupByConsultor(recs);
    const top = Object.entries(byC)
      .map(([n, d]) => ({
        n,
        total: d.total,
        rev: d.rev,
        taxa: d.total ? +(d.rev / d.total * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.total - a.total || b.rev - a.rev)
      .slice(0, 5);

    if (!top.length) {
      return `<div class="dashboard-empty-state">
        <div class="dashboard-empty-icon">REAT</div>
        <p class="text-muted-message">Nenhum dado importado ainda.</p>
        <span class="dashboard-empty-sub">Use a aba REATs para carregar os primeiros atendimentos.</span>
      </div>`;
    }

    const accentColors = ['#6d5efc', '#00c2a8', '#ff7ab6', '#4f8dc7', '#f59e0b'];
    return `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px">
        <div style="display:flex;flex-direction:column;gap:4px">
          <div style="color:var(--text3);font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase">Ranking por consultora</div>
          <div style="color:var(--text2);font-size:12px">Ordenado por volume de atendimentos</div>
        </div>
        <div style="color:var(--text3);font-size:12px;font-weight:700">${top.length} ativas</div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Consultora</th>
              <th class="u-text-center">Recebidas</th>
              <th class="u-text-center">Reversoes</th>
              <th class="u-text-center">Taxa</th>
            </tr>
          </thead>
          <tbody>
            ${top.map((t, i) => `
              <tr>
                <td style="width:40px">
                  <span style="display:inline-flex;width:30px;height:30px;align-items:center;justify-content:center;border-radius:999px;background:${accentColors[i]};color:#fff;font-size:11px;font-weight:800">${i + 1}</span>
                </td>
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <span style="display:inline-flex;width:30px;height:30px;align-items:center;justify-content:center;border-radius:999px;background:${accentColors[i]};color:#fff;font-size:11px;font-weight:800;flex:0 0 auto">${escapeHtml(t.n).charAt(0).toUpperCase()}</span>
                    <div style="min-width:0">
                      <div style="font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(t.n)}</div>
                    </div>
                  </div>
                </td>
                <td style="text-align:center;font-weight:700">${t.total}</td>
                <td style="text-align:center;color:var(--green2);font-weight:700">${t.rev}</td>
                <td style="text-align:center"><span class="tag ${t.taxa >= 40 ? 'tag-rev' : t.taxa >= 30 ? 'tag-trat' : 'tag-can'}">${t.taxa}%</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderOutcomePanel(recs) {
    const total = recs.length;
    const rev = recs.filter(r => r.status === 'Revertido').length;
    const can = recs.filter(r => r.status === 'Cancelado').length;
    const taxa = total ? Math.round(rev / total * 100) : 0;
    const revPct = total ? Math.round(rev / total * 100) : 0;
    const canPct = total ? Math.round(can / total * 100) : 0;
    const host = document.querySelector('#tab-dashboard .dash-meta-card');
    if (!host) return;

    host.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px">
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="color:var(--text3);font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase">Reversoes vs Cancelamentos</div>
          <div style="color:var(--text2);font-size:12px">Distribuicao consolidada do periodo</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:34px;font-weight:800;line-height:1;color:var(--text)">${taxa}%</div>
          <div style="font-size:11px;color:var(--text3);font-weight:700">taxa de reversao</div>
        </div>
      </div>
      <div style="position:relative;display:grid;place-items:center;min-height:250px">
        <canvas id="dash-outcome-chart" style="max-height:240px"></canvas>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none">
          <div style="text-align:center">
            <div style="font-size:34px;font-weight:800;line-height:1;color:var(--text)">${taxa}%</div>
            <div style="font-size:12px;color:var(--text3)">reversao</div>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:10px">
        <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:rgba(16,185,129,.12);color:#10b981;font-size:12px;font-weight:700">
          <span style="width:10px;height:10px;border-radius:999px;background:#10b981;display:inline-block"></span>
          Reversoes ${rev} (${revPct}%)
        </div>
        <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:rgba(255,122,182,.12);color:#ff7ab6;font-size:12px;font-weight:700">
          <span style="width:10px;height:10px;border-radius:999px;background:#ff7ab6;display:inline-block"></span>
          Cancelamentos ${can} (${canPct}%)
        </div>
      </div>
    `;

    if (S.charts['dash-outcome-chart']) {
      S.charts['dash-outcome-chart'].destroy();
      delete S.charts['dash-outcome-chart'];
    }
    if (!window.Chart) return;

    S.charts['dash-outcome-chart'] = new window.Chart(document.getElementById('dash-outcome-chart').getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: total ? ['Reversoes', 'Cancelamentos'] : ['Sem dados'],
        datasets: [{
          data: total ? [rev, can] : [1],
          backgroundColor: total ? ['#10b981', '#ff7ab6'] : ['rgba(255,255,255,.12)'],
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.raw}`,
            },
          },
        },
      },
    });
  }
  function renderDashboardSummary(recs) {
    const selEl = document.getElementById('dash-comp-mes');
    const meses = [...new Set(recs.map(r => r.data_ref?.slice(0, 7)).filter(Boolean))].sort().reverse();
    if (selEl && selEl.options.length <= 1) {
      selEl.innerHTML = '<option value="">Todos os meses</option>' + meses.map(m => `<option value="${m}">${fmtMes(m)}</option>`).join('');
      if (!selEl.value) selEl.value = meses[0] || '';
    }

    const mes = selEl?.value || meses[0] || '';
    const recsMes = mes ? recs.filter(r => r.data_ref?.startsWith(mes)) : recs;
    const total = recsMes.length;
    const byC = _groupByConsultor(recsMes);
    const numConss = Object.keys(byC).length;
    const periodLabel = mes ? fmtMes(mes) : getPeriodLabel(recsMes);
    const taxa = total ? Math.round(recsMes.filter(r => r.status === 'Revertido').length / total * 100) : 0;
    const target = 40;
    const targetGap = taxa - target;

    const el = document.getElementById('dash-comp-cards');
    if (!el) return;

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px">
        <div style="padding:16px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.16)">
          <div style="color:var(--text3);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px">Periodo</div>
          <div style="font-size:18px;font-weight:800;color:var(--text)">${escapeHtml(periodLabel)}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:6px">dados selecionados</div>
        </div>
        <div style="padding:16px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.16)">
          <div style="color:var(--text3);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px">Consultoras</div>
          <div style="font-size:18px;font-weight:800;color:var(--text)">${numConss}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:6px">ativas no periodo</div>
        </div>
        <div style="padding:16px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.16)">
          <div style="color:var(--text3);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px">Meta</div>
          <div style="font-size:18px;font-weight:800;color:${taxa >= target ? '#10b981' : '#f59e0b'}">${taxa}%</div>
          <div style="font-size:11px;color:var(--text3);margin-top:6px">${targetGap >= 0 ? '+' : ''}${targetGap}% da meta</div>
        </div>
        <div style="padding:16px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.16)">
          <div style="color:var(--text3);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px">Volume</div>
          <div style="font-size:18px;font-weight:800;color:var(--text)">${total}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:6px">registros no periodo</div>
        </div>
      </div>
    `;

    const titles = document.querySelectorAll('#tab-dashboard .card-title');
    if (titles[0]) titles[0].textContent = 'Top Consultoras';
    if (titles[1]) titles[1].textContent = 'Resumo mensal';
    if (titles[2]) titles[2].textContent = 'Insights da equipe';
  }

  function renderInsights(total, rev, taxa, numConss, streak, topVolume, topTaxa) {
    const el = document.getElementById('dash-achievements');
    if (!el) return;

    const items = [
      {
        label: 'Meta',
        value: `${taxa}%`,
        sub: taxa >= 40 ? 'acima da meta' : 'precisa evoluir',
        tone: taxa >= 40 ? '#10b981' : '#f59e0b',
      },
      {
        label: 'Consultoras ativas',
        value: `${numConss}`,
        sub: 'no periodo atual',
        tone: '#6d5efc',
      },
      {
        label: 'Maior volume',
        value: topVolume ? escapeHtml(topVolume.name) : '--',
        sub: topVolume ? `${topVolume.total} registros` : 'sem dados',
        tone: '#4f8dc7',
      },
      {
        label: 'Melhor taxa',
        value: topTaxa ? `${escapeHtml(topTaxa.name)}` : '--',
        sub: topTaxa ? `${topTaxa.taxa}% de reversao` : 'sem dados',
        tone: '#ff7ab6',
      },
    ];

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px">
        ${items.map(item => `
          <div style="padding:16px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.16)">
            <div style="color:var(--text3);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px">${item.label}</div>
            <div style="font-size:18px;font-weight:800;color:${item.tone};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.value}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:6px">${item.sub}</div>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:14px;color:var(--text3);font-size:12px">
        <span style="padding:8px 12px;border-radius:999px;background:rgba(16,185,129,.12);color:#10b981;font-weight:700">${rev} reversoes</span>
        <span style="padding:8px 12px;border-radius:999px;background:rgba(109,94,252,.12);color:#6d5efc;font-weight:700">${total} registros</span>
        <span style="padding:8px 12px;border-radius:999px;background:rgba(255,122,182,.12);color:#ff7ab6;font-weight:700">Sequencia ${streak} dias</span>
      </div>
    `;
  }
  function renderOutcomeChart(recs) {
    const total = recs.length;
    const rev = recs.filter(r => r.status === 'Revertido').length;
    const can = recs.filter(r => r.status === 'Cancelado').length;
    const taxa = total ? Math.round(rev / total * 100) : 0;
    const revPct = total ? Math.round(rev / total * 100) : 0;
    const canPct = total ? Math.round(can / total * 100) : 0;
    const legend = document.getElementById('dash-outcome-legend');
    const canvas = document.getElementById('dash-outcome-chart');
    if (!legend || !canvas) return;

    legend.innerHTML = `
      <div class="dash-legend-item">
        <span class="dash-legend-swatch" style="background:#10b981"></span>
        <span>Reversoes ${rev} (${revPct}%)</span>
      </div>
      <div class="dash-legend-item">
        <span class="dash-legend-swatch" style="background:#ff7ab6"></span>
        <span>Cancelamentos ${can} (${canPct}%)</span>
      </div>
    `;

    if (S.charts['dash-outcome-chart']) {
      S.charts['dash-outcome-chart'].destroy();
      delete S.charts['dash-outcome-chart'];
    }
    if (!window.Chart) return;

    S.charts['dash-outcome-chart'] = new window.Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: total ? ['Reversoes', 'Cancelamentos'] : ['Sem dados'],
        datasets: [{
          data: total ? [rev, can] : [1],
          backgroundColor: total ? ['#10b981', '#ff7ab6'] : ['rgba(255,255,255,.12)'],
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.raw}`,
            },
          },
        },
      },
    });

    const monthChip = document.getElementById('dash-month-chip');
    if (monthChip) {
      monthChip.textContent = total ? `${getPeriodLabel(recs)} • ${taxa}% reversao` : `${getPeriodLabel(recs)} • sem dados`;
    }
  }

  function renderDashboard() {
    const recs = S.records;
    const total = recs.length;
    const rev = recs.filter(r => r.status === 'Revertido').length;
    const trat = recs.filter(r => r.status === 'Em Tratativa').length;
    const can = recs.filter(r => r.status === 'Cancelado').length;
    const taxa = total ? +(rev / total * 100).toFixed(1) : 0;
    const byC = _groupByConsultor(recs);
    const sortedByVolume = Object.entries(byC).sort((a, b) => b[1].total - a[1].total || b[1].rev - a[1].rev);
    const sortedByTaxa = Object.entries(byC).sort((a, b) => {
      const ta = a[1].total ? a[1].rev / a[1].total : 0;
      const tb = b[1].total ? b[1].rev / b[1].total : 0;
      return tb - ta || b[1].total - a[1].total;
    });
    const topVolume = sortedByVolume[0] ? { name: sortedByVolume[0][0], total: sortedByVolume[0][1].total } : null;
    const topTaxa = sortedByTaxa[0]
      ? { name: sortedByTaxa[0][0], taxa: sortedByTaxa[0][1].total ? +(sortedByTaxa[0][1].rev / sortedByTaxa[0][1].total * 100).toFixed(1) : 0 }
      : null;

    setText('dash-month-chip', total ? `${getPeriodLabel(recs)} • ${taxa}% reversao` : `${getPeriodLabel(recs)} • sem dados`);
    setHTML('dash-kpis', renderKpis(total, rev, trat, can, taxa));
    setHTML('dash-top-cons', renderTopConsultorasTable(recs));
    renderOutcomeChart(recs);

    const datesRev = [...new Set(recs.filter(r => r.status === 'Revertido').map(r => r.data_ref).filter(Boolean))].sort().reverse();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i += 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (datesRev.includes(d.toISOString().slice(0, 10))) streak += 1;
      else if (i > 0) break;
    }
    setText('streak-badge', `Sequencia ativa: ${streak} dia${streak !== 1 ? 's' : ''} seguido${streak !== 1 ? 's' : ''}`);

    const alerts = document.getElementById('perf-alerts');
    if (alerts) {
      const low = Object.entries(byC).filter(([, d]) => d.total >= 5 && d.rev / d.total < 0.3);
      alerts.innerHTML = low.map(([n, d]) => `
        <div class="perf-alert"><strong>${escapeHtml(n)}</strong> esta com taxa baixa: ${(d.rev / d.total * 100).toFixed(1)}% (${d.rev}/${d.total})</div>
      `).join('');
    }

    const titles = document.querySelectorAll('#tab-dashboard .card-title');
    if (titles[0]) titles[0].textContent = 'Top Consultoras';

    const topTable = document.getElementById('dash-top-cons');
    if (topTable && !topTable.innerHTML.trim()) topTable.innerHTML = renderMutedText('Nenhum dado. Importe um arquivo REAT.');

    if (typeof topVolume === 'object' && typeof topTaxa === 'object') {
      const monthChip = document.getElementById('dash-month-chip');
      if (monthChip) monthChip.title = `${topVolume.name} | ${topTaxa.name}`;
    }
  }

  function renderDashComp() {
    renderDashboard();
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
        <div class="alert-banner"><strong>${escapeHtml(n)}</strong> com taxa baixa: ${(d.rev / d.total * 100).toFixed(1)}% (${d.rev}/${d.total})</div>
      `).join('');
    }

    if (!total) {
      el.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text3)">Sem dados para o periodo</td></tr>';
      return;
    }

    el.innerHTML = Object.entries(byC).sort((a, b) => {
      const ta = a[1].total ? a[1].rev / a[1].total : 0;
      const tb = b[1].total ? b[1].rev / b[1].total : 0;
      return tb - ta;
    }).map(([n, d], i) => {
      const tx = d.total ? +(d.rev / d.total * 100).toFixed(1) : 0;
      return `<tr>
        <td>${i + 1}</td><td><strong>${escapeHtml(n)}</strong></td>
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
        return `<div class="heatmap-cell" style="height:54px;background:${bg};color:${tc}" title="${h}h: ${v} reversoes">
          <div class="heatmap-hour">${String(h).padStart(2, '0')}h</div>
          <div class="heatmap-total">${v || ''}</div>
        </div>`;
      }).join('')}
    </div>`;

    const top = Object.entries(grid).sort((a, b) => b[1] - a[1]).slice(0, 3);
    setHTML('best-hours', top.map(([h, v], i) => `
      <div class="best-hour-row">
        <div class="best-hour-rank">${i + 1}</div>
        <div class="best-hour-time">${String(h).padStart(2, '0')}h</div>
        <div class="best-hour-count">${v} reversao${v !== 1 ? 'es' : ''}</div>
      </div>`).join(''));

    const turnos = [
      { nome: 'Manha (06-12)', horas: [6, 7, 8, 9, 10, 11] },
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
        <td><strong>${escapeHtml(n)}</strong></td>
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
          <div class="podium-name">${escapeHtml(n)}</div>
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
    renderStats,
    renderCharts,
    mkChart,
    renderHeatmap,
    renderRanking,
  };
}

