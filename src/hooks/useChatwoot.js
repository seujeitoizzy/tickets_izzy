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

function buildResult(ctx) {
  return {
    ...ctx,
    chatwootLink: buildConversationLink(ctx.accountId, ctx.conversationId),
    conversationLabel: ctx.conversationId ? `#${ctx.conversationId}` : null,
  }
}

function loadSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

function saveSession(ctx) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      accountId: ctx.accountId,
      conversationId: ctx.conversationId,
      agentId: ctx.agentId,
      agentName: ctx.agentName,
      agentEmail: ctx.agentEmail,
      clientName: ctx.clientName,
      clientPhone: ctx.clientPhone,
    }))
  } catch {}
}

export function useChatwoot(addLog) {
  // Inicia com sessionStorage mas sempre sobrescreve com postMessage
  const [data, setData] = useState(() => {
    const session = loadSession()
    if (session) {
      addLog?.(`[INIT] sessionStorage: convId=${session.conversationId} client="${session.clientName}"`)
      return buildResult(session)
    }
    addLog?.('[INIT] Sem dados no sessionStorage')
    return null
  })

  useEffect(() => {
    function handleMessage(event) {
      let msg = event.data
      if (typeof msg === 'string') {
        try { msg = JSON.parse(msg) } catch { return }
      }

      const isAppContext = msg?.event === 'appContext' || msg?.type === 'appContext'
      if (!isAppContext) return

      const payload = msg.data || msg.payload || msg
      const ctx = parseContext(payload)

      addLog?.(`[MSG] Nova conversa: convId=${ctx.conversationId} client="${ctx.clientName}"`)

      if (!ctx.conversationId && !ctx.clientName) return

      // Sempre sobrescreve — garante que mudança de conversa atualiza tudo
      saveSession(ctx)
      setData(buildResult(ctx))
    }

    window.addEventListener('message', handleMessage)
    try { window.parent.postMessage({ type: 'chatwoot:ready' }, '*') } catch {}

    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return data
}
