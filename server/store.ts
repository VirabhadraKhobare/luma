import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { StoredConversation, StoredDocument } from './types'

type Database = { conversations: StoredConversation[]; documents: StoredDocument[] }

export class Store {
  private readonly path: string
  private data: Database = { conversations: [], documents: [] }
  private loaded = false

  constructor(dataDir: string) { this.path = join(dataDir, 'assistant.json') }

  async load() {
    if (this.loaded) return
    await mkdir(join(this.path, '..'), { recursive: true })
    try {
      this.data = JSON.parse(await readFile(this.path, 'utf8')) as Database
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      await this.persist()
    }
    this.loaded = true
  }

  private async persist() { await writeFile(this.path, JSON.stringify(this.data, null, 2), 'utf8') }
  async getConversation(id: string) { await this.load(); return this.data.conversations.find((item) => item.id === id) }
  async saveConversation(conversation: StoredConversation) {
    await this.load()
    const index = this.data.conversations.findIndex((item) => item.id === conversation.id)
    if (index === -1) this.data.conversations.push(conversation)
    else this.data.conversations[index] = conversation
    await this.persist()
    return conversation
  }
  async listDocuments() { await this.load(); return this.data.documents }
  async saveDocument(document: StoredDocument) { await this.load(); this.data.documents.push(document); await this.persist(); return document }
}
