// ══════════════════════════════════════════════
// TRACKER — Coobrastur — API Routes: REATs
// ══════════════════════════════════════════════
import { Hono } from 'hono'
import { requireAuth } from './middleware'

type Bindings = { DB: D1Database }
type Variables = { user: any }

const reats = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Aplicar auth em todas as rotas
reats.use('*', requireAuth)

// GET /api/reats — listar todos (com filtros opcionais)
reats.get('/', async (c) => {
  const { consultor, status, data_ref, mes, q } = c.req.query()

  let sql = 'SELECT * FROM reats WHERE 1=1'
  const params: any[] = []

  if (consultor) { sql += ' AND consultor = ?'; params.push(consultor) }
  if (status)    { sql += ' AND status = ?';    params.push(status) }
  if (data_ref)  { sql += ' AND data_ref = ?';  params.push(data_ref) }
  if (mes)       { sql += ' AND data_ref LIKE ?'; params.push(mes + '%') }
  if (q) {
    sql += ' AND (consultor LIKE ? OR motivo LIKE ? OR analise LIKE ? OR plano LIKE ? OR texto LIKE ?)'
    const lq = `%${q}%`
    params.push(lq, lq, lq, lq, lq)
  }

  sql += ' ORDER BY data_ref DESC, hora ASC'

  const result = await c.env.DB.prepare(sql).bind(...params).all<any>()
  return c.json({ ok: true, records: result.results })
})

// GET /api/reats/dates — listar datas únicas
reats.get('/dates', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT DISTINCT data_ref FROM reats ORDER BY data_ref DESC'
  ).all<any>()
  return c.json({ ok: true, dates: result.results.map((r: any) => r.data_ref) })
})

// GET /api/reats/consultores — listar consultores únicos
reats.get('/consultores', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT DISTINCT consultor FROM reats ORDER BY consultor ASC'
  ).all<any>()
  return c.json({ ok: true, consultores: result.results.map((r: any) => r.consultor) })
})

// POST /api/reats — salvar lote de registros de um dia
reats.post('/', async (c) => {
  const { data_ref, records } = await c.req.json()
  if (!data_ref || !Array.isArray(records)) {
    return c.json({ error: 'Dados inválidos' }, 400)
  }

  // Deletar registros existentes do mesmo dia antes de inserir
  await c.env.DB.prepare('DELETE FROM reats WHERE data_ref = ?').bind(data_ref).run()

  // Inserir em batch
  const stmt = c.env.DB.prepare(`
    INSERT INTO reats (data_ref, tipo, data, hora, consultor, status, revertido, motivo, plano_em_dia, plano, analise, texto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const batch = records.map((r: any) =>
    stmt.bind(
      data_ref,
      r.tipo || '',
      r.data || '',
      r.hora || '',
      r.consultor || '-',
      r.status || 'Em Tratativa',
      r.revertido || '-',
      r.motivo || '-',
      r.plano_em_dia || '-',
      r.plano || '-',
      r.analise || '',
      r.texto || ''
    )
  )

  await c.env.DB.batch(batch)

  return c.json({ ok: true, count: records.length })
})

// PUT /api/reats/:id — editar registro
reats.put('/:id', async (c) => {
  const id = c.req.param('id')
  const { status, analise } = await c.req.json()

  await c.env.DB.prepare(
    'UPDATE reats SET status = ?, analise = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(status, analise, id).run()

  return c.json({ ok: true })
})

// DELETE /api/reats/date/:data_ref — remover todos de uma data
reats.delete('/date/:data_ref', async (c) => {
  const data_ref = c.req.param('data_ref')
  await c.env.DB.prepare('DELETE FROM reats WHERE data_ref = ?').bind(data_ref).run()
  return c.json({ ok: true })
})

// GET /api/reats/stats — estatísticas gerais
reats.get('/stats', async (c) => {
  const { mes } = c.req.query()
  let where = mes ? `WHERE data_ref LIKE '${mes}%'` : ''

  const [totals, byConsultor, byDate] = await Promise.all([
    c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status='Revertido' THEN 1 ELSE 0 END) as revertidos,
        SUM(CASE WHEN status='Cancelado' THEN 1 ELSE 0 END) as cancelados,
        SUM(CASE WHEN status='Em Tratativa' THEN 1 ELSE 0 END) as tratativas
      FROM reats ${where}
    `).first<any>(),

    c.env.DB.prepare(`
      SELECT consultor,
        COUNT(*) as total,
        SUM(CASE WHEN status='Revertido' THEN 1 ELSE 0 END) as revertidos,
        SUM(CASE WHEN status='Cancelado' THEN 1 ELSE 0 END) as cancelados,
        SUM(CASE WHEN status='Em Tratativa' THEN 1 ELSE 0 END) as tratativas
      FROM reats ${where}
      GROUP BY consultor
      ORDER BY total DESC
    `).all<any>(),

    c.env.DB.prepare(`
      SELECT data_ref,
        COUNT(*) as total,
        SUM(CASE WHEN status='Revertido' THEN 1 ELSE 0 END) as revertidos
      FROM reats ${where}
      GROUP BY data_ref
      ORDER BY data_ref DESC
    `).all<any>()
  ])

  return c.json({
    ok: true,
    totals,
    byConsultor: byConsultor.results,
    byDate: byDate.results
  })
})

// POST /api/reats/import-backup — importar backup JSON
reats.post('/import-backup', async (c) => {
  const { records } = await c.req.json()
  if (!records || typeof records !== 'object') {
    return c.json({ error: 'Formato inválido' }, 400)
  }

  let count = 0
  for (const [data_ref, recs] of Object.entries(records)) {
    if (!Array.isArray(recs)) continue
    await c.env.DB.prepare('DELETE FROM reats WHERE data_ref = ?').bind(data_ref).run()

    const stmt = c.env.DB.prepare(`
      INSERT INTO reats (data_ref, tipo, data, hora, consultor, status, revertido, motivo, plano_em_dia, plano, analise, texto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const batch = (recs as any[]).map((r: any) =>
      stmt.bind(data_ref, r.tipo||'', r.data||'', r.hora||'', r.consultor||'-',
        r.status||'Em Tratativa', r.revertido||'-', r.motivo||'-',
        r.plano_em_dia||'-', r.plano||'-', r.analise||'', r.texto||'')
    )

    await c.env.DB.batch(batch)
    count += recs.length
  }

  return c.json({ ok: true, count })
})

export { reats }
