export const sessionConfig = {
  cookieName: 'tracker_session',
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
  sameSite: 'Strict' as const,
  hashSalt: 'rt_salt_2026_',
}
