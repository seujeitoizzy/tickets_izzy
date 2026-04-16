import { useState, useEffect } from 'react'

const CHATWOOT_HOST = 'https://chat.izzy.app.br'
const SESSION_KEY = 'chatwoot.context'

function buildConversationLink(accountId, conversationId) {
  if (!accountId || !conversationId) return null
  return `${CHATWOOT_HOST}/app/accounts/${accountId}/conversations/${conversationId}`
}

function parseContext(payload) {
  // Extrai accountId pela mesma ordem de prioridade do projeto original
  const accountId =
    payload?.currentAccount?.id ||
    payload?.conversation?.account_id ||
    payload?.currentAgent?.account_id ||
    payload?.account?.id ||
    payload?.accountId ||
    null

  const conversationId =
    payload?.conversation?.id ||
    payload?.conversationId ||
    null

  const agentId = payload?.currentAgent?.id || null
  const agentName = payload?.currentAgent?.name || null
  const agentEmail = payload?.currentAgent?.email || null

  const clientName =
    payload?.conversation?.meta?.sender?.name ||
    payload?.contact?.name ||
    null

  return { accountId, conversationId, agentId, agentName, agentEmail, clientName }
}

export function useChatwoot() {
  const [data, setData] = useState(() => {
    // Tenta recuperar do sessionStorage ao inicializar
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        const ctx = JSON.parse(stored)
        return {
          ...ctx,
          chatwootLink: buildConversationLink(ctx.accountId, ctx.conversationId),
          conversationLabel: ctx.conversationId ? `#${ctx.conversationId}` : null,
        }
      }
    } catch {}
    return null
  })

  useEffect(() => {
    function handleMessage(event) {
      const msg = event.data
      if (!msg || msg.type !== 'appContext') return

      const ctx = parseContext(msg.payload || msg.data || msg)

      if (!ctx.accountId && !ctx.conversationId) return

      // Persiste no sessionStorage igual ao projeto original
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        accountId: ctx.accountId,
        conversationId: ctx.conversationId,
        agentId: ctx.agentId,
        agentName: ctx.agentName,
        agentEmail: ctx.agentEmail,
      }))

      setData({
        ...ctx,
        chatwootLink: buildConversationLink(ctx.accountId, ctx.conversationId),
        conversationLabel: ctx.conversationId ? `#${ctx.conversationId}` : null,
      })
    }

    window.addEventListener('message', handleMessage)

    // Sinaliza ao Chatwoot que o app está pronto
    window.parent.postMessage({ type: 'chatwoot:ready' }, '*')

    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return data
}
