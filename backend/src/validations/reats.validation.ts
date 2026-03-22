import type { ReatBackupPayload, ReatRecordInput, ReatStatus, SystemBackupPayload } from '../models/reats.model'
import { validateMonthFilter } from './shared.validation'
import { trimString } from '../utils/input'

const REAT_STATUSES: ReatStatus[] = ['Revertido', 'Em Tratativa', 'Cancelado']

function validateDateRef(value: unknown) {
  const dateRef = trimString(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRef)) {
    throw new Error('Data de referência inválida. Use o formato YYYY-MM-DD.')
  }
  return dateRef
}

function normalizeReatStatus(value: unknown, fallback: ReatStatus = 'Em Tratativa') {
  const status = trimString(value)
  if (!status) return fallback
  if (!REAT_STATUSES.includes(status as ReatStatus)) {
    throw new Error('Status inválido')
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
  const data_ref = validateDateRef(body?.data_ref)
  const rawRecords = Array.isArray(body?.records) ? (body.records as ReatRecordInput[]) : null

  if (!rawRecords?.length) {
    throw new Error('Dados invalidos')
  }

  return { data_ref, records: rawRecords.map(sanitizeReatRecord) }
}

export function validateReatUpdatePayload(body: any) {
  return {
    status: normalizeReatStatus(body?.status, 'Em Tratativa'),
    analise: typeof body?.analise === 'string' ? body.analise.trim() : '',
  }
}

export function validateBackupPayload(body: any) {
  const records = body?.records && typeof body.records === 'object' && !Array.isArray(body.records)
    ? body.records
    : body

  if (!records || typeof records !== 'object' || Array.isArray(records)) {
    throw new Error('Formato invalido')
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