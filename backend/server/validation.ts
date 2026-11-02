import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(1).max(80),
})
export const loginSchema = z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(128) })
export const chatSchema = z.object({ message: z.string().trim().min(1).max(20000), conversationId: z.string().uuid().optional() })
export const documentSchema = z.object({ name: z.string().trim().min(1).max(255), text: z.string().trim().min(1).max(10_000_000), mimeType: z.string().max(100).default('text/plain') })

export function parseBody<T>(schema: z.ZodSchema<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new Error(`Invalid request: ${result.error.issues.map((issue) => `${issue.path.join('.') || 'body'} ${issue.message}`).join('; ')}`)
  return result.data
}
