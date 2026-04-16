import { useState, useEffect } from 'react'

const CHATWOOT_HOST = 'https://chat.izzy.app.br'
const SESSION_KEY = 'chatwoot.context'

function buildConversationLink(accountId, conversationId) {
  if (!accountId || !conversationId) return null
  return `${CHATWOOT_HOST}/app/accounts/${accountId}/conversations/${conversationId}`
}

function parseContext(data) {
  const conv = data?.conversation || {}
  const agent = data?.currentAgent || data?.current_agent || {}
  const account = data?.currentAccount || data?.current_account || data?.account || {}

  const accountId =
    account?.id ||
    conv?.account_id ||
    agent?.account_id ||
    data?.accountId ||
    null

  const conversationId = conv?.id || data?.conversationId || null

  const clientName = conv?.meta?.sender?.name || data?.contact?.name || null
  const clientPhone = conv?.meta?.sender?.phone_number || null

  const agentId = agent?.id || null
  const agentName = agent?.name || null
  const agentEmail = agent?.email || null

  return { accountId, conversationId, clientName, clientPhone, agentId, agentName, agentEmail }
}

export function useChatwoot(addLog) {
  const [data, setData] = useState(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        const ctx = JSON.parse(stored)
        addLog?.(`[INIT] sessionStorage: ${stored}`)
        return {
          ...ctx,
          chatwootLink: buildConversationLink(ctx.accountId, ctx.conversationId),
          conversationLabel: ctx.conversationId ? `#${ctx.conversationId}` : null,
        }
      } else {
        addLog?.('[INIT] Nenhum dado no sessionStorage')
      }
    } catch (e) {
      addLog?.(`[INIT] Erro: ${e.message}`)
    }
    return null
  })

  useEffect(() => {
    function handleMessage(event) {
      // Tenta parsear se vier como string
      let msg = event.data
      if (typeof msg === 'string') {
        try { msg = JSON.parse(msg) } catch { return }
      }

      addLog?.(`[MSG] origin="${event.origin}" event="${msg?.event}" type="${msg?.type}" keys=${Object.keys(msg || {}).join(',')}`)

      // Chatwoot envia { event: "appContext", data: {...} }
      const isAppContext = msg?.event === 'appContext' || msg?.type === 'appContext'
      if (!isAppContext) {
        addLog?.(`[SKIP] Não é appContext`)
        return
      }

      const payload = msg.data || msg.payload || msg
      addLog?.(`[PAYLOAD] ${JSON.stringify(payload).slice(0, 400)}`)

      const ctx = parseContext(payload)
      addLog?.(`[CTX] accountId=${ctx.accountId} convId=${ctx.conversationId} client="${ctx.clientName}" agent="${ctx.agentName}"`)

      const toStore = {
        accountId: ctx.accountId,
        conversationId: ctx.conversationId,
        agentId: ctx.agentId,
        agentName: ctx.agentName,
        agentEmail: ctx.agentEmail,
        clientName: ctx.clientName,
        clientPhone: ctx.clientPhone,
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(toStore))
      addLog?.(`[SAVED] ${JSON.stringify(toStore)}`)

      setData({
        ...ctx,
        chatwootLink: buildConversationLink(ctx.accountId, ctx.conversationId),
        conversationLabel: ctx.conversationId ? `#${ctx.conversationId}` : null,
      })
    }

    window.addEventListener('message', handleMessage)
    addLog?.('[READY] Listener ativo, enviando chatwoot:ready')
    try { window.parent.postMessage({ type: 'chatwoot:ready' }, '*') } catch {}

    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return data
}
