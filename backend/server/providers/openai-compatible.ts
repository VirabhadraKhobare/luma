import type { Provider, ProviderRequest } from '../types'

type ChatCompletion = { choices?: Array<{ message?: { content?: string } }> }

export class OpenAICompatibleProvider implements Provider {
  readonly name = 'openai-compatible'
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  private headers() { return { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' } }

  async complete(request: ProviderRequest) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST', headers: this.headers(), signal: request.signal,
      body: JSON.stringify({ model: request.model, messages: request.messages, temperature: request.temperature, max_tokens: request.maxTokens }),
    })
    if (!response.ok) throw new Error(`Model provider returned HTTP ${response.status}`)
    const payload = await response.json() as ChatCompletion
    const content = payload.choices?.[0]?.message?.content
    if (!content) throw new Error('Model provider returned no assistant content')
    return content
  }

  async *stream(request: ProviderRequest) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST', headers: this.headers(), signal: request.signal,
      body: JSON.stringify({ model: request.model, messages: request.messages, temperature: request.temperature, max_tokens: request.maxTokens, stream: true }),
    })
    if (!response.ok) throw new Error(`Model provider returned HTTP ${response.status}`)
    if (!response.body) throw new Error('Model provider did not return a stream')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const result = await reader.read()
      if (result.done) break
      buffer += decoder.decode(result.value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') return
        const json = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> }
        const token = json.choices?.[0]?.delta?.content
        if (token) yield token
      }
    }
  }

  async embed(texts: string[], signal: AbortSignal) {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST', headers: this.headers(), signal,
      body: JSON.stringify({ model: process.env.AI_EMBEDDING_MODEL, input: texts }),
    })
    if (!response.ok) throw new Error(`Embedding provider returned HTTP ${response.status}`)
    const payload = await response.json() as { data?: Array<{ embedding: number[] }> }
    return (payload.data || []).map((item) => item.embedding)
  }
}
