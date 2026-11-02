import { useState } from 'react'
import { Icon } from './Icon'
import { Toggle } from './Toggle'
import type { Theme } from '../types'

type Props = { onBack: () => void; theme: Theme; onThemeChange: (theme: Theme) => void }
export function Settings({ onBack, theme, onThemeChange }: Props) {
  const [active, setActive] = useState('General')
  const [memory, setMemory] = useState(true)
  const [privateMode, setPrivateMode] = useState(false)
  const tabs = [{ name: 'General', icon: 'settings' as const }, { name: 'Personalization', icon: 'sliders' as const }, { name: 'Privacy & data', icon: 'globe' as const }, { name: 'Usage', icon: 'bar-chart' as const }]
  return (
    <div className="settings-screen">
      <header className="settings-header"><button className="back-link" onClick={onBack}><Icon name="arrow-left" size={17} /> Back to chat</button><div className="settings-heading"><h1>Settings</h1><p>Make Luma work better for you.</p></div><div /></header>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">{tabs.map((tab) => <button className={active === tab.name ? 'active' : ''} onClick={() => setActive(tab.name)} key={tab.name}><Icon name={tab.icon} size={17} /> {tab.name}</button>)}</nav>
        <main className="settings-main">
          {active === 'General' && <><section className="settings-section"><div className="section-title"><h2>Appearance</h2><p>Choose how Luma looks on your devices.</p></div><div className="setting-card"><div><strong>Theme</strong><span>Choose your preferred color theme.</span></div><div className="theme-choice"><button className={theme === 'light' ? 'selected' : ''} onClick={() => onThemeChange('light')}><span className="theme-preview light-preview" /> Light</button><button className={theme === 'dark' ? 'selected' : ''} onClick={() => onThemeChange('dark')}><span className="theme-preview dark-preview" /> Dark</button></div></div></section><section className="settings-section"><div className="section-title"><h2>Notifications</h2><p>Stay up to date without the noise.</p></div><div className="setting-card"><div><strong>Task completion</strong><span>Notify me when a longer task is finished.</span></div><Toggle checked label="Task completion notifications" onChange={() => {}} /></div><div className="setting-card"><div><strong>Weekly digest</strong><span>A quick look at your Luma activity.</span></div><Toggle checked={false} label="Weekly digest notifications" onChange={() => {}} /></div></section></>}
          {active === 'Personalization' && <><section className="settings-section"><div className="section-title"><h2>Personalization</h2><p>Help Luma adapt to the way you work.</p></div><div className="setting-card"><div><strong>Memory</strong><span>Let Luma remember useful details between conversations.</span></div><Toggle checked={memory} label="Memory" onChange={setMemory} /></div><div className="setting-card"><div><strong>Default model</strong><span>Balanced is best for most everyday tasks.</span></div><button className="select-button">Luma Balanced <Icon name="chevron-down" size={15} /></button></div></section></>}
          {active === 'Privacy & data' && <><section className="settings-section"><div className="section-title"><h2>Privacy & data</h2><p>You are in control of your conversations.</p></div><div className="setting-card"><div><strong>Private mode</strong><span>Do not use conversations to improve Luma.</span></div><Toggle checked={privateMode} label="Private mode" onChange={setPrivateMode} /></div><div className="setting-card danger-card"><div><strong>Export your data</strong><span>Download a copy of your conversations and files.</span></div><button className="outline-button" onClick={() => window.alert('Your export is being prepared.')}>Request export</button></div></section></>}
          {active === 'Usage' && <><section className="settings-section"><div className="section-title"><h2>Usage</h2><p>Keep an eye on your Luma credits.</p></div><div className="usage-large"><div className="usage-large-top"><div><span>Monthly usage</span><strong>2,840 <small>/ 4,000 credits</small></strong></div><div className="usage-icon"><Icon name="zap" size={20} /></div></div><div className="usage-bar large"><span /></div><div className="usage-breakdown"><span>Chat <b>1,920</b></span><span>Files <b>640</b></span><span>Tasks <b>280</b></span></div></div></section></>}
        </main>
      </div>
    </div>
  )
}
