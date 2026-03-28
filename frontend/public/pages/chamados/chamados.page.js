import { getConsultantSearchTerms, normalizeConsultantName } from '../../assets/js/core/consultants.js';
import { renderEmptyState } from '../../assets/js/core/templates.js';

export function createReatsModule({
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
}) {
  let histDebounce = null;

  function _setImportStep(n) {
    for (let i = 1; i <= 3; i += 1) {
      const dot = document.getElementById(`sc${i}`);
      if (dot) dot.className = i <= n ? 'step-dot done' : 'step-dot idle';

      const lbl = document.getElementById(`sl${i}`);
      if (lbl) {
        lbl.style.fontWeight = i === n ? '700' : '400';
        lbl.style.color = i <= n ? 'var(--text)' : 'var(--text3)';
      }
    }

    const ln1 = document.getElementById('ln1');
    const ln2 = document.getElementById('ln2');
    if (ln1) ln1.className = `step-line${n > 1 ? ' done' : ''}`;
    if (ln2) ln2.className = `step-line${n > 2 ? ' done' : ''}`;
  }

  function clearForm() {
    document.getElementById('raw-text').value = '';
    document.getElementById('date-input').value = '';
    setHTML('prev-stats', '');
    setHTML('prev-list', '');
    showElement('prev-empty');
    hideElement('prev-content');
    setText('prev-title', 'Preview dos registros');
  }

  function resetImport() {
    clearForm();
    showElement('step-form');
    hideElement('step-success');
    _setImportStep(1);
  }

  function _parseREATs(text, dataRef) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const records = [];

    const consultantTerms = getConsultantSearchTerms();
    const reData = /\b(\d{2}\/\d{2}\/\d{4})\b/;
    const reHora = /\b(\d{2}:\d{2})\b/;
    const reStatus = /\b(revertid[oa]|cancelad[oa]|em tratativa|tratativa)\b/i;
    const reMotivo = /\b(financeiro|financeira|falecimento|mudan\u00E7a|transfer\u00EAncia|desist\u00EAncia|viagem|doen\u00E7a|inadimpl\u00EAncia|inadimplente|outros?)\b/i;
    const rePlano = /\b(bronze|prata|ouro|diamante|premium|essencial|b\u00E1sico|b\u00E1sica)\b/i;
    const reTipo = /\b(cancelamento|solicita\u00E7\u00E3o|pedido|reat)\b/i;

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const mData = reData.exec(line);
      const mHora = reHora.exec(line);
      if (!mData || !mHora) continue;

      const ctx = `${line} ${lines[i + 1] || ''} ${lines[i + 2] || ''}`;

      let status = 'Em Tratativa';
      let revertido = '-';
      const mS = reStatus.exec(ctx);
      if (mS) {
        const s = mS[1].toLowerCase();
        if (s.startsWith('revert')) {
          status = 'Revertido';
          revertido = 'Sim';
        } else if (s.startsWith('cancel')) {
          status = 'Cancelado';
        }
      }

      let consultor = '-';
      for (let j = i; j <= Math.min(i + 3, lines.length - 1); j += 1) {
        const ll = lines[j].toLowerCase();
        if (consultantTerms.some(cn => ll.includes(cn))) {
          consultor = normalizeConsultantName(lines[j]);
          break;
        }
      }

      const mMotivo = reMotivo.exec(ctx);
      const mPlano = rePlano.exec(ctx);
      const mTipo = reTipo.exec(line);
      const motivo = mMotivo ? mMotivo[1].charAt(0).toUpperCase() + mMotivo[1].slice(1) : '-';
      const plano = mPlano ? mPlano[1].charAt(0).toUpperCase() + mPlano[1].slice(1) : '-';
      const tipo = mTipo ? mTipo[1].charAt(0).toUpperCase() + mTipo[1].slice(1) : 'Cancelamento';

      let analise = '';
      if (status === 'Revertido') analise = 'REAT revertido com sucesso.';
      else if (status === 'Cancelado') analise = 'Cancelamento efetivado.';
      else analise = 'Em acompanhamento.';

      records.push({
        data_ref: dataRef,
        tipo,
        data: mData[1],
        hora: mHora[1],
        consultor,
        status,
        revertido,
        motivo,
        plano_em_dia: '-',
        plano,
        analise,
        texto: line,
      });
    }

    return records;
  }

  function hdlParse() {
    const txt = document.getElementById('raw-text').value.trim();
    const date = document.getElementById('date-input').value;
    if (!txt) {
      showToast('Cole o texto do REAT', 'warn');
      return;
    }
    if (!date) {
      showToast('Selecione a data', 'warn');
      return;
    }

    const records = _parseREATs(txt, date);
    S.parsedImport = { date, records };

    if (!records.length) {
      showToast('Nenhum registro identificado. Verifique o texto.', 'warn');
      return;
    }

    const rev = records.filter(r => r.status === 'Revertido').length;
    const can = records.filter(r => r.status === 'Cancelado').length;
    const trat = records.filter(r => r.status === 'Em Tratativa').length;
    const taxa = records.length ? Math.round(rev / records.length * 100) : 0;
    setHTML('prev-stats', `
      <div class="kpi-card kpi-gold compact-kpi-card"><div class="kpi-val gold compact-kpi-value">${records.length}</div><div class="kpi-label">Total</div></div>
      <div class="kpi-card kpi-green compact-kpi-card"><div class="kpi-val green compact-kpi-value">${rev}</div><div class="kpi-label">Revertidos</div></div>
      <div class="kpi-card kpi-blue compact-kpi-card"><div class="kpi-val blue compact-kpi-value">${taxa}%</div><div class="kpi-label">Taxa</div></div>
    `);
    setHTML('prev-list', records.map(r => `
      <div class="prev-item">
        <span class="prev-tag ${r.status === 'Revertido' ? 'tag-rev' : r.status === 'Cancelado' ? 'tag-can' : 'tag-trat'}">${r.status}</span>
        <strong>${r.hora}</strong> \u2014 ${r.consultor} | ${r.motivo} | ${r.plano}
      </div>`).join(''));

    setText('prev-title', `${records.length} registros identificados`);
    hideElement('prev-empty');
    showElement('prev-content');
    _setImportStep(2);
  }

  async function hdlSave() {
    if (S.user?.role !== 'admin') {
      showToast('Apenas administradores podem importar REATs.', 'warn');
      return;
    }
    if (!S.parsedImport?.records?.length) return;
    showLoading();
    try {
      await api.post('/reats', { data_ref: S.parsedImport.date, records: S.parsedImport.records });
      const d = await api.get('/reats');
      S.records = d.records || [];
      populateAllFilters();
      updateTopbarKpis();
      hideElement('step-form');
      showElement('step-success');
      _setImportStep(3);
      setText('succ-msg', `${S.parsedImport.records.length} registros salvos para ${fmtDate(S.parsedImport.date)}`);
      fireConfetti();
      showToast(`${S.parsedImport.records.length} registros importados!`);
      S.parsedImport = null;
    } catch (e) {
      showToast(`Erro ao salvar: ${e.message}`, 'err');
    } finally {
      hideLoading();
    }
  }

  function debouncedHistory() {
    clearTimeout(histDebounce);
    histDebounce = setTimeout(renderHistory, 250);
  }

  function clearFilters() {
    ['f-consultor', 'f-status-h', 'f-data'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const s = document.getElementById('f-search');
    if (s) s.value = '';
    renderHistory();
  }

  function renderHistory() {
    let recs = S.records;
    const fc = document.getElementById('f-consultor')?.value || '';
    const fs = document.getElementById('f-status-h')?.value || '';
    const fd = document.getElementById('f-data')?.value || '';
    const fq = document.getElementById('f-search')?.value?.toLowerCase() || '';

    if (fc) recs = recs.filter(r => r.consultor === fc);
    if (fs) recs = recs.filter(r => r.status === fs);
    if (fd) recs = recs.filter(r => r.data_ref === fd);
    if (fq) recs = recs.filter(r => `${r.consultor}${r.motivo}${r.analise}${r.plano}${r.texto}`.toLowerCase().includes(fq));

    setText('filter-count', `${recs.length} registros`);
    const el = document.getElementById('hist-list');
    if (!el) return;

    if (!S.records.length) {
      showElement('hist-empty');
      el.innerHTML = '';
      return;
    }
    hideElement('hist-empty');

    if (!recs.length) {
      el.innerHTML = '';
      return;
    }

    const sub = document.getElementById('hist-subtitle');
    if (sub) sub.textContent = `${S.records.length} registros totais`;

    const byDate = {};
    recs.forEach(r => {
      if (!byDate[r.data_ref]) byDate[r.data_ref] = [];
      byDate[r.data_ref].push(r);
    });

    el.innerHTML = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, items]) => `
      <div class="hist-day">
        <div class="hist-day-hdr">
          <div class="hist-day-label">${fmtDate(date)}</div>
          <div class="hist-day-actions">
            <div class="hist-day-count">${items.length} registros</div>
            ${S.user?.role === 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteDay('${date}')">Apagar dia</button>` : ''}
          </div>
        </div>
        ${items.map(r => `
          <div class="hist-item ${r.status === 'Revertido' ? 'rev' : r.status === 'Cancelado' ? 'can' : 'trat'}"${S.user?.role === 'admin' ? ` onclick="openEdit(${r.id})"` : ''}>
            <div>
              <div class="hist-main">${r.hora} <span class="hist-separator">\u2022</span> <strong>${r.consultor}</strong></div>
              <div class="hist-meta"><span>${r.tipo}</span><span>${r.motivo}</span><span>Plano: ${r.plano}</span></div>
              ${r.analise ? `<div class="hist-analise">${r.analise}</div>` : ''}
            </div>
            <span class="tag ${r.status === 'Revertido' ? 'tag-rev' : r.status === 'Cancelado' ? 'tag-can' : 'tag-trat'}">${r.status}</span>
          </div>`).join('')}
      </div>`).join('');
  }

  function openEdit(id) {
    if (S.user?.role !== 'admin') return;
    const r = S.records.find(x => x.id === id);
    if (!r) return;
    S.editingId = id;
    setHTML('edit-info', `<strong>${r.hora}</strong> <span class="hist-separator">\u2022</span> ${r.consultor}<br>${r.tipo} | ${r.motivo} | Plano: ${r.plano}`);
    document.getElementById('edit-status').value = r.status;
    document.getElementById('edit-analise').value = r.analise || '';
    document.getElementById('edit-modal').classList.add('open');
  }

  async function saveEdit() {
    if (!S.editingId) return;
    const status = document.getElementById('edit-status').value;
    const analise = document.getElementById('edit-analise').value;
    try {
      await api.put(`/reats/${S.editingId}`, { status, analise });
      const rec = S.records.find(r => r.id === S.editingId);
      if (rec) {
        rec.status = status;
        rec.analise = analise;
      }
      closeModal();
      renderHistory();
      renderDashboard();
      updateTopbarKpis();
      showToast('Registro atualizado!');
    } catch (e) {
      showToast(e.message, 'err');
    }
  }

  async function deleteDay(dataRef) {
    if (!window.confirm(`Apagar TODOS os registros de ${fmtDate(dataRef)}?`)) return;
    try {
      await api.del(`/reats/date/${dataRef}`);
      S.records = S.records.filter(r => r.data_ref !== dataRef);
      populateAllFilters();
      renderHistory();
      renderDashboard();
      updateTopbarKpis();
      showToast('Dia removido.');
    } catch (e) {
      showToast(e.message, 'err');
    }
  }

  return {
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
  };
}

