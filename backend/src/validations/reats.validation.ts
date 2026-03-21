import type { ReatBackupPayload, ReatRecordInput } from '../models/reats.model'
import { validateMonthFilter } from './shared.validation'
import { trimString } from '../utils/input'

export function validateReatsQuery(query: Record<string, string | undefined>) {
  return {
    consultor: trimString(query.consultor),
    status: trimString(query.status),
    data_ref: trimString(query.data_ref),
    mes: validateMonthFilter(query.mes),
    q: trimString(query.q),
  }
}

export function validateReatsCreatePayload(body: any) {
  const data_ref = trimString(body?.data_ref)
  const records = Array.isArray(body?.records) ? (body.records as ReatRecordInput[]) : null

  if (!data_ref || !records) {
    throw new Error('Dados invalidos')
  }

  return { data_ref, records }
}

export function validateReatUpdatePayload(body: any) {
  return {
    status: trimString(body?.status),
    analise: typeof body?.analise === 'string' ? body.analise : '',
  }
}

export function validateBackupPayload(body: any) {
  const records = body?.records
  if (!records || typeof records !== 'object' || Array.isArray(records)) {
    throw new Error('Formato invalido')
  }
  return { records: records as ReatBackupPayload }
}

