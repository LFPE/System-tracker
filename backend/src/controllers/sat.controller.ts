import {
  createSatRecords,
  getSatAggregation,
  getSatTotals,
  listSatMonths,
  listSatRecords,
} from '../services/sat.service'
import { validateSatCreatePayload, validateSatQuery } from '../validations/sat.validation'
import type { AppContext } from '../models/app.model'
import { getErrorStatus, jsonError, jsonOk, readJsonBody } from '../utils/http'

export async function getSatRecordsController(c: AppContext) {
  try {
    const filters = validateSatQuery(c.req.query())
    const records = await listSatRecords(c.env.DB, filters)
    return jsonOk(c, { records })
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 400), error, 'Erro ao listar satisfacao')
  }
}

export async function getSatMonthsController(c: AppContext) {
  const months = await listSatMonths(c.env.DB)
  return jsonOk(c, { months })
}

export async function createSatController(c: AppContext) {
  try {
    const { mes, records } = validateSatCreatePayload(
      await readJsonBody<Record<string, unknown>>(c, 'Dados invalidos'),
    )
    const count = await createSatRecords(c.env.DB, mes, records)
    return jsonOk(c, { count })
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 400), error, 'Dados invalidos')
  }
}

export async function getSatAggregationController(c: AppContext) {
  try {
    const { mes } = validateSatQuery(c.req.query())
    const records = await getSatAggregation(c.env.DB, mes)
    return jsonOk(c, { records })
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 400), error, 'Erro ao consultar agregados')
  }
}

export async function getSatTotalsController(c: AppContext) {
  try {
    const { mes } = validateSatQuery(c.req.query())
    const totals = await getSatTotals(c.env.DB, mes)
    return jsonOk(c, { totals })
  } catch (error) {
    return jsonError(c, getErrorStatus(error, 400), error, 'Erro ao consultar totais')
  }
}