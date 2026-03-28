import type { Role } from './auth.model'

export type SessionUserRow = {
  id: number
  login: string
  name: string
  role: Role
  session_expires_at: number
}
