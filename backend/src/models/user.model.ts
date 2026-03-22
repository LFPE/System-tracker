import type { Role } from './auth.model'

export type UserCreateInput = {
  login: string
  name: string
  pass: string
  role?: Role
}