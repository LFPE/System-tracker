import type { D1Database } from '@cloudflare/workers-types'
import type { BackupUserInput, ReatRecordInput, SystemBackupPayload } from '../models/reats.model'
import type { SatRecordInput } from '../models/sat.model'
import { normalizeLogin, trimString } from '../utils/input'

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

  if (batch.length) {
    await db.batch(batch)
  }

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

async function replaceSatForMonth(db: D1Database, month: string, records: SatRecordInput[]) {
  await db.prepare('DELETE FROM satisfacao WHERE date LIKE ?').bind(`${month}%`).run()

  const statement = db.prepare(`
    INSERT INTO satisfacao (ramal, name, date, day, phone, score, cat)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const batch = records.map((record) =>
    statement.bind(
      record.ramal,
      record.name,
      record.date,
      record.day,
      record.phone || '',
      record.score,
      record.cat
    )
  )

  if (batch.length) {
    await db.batch(batch)
  }

  return records.length
}

async function upsertBackupUsers(db: D1Database, users: BackupUserInput[]) {
  const validUsers = users.filter((user) => normalizeLogin(user?.login) && trimString(user?.name) && trimString(user?.pass_hash))
  if (!validUsers.length) return 0

  const statement = db.prepare(`
    INSERT INTO users (login, name, pass_hash, role)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(login) DO UPDATE SET
      name = excluded.name,
      pass_hash = excluded.pass_hash,
      role = excluded.role
  `)

  const batch = validUsers.map((user) =>
    statement.bind(
      normalizeLogin(user.login),
      trimString(user.name),
      trimString(user.pass_hash),
      trimString(user.role) || 'user'
    )
  )

  await db.batch(batch)
  return validUsers.length
}

export async function exportSystemBackup(db: D1Database) {
  const [reatsResult, satResult, usersResult] = await Promise.all([
    db.prepare('SELECT * FROM reats ORDER BY data_ref DESC, hora ASC').all<any>(),
    db.prepare('SELECT * FROM satisfacao ORDER BY date ASC, name ASC').all<any>(),
    db.prepare('SELECT login, name, role, pass_hash, created_at FROM users ORDER BY created_at ASC').all<any>(),
  ])

  const records: Record<string, ReatRecordInput[]> = {}
  for (const row of reatsResult.results) {
    if (!records[row.data_ref]) records[row.data_ref] = []
    records[row.data_ref].push(row)
  }

  return {
    version: 3,
    exported: new Date().toISOString(),
    records,
    sat: satResult.results,
    users: usersResult.results,
  }
}

export async function importSystemBackup(db: D1Database, backup: SystemBackupPayload) {
  let reats = 0
  let sat = 0

  for (const [dataRef, rows] of Object.entries(backup.records || {})) {
    if (!Array.isArray(rows)) continue
    reats += await replaceReatsForDate(db, dataRef, rows)
  }

  const satByMonth: Record<string, SatRecordInput[]> = {}
  for (const row of backup.sat || []) {
    const month = trimString(row?.date).slice(0, 7)
    if (!month) continue
    if (!satByMonth[month]) satByMonth[month] = []
    satByMonth[month].push(row)
  }

  for (const [month, rows] of Object.entries(satByMonth)) {
    sat += await replaceSatForMonth(db, month, rows)
  }

  const users = await upsertBackupUsers(db, backup.users || [])

  return { reats, sat, users }
}