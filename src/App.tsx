import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Play } from 'lucide-react'
import { ChatComposer } from './components/ChatComposer'
import { Icon } from './components/Icon'
import { Logo } from './components/Logo'
import { MarkdownMessage } from './components/MarkdownMessage'
import { Settings } from './components/Settings'
import { Sidebar } from './components/Sidebar'
import { listSavedConversations, streamAssistant } from './lib/intelligence'
import { apiUrl } from './lib/api'
import type { AuthMode, Conversation, Message, Screen, Theme } from './types'

const initialConversations: Conversation[] = [
  { id: 'c1', title: 'Q3 product strategy', date: '2:42 PM', group: 'Today' },
  { id: 'c2', title: 'Landing page feedback', date: '11:18 AM', group: 'Today' },
  { id: 'c3', title: 'TypeScript patterns', date: 'Yesterday', group: 'Yesterday' },
  { id: 'c4', title: 'Plan a trip to Kyoto', date: 'Monday', group: 'Earlier' },
  { id: 'c5', title: 'Book recommendations', date: 'Sunday', group: 'Earlier' },
]
const initialMessages: Message[] = [
  { id: 'm1', role: 'user', time: '2:41 PM', content: 'Can you help me make sense of our Q3 product metrics and suggest where we should focus next quarter?' },
  { id: 'm2', role: 'assistant', time: '2:42 PM', content: 'Absolutely. I looked across the metrics you shared and found a clear story: activation is healthy, but retention is where the biggest opportunity sits.\n\n### What stands out\n- Week-one retention is down 8% from Q2, concentrated in self-serve accounts.\n- Teams that use the collaboration features retain 2.4× better.\n- The new onboarding flow improved activation by 14%, but fewer users reach the collaboration moment.\n\nI would focus next quarter on getting users to that first collaborative win earlier. Here is a small experiment I would start with:' },
]

function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [authMode, setAuthMode] = useState<AuthMode>('signup')
  const [theme, setTheme] = useState<Theme>('light')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [conversations, setConversations] = useState(initialConversations)
  const [activeId, setActiveId] = useState('c1')
  const [messages, setMessages] = useState(initialMessages)
  const [isThinking, setIsThinking] = useState(false)
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [model, setModel] = useState('Luma Balanced')
  const [intelligenceError, setIntelligenceError] = useState<string | null>(null)

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('auth') !== 'success') return
    void listSavedConversations().then((saved) => {
      setConversations(saved.map((item) => ({ id: item.id, title: item.title, date: new Date(item.updated_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), group: 'Today' as const })))
      setScreen('chat')
      setSidebarOpen(true)
      window.history.replaceState({}, '', window.location.pathname)
    }).catch(() => { window.history.replaceState({}, '', window.location.pathname) })
  }, [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); startNewChat() }
      if (event.key === 'Escape') setShowModelMenu(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  const activeConversation = useMemo(() => conversations.find((item) => item.id === activeId), [activeId, conversations])
  const startNewChat = () => { setActiveId('new'); setMessages([]); setScreen('chat'); setSidebarOpen(false) }
  const sendMessage = (text: string) => {
    setScreen('chat'); setIsThinking(true); setIntelligenceError(null)
    const userMessage = { id: `u-${Date.now()}`, role: 'user' as const, content: text, time: 'Now' }
    const assistantId = `a-${Date.now()}`
    setMessages((current) => [...current, userMessage, { id: assistantId, role: 'assistant', content: '', time: 'Now' }])
    void streamAssistant(text, activeId === 'new' ? undefined : activeId, (token) => {
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: message.content + token } : message))
    }, (meta) => {
      if (meta.conversationId !== activeId) setActiveId(meta.conversationId)
      if (meta.model) setModel(meta.model)
    }).catch((error: unknown) => {
      setMessages((current) => current.filter((message) => message.id !== assistantId))
      setIntelligenceError(error instanceof Error ? error.message : 'The intelligence service failed.')
    }).finally(() => setIsThinking(false))
  }
  const rename = (id: string) => {
    const current = conversations.find((item) => item.id === id)
    const next = window.prompt('Rename conversation', current?.title)
    if (next?.trim()) setConversations((items) => items.map((item) => item.id === id ? { ...item, title: next.trim() } : item))
  }
  const remove = (id: string) => { if (window.confirm('Delete this conversation?')) { setConversations((items) => items.filter((item) => item.id !== id)); if (activeId === id) startNewChat() } }
  if (screen === 'landing') return <Landing onStart={() => { setScreen('auth'); setAuthMode('signup') }} onDemo={() => setScreen('chat')} />
  if (screen === 'auth') return <Auth mode={authMode} onModeChange={setAuthMode} onGoogle={() => { window.location.href = apiUrl('/api/auth/google') }} onSuccess={async (email: string, password: string) => {
    const route = authMode === 'signup' ? '/api/auth/register' : authMode === 'login' ? '/api/auth/login' : null
    if (!route) throw new Error('Password recovery is not connected yet. Configure the account recovery service before enabling this flow.')
    const response = await fetch(apiUrl(route), { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(authMode === 'signup' ? { email, password, displayName: email.split('@')[0] } : { email, password }) })
    if (!response.ok) { const result = await response.json().catch(() => ({})) as { error?: { message?: string } }; throw new Error(result.error?.message || 'Authentication request failed') }
    const saved = await listSavedConversations()
    setConversations(saved.map((item) => ({ id: item.id, title: item.title, date: new Date(item.updated_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), group: 'Today' as const })))
    setScreen('chat'); setSidebarOpen(true)
  }} onBack={() => setScreen('landing')} />
  if (screen === 'settings') return <Settings onBack={() => setScreen('chat')} theme={theme} onThemeChange={setTheme} />
  return (
    <div className="app-shell">
      {sidebarOpen && <Sidebar conversations={conversations} activeId={activeId} onSelect={(id) => { setActiveId(id); setMessages(id === 'c1' ? initialMessages : []); setSidebarOpen(false) }} onNew={startNewChat} onRename={rename} onDelete={remove} onSettings={() => setScreen('settings')} onClose={() => setSidebarOpen(false)} />}
      <main className="chat-shell">
        <header className="chat-header"><button className="icon-button menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}><Icon name={sidebarOpen ? 'panel-close' : 'panel-open'} /></button><button className="model-selector" onClick={() => setShowModelMenu(!showModelMenu)}><span className="model-orb"><Icon name="sparkles" size={14} /></span>{model}<Icon name="chevron-down" size={15} /></button>{showModelMenu && <div className="model-menu">{['Luma Balanced', 'Luma Fast', 'Luma Deep'].map((item) => <button key={item} onClick={() => { setModel(item); setShowModelMenu(false) }}><span className="model-menu-icon"><Icon name={item === 'Luma Fast' ? 'zap' : item === 'Luma Deep' ? 'lightbulb' : 'sparkles'} size={15} /></span><span><strong>{item}</strong><small>{item === 'Luma Fast' ? 'Quick answers, everyday work' : item === 'Luma Deep' ? 'Complex reasoning and analysis' : 'Balanced speed and quality'}</small></span>{model === item && <Icon name="check" size={15} />}</button>)}</div>}<div className="header-actions"><button className="icon-button" onClick={() => window.alert('Share link copied to clipboard.')} aria-label="Share conversation"><Icon name="link" size={17} /></button><button className="icon-button" onClick={() => window.alert('More conversation actions opened.')} aria-label="More actions"><Icon name="more" size={18} /></button></div></header>
        <div className="chat-scroll">
          {intelligenceError && <div className="intelligence-error" role="alert"><Icon name="x" size={15} /><span>{intelligenceError}</span><button onClick={() => setIntelligenceError(null)} aria-label="Dismiss error"><Icon name="x" size={13} /></button></div>}
          {!messages.length ? <EmptyChat onPrompt={sendMessage} /> : <div className="message-thread"><div className="thread-heading"><div><span className="eyebrow">CONVERSATION</span><h1>{activeConversation?.title || 'New conversation'}</h1></div><span className="thread-date">Today, {activeConversation?.date || 'now'}</span></div>{messages.map((message) => <MarkdownMessage key={message.id} message={message} />)}{isThinking && <div className="thinking"><span className="assistant-avatar"><Icon name="sparkles" size={15} /></span><span className="thinking-dots"><i /><i /><i /></span><span>Thinking</span></div>}</div>}
        </div>
        <ChatComposer onSend={sendMessage} disabled={isThinking} />
      </main>
    </div>
  )
}

function Landing({ onStart, onDemo }: { onStart: () => void; onDemo: () => void }) {
  return <div className="landing"><nav className="landing-nav"><Logo /><div className="landing-nav-links"><a href="#product">Product</a><a href="#workspaces">Workspaces</a><a href="#security">Security</a><button onClick={onStart}>Sign in</button><button className="nav-cta" onClick={onStart}>Get started <ArrowRight size={15} /></button></div><button className="mobile-menu" aria-label="Open navigation"><Icon name="menu" /></button></nav><main className="hero" id="product"><div className="hero-copy"><div className="announcement"><span>✦</span> Introducing Luma for teams <Icon name="arrow-right" size={14} /></div><h1>Think clearly.<br /><em>Move forward.</em></h1><p>Luma is the calm, capable AI workspace for turning complex questions into clear decisions and meaningful progress.</p><div className="hero-actions"><button className="primary-button" onClick={onStart}>Start for free <ArrowRight size={17} /></button><button className="demo-button" onClick={onDemo}><span className="play-icon"><Play size={13} fill="currentColor" /></span> See how it works</button></div><div className="social-proof"><div className="avatar-stack"><span>AS</span><span>ML</span><span>KP</span><span>+</span></div><p>Join <strong>12,000+</strong> curious minds<br />building what comes next.</p></div></div><div className="hero-demo"><div className="demo-window"><div className="demo-window-top"><div className="window-dots"><i /><i /><i /></div><span>luma / new conversation</span><button onClick={onDemo}><Icon name="more" size={16} /></button></div><div className="demo-body"><div className="demo-question"><span className="mini-avatar">JD</span><p>What are the key ideas in <strong>Thinking in Systems</strong>?</p></div><div className="demo-answer"><div className="assistant-avatar"><Icon name="sparkles" size={15} /></div><div><p><strong>Thinking in Systems</strong> by Donella Meadows is a guide to seeing the world differently.</p><p>Its central idea is simple: outcomes come from the <mark>structure of a system</mark>, not isolated events.</p><div className="demo-insight"><Icon name="lightbulb" size={15} /><span>Key insight</span><p>Change the relationships, rules, and information flows — not just the parts.</p></div><div className="demo-sources"><span>Sources</span><button onClick={onDemo}>Thinking in Systems <Icon name="arrow-up" size={12} /></button><button onClick={onDemo}>Systems Primer <Icon name="arrow-up" size={12} /></button></div></div></div></div></div><div className="floating-note"><span className="note-icon"><Icon name="check" size={15} /></span><div><strong>Grounded in your sources</strong><span>2 references found</span></div></div><div className="floating-stat"><span>✦</span><strong>98%</strong><small>clarity score</small></div></div></main><section className="landing-bottom" id="workspaces"><span>BUILT FOR THE WAY YOU THINK</span><div><p>Research</p><p>Create</p><p>Decide</p><p>Build</p><p>Learn</p></div></section></div>
}

function Auth({ mode, onModeChange, onGoogle, onSuccess, onBack }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void; onGoogle: () => void; onSuccess: (email: string, password: string) => Promise<void>; onBack: () => void }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const submit = async () => { setError(null); try { await onSuccess(email, password) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Authentication failed') } }
  const title = mode === 'signup' ? 'Start thinking with Luma.' : mode === 'login' ? 'Welcome back.' : 'Find your way back.'
  const subtitle = mode === 'signup' ? 'Your clearest work starts here.' : mode === 'login' ? 'Your workspace is ready when you are.' : 'Enter your email and we will send a reset link.'
  return <div className="auth-screen"><div className="auth-art"><button className="auth-back" onClick={onBack}><Icon name="arrow-left" size={16} /> Back to home</button><div className="auth-art-copy"><Logo /><h1>Ideas become<br /><em>momentum.</em></h1><p>“The best thinking partner I have ever had — and it never gets tired of my questions.”</p><span className="quote-author">Maya Chen · Product lead</span></div><span className="auth-art-foot">© 2024 Luma, Inc.</span></div><main className="auth-form-wrap"><div className="auth-form"><Logo compact /><h2>{title}</h2><p className="auth-subtitle">{subtitle}</p>{error && <div className="intelligence-error" role="alert"><Icon name="x" size={15} />{error}</div>}{mode !== 'recovery' && <button className="social-button" onClick={onGoogle}><span className="google-g">G</span> Continue with Google</button>}{mode !== 'recovery' && <div className="or-divider"><span>or</span></div>}<form onSubmit={(event) => { event.preventDefault(); void submit() }}><label>Email address<input type="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>{mode !== 'recovery' && <label>Password<input type="password" placeholder="At least 12 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} required /></label>}{mode === 'login' && <div className="form-meta"><label className="check-label"><input type="checkbox" /> Remember me</label><button type="button" onClick={() => onModeChange('recovery')}>Forgot password?</button></div>}<button className="primary-button full" type="submit">{mode === 'signup' ? 'Create your account' : mode === 'login' ? 'Sign in' : 'Send reset link'} <ArrowRight size={16} /></button></form>{mode === 'recovery' ? <p className="auth-switch">Remembered it? <button onClick={() => onModeChange('login')}>Back to sign in</button></p> : <p className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to Luma?'} <button onClick={() => onModeChange(mode === 'signup' ? 'login' : 'signup')}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</button></p>}<p className="terms">By continuing, you agree to Luma’s <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p></div></main></div>
}

function EmptyChat({ onPrompt }: { onPrompt: (text: string) => void }) {
  const prompts = [{ icon: 'lightbulb' as const, title: 'Explore an idea', text: 'Help me think through a difficult decision' }, { icon: 'book' as const, title: 'Learn something', text: 'Explain quantum computing simply' }, { icon: 'pen' as const, title: 'Create something', text: 'Draft a thoughtful project brief' }]
  return <div className="empty-chat"><div className="empty-orb"><Icon name="sparkles" size={26} /></div><span className="eyebrow">GOOD TO SEE YOU</span><h1>What’s on your mind?</h1><p>Ask a question, share an idea, or bring a challenge.<br />Luma is here to help you make sense of it.</p><div className="prompt-grid">{prompts.map((prompt) => <button onClick={() => onPrompt(prompt.text)} key={prompt.title}><span><Icon name={prompt.icon} size={17} /></span><strong>{prompt.title}</strong><small>{prompt.text}</small><Icon name="arrow-up" size={14} /></button>)}</div></div>
}

export default App
