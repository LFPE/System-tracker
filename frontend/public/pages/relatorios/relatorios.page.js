import { downloadBlob } from '../../assets/js/shared/download.js';

export function createExportModule({
  S,
  api,
  showToast,
  showLoading,
  hideLoading,
  populateAllFilters,
  renderDashboard,
  updateTopbarKpis,
}) {
  async function hdlExcel() {
    if (!S.records.length) {
      showToast('Sem dados para exportar', 'warn');
      return;
    }

    try {
      const ExcelJS = window.ExcelJS;
      if (!ExcelJS) throw new Error('ExcelJS não está disponível');

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('REATs');
      ws.columns = [
        { header: 'Data', key: 'data_ref', width: 12 },
        { header: 'Hora', key: 'hora', width: 8 },
        { header: 'Consultor', key: 'consultor', width: 22 },
        { header: 'Status', key: 'status', width: 16 },
        { header: 'Motivo', key: 'motivo', width: 20 },
        { header: 'Plano', key: 'plano', width: 14 },
        { header: 'Análise', key: 'analise', width: 45 },
      ];
      ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      S.records.forEach(r => ws.addRow(r));

      const buf = await wb.xlsx.writeBuffer();
      downloadBlob(
        new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `tracker_reats_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      showToast('Excel exportado!');
    } catch (e) {
      showToast(`Erro: ${e.message}`, 'err');
    }
  }

  async function hdlPDF() {
    if (!S.records.length) {
      showToast('Sem dados para exportar', 'warn');
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('TRACKER - Coobrastur - Relatório REATs', 14, 16);
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
      doc.save(`tracker_reats_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast('PDF exportado!');
    } catch (e) {
      showToast(`Erro: ${e.message}`, 'err');
    }
  }

  async function hdlExportBackup() {
    try {
      const d = await api.get('/reats');
      const grouped = {};
      (d.records || []).forEach(r => {
        if (!grouped[r.data_ref]) grouped[r.data_ref] = [];
        grouped[r.data_ref].push(r);
      });
      const json = JSON.stringify({ version: 2, exported: new Date().toISOString(), records: grouped }, null, 2);
      downloadBlob(
        new Blob([json], { type: 'application/json' }),
        `tracker_backup_${new Date().toISOString().slice(0, 10)}.json`
      );
      showToast('Backup exportado!');
    } catch (e) {
      showToast(`Erro: ${e.message}`, 'err');
    }
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
      populateAllFilters();
      renderDashboard();
      updateTopbarKpis();
      showToast('Backup importado com sucesso!');
    } catch (e) {
      showToast(`Erro: ${e.message}`, 'err');
    } finally {
      hideLoading();
      input.value = '';
    }
  }

  return {
    hdlExcel,
    hdlPDF,
    hdlExportBackup,
    hdlImportBackup,
  };
}

