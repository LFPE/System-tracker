import { TRACKED_CONSULTANTS, normalizeConsultantName } from '../../assets/js/shared/consultants.js';
import { getPerformanceTone, renderEmptyState } from '../../assets/js/shared/templates.js';

export function createSatModule({
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
}) {
  function switchSatTab(tab) {
    ['import', 'mensal', 'consultores', 'charts'].forEach(t => {
      const btn = document.getElementById(`sat-tab-${t}`);
      const pan = document.getElementById(`sat-panel-${t}`);
      if (btn) btn.className = t === tab ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
      if (pan) pan.classList.toggle('hidden', t !== tab);
    });

    if (tab === 'mensal') renderSatMensal();
    else if (tab === 'consultores') renderSatCards();
    else if (tab === 'charts') renderSatCharts();
    else renderSatImportPanel();
  }

  function renderSat() {
    const active = ['import', 'mensal', 'consultores', 'charts'].find(t => {
      const btn = document.getElementById(`sat-tab-${t}`);
      return btn && btn.classList.contains('btn-primary');
    }) || 'import';
    switchSatTab(active);
  }

  function renderSatImportPanel() {
    setHTML('sat-cons-list', TRACKED_CONSULTANTS.map((consultant) => `
      <div class="consultant-list-item">
        <div class="consultant-list-dot"></div>
        <span class="consultant-list-name">${consultant}</span>
      </div>`).join(''));
  }

  function parseSatData() {
    const txt = document.getElementById('sat-raw')?.value?.trim();
    const mes = document.getElementById('sat-mes-sel')?.value;
    if (!txt) {
      showToast('Cole os dados TSV', 'warn');
      return;
    }
    if (!mes) {
      showToast('Selecione o mês no filtro acima', 'warn');
      return;
    }

    const [y, m] = mes.split('-').map(Number);
    const lines = txt.split('\n').map(l => l.trim()).filter(Boolean);
    const records = [];


    for (const line of lines) {
      const cols = line.split('\t');
      if (cols.length < 3) continue;
      const ramal = parseInt(cols[0], 10);
      const name = normalizeConsultantName(cols[1], { strict: true });
      if (!name) continue;
      const day = parseInt(cols[2], 10);
      const phone = cols[3] || '';
      const score = parseFloat(cols[4] || '0');
      if (Number.isNaN(ramal) || Number.isNaN(day) || Number.isNaN(score)) continue;
      const cat = score >= 4 ? 'BOM' : score >= 2 ? 'ATENÇÃO' : 'RUIM';
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      records.push({ ramal, name, date: dateStr, day, phone, score, cat });
    }

    if (!records.length) {
      showToast('Nenhum registro válido encontrado', 'warn');
      return;
    }

    S.parsedSat = { mes, records };

    const bom = records.filter(r => r.cat === 'BOM').length;
    const aten = records.filter(r => r.cat === 'ATENÇÃO').length;
    const ruim = records.filter(r => r.cat === 'RUIM').length;
    const pct = Math.round(bom / records.length * 100);

    setHTML('sat-prev-kpis', `
      <div class="kpi-card kpi-green" style="padding:14px"><div class="kpi-val green" style="font-size:22px">${bom}</div><div class="kpi-label">BOM</div></div>
      <div class="kpi-card kpi-yellow" style="padding:14px"><div class="kpi-val yellow" style="font-size:22px">${aten}</div><div class="kpi-label">ATENÇÃO</div></div>
      <div class="kpi-card kpi-red" style="padding:14px"><div class="kpi-val red" style="font-size:22px">${ruim}</div><div class="kpi-label">RUIM</div></div>
    `);
    setHTML('sat-prev-list', records.slice(0, 30).map(r => `
      <div class="prev-item" style="border-left-color:${r.cat === 'BOM' ? 'var(--green2)' : r.cat === 'ATENÇÃO' ? 'var(--yellow2)' : 'var(--red2)'}">
        <strong>${r.name.split(' ')[0]}</strong> — Dia ${r.day} | Nota: ${r.score} |
        <span style="font-weight:700;color:${r.cat === 'BOM' ? 'var(--green2)' : r.cat === 'ATENÇÃO' ? 'var(--yellow2)' : 'var(--red2)'}">${r.cat}</span>
      </div>`).join('') + (records.length > 30 ? `<div style="color:var(--text3);font-size:11px;padding:8px">...e mais ${records.length - 30} registros</div>` : ''));

    setText('sat-prev-title', `📊 ${records.length} avaliações — ${pct}% satisfação`);
    hideElement('sat-prev-empty');
    showElement('sat-prev-content');
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
      hideElement('sat-prev-content');
      showElement('sat-prev-empty');
      document.getElementById('sat-raw').value = '';
      switchSatTab('mensal');
    } catch (e) {
      showToast(`Erro: ${e.message}`, 'err');
    } finally {
      hideLoading();
    }
  }

  function renderSatMensal() {
    const mes = document.getElementById('sat-mes-sel')?.value || '';
    const recs = mes ? S.satRecords.filter(r => r.date?.startsWith(mes)) : S.satRecords;
    const el = document.getElementById('sat-grid-wrap');
    if (!el) return;
    if (!recs.length) {
      el.innerHTML = '';
      return;
    }

    const month = mes || recs[0]?.date?.slice(0, 7) || '';
    const [y, m] = month.split('-').map(Number);
    const dias = new Date(y, m, 0).getDate();
    const conss = [...new Set(recs.map(r => r.name).filter(Boolean))].sort();
    const grid = {};
    recs.forEach(r => {
      const k = `${r.name}|${r.day}`;
      if (!grid[k]) grid[k] = { bom: 0, aten: 0, ruim: 0 };
      if (r.cat === 'BOM') grid[k].bom += 1;
      else if (r.cat === 'ATENÇÃO') grid[k].aten += 1;
      else grid[k].ruim += 1;
    });

    const COLORS = ['#c9a84c', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
    const dArr = Array.from({ length: dias }, (_, i) => i + 1);

    el.innerHTML = `<table style="border-collapse:collapse;font-size:11px;min-width:100%">
      <thead><tr>
        <th style="text-align:left;padding:8px 12px;min-width:130px;position:sticky;left:0;background:var(--bg2);z-index:2">Consultor</th>
        ${dArr.map(d => {
          const dow = new Date(y, m - 1, d).getDay();
          const wknd = dow === 0 || dow === 6;
          return `<th style="min-width:30px;padding:4px 2px;text-align:center;${wknd ? 'opacity:.35' : ''}">
            <div style="font-size:9px;color:var(--text3)">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][dow]}</div>
            <div style="font-weight:700">${d}</div></th>`;
        }).join('')}
        <th style="padding:8px;text-align:center">%</th>
      </tr></thead>
      <tbody>
      ${conss.map((cons, ci) => {
        const color = COLORS[ci % COLORS.length];
        let totB = 0;
        let totA = 0;
        let totR = 0;
        const cells = dArr.map(d => {
          const dow = new Date(y, m - 1, d).getDay();
          const wknd = dow === 0 || dow === 6;
          const k = `${cons}|${d}`;
          const v = grid[k];
          if (wknd) return '<td class="sat-cell sc-weekend">—</td>';
          if (!v) return '<td class="sat-cell sc-empty">·</td>';
          totB += v.bom;
          totA += v.aten;
          totR += v.ruim;
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
    const mes = document.getElementById('sat-mes-sel')?.value || '';
    const recs = mes ? S.satRecords.filter(r => r.date?.startsWith(mes)) : S.satRecords;
    const el = document.getElementById('sat-cons-cards');
    if (!el) return;

    const byC = {};
    recs.forEach(r => {
      if (!byC[r.name]) byC[r.name] = { bom: 0, aten: 0, ruim: 0 };
      if (r.cat === 'BOM') byC[r.name].bom += 1;
      else if (r.cat === 'ATENÇÃO') byC[r.name].aten += 1;
      else byC[r.name].ruim += 1;
    });

    if (!Object.keys(byC).length) {
      el.innerHTML = '';
      return;
    }

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
    const mes = document.getElementById('sat-mes-sel')?.value || '';
    const recs = mes ? S.satRecords.filter(r => r.date?.startsWith(mes)) : S.satRecords;
    if (!recs.length) return;

    const byC = {};
    recs.forEach(r => {
      if (!byC[r.name]) byC[r.name] = { bom: 0, aten: 0, ruim: 0 };
      if (r.cat === 'BOM') byC[r.name].bom += 1;
      else if (r.cat === 'ATENÇÃO') byC[r.name].aten += 1;
      else byC[r.name].ruim += 1;
    });

    const conss = Object.keys(byC);
    const tc = S.theme === 'dark' ? 'rgba(241,245,249,.7)' : 'rgba(15,23,42,.7)';
    const gc = S.theme === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(15,23,42,.07)';

    mkChart('sat-chart-bar', 'bar', {
      labels: conss.map(c => c.split(' ')[0]),
      datasets: [
        { label: 'BOM', data: conss.map(c => byC[c].bom), backgroundColor: 'rgba(16,185,129,.7)' },
        { label: 'ATENÇÃO', data: conss.map(c => byC[c].aten), backgroundColor: 'rgba(245,158,11,.7)' },
        { label: 'RUIM', data: conss.map(c => byC[c].ruim), backgroundColor: 'rgba(239,68,68,.7)' },
      ],
    }, { stacked: true, tc, gc });

    const totB = recs.filter(r => r.cat === 'BOM').length;
    const totA = recs.filter(r => r.cat === 'ATENÇÃO').length;
    const totR = recs.filter(r => r.cat === 'RUIM').length;
    mkChart('sat-chart-pie', 'doughnut', {
      labels: ['BOM', 'ATENÇÃO', 'RUIM'],
      datasets: [{ data: [totB, totA, totR], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderWidth: 0 }],
    }, { tc });

    mkChart('sat-chart-pct', 'bar', {
      labels: conss.map(c => c.split(' ')[0]),
      datasets: [{
        label: '% Satisfação',
        data: conss.map(c => {
          const t = byC[c].bom + byC[c].aten + byC[c].ruim;
          return t ? Math.round(byC[c].bom / t * 100) : 0;
        }),
        backgroundColor: conss.map(c => {
          const t = byC[c].bom + byC[c].aten + byC[c].ruim;
          const p = t ? byC[c].bom / t : 0;
          return p >= 0.8 ? 'rgba(16,185,129,.7)' : p >= 0.6 ? 'rgba(245,158,11,.7)' : 'rgba(239,68,68,.7)';
        }),
      }],
    }, { tc, gc, yMin: 0, yMax: 100 });
  }

  async function hdlExcelSat() {
    if (!S.satRecords.length) {
      showToast('Sem dados de satisfação', 'warn');
      return;
    }

    try {
      const ExcelJS = window.ExcelJS;
      if (!ExcelJS) throw new Error('ExcelJS não está disponível');

      const wb = new ExcelJS.Workbook();
      const ws1 = wb.addWorksheet('Dados');
      ws1.columns = [
        { header: 'Data', key: 'date', width: 12 },
        { header: 'Consultor', key: 'name', width: 22 },
        { header: 'Ramal', key: 'ramal', width: 10 },
        { header: 'Dia', key: 'day', width: 6 },
        { header: 'Telefone', key: 'phone', width: 16 },
        { header: 'Nota', key: 'score', width: 8 },
        { header: 'Categoria', key: 'cat', width: 12 },
      ];
      ws1.getRow(1).font = { bold: true };
      S.satRecords.forEach(r => ws1.addRow(r));

      const ws2 = wb.addWorksheet('Resumo');
      ws2.columns = [
        { header: 'Consultor', key: 'name', width: 22 },
        { header: 'BOM', key: 'bom', width: 8 },
        { header: 'ATENÇÃO', key: 'aten', width: 10 },
        { header: 'RUIM', key: 'ruim', width: 8 },
        { header: 'Total', key: 'total', width: 8 },
        { header: '% BOM', key: 'pct', width: 10 },
      ];
      ws2.getRow(1).font = { bold: true };

      const byC = {};
      S.satRecords.forEach(r => {
        if (!byC[r.name]) byC[r.name] = { bom: 0, aten: 0, ruim: 0 };
        if (r.cat === 'BOM') byC[r.name].bom += 1;
        else if (r.cat === 'ATENÇÃO') byC[r.name].aten += 1;
        else byC[r.name].ruim += 1;
      });
      Object.entries(byC).forEach(([name, d]) => {
        const total = d.bom + d.aten + d.ruim;
        ws2.addRow({ name, ...d, total, pct: total ? `${Math.round(d.bom / total * 100)}%` : '0%' });
      });

      const buf = await wb.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracker_satisfacao_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Excel de satisfação exportado!');
    } catch (e) {
      showToast(`Erro: ${e.message}`, 'err');
    }
  }

  return {
    switchSatTab,
    renderSat,
    renderSatImportPanel,
    parseSatData,
    saveSatData,
    renderSatMensal,
    renderSatCards,
    renderSatCharts,
    hdlExcelSat,
  };
}


