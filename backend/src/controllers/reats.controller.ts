import {
  deleteReatsByDate,
  exportSystemBackup,
  getReatsStats,
  importSystemBackup,
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
import { validateDateRef, validateRouteId } from '../validations/shared.validation'
import type { AppContext } from '../models/app.model'
import { getErrorStatus, jsonError, jsonOk, readJsonBody } from '../utils/http'

export async function getReatsController(c: AppContext) {
  try {
    const filters = validateReatsQuery(c.req.query())
    const records = await listReats(c.env.DB, filters)
    return jsonOk(c, { records })
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 400), error, 'Erro ao listar reats')
  }
}

export async function exportBackupController(c: AppContext) {
  try {
    const backup = await exportSystemBackup(c.env.DB)
    return jsonOk(c, backup)
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 500), error, 'Erro ao exportar backup')
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
    const { data_ref, records } = validateReatsCreatePayload(
      await readJsonBody<Record<string, unknown>>(c, 'Dados invalidos'),
    )
    const count = await replaceReatsForDate(c.env.DB, data_ref, records)
    return jsonOk(c, { count })
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 400), error, 'Dados invalidos')
  }
}

export async function updateReatController(c: AppContext) {
  try {
    const id = validateRouteId(c.req.param('id'), 'Reat')
    const { status, analise } = validateReatUpdatePayload(
      await readJsonBody<Record<string, unknown>>(c, 'Dados invalidos'),
    )
    await updateReat(c.env.DB, id, status, analise)
    return jsonOk(c)
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 400), error, 'Dados invalidos')
  }
}

export async function deleteReatsByDateController(c: AppContext) {
  try {
    const dateRef = validateDateRef(c.req.param('data_ref'))
    await deleteReatsByDate(c.env.DB, dateRef)
    return jsonOk(c)
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 400), error, 'Data invalida')
  }
}

export async function getReatsStatsController(c: AppContext) {
  try {
    const { mes } = validateReatsQuery(c.req.query())
    const stats = await getReatsStats(c.env.DB, mes)
    return jsonOk(c, stats)
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 400), error, 'Erro ao consultar stats')
  }
}

export async function importBackupController(c: AppContext) {
  try {
    const { backup } = validateBackupPayload(await readJsonBody<Record<string, unknown>>(c, 'Formato invalido'))
    const summary = await importSystemBackup(c.env.DB, backup)
    return jsonOk(c, summary)
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 400), error, 'Formato invalido')
  }
}