import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Debug global — captura postMessages antes de qualquer componente
window.__allMessages = []
window.addEventListener('message', (event) => {
  window.__allMessages.push(event)
  console.log(
    `%c[GLOBAL PostMessage] origin="${event.origin}"`,
    'background: #1e293b; color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-weight: bold',
    '\ndata:', event.data
  )
})

// Avisa o parent que está pronto
try {
  window.parent.postMessage({ type: 'chatwoot:ready' }, '*')
  console.log('%c[GLOBAL] chatwoot:ready enviado para parent', 'color: #4ade80')
} catch(e) {
  console.log('%c[GLOBAL] Não está em iframe', 'color: #64748b')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
