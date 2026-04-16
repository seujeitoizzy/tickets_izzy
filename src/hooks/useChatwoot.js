import { useState, useEffect } from 'react'

const CHATWOOT_HOST = 'https://chat.izzy.app.br'
const SESSION_KEY = 'chatwoot.context'

function buildConversationLink(accountId, conversationId) {
  if (!accountId || !conversationId) return null
  return `${CHATWOOT_HOST}/app/accounts/${accountId}/conversations/${conversationId}`
}

function parseContext(payload) {
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

export function useChatwoot(addLog) {
  const [data, setData] = useState(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        const ctx = JSON.parse(stored)
        addLog?.(`[INIT] Dados recuperados do sessionStorage: ${stored}`)
        return {
          ...ctx,
          chatwootLink: buildConversationLink(ctx.accountId, ctx.conversationId),
          conversationLabel: ctx.conversationId ? `#${ctx.conversationId}` : null,
        }
      } else {
        addLog?.('[INIT] Nenhum dado no sessionStorage')
      }
    } catch (e) {
      addLog?.(`[INIT] Erro ao ler sessionStorage: ${e.message}`)
    }
    return null
  })

  useEffect(() => {
    function handleMessage(event) {
      const msg = event.data
      addLog?.(`[MSG] origin="${event.origin}" type="${msg?.type}" payload=${JSON.stringify(msg).slice(0, 300)}`)

      // Chatwoot usa msg.event, não msg.type
      if (!msg || msg.event !== 'appContext') {
        addLog?.(`[MSG] Ignorado — event esperado: "appContext", recebido: "${msg?.event}"`)
        return
      }

      const payload = msg.data || msg.payload || msg
      addLog?.(`[PARSE] payload=${JSON.stringify(payload).slice(0, 300)}`)

      const ctx = parseContext(payload)
      addLog?.(`[CTX] accountId=${ctx.accountId} conversationId=${ctx.conversationId} clientName=${ctx.clientName} agentName=${ctx.agentName}`)

      if (!ctx.accountId && !ctx.conversationId) {
        addLog?.('[CTX] Nenhum accountId ou conversationId encontrado, ignorando')
        return
      }

      const toStore = {
        accountId: ctx.accountId,
        conversationId: ctx.conversationId,
        agentId: ctx.agentId,
        agentName: ctx.agentName,
        agentEmail: ctx.agentEmail,
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(toStore))
      addLog?.(`[SESSION] Salvo: ${JSON.stringify(toStore)}`)

      setData({
        ...ctx,
        chatwootLink: buildConversationLink(ctx.accountId, ctx.conversationId),
        conversationLabel: ctx.conversationId ? `#${ctx.conversationId}` : null,
      })
    }

    window.addEventListener('message', handleMessage)
    addLog?.('[READY] Listener registrado, enviando chatwoot:ready para parent')
    window.parent.postMessage({ type: 'chatwoot:ready' }, '*')

    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return data
}
