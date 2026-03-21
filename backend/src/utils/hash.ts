import { sessionConfig } from '../config/env'

export function hashPass(pass: string): string {
  let hash = 5381
  const input = sessionConfig.hashSalt + pass

  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i)
    hash &= hash
  }

  return 'h_' + (hash >>> 0).toString(16)
}
