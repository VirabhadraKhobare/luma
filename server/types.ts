export type Role = 'system' | 'user' | 'assistant' | 'tool'

export type ChatMessage = {
  role: Role
  content: string
  name?: string
}

export type SourceReference = {
  id: string
  title: string
  url?: string
  quote?: string
  source: 'web' | 'document'
}

export type ModelTask = 'chat' | 'fast' | 'deep' | 'vision' | 'embedding'

export type ModelSelection = {
  provider: string
  model: string
  task: ModelTask
  maxTokens: number
  temperature: number
  reason: string
}

export type ProviderRequest = {
  messages: ChatMessage[]
  model: string
  temperature: number
  maxTokens: number
  signal: AbortSignal
}

export type Provider = {
  readonly name: string
  complete(request: ProviderRequest): Promise<string>
  stream(request: ProviderRequest): AsyncIterable<string>
  embed?(texts: string[], signal: AbortSignal): Promise<number[][]>
}

export type StoredConversation = {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export type StoredDocument = {
  id: string
  name: string
  text: string
  chunks: string[]
  createdAt: string
}
