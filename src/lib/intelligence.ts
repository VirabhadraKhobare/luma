import type { Message } from '../types'
import { apiUrl } from './api'

export type StreamResult = { conversationId: string; model: string; route: string; sources: Array<{ id: string; title: string; url?: string }> }

function csrfToken() {
  return document.cookie.split('; ').find((item) => item.startsWith('luma_csrf='))?.slice('luma_csrf='.length) || ''
}

export async function streamAssistant(message: string, conversationId: string | undefined, onToken: (token: string) => void, onMeta: (meta: StreamResult) => void) {
  const response = await fetch(apiUrl('/api/chat'), { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken() }, body: JSON.stringify({ message, conversationId }) })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `Intelligence service returned HTTP ${response.status}` })) as { error?: string }
    throw new Error(error.error || 'Intelligence service failed')
  }
  if (!response.body) throw new Error('Intelligence service returned no stream')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const next = await reader.read()
    if (next.done) break
    buffer += decoder.decode(next.value, { stream: true })
    const events = buffer.split('\n\n'); buffer = events.pop() || ''
    for (const event of events) {
      const dataLine = event.split('\n').find((line) => line.startsWith('data: '))
      if (!dataLine) continue
      const data = JSON.parse(dataLine.slice(6)) as Record<string, unknown>
      if (event.startsWith('event: meta')) onMeta(data as unknown as StreamResult)
      if (event.startsWith('event: token')) onToken(String(data.token || ''))
      if (event.startsWith('event: error')) throw new Error(String(data.error || 'Model request failed'))
    }
  }
}

export function messageFromAssistant(content: string, id = `assistant-${Date.now()}`): Message {
  return { id, role: 'assistant', content, time: 'Now' }
}

export type SavedConversation = { id: string; title: string; updated_at: string }

export async function listSavedConversations(): Promise<SavedConversation[]> {
  const response = await fetch(apiUrl('/api/conversations'), { credentials: 'include' })
  if (!response.ok) throw new Error('Unable to load saved conversations')
  const result = await response.json() as { data?: SavedConversation[] }
  return result.data || []
}
