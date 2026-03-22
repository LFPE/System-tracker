import type { ReatBackupPayload, ReatRecordInput, ReatStatus, SystemBackupPayload } from '../models/reats.model'
import { trimString } from '../utils/input'
import { AppError } from '../utils/http'
import { validateDateRef, validateMonthFilter } from './shared.validation'

const REAT_STATUSES: ReatStatus[] = ['Revertido', 'Em Tratativa', 'Cancelado']

function normalizeReatStatus(value: unknown, fallback: ReatStatus = 'Em Tratativa') {
  const status = trimString(value)
  if (!status) return fallback

  if (!REAT_STATUSES.includes(status as ReatStatus)) {
    throw new AppError(400, 'Status invalido')
  }

  return status as ReatStatus
}

function sanitizeReatRecord(record: ReatRecordInput) {
  return {
    tipo: trimString(record?.tipo),
    data: trimString(record?.data),
    hora: trimString(record?.hora),
    consultor: trimString(record?.consultor) || '-',
    status: normalizeReatStatus(record?.status),
    revertido: trimString(record?.revertido) || '-',
    motivo: trimString(record?.motivo) || '-',
    plano_em_dia: trimString(record?.plano_em_dia) || '-',
    plano: trimString(record?.plano) || '-',
    analise: typeof record?.analise === 'string' ? record.analise.trim() : '',
    texto: typeof record?.texto === 'string' ? record.texto : '',
  }
}

function validateStatusFilter(value: unknown) {
  const status = trimString(value)
  if (!status) return ''
  return normalizeReatStatus(status)
}

export function validateReatsQuery(query: Record<string, string | undefined>) {
  return {
    consultor: trimString(query.consultor),
    status: validateStatusFilter(query.status),
    data_ref: query.data_ref ? validateDateRef(query.data_ref) : '',
    mes: validateMonthFilter(query.mes),
    q: trimString(query.q),
  }
}

export function validateReatsCreatePayload(body: Record<string, unknown>) {
  const data_ref = validateDateRef(body?.data_ref)
  const rawRecords = Array.isArray(body?.records) ? (body.records as ReatRecordInput[]) : null

  if (!rawRecords?.length) {
    throw new AppError(400, 'Envie ao menos um registro para importacao')
  }

  return { data_ref, records: rawRecords.map(sanitizeReatRecord) }
}

export function validateReatUpdatePayload(body: Record<string, unknown>) {
  return {
    status: normalizeReatStatus(body?.status, 'Em Tratativa'),
    analise: typeof body?.analise === 'string' ? body.analise.trim() : '',
  }
}

export function validateBackupPayload(body: Record<string, unknown>) {
  const records = body?.records && typeof body.records === 'object' && !Array.isArray(body.records)
    ? body.records
    : body

  if (!records || typeof records !== 'object' || Array.isArray(records)) {
    throw new AppError(400, 'Formato de backup invalido')
  }

  return {
    backup: {
      version: Number(body?.version || 0),
      exported: trimString(body?.exported),
      records: records as ReatBackupPayload,
      sat: Array.isArray(body?.sat) ? body.sat : [],
      users: Array.isArray(body?.users) ? body.users : [],
    } as SystemBackupPayload,
  }
}