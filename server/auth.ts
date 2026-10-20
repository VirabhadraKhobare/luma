import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { query } from './db'
import { accessToken, csrfHash, hashPassword, randomToken, refreshExpiry, tokenHash, verifyAccess, verifyPassword } from './security'
import { config } from './config'

type User = { id: string; email: string; display_name: string; role: 'user' | 'admin'; status: string }
type GoogleProfile = { sub: string; email: string; name?: string; email_verified?: boolean }
type AuthContext = { userId: string; role: 'user' | 'admin'; sessionId: string; csrf: string }

function cookies(request: IncomingMessage) {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const index = part.indexOf('=')
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())]
  }))
}
function cookie(name: string, value: string, maxAge: number, httpOnly: boolean) {
  const flags = [`${name}=${encodeURIComponent(value)}`, 'Path=/', `Max-Age=${maxAge}`, `SameSite=${config.cookieSameSite}`]
  if (config.cookieSecure) flags.push('Secure')
  if (httpOnly) flags.push('HttpOnly')
  return flags.join('; ')
}
function setAuthCookies(response: ServerResponse, refresh: string, csrf: string, access: string) {
  response.setHeader('Set-Cookie', [cookie('luma_access', access, 900, true), cookie('luma_refresh', refresh, 30 * 86400, true), cookie('luma_csrf', csrf, 30 * 86400, false)])
}
function clearAuthCookies(response: ServerResponse) {
  response.setHeader('Set-Cookie', [cookie('luma_access', '', 0, true), cookie('luma_refresh', '', 0, true), cookie('luma_csrf', '', 0, false)])
}

export async function register(email: string, password: string, displayName: string, response: ServerResponse) {
  const passwordHash = await hashPassword(password)
  let result
  try {
    result = await query<User>('INSERT INTO users(email, password_hash, display_name) VALUES(lower($1), $2, $3) RETURNING id, email, display_name, role, status', [email, passwordHash, displayName])
  } catch (error) {
    if ((error as { code?: string }).code === '23505') throw new Error('An account with that email already exists')
    throw error
  }
  await establishSession(result.rows[0], response)
  return publicUser(result.rows[0])
}
export async function login(email: string, password: string, response: ServerResponse) {
  const result = await query<User & { password_hash: string }>('SELECT id, email, display_name, role, status, password_hash FROM users WHERE lower(email)=lower($1)', [email])
  const user = result.rows[0]
  if (!user || !(await verifyPassword(password, user.password_hash)) || user.status !== 'active') throw new Error('Invalid email or password')
  await establishSession(user, response)
  return publicUser(user)
}
export function googleAuthorizationUrl(state: string) {
  if (!config.googleClientId || !config.googleClientSecret) throw new Error('Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server.')
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: config.googleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}
export async function googleLogin(code: string, response: ServerResponse) {
  if (!config.googleClientId || !config.googleClientSecret) throw new Error('Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server.')
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: config.googleRedirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenResponse.ok) throw new Error('Google authorization code exchange failed')
  const token = await tokenResponse.json() as { access_token?: string }
  if (!token.access_token) throw new Error('Google did not return an access token')
  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${token.access_token}` } })
  if (!profileResponse.ok) throw new Error('Google profile lookup failed')
  const profile = await profileResponse.json() as GoogleProfile
  if (!profile.sub || !profile.email || profile.email_verified !== true) throw new Error('Google did not provide a verified email address')
  const existing = await query<User>('SELECT id, email, display_name, role, status FROM users WHERE google_subject=$1 OR lower(email)=lower($2) LIMIT 1', [profile.sub, profile.email])
  let user = existing.rows[0]
  if (user) {
    const result = await query<User>('UPDATE users SET google_subject=$1, email=lower($2), display_name=$3, updated_at=now() WHERE id=$4 RETURNING id, email, display_name, role, status', [profile.sub, profile.email, profile.name || user.display_name, user.id])
    user = result.rows[0]
  } else {
    const result = await query<User>('INSERT INTO users(email, password_hash, google_subject, display_name) VALUES(lower($1), NULL, $2, $3) RETURNING id, email, display_name, role, status', [profile.email, profile.sub, profile.name || profile.email.split('@')[0]])
    user = result.rows[0]
  }
  if (user.status !== 'active') throw new Error('This account is not active')
  await establishSession(user, response)
  return publicUser(user)
}
async function establishSession(user: User, response: ServerResponse) {
  const refresh = randomToken()
  const csrf = randomToken()
  await query('INSERT INTO sessions(user_id, refresh_token_hash, csrf_token_hash, expires_at) VALUES($1, $2, $3, $4)', [user.id, tokenHash(refresh), csrfHash(csrf), refreshExpiry()])
  setAuthCookies(response, refresh, csrf, await accessToken(user.id, user.role))
}
export async function refresh(request: IncomingMessage, response: ServerResponse) {
  const refreshToken = cookies(request).luma_refresh
  if (!refreshToken) throw new Error('Refresh session is missing')
  const result = await query<User & { session_id: string }>('SELECT u.id, u.email, u.display_name, u.role, u.status, s.id session_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.refresh_token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at > now()', [tokenHash(refreshToken)])
  const user = result.rows[0]
  if (!user || user.status !== 'active') throw new Error('Refresh session is invalid or expired')
  await query('UPDATE sessions SET revoked_at=now() WHERE id=$1', [user.session_id])
  await establishSession(user, response)
  return publicUser(user)
}
export async function logout(request: IncomingMessage, response: ServerResponse) {
  const refreshToken = cookies(request).luma_refresh
  if (refreshToken) await query('UPDATE sessions SET revoked_at=now() WHERE refresh_token_hash=$1', [tokenHash(refreshToken)])
  clearAuthCookies(response)
}
export async function authenticate(request: IncomingMessage): Promise<AuthContext> {
  const token = cookies(request).luma_access
  if (!token) throw new Error('Authentication required')
  const access = await verifyAccess(token)
  const csrf = cookies(request).luma_csrf || ''
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
    const header = request.headers['x-csrf-token']
    if (!csrf || header !== csrf) throw new Error('CSRF validation failed')
  }
  const session = await query<{ id: string }>('SELECT id FROM sessions WHERE user_id=$1 AND revoked_at IS NULL AND expires_at > now() ORDER BY created_at DESC LIMIT 1', [access.userId])
  if (!session.rows[0]) throw new Error('Session is invalid or expired')
  return { userId: access.userId, role: access.role as 'user' | 'admin', sessionId: session.rows[0].id, csrf }
}
export function requireRole(context: AuthContext, role: 'admin') { if (context.role !== role) throw new Error(`Role ${role} is required`) }
export function publicUser(user: User) { return { id: user.id, email: user.email, displayName: user.display_name, role: user.role } }
export function requestId() { return randomUUID() }
