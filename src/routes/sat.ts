import { Hono } from 'hono'
import { requireAuth } from './middleware'

type Bindings = { DB: D1Database }
type Variables = { user: any }

const sat = new Hono<{ Bindings: Bindings; Variables: Variables }>()

sat.use('*', requireAuth)

sat.get('/', async (c) => {
  const { mes, name } = c.req.query()
  let sql = 'SELECT * FROM satisfacao WHERE 1=1'
  const params: any[] = []

  const monthFilter = typeof mes === 'string' ? mes.trim() : ''
  if (monthFilter) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthFilter)) {
      return c.json({ error: 'Mes invalido. Use o formato YYYY-MM.' }, 400)
    }

    sql += ' AND date LIKE ?'
    params.push(`${monthFilter}%`)
  }

  if (name) {
    sql += ' AND name = ?'
    params.push(name)
  }

  sql += ' ORDER BY date ASC'

  const result = await c.env.DB.prepare(sql).bind(...params).all<any>()
  return c.json({ ok: true, records: result.results })
})

sat.get('/months', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT DISTINCT substr(date,1,7) as month FROM satisfacao ORDER BY month DESC'
  ).all<any>()

  return c.json({ ok: true, months: result.results.map((row: any) => row.month) })
})

sat.post('/', async (c) => {
  const { records } = await c.req.json()
  if (!Array.isArray(records)) {
    return c.json({ error: 'Dados invalidos' }, 400)
  }

  const statement = c.env.DB.prepare(`
    INSERT INTO satisfacao (ramal, name, date, day, phone, score, cat)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const batch = records.map((record: any) =>
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

  await c.env.DB.batch(batch)
  return c.json({ ok: true, count: records.length })
})

sat.get('/agg', async (c) => {
  const { mes } = c.req.query()
  const monthFilter = typeof mes === 'string' ? mes.trim() : ''
  const hasMonthFilter = monthFilter.length > 0

  if (hasMonthFilter && !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthFilter)) {
    return c.json({ error: 'Mes invalido. Use o formato YYYY-MM.' }, 400)
  }

  const where = hasMonthFilter ? 'WHERE date LIKE ?' : ''
  const whereParams = hasMonthFilter ? [`${monthFilter}%`] : []

  const result = await c.env.DB.prepare(`
    SELECT name, day, substr(date,1,7) as month,
      SUM(CASE WHEN cat='BOM' THEN 1 ELSE 0 END) as bom,
      SUM(CASE WHEN cat='ATENÇÃO' THEN 1 ELSE 0 END) as atencao,
      SUM(CASE WHEN cat='RUIM' THEN 1 ELSE 0 END) as ruim,
      GROUP_CONCAT(CASE WHEN cat='RUIM' AND phone!='' THEN phone END) as phones_ruim
    FROM satisfacao ${where}
    GROUP BY name, day, month
    ORDER BY name, day
  `).bind(...whereParams).all<any>()

  return c.json({ ok: true, records: result.results })
})

sat.get('/totals', async (c) => {
  const { mes } = c.req.query()
  const monthFilter = typeof mes === 'string' ? mes.trim() : ''
  const hasMonthFilter = monthFilter.length > 0

  if (hasMonthFilter && !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthFilter)) {
    return c.json({ error: 'Mes invalido. Use o formato YYYY-MM.' }, 400)
  }

  const where = hasMonthFilter ? 'WHERE date LIKE ?' : ''
  const whereParams = hasMonthFilter ? [`${monthFilter}%`] : []

  const result = await c.env.DB.prepare(`
    SELECT name,
      SUM(CASE WHEN cat='BOM' THEN 1 ELSE 0 END) as bom,
      SUM(CASE WHEN cat='ATENÇÃO' THEN 1 ELSE 0 END) as atencao,
      SUM(CASE WHEN cat='RUIM' THEN 1 ELSE 0 END) as ruim,
      COUNT(*) as total
    FROM satisfacao ${where}
    GROUP BY name
    ORDER BY name
  `).bind(...whereParams).all<any>()

  return c.json({ ok: true, totals: result.results })
})

export { sat }
