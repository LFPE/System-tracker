import {
  deleteReatsByDate,
  getReatsStats,
  importReatsBackup,
  listReatConsultores,
  listReatDates,
  listReats,
  replaceReatsForDate,
  updateReat,
} from '../services/reats.service'
import {
  validateBackupPayload,
  validateReatsCreatePayload,
  validateReatsQuery,
  validateReatUpdatePayload,
} from '../validations/reats.validation'
import type { AppContext } from '../models/app.model'
import { jsonError, jsonOk } from '../utils/http'

export async function getReatsController(c: AppContext) {
  try {
    const filters = validateReatsQuery(c.req.query())
    const records = await listReats(c.env.DB, filters)
    return jsonOk(c, { records })
  } catch (error) {
    return jsonError(c, 400, error, 'Erro ao listar reats')
  }
}

export async function getReatDatesController(c: AppContext) {
  const dates = await listReatDates(c.env.DB)
  return jsonOk(c, { dates })
}

export async function getReatConsultoresController(c: AppContext) {
  const consultores = await listReatConsultores(c.env.DB)
  return jsonOk(c, { consultores })
}

export async function createReatsController(c: AppContext) {
  try {
    const { data_ref, records } = validateReatsCreatePayload(await c.req.json())
    const count = await replaceReatsForDate(c.env.DB, data_ref, records)
    return jsonOk(c, { count })
  } catch (error) {
    return jsonError(c, 400, error, 'Dados invalidos')
  }
}

export async function updateReatController(c: AppContext) {
  const id = c.req.param('id')
  const { status, analise } = validateReatUpdatePayload(await c.req.json())
  await updateReat(c.env.DB, id, status, analise)
  return jsonOk(c)
}

export async function deleteReatsByDateController(c: AppContext) {
  const dateRef = c.req.param('data_ref')
  await deleteReatsByDate(c.env.DB, dateRef)
  return jsonOk(c)
}

export async function getReatsStatsController(c: AppContext) {
  try {
    const { mes } = validateReatsQuery(c.req.query())
    const stats = await getReatsStats(c.env.DB, mes)
    return jsonOk(c, stats)
  } catch (error) {
    return jsonError(c, 400, error, 'Erro ao consultar stats')
  }
}

export async function importBackupController(c: AppContext) {
  try {
    const { records } = validateBackupPayload(await c.req.json())
    const count = await importReatsBackup(c.env.DB, records)
    return jsonOk(c, { count })
  } catch (error) {
    return jsonError(c, 400, error, 'Formato invalido')
  }
}
