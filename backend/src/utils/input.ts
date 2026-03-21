export function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeLogin(value: unknown) {
  return trimString(value).toLowerCase()
}
