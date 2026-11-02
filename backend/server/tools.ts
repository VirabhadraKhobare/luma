import { createHash } from 'node:crypto'
import type { SourceReference } from './types'

export type ToolResult = { output: string; sources?: SourceReference[]; verified: boolean }

export function calculate(expression: string): ToolResult {
  const clean = expression.replace(/[^0-9+\-*/().%\s]/g, '').trim()
  if (!clean || clean !== expression.trim()) throw new Error('Calculator accepts arithmetic expressions only')
  if (clean.length > 120) throw new Error('Expression exceeds the calculator limit')
  const value = Function(`"use strict"; return (${clean})`)()
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Expression did not produce a finite number')
  return { output: String(value), verified: true }
}

export async function searchWeb(query: string, apiKey: string, signal: AbortSignal): Promise<ToolResult> {
  if (!apiKey) throw new Error('Web search is not configured. Set TAVILY_API_KEY on the server.')
  const response = await fetch('https://api.tavily.com/search', { method: 'POST', signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ api_key: apiKey, query, search_depth: 'advanced', max_results: 5, include_answer: false }) })
  if (!response.ok) throw new Error(`Search provider returned HTTP ${response.status}`)
  const payload = await response.json() as { results?: Array<{ title: string; url: string; content: string }> }
  const results = payload.results || []
  return { verified: true, output: results.map((item, index) => `[${index + 1}] ${item.title}\n${item.content}\nURL: ${item.url}`).join('\n\n'), sources: results.map((item, index) => ({ id: `web-${index}`, title: item.title, url: item.url, quote: item.content.slice(0, 280), source: 'web' })) }
}

export function chunkDocument(text: string, size = 1200, overlap = 180) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  const chunks: string[] = []
  for (let start = 0; start < normalized.length; start += size - overlap) chunks.push(normalized.slice(start, start + size))
  return chunks.filter(Boolean)
}

export function documentId(name: string, text: string) { return createHash('sha256').update(`${name}:${text}`).digest('hex').slice(0, 16) }

export function findRelevantChunks(query: string, documents: Array<{ id: string; name: string; chunks: string[] }>) {
  const terms = query.toLowerCase().split(/\W+/).filter((term) => term.length > 2)
  return documents.flatMap((document) => document.chunks.map((chunk, index) => ({ document, chunk, index, score: terms.reduce((score, term) => score + (chunk.toLowerCase().includes(term) ? 1 : 0), 0) }))).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 6)
}
