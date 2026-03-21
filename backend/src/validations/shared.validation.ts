import { trimString } from '../utils/input'

export function validateMonthFilter(value: unknown) {
  const month = trimString(value)
  if (!month) return ''
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error('Mes invalido. Use o formato YYYY-MM.')
  }
  return month
}
