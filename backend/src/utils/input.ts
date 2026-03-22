import { AppError } from './http'

export function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeLogin(value: unknown) {
  return trimString(value).toLowerCase()
}

export function parsePositiveInt(value: unknown, label = 'Id') {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, `${label} invalido`)
  }
  return parsed
}