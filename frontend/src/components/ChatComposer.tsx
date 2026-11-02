import { useRef, useState } from 'react'
import { Icon } from './Icon'

type Props = { onSend: (text: string) => void; disabled?: boolean }

export function ChatComposer({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const [recording, setRecording] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const submit = () => { if (value.trim() && !disabled) { onSend(value.trim()); setValue('') } }
  return (
    <div className="composer-wrap">
      <div className="composer">
        <textarea value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() } }} placeholder="Ask Luma anything..." rows={1} aria-label="Message Luma" />
        <div className="composer-tools">
          <div className="composer-left">
            <input ref={fileRef} type="file" hidden onChange={() => window.alert('File attached. Processing will be available when the API is connected.')} />
            <button onClick={() => fileRef.current?.click()} aria-label="Attach file"><Icon name="paperclip" size={18} /></button>
            <button onClick={() => window.alert('Image input selected.')} aria-label="Add image"><Icon name="image" size={18} /></button>
            <span className="tool-divider" />
            <button onClick={() => window.alert('Tools menu opened.')} aria-label="Open tools"><Icon name="sliders" size={17} /> <span>Tools</span><Icon name="chevron-down" size={13} /></button>
          </div>
          <div className="composer-right">
            <button className={recording ? 'recording' : ''} onClick={() => setRecording(!recording)} aria-label={recording ? 'Stop voice recording' : 'Start voice recording'}><Icon name="mic" size={18} /></button>
            <button className="send-button" disabled={!value.trim() || disabled} onClick={submit} aria-label="Send message"><Icon name="arrow-up" size={18} /></button>
          </div>
        </div>
      </div>
      <p className="composer-note">Luma can make mistakes. Check important info.</p>
    </div>
  )
}
