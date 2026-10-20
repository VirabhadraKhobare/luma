import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { SignJWT, jwtVerify } from 'jose'
import { config } from './config'

const scrypt = promisify(scryptCallback)
const secret = new TextEncoder().encode(config.sessionSecret)
const refreshDays = 30

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const derived = await scrypt(password, salt, 64) as Buffer
  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, saltText, hashText] = stored.split('$')
  if (algorithm !== 'scrypt' || !saltText || !hashText) return false
  const expected = Buffer.from(hashText, 'base64url')
  const actual = await scrypt(password, Buffer.from(saltText, 'base64url'), expected.length) as Buffer
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function randomToken() { return randomBytes(32).toString('base64url') }
export function tokenHash(token: string) { return createHash('sha256').update(token).digest('hex') }

export async function accessToken(userId: string, role: string) {
  return new SignJWT({ role, typ: 'access' }).setProtectedHeader({ alg: 'HS256' }).setSubject(userId).setIssuedAt().setExpirationTime('15m').sign(secret)
}

export async function verifyAccess(token: string) {
  const result = await jwtVerify(token, secret, { algorithms: ['HS256'] })
  if (result.payload.typ !== 'access' || typeof result.payload.sub !== 'string') throw new Error('Invalid access token')
  return { userId: result.payload.sub, role: String(result.payload.role || 'user') }
}

export function refreshExpiry() { return new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000) }
export function csrfHash(token: string) { return tokenHash(token) }
