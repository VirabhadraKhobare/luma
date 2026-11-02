import assert from 'node:assert/strict'
import test from 'node:test'
import { hashPassword, verifyPassword } from '../server/security'
import { parseBody, registerSchema } from '../server/validation'

test('password hashing is salted and verifies without exposing the password', async () => {
  const first = await hashPassword('a sufficiently long password')
  const second = await hashPassword('a sufficiently long password')
  assert.notEqual(first, second)
  assert.equal(await verifyPassword('a sufficiently long password', first), true)
  assert.equal(await verifyPassword('wrong password', first), false)
  assert.doesNotMatch(first, /sufficiently/)
})

test('registration validation rejects weak and malformed input', () => {
  assert.throws(() => parseBody(registerSchema, { email: 'bad', password: 'short', displayName: '' }), /Invalid request/)
  const valid = parseBody(registerSchema, { email: 'user@example.com', password: 'a sufficiently long password', displayName: 'User' })
  assert.equal(valid.email, 'user@example.com')
})
