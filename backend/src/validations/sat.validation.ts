import type { SatCategory, SatRecordInput } from '../models/sat.model'
import { validateMonthFilter } from './shared.validation'
import { trimString } from '../utils/input'

const SAT_CATEGORIES: SatCategory[] = ['BOM', 'ATENÇÃO', 'RUIM']

function validateSatCategory(value: unknown) {
  const category = trimString(value)
  if (!SAT_CATEGORIES.includes(category as SatCategory)) {
    throw new Error('Categoria de satisfação inválida')
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
  const cat = validateSatCategory(record?.cat)

  if (!Number.isInteger(ramal) || !name || !date || !Number.isInteger(day) || Number.isNaN(score)) {
    throw new Error('Registro de satisfação inválido')
  }

  if (!date.startsWith(`${month}-`)) {
    throw new Error('Os registros de satisfação devem pertencer ao mês selecionado')
  }

  return { ramal, name, date, day, phone, score, cat }
}

export function validateSatQuery(query: Record<string, string | undefined>) {
  return {
    mes: validateMonthFilter(query.mes),
    name: trimString(query.name),
  }
}

export function validateSatCreatePayload(body: any) {
  const mes = validateMonthFilter(body?.mes)
  const rawRecords = Array.isArray(body?.records) ? (body.records as SatRecordInput[]) : null

  if (!mes || !rawRecords?.length) {
    throw new Error('Mês e registros são obrigatórios')
  }

  return { mes, records: rawRecords.map((record) => validateSatRecord(record, mes)) }
}