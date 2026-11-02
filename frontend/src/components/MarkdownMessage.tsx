import { useState } from 'react'
import { Icon } from './Icon'
import type { Message } from '../types'

export function MarkdownMessage({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard?.writeText(message.content)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }
  if (message.role === 'user') return <div className="user-bubble">{message.content}</div>
  return (
    <div className="assistant-message">
      <div className="assistant-avatar"><Icon name="sparkles" size={16} /></div>
      <div className="assistant-copy">
        <div className="message-content">
          {message.content.split('\n').map((line, index) => {
            if (line.startsWith('```')) return null
            if (line.startsWith('###')) return <h3 key={index}>{line.replace(/^###\s*/, '')}</h3>
            if (line.startsWith('- ')) return <div className="bullet-line" key={index}><span>•</span>{line.slice(2)}</div>
            if (!line.trim()) return <div className="message-gap" key={index} />
            return <p key={index}>{line}</p>
          })}
          {message.id === 'm2' && (
            <div className="code-block">
              <div className="code-head"><span>dashboard.tsx</span><button onClick={copy}>{copied ? <><Icon name="check" size={13} /> Copied</> : <><Icon name="copy" size={13} /> Copy</>}</button></div>
              <code><span className="code-purple">const</span> <span className="code-blue">insights</span> = <span className="code-purple">await</span> <span className="code-yellow">analyze</span>({'{'}<br />{'  '}data: <span className="code-blue">quarterlyData</span>,<br />{'  '}focus: <span className="code-green">'retention'</span><br />{'}'})</code>
            </div>
          )}
          {message.id === 'm2' && (
            <div className="citation-row"><button><span className="citation-number">1</span> Q3 Product Metrics <Icon name="arrow-up" size={12} /></button><button><span className="citation-number">2</span> Retention Playbook <Icon name="arrow-up" size={12} /></button></div>
          )}
        </div>
        <div className="message-footer"><span>{message.time}</span><button onClick={copy} aria-label="Copy response"><Icon name="copy" size={14} /></button><button aria-label="Helpful response"><Icon name="check-circle" size={14} /></button><button aria-label="More response options"><Icon name="more" size={15} /></button></div>
      </div>
    </div>
  )
}
