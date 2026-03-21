import type { SatRecordInput } from '../models/sat.model'
import { validateMonthFilter } from './shared.validation'
import { trimString } from '../utils/input'

export function validateSatQuery(query: Record<string, string | undefined>) {
  return {
    mes: validateMonthFilter(query.mes),
    name: trimString(query.name),
  }
}

export function validateSatCreatePayload(body: any) {
  const records = Array.isArray(body?.records) ? (body.records as SatRecordInput[]) : null
  if (!records) {
    throw new Error('Dados invalidos')
  }
  return { records }
}

