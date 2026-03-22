import type { Bindings } from '../config/bindings'
import { getSessionConfig } from '../config/env'

function legacyHashWithSalt(pass: string, salt: string) {
  let hash = 5381
  const input = salt + pass

  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i)
    hash &= hash
  }

  return `h_${(hash >>> 0).toString(16)}`
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function getHashSalt(env?: Partial<Bindings>) {
  return getSessionConfig(env).hashSalt
}

export async function hashPass(pass: string, env?: Partial<Bindings>) {
  return `sha256$${await sha256Hex(`${getHashSalt(env)}${pass}`)}`
}

export async function signSessionValue(value: string, env?: Partial<Bindings>) {
  return `sig$${await sha256Hex(`${getHashSalt(env)}session:${value}`)}`
}

export async function verifyPass(pass: string, storedHash: string, env?: Partial<Bindings>) {
  if (!storedHash) return false

  if (storedHash.startsWith('sha256$')) {
    return storedHash === await hashPass(pass, env)
  }

  return storedHash === legacyHashWithSalt(pass, getHashSalt(env))
}

export function needsPasswordRehash(storedHash: string) {
  return !storedHash.startsWith('sha256$')
}