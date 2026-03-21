export type Role = 'admin' | 'user'

export type AuthUser = {
  id: number
  login: string
  name: string
  role: Role | string
}

export type AppVariables = {
  user: AuthUser
}
