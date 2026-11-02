import { useMemo, useState } from 'react'
import { Conversation } from '../types'
import { Icon } from './Icon'
import { Logo } from './Logo'

type Props = {
  conversations: Conversation[]
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
  onSettings: () => void
  onClose?: () => void
}

export function Sidebar({ conversations, activeId, onSelect, onNew, onRename, onDelete, onSettings, onClose }: Props) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => conversations.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())), [conversations, query])
  const groups = ['Today', 'Yesterday', 'Earlier'] as const

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <Logo />
        <button className="icon-button sidebar-close" aria-label="Close sidebar" onClick={onClose}><Icon name="x" /></button>
      </div>
      <button className="new-chat-button" onClick={onNew}><Icon name="plus" size={17} /> New conversation <span className="shortcut">⌘ K</span></button>
      <label className="search-field">
        <Icon name="search" size={16} />
        <input placeholder="Search conversations" value={query} onChange={(event) => setQuery(event.target.value)} />
        {query && <button className="field-clear" onClick={() => setQuery('')} aria-label="Clear search"><Icon name="x" size={14} /></button>}
      </label>
      <div className="conversation-list" aria-label="Conversation history">
        {groups.map((group) => {
          const items = filtered.filter((item) => item.group === group)
          if (!items.length) return null
          return (
            <div className="conversation-group" key={group}>
              <div className="group-label">{group}</div>
              {items.map((item) => (
                <div className={`conversation-item ${activeId === item.id ? 'active' : ''}`} key={item.id}>
                  <button className="conversation-main" onClick={() => onSelect(item.id)}>
                    <Icon name="message" size={16} />
                    <span>{item.title}</span>
                  </button>
                  <div className="conversation-actions">
                    <button aria-label={`Rename ${item.title}`} onClick={() => onRename(item.id)}><Icon name="edit" size={14} /></button>
                    <button aria-label={`Delete ${item.title}`} onClick={() => onDelete(item.id)}><Icon name="trash" size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
        {!filtered.length && <div className="empty-search"><Icon name="search" size={22} /><span>No conversations found</span></div>}
      </div>
      <div className="sidebar-bottom">
        <div className="usage-card">
          <div className="usage-title"><span className="usage-dot" /> Personal plan <span>70%</span></div>
          <div className="usage-bar"><span /></div>
          <p>2,840 of 4,000 credits used</p>
          <button onClick={() => window.alert('Plan upgrades will be available soon.')}>Manage plan <Icon name="arrow-right" size={14} /></button>
        </div>
        <button className="sidebar-link" onClick={onSettings}><Icon name="settings" size={17} /> Settings</button>
        <button className="sidebar-link" onClick={() => window.alert('Help center opened in a new tab.') }><Icon name="help" size={17} /> Help center <span className="external-arrow">↗</span></button>
        <div className="profile-row"><div className="avatar">JD</div><div><strong>Jordan Davis</strong><span>jordan@acme.co</span></div><button className="icon-button"><Icon name="more" size={17} /></button></div>
      </div>
    </aside>
  )
}
