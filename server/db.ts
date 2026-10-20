import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Pool, type PoolClient, type QueryResultRow } from 'pg'
import { config } from './config'

export const pool = config.databaseUrl ? new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: true } : undefined,
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
}) : null

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  if (!pool) throw new Error('DATABASE_URL is required for this operation')
  return pool.query<T>(text, values)
}

export async function withUserTransaction<T>(userId: string, callback: (client: PoolClient) => Promise<T>) {
  if (!pool) throw new Error('DATABASE_URL is required for this operation')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT set_config('app.user_id', $1, true)", [userId])
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

export async function userQuery<T extends QueryResultRow>(userId: string, text: string, values: unknown[] = []) {
  return withUserTransaction(userId, (client) => client.query<T>(text, values))
}

export async function migrate() {
  if (!pool) return
  const files = ['001_initial.sql', '002_rls.sql', '003_google_oidc.sql']
  for (const file of files) await pool.query(await readFile(join(process.cwd(), 'migrations', file), 'utf8'))
}
