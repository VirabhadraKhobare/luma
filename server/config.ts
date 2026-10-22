function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for the configured AI provider`)
  return value
}

export const config = {
  port: Number(process.env.PORT || 8787),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  databaseSsl: process.env.DATABASE_SSL === 'true',
  // sessionSecret: process.env.SESSION_SECRET || 'development-only-session-secret-change-me',
  sessionSecret:process.env.NODE_ENV === 'production'? required('SESSION_SECRET'): process.env.SESSION_SECRET || 'development-only-session-secret-change-me',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
  allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  maxBodyBytes: Number(process.env.MAX_BODY_BYTES || 1048576),
  rateLimitPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE || 30),
  dailyTokenQuota: Number(process.env.DAILY_TOKEN_QUOTA || 100000),
  retentionDays: Number(process.env.RETENTION_DAYS || 90),
  dataDir: process.env.DATA_DIR || '.data',
  provider: process.env.AI_PROVIDER || 'openai-compatible',
  baseUrl: (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
  apiKey: process.env.AI_API_KEY || '',
  chatModel: process.env.AI_CHAT_MODEL || '',
  fastModel: process.env.AI_FAST_MODEL || process.env.AI_CHAT_MODEL || '',
  deepModel: process.env.AI_DEEP_MODEL || process.env.AI_CHAT_MODEL || '',
  embeddingModel: process.env.AI_EMBEDDING_MODEL || '',
  tavilyKey: process.env.TAVILY_API_KEY || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8787/api/auth/google/callback',
  maxContextTokens: Number(process.env.MAX_CONTEXT_TOKENS || 12000),
  requireApiKey() { return required('AI_API_KEY') },
  requireChatModel() { return required('AI_CHAT_MODEL') },
}
