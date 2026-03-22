import type { D1Database } from '@cloudflare/workers-types'
import type { SatCategory, SatRecordInput } from '../models/sat.model'

const ATTENTION_MATCHERS = ['ATENÇÃO', 'ATENÃ‡ÃƒO', 'ATENCAO']

export async function listSatRecords(db: D1Database, filters: { mes: string; name: string }) {
  let sql = 'SELECT * FROM satisfacao WHERE 1=1'
  const params: string[] = []

  if (filters.mes) {
    sql += ' AND date LIKE ?'
    params.push(`${filters.mes}%`)
  }

  if (filters.name) {
    sql += ' AND name = ?'
    params.push(filters.name)
  }

  sql += ' ORDER BY date ASC'

  const result = await db.prepare(sql).bind(...params).all<any>()
  return result.results
}

export async function listSatMonths(db: D1Database) {
  const result = await db.prepare(
    'SELECT DISTINCT substr(date,1,7) as month FROM satisfacao ORDER BY month DESC'
  ).all<any>()

  return result.results.map((row: any) => row.month)
}

export async function replaceSatRecordsForMonth(db: D1Database, month: string, records: SatRecordInput[]) {
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
      record.cat as SatCategory,
    )
  )

  if (batch.length) {
    await db.batch(batch)
  }

  return records.length
}

export async function createSatRecords(db: D1Database, month: string, records: SatRecordInput[]) {
  return replaceSatRecordsForMonth(db, month, records)
}

export async function getSatAggregation(db: D1Database, month: string) {
  const where = month ? 'WHERE date LIKE ?' : ''
  const whereParams = month ? [`${month}%`] : []
  const attentionSql = ATTENTION_MATCHERS.map(() => '?').join(', ')

  const result = await db.prepare(`
    SELECT name, day, substr(date,1,7) as month,
      SUM(CASE WHEN cat='BOM' THEN 1 ELSE 0 END) as bom,
      SUM(CASE WHEN cat IN (${attentionSql}) THEN 1 ELSE 0 END) as atencao,
      SUM(CASE WHEN cat='RUIM' THEN 1 ELSE 0 END) as ruim,
      GROUP_CONCAT(CASE WHEN cat='RUIM' AND phone!='' THEN phone END) as phones_ruim
    FROM satisfacao ${where}
    GROUP BY name, day, month
    ORDER BY name, day
  `).bind(...ATTENTION_MATCHERS, ...whereParams).all<any>()

  return result.results
}

export async function getSatTotals(db: D1Database, month: string) {
  const where = month ? 'WHERE date LIKE ?' : ''
  const whereParams = month ? [`${month}%`] : []
  const attentionSql = ATTENTION_MATCHERS.map(() => '?').join(', ')

  const result = await db.prepare(`
    SELECT name,
      SUM(CASE WHEN cat='BOM' THEN 1 ELSE 0 END) as bom,
      SUM(CASE WHEN cat IN (${attentionSql}) THEN 1 ELSE 0 END) as atencao,
      SUM(CASE WHEN cat='RUIM' THEN 1 ELSE 0 END) as ruim,
      COUNT(*) as total
    FROM satisfacao ${where}
    GROUP BY name
    ORDER BY name
  `).bind(...ATTENTION_MATCHERS, ...whereParams).all<any>()

  return result.results
}