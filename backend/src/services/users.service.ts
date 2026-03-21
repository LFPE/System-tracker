import type { D1Database } from '@cloudflare/workers-types'
import type { UserCreateInput } from '../models/user.model'
import { hashPass } from '../utils/hash'

export async function listUsers(db: D1Database) {
  const result = await db.prepare(
    'SELECT id, login, name, role, created_at FROM users ORDER BY created_at ASC'
  ).all<any>()

  return result.results
}

export async function createUser(db: D1Database, input: UserCreateInput) {
  const exists = await db.prepare('SELECT id FROM users WHERE login = ?').bind(input.login).first()
  if (exists) {
    throw new Error('Login já existe')
  }

  await db.prepare(
    'INSERT INTO users (login, name, pass_hash, role) VALUES (?, ?, ?, ?)'
  ).bind(input.login, input.name, hashPass(input.pass), input.role || 'user').run()
}

export async function deleteUserById(db: D1Database, id: string) {
  const user = await db.prepare('SELECT login FROM users WHERE id = ?').bind(id).first<any>()
  if (user?.login === 'admin') {
    throw new Error('Não é possível remover o admin')
  }

  await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
}

export async function updateOwnPassword(db: D1Database, userId: number, pass: string) {
  await db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').bind(hashPass(pass), userId).run()
}
