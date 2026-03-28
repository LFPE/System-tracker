import { downloadBlob } from '../../assets/js/core/download.js';

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
      if (!ExcelJS) throw new Error('ExcelJS n\u00E3o est\u00E1 dispon\u00EDvel');

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('REATs');
      ws.columns = [
        { header: 'Data', key: 'data_ref', width: 12 },
        { header: 'Hora', key: 'hora', width: 8 },
        { header: 'Consultor', key: 'consultor', width: 22 },
        { header: 'Status', key: 'status', width: 16 },
        { header: 'Motivo', key: 'motivo', width: 20 },
        { header: 'Plano', key: 'plano', width: 14 },
        { header: 'An\u00E1lise', key: 'analise', width: 45 },
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
      doc.text('TRACKER - Coobrastur - Relat\u00F3rio REATs', 14, 16);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 22);
      doc.autoTable({
        startY: 28,
        head: [['Data', 'Hora', 'Consultor', 'Status', 'Motivo', 'Plano', 'An\u00E1lise']],
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
      const d = await api.get('/reats/backup');
      const payload = {
        version: d.version,
        exported: d.exported,
        records: d.records || {},
        sat: d.sat || [],
        users: d.users || [],
      };
      const json = JSON.stringify(payload, null, 2);
      downloadBlob(
        new Blob([json], { type: 'application/json' }),
        `tracker_backup_${new Date().toISOString().slice(0, 10)}.json`
      );
      showToast('Backup completo exportado!');
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
      if (!records || typeof records !== 'object') throw new Error('Formato de backup inv\u00E1lido');
      showLoading();
      const result = await api.post('/reats/import-backup', data.records ? data : { records });
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
      showToast(`Backup importado! REATs: ${result.reats || 0} | Satisfa\u00E7\u00E3o: ${result.sat || 0} | Usu\u00E1rios: ${result.users || 0}`);
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

