import React, { useState } from 'react'
import './DebugPanel.css'

export default function DebugPanel({ logs }) {
  const [open, setOpen] = useState(true)

  return (
    <div className={`debug-panel ${open ? 'open' : 'closed'}`}>
      <div className="debug-header" onClick={() => setOpen(v => !v)}>
        <span>🔍 Debug Chatwoot</span>
        <span className="debug-count">{logs.length} eventos</span>
        <span className="debug-toggle">{open ? '▼' : '▲'}</span>
      </div>
      {open && (
        <div className="debug-body">
          {logs.length === 0 && (
            <p className="debug-empty">Aguardando mensagens do Chatwoot...</p>
          )}
          {[...logs].reverse().map((log, i) => (
            <div key={i} className="debug-line">
              <span className="debug-time">{log.time}</span>
              <span className="debug-msg">{log.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
