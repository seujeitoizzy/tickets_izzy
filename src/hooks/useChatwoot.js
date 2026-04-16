import { useState, useEffect } from 'react'

export function useChatwoot() {
  const [chatwootData, setChatwootData] = useState(null)

  useEffect(() => {
    function handleMessage(event) {
      const data = event.data

      // Chatwoot envia um objeto com type e data
      if (!data || !data.type) return

      if (data.type === 'chatwoot:set-current-user') {
        setChatwootData(prev => ({ ...prev, agent: data.data }))
      }

      if (data.type === 'chatwoot:set-current-conversation') {
        const conv = data.data
        setChatwootData(prev => ({
          ...prev,
          conversationId: `#${conv.id}`,
          chatwootLink: conv.meta?.channel === 'Channel::WebWidget'
            ? `${window.location.origin}/app/accounts/${conv.account_id}/conversations/${conv.id}`
            : null,
          clientName: conv.meta?.sender?.name || '',
          clientEmail: conv.meta?.sender?.email || '',
          rawConversation: conv,
        }))
      }

      if (data.type === 'chatwoot:set-label') {
        setChatwootData(prev => ({ ...prev, labels: data.data }))
      }
    }

    window.addEventListener('message', handleMessage)

    // Notifica o Chatwoot que o app está pronto para receber dados
    window.parent.postMessage({ type: 'chatwoot:ready' }, '*')

    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return chatwootData
}
