import type { D1Database } from '@cloudflare/workers-types'
import type { ReatBackupPayload, ReatRecordInput } from '../models/reats.model'

export async function listReats(db: D1Database, filters: {
  consultor: string
  status: string
  data_ref: string
  mes: string
  q: string
}) {
  let sql = 'SELECT * FROM reats WHERE 1=1'
  const params: string[] = []

  if (filters.consultor) {
    sql += ' AND consultor = ?'
    params.push(filters.consultor)
  }

  if (filters.status) {
    sql += ' AND status = ?'
    params.push(filters.status)
  }

  if (filters.data_ref) {
    sql += ' AND data_ref = ?'
    params.push(filters.data_ref)
  }

  if (filters.mes) {
    sql += ' AND data_ref LIKE ?'
    params.push(`${filters.mes}%`)
  }

  if (filters.q) {
    sql += ' AND (consultor LIKE ? OR motivo LIKE ? OR analise LIKE ? OR plano LIKE ? OR texto LIKE ?)'
    const search = `%${filters.q}%`
    params.push(search, search, search, search, search)
  }

  sql += ' ORDER BY data_ref DESC, hora ASC'

  const result = await db.prepare(sql).bind(...params).all<any>()
  return result.results
}

export async function listReatDates(db: D1Database) {
  const result = await db.prepare(
    'SELECT DISTINCT data_ref FROM reats ORDER BY data_ref DESC'
  ).all<any>()

  return result.results.map((row: any) => row.data_ref)
}

export async function listReatConsultores(db: D1Database) {
  const result = await db.prepare(
    'SELECT DISTINCT consultor FROM reats ORDER BY consultor ASC'
  ).all<any>()

  return result.results.map((row: any) => row.consultor)
}

export async function replaceReatsForDate(db: D1Database, data_ref: string, records: ReatRecordInput[]) {
  await db.prepare('DELETE FROM reats WHERE data_ref = ?').bind(data_ref).run()

  const statement = db.prepare(`
    INSERT INTO reats (data_ref, tipo, data, hora, consultor, status, revertido, motivo, plano_em_dia, plano, analise, texto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const batch = records.map((record) =>
    statement.bind(
      data_ref,
      record.tipo || '',
      record.data || '',
      record.hora || '',
      record.consultor || '-',
      record.status || 'Em Tratativa',
      record.revertido || '-',
      record.motivo || '-',
      record.plano_em_dia || '-',
      record.plano || '-',
      record.analise || '',
      record.texto || ''
    )
  )

  await db.batch(batch)
  return records.length
}

export async function updateReat(db: D1Database, id: string, status: string, analise: string) {
  await db.prepare(
    'UPDATE reats SET status = ?, analise = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(status, analise, id).run()
}

export async function deleteReatsByDate(db: D1Database, dataRef: string) {
  await db.prepare('DELETE FROM reats WHERE data_ref = ?').bind(dataRef).run()
}

export async function getReatsStats(db: D1Database, month: string) {
  const where = month ? 'WHERE data_ref LIKE ?' : ''
  const whereParams = month ? [`${month}%`] : []

  const [totals, byConsultor, byDate] = await Promise.all([
    db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status='Revertido' THEN 1 ELSE 0 END) as revertidos,
        SUM(CASE WHEN status='Cancelado' THEN 1 ELSE 0 END) as cancelados,
        SUM(CASE WHEN status='Em Tratativa' THEN 1 ELSE 0 END) as tratativas
      FROM reats ${where}
    `).bind(...whereParams).first<any>(),

    db.prepare(`
      SELECT consultor,
        COUNT(*) as total,
        SUM(CASE WHEN status='Revertido' THEN 1 ELSE 0 END) as revertidos,
        SUM(CASE WHEN status='Cancelado' THEN 1 ELSE 0 END) as cancelados,
        SUM(CASE WHEN status='Em Tratativa' THEN 1 ELSE 0 END) as tratativas
      FROM reats ${where}
      GROUP BY consultor
      ORDER BY total DESC
    `).bind(...whereParams).all<any>(),

    db.prepare(`
      SELECT data_ref,
        COUNT(*) as total,
        SUM(CASE WHEN status='Revertido' THEN 1 ELSE 0 END) as revertidos
      FROM reats ${where}
      GROUP BY data_ref
      ORDER BY data_ref DESC
    `).bind(...whereParams).all<any>(),
  ])

  return {
    totals,
    byConsultor: byConsultor.results,
    byDate: byDate.results,
  }
}

export async function importReatsBackup(db: D1Database, backup: ReatBackupPayload) {
  let count = 0

  for (const [dataRef, rows] of Object.entries(backup)) {
    if (!Array.isArray(rows)) continue
    count += await replaceReatsForDate(db, dataRef, rows)
  }

  return count
}
