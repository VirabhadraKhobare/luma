export type Screen = 'landing' | 'auth' | 'chat' | 'settings'
export type AuthMode = 'login' | 'signup' | 'recovery'
export type Theme = 'light' | 'dark'

export type Conversation = {
  id: string
  title: string
  date: string
  group: 'Today' | 'Yesterday' | 'Earlier'
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
  sources?: string[]
}
