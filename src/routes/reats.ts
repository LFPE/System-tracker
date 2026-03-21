import { Hono } from 'hono'
import { requireAuth } from './middleware'

type Bindings = { DB: D1Database }
type Variables = { user: any }

const reats = new Hono<{ Bindings: Bindings; Variables: Variables }>()

reats.use('*', requireAuth)

reats.get('/', async (c) => {
  const { consultor, status, data_ref, mes, q } = c.req.query()

  let sql = 'SELECT * FROM reats WHERE 1=1'
  const params: any[] = []

  if (consultor) {
    sql += ' AND consultor = ?'
    params.push(consultor)
  }

  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }

  if (data_ref) {
    sql += ' AND data_ref = ?'
    params.push(data_ref)
  }

  const monthFilter = typeof mes === 'string' ? mes.trim() : ''
  if (monthFilter) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthFilter)) {
      return c.json({ error: 'Mes invalido. Use o formato YYYY-MM.' }, 400)
    }

    sql += ' AND data_ref LIKE ?'
    params.push(`${monthFilter}%`)
  }

  if (q) {
    sql += ' AND (consultor LIKE ? OR motivo LIKE ? OR analise LIKE ? OR plano LIKE ? OR texto LIKE ?)'
    const search = `%${q}%`
    params.push(search, search, search, search, search)
  }

  sql += ' ORDER BY data_ref DESC, hora ASC'

  const result = await c.env.DB.prepare(sql).bind(...params).all<any>()
  return c.json({ ok: true, records: result.results })
})

reats.get('/dates', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT DISTINCT data_ref FROM reats ORDER BY data_ref DESC'
  ).all<any>()

  return c.json({ ok: true, dates: result.results.map((row: any) => row.data_ref) })
})

reats.get('/consultores', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT DISTINCT consultor FROM reats ORDER BY consultor ASC'
  ).all<any>()

  return c.json({ ok: true, consultores: result.results.map((row: any) => row.consultor) })
})

reats.post('/', async (c) => {
  const { data_ref, records } = await c.req.json()
  if (!data_ref || !Array.isArray(records)) {
    return c.json({ error: 'Dados invalidos' }, 400)
  }

  await c.env.DB.prepare('DELETE FROM reats WHERE data_ref = ?').bind(data_ref).run()

  const statement = c.env.DB.prepare(`
    INSERT INTO reats (data_ref, tipo, data, hora, consultor, status, revertido, motivo, plano_em_dia, plano, analise, texto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const batch = records.map((record: any) =>
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

  await c.env.DB.batch(batch)
  return c.json({ ok: true, count: records.length })
})

reats.put('/:id', async (c) => {
  const id = c.req.param('id')
  const { status, analise } = await c.req.json()

  await c.env.DB.prepare(
    'UPDATE reats SET status = ?, analise = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(status, analise, id).run()

  return c.json({ ok: true })
})

reats.delete('/date/:data_ref', async (c) => {
  const dateRef = c.req.param('data_ref')
  await c.env.DB.prepare('DELETE FROM reats WHERE data_ref = ?').bind(dateRef).run()
  return c.json({ ok: true })
})

reats.get('/stats', async (c) => {
  const { mes } = c.req.query()
  const monthFilter = typeof mes === 'string' ? mes.trim() : ''
  const hasMonthFilter = monthFilter.length > 0

  if (hasMonthFilter && !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthFilter)) {
    return c.json({ error: 'Mes invalido. Use o formato YYYY-MM.' }, 400)
  }

  const where = hasMonthFilter ? 'WHERE data_ref LIKE ?' : ''
  const whereParams = hasMonthFilter ? [`${monthFilter}%`] : []

  const [totals, byConsultor, byDate] = await Promise.all([
    c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status='Revertido' THEN 1 ELSE 0 END) as revertidos,
        SUM(CASE WHEN status='Cancelado' THEN 1 ELSE 0 END) as cancelados,
        SUM(CASE WHEN status='Em Tratativa' THEN 1 ELSE 0 END) as tratativas
      FROM reats ${where}
    `).bind(...whereParams).first<any>(),

    c.env.DB.prepare(`
      SELECT consultor,
        COUNT(*) as total,
        SUM(CASE WHEN status='Revertido' THEN 1 ELSE 0 END) as revertidos,
        SUM(CASE WHEN status='Cancelado' THEN 1 ELSE 0 END) as cancelados,
        SUM(CASE WHEN status='Em Tratativa' THEN 1 ELSE 0 END) as tratativas
      FROM reats ${where}
      GROUP BY consultor
      ORDER BY total DESC
    `).bind(...whereParams).all<any>(),

    c.env.DB.prepare(`
      SELECT data_ref,
        COUNT(*) as total,
        SUM(CASE WHEN status='Revertido' THEN 1 ELSE 0 END) as revertidos
      FROM reats ${where}
      GROUP BY data_ref
      ORDER BY data_ref DESC
    `).bind(...whereParams).all<any>(),
  ])

  return c.json({
    ok: true,
    totals,
    byConsultor: byConsultor.results,
    byDate: byDate.results,
  })
})

reats.post('/import-backup', async (c) => {
  const { records } = await c.req.json()
  if (!records || typeof records !== 'object') {
    return c.json({ error: 'Formato invalido' }, 400)
  }

  let count = 0
  for (const [dataRef, rows] of Object.entries(records)) {
    if (!Array.isArray(rows)) {
      continue
    }

    await c.env.DB.prepare('DELETE FROM reats WHERE data_ref = ?').bind(dataRef).run()

    const statement = c.env.DB.prepare(`
      INSERT INTO reats (data_ref, tipo, data, hora, consultor, status, revertido, motivo, plano_em_dia, plano, analise, texto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const batch = rows.map((record: any) =>
      statement.bind(
        dataRef,
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

    await c.env.DB.batch(batch)
    count += rows.length
  }

  return c.json({ ok: true, count })
})

export { reats }
