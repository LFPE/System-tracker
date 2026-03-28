import type { Bindings } from '../config/bindings'
import { getPasswordHashConfig, getSessionConfig } from '../config/env'

const PBKDF2_PREFIX = 'pbkdf2$sha256'
const textEncoder = new TextEncoder()

type ParsedPbkdf2Hash = {
  iterations: number
  saltHex: string
  digestHex: string
}

function legacyHashWithSalt(pass: string, salt: string) {
  let hash = 5381
  const input = salt + pass

  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i)
    hash &= hash
  }

  return `h_${(hash >>> 0).toString(16)}`
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string) {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null

  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16)
  }

  return bytes
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false

  let diff = 0
  for (let i = 0; i < left.length; i += 1) {
    diff |= left[i] ^ right[i]
  }

  return diff === 0
}

function timingSafeEqualText(left: string, right: string) {
  return timingSafeEqual(textEncoder.encode(left), textEncoder.encode(right))
}

async function sha256Hex(input: string) {
  const data = textEncoder.encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return bytesToHex(new Uint8Array(digest))
}

function getHashSalt(env?: Partial<Bindings>) {
  return getSessionConfig(env).hashSalt
}

function parsePbkdf2Hash(storedHash: string): ParsedPbkdf2Hash | null {
  const [scheme, digest, iterationsRaw, saltHex, digestHex] = storedHash.split('$')

  if (scheme !== 'pbkdf2' || digest !== 'sha256') return null

  const iterations = Number(iterationsRaw)
  if (!Number.isInteger(iterations) || iterations <= 0) return null
  if (!hexToBytes(saltHex) || !hexToBytes(digestHex)) return null

  return { iterations, saltHex, digestHex }
}

async function derivePbkdf2Hex(pass: string, saltHex: string, iterations: number, keyLength: number) {
  const salt = hexToBytes(saltHex)
  if (!salt) {
    throw new Error('Invalid PBKDF2 salt')
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(pass),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    keyMaterial,
    keyLength * 8,
  )

  return bytesToHex(new Uint8Array(derivedBits))
}

function generateSaltHex(length: number) {
  const salt = new Uint8Array(length)
  crypto.getRandomValues(salt)
  return bytesToHex(salt)
}

function createLegacySha256Hash(pass: string, env?: Partial<Bindings>) {
  return sha256Hex(`${getHashSalt(env)}${pass}`)
}

export async function hashPassword(pass: string, env?: Partial<Bindings>) {
  const config = getPasswordHashConfig(env)
  const saltHex = generateSaltHex(config.saltBytes)
  const digestHex = await derivePbkdf2Hex(pass, saltHex, config.iterations, config.keyLength)
  return `${PBKDF2_PREFIX}$${config.iterations}$${saltHex}$${digestHex}`
}

export async function hashSessionToken(token: string, env?: Partial<Bindings>) {
  return sha256Hex(`${getHashSalt(env)}session-token:${token}`)
}

export async function verifyPassword(pass: string, storedHash: string, env?: Partial<Bindings>) {
  if (!storedHash) return false

  const parsedPbkdf2 = parsePbkdf2Hash(storedHash)
  if (parsedPbkdf2) {
    const keyLength = parsedPbkdf2.digestHex.length / 2
    const derivedHex = await derivePbkdf2Hex(pass, parsedPbkdf2.saltHex, parsedPbkdf2.iterations, keyLength)
    return timingSafeEqualText(derivedHex, parsedPbkdf2.digestHex)
  }

  if (storedHash.startsWith('sha256$')) {
    const legacySha256 = `sha256$${await createLegacySha256Hash(pass, env)}`
    return timingSafeEqualText(storedHash, legacySha256)
  }

  return timingSafeEqualText(storedHash, legacyHashWithSalt(pass, getHashSalt(env)))
}

export function needsPasswordRehash(storedHash: string, env?: Partial<Bindings>) {
  const parsedPbkdf2 = parsePbkdf2Hash(storedHash)
  if (!parsedPbkdf2) return true

  const config = getPasswordHashConfig(env)
  return parsedPbkdf2.iterations < config.iterations || parsedPbkdf2.digestHex.length !== config.keyLength * 2
}



