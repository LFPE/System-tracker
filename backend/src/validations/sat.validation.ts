import type { SatCategory, SatRecordInput } from '../models/sat.model'
import { trimString } from '../utils/input'
import { AppError } from '../utils/http'
import { validateMonthFilter } from './shared.validation'

const ATTENTION_LABELS = ['ATENÇÃO', 'ATENCAO', 'ATENÃ‡ÃƒO']
const SAT_CATEGORIES: SatCategory[] = ['BOM', 'ATENÇÃO', 'RUIM']

function normalizeSatCategory(value: unknown) {
  const category = trimString(value).toUpperCase()

  if (ATTENTION_LABELS.includes(category)) {
    return 'ATENÇÃO' as SatCategory
  }

  if (!SAT_CATEGORIES.includes(category as SatCategory)) {
    throw new AppError(400, 'Categoria de satisfacao invalida')
  }

  return category as SatCategory
}

function validateSatRecord(record: SatRecordInput, month: string) {
  const ramal = Number(record?.ramal)
  const name = trimString(record?.name)
  const date = trimString(record?.date)
  const day = Number(record?.day)
  const phone = trimString(record?.phone)
  const score = Number(record?.score)
  const cat = normalizeSatCategory(record?.cat)

  if (!Number.isInteger(ramal) || !name || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AppError(400, 'Registro de satisfacao invalido')
  }

  if (!Number.isInteger(day) || day < 1 || day > 31 || !Number.isFinite(score)) {
    throw new AppError(400, 'Registro de satisfacao invalido')
  }

  if (!date.startsWith(`${month}-`)) {
    throw new AppError(400, 'Os registros de satisfacao devem pertencer ao mes selecionado')
  }

  return { ramal, name, date, day, phone, score, cat }
}

export function validateSatQuery(query: Record<string, string | undefined>) {
  return {
    mes: validateMonthFilter(query.mes),
    name: trimString(query.name),
  }
}

export function validateSatCreatePayload(body: Record<string, unknown>) {
  const mes = validateMonthFilter(body?.mes)
  const rawRecords = Array.isArray(body?.records) ? (body.records as SatRecordInput[]) : null

  if (!mes || !rawRecords?.length) {
    throw new AppError(400, 'Mes e registros sao obrigatorios')
  }

  return { mes, records: rawRecords.map((record) => validateSatRecord(record, mes)) }
}