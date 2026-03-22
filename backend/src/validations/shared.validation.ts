import type { Role } from '../models/auth.model'
import { parsePositiveInt, trimString } from '../utils/input'
import { AppError } from '../utils/http'

const VALID_ROLES: Role[] = ['admin', 'user']

export function validateMonthFilter(value: unknown) {
  const month = trimString(value)
  if (!month) return ''

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new AppError(400, 'Mes invalido. Use o formato YYYY-MM.')
  }

  return month
}

export function validateDateRef(value: unknown) {
  const dateRef = trimString(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRef)) {
    throw new AppError(400, 'Data de referencia invalida. Use o formato YYYY-MM-DD.')
  }
  return dateRef
}

export function validateRole(value: unknown, fallback: Role = 'user') {
  const role = trimString(value)
  if (!role) return fallback

  if (!VALID_ROLES.includes(role as Role)) {
    throw new AppError(400, 'Perfil invalido')
  }

  return role as Role
}

export function validateRouteId(value: unknown, label = 'Id') {
  return parsePositiveInt(value, label)
}