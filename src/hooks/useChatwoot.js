import { useState, useEffect, useRef } from 'react'

const CHATWOOT_HOST = 'https://chat.izzy.app.br'
const SESSION_KEY = 'chatwoot.context'
const AUTH_KEY = 'chatwoot.auth'
const FALLBACK_TIMEOUT_MS = 1500

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

export function useChatwoot(addLog, { ignoreSession = false } = {}) {
  const [data, setData] = useState(null)
  const [ready, setReady] = useState(false)
  const receivedPostMessage = useRef(false)

  useEffect(() => {
    function handleMessage(event) {
      let msg = event.data
      if (typeof msg === 'string') {
        try { msg = JSON.parse(msg) } catch { return }
      }

      // DEBUG COMPLETO — loga tudo que chega do parent
      if (event.origin && event.origin !== window.location.origin) {
        console.group(`%c[PostMessage Debug] origin: ${event.origin}`, 'color: #6366f1; font-weight: bold')
        console.log('event:', msg?.event || msg?.type || '(sem event)')
        console.log('keys:', Object.keys(msg || {}).join(', '))
        console.log('payload completo:', msg)
        console.groupEnd()
      }

      addLog?.(`[MSG] origin="${event.origin}" event="${msg?.event}" keys=${Object.keys(msg || {}).join(',')}`)

      const isAppContext = msg?.event === 'appContext' || msg?.type === 'appContext'
      if (!isAppContext) return

      const payload = msg.data || msg.payload || msg
      const ctx = parseContext(payload)
      addLog?.(`[CTX] accountId=${ctx.accountId} convId=${ctx.conversationId} client="${ctx.clientName}"`)

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

      // Tenta extrair auth headers do cookie cw_d_session_info
      try {
        const cookieVal = document.cookie.split('; ').find(r => r.startsWith('cw_d_session_info='))
        if (cookieVal) {
          const info = JSON.parse(decodeURIComponent(cookieVal.split('=').slice(1).join('=')))
          if (info['access-token']) {
            sessionStorage.setItem(AUTH_KEY, JSON.stringify({
              'access-token': info['access-token'],
              'client': info['client'],
              'uid': info['uid'],
              'token-type': info['token-type'] || 'Bearer',
            }))
          }
        }
      } catch {}

      addLog?.(`[SAVED] ${JSON.stringify(toStore)}`)

      receivedPostMessage.current = true
      setData(buildResult(ctx))
      setReady(true)
    }

    window.addEventListener('message', handleMessage)
    addLog?.('[READY] Listener ativo, enviando chatwoot:ready')
    try { window.parent.postMessage({ type: 'chatwoot:ready' }, '*') } catch {}

    // Fallback: se não receber postMessage em tempo hábil, usa sessionStorage
    const timer = setTimeout(() => {
      if (!receivedPostMessage.current) {
        const session = loadSession()
        if (session) {
          addLog?.(`[FALLBACK] postMessage não chegou, usando sessionStorage: ${JSON.stringify(session)}`)
          setData(buildResult(session))
        } else {
          addLog?.('[FALLBACK] Sem postMessage e sem sessionStorage')
        }
        setReady(true)
      }
    }, FALLBACK_TIMEOUT_MS)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearTimeout(timer)
    }
  }, [])

  // Para rota / (sem ignoreSession), retorna sessionStorage imediatamente sem loading
  if (!ignoreSession) {
    const session = loadSession()
    const staticData = data || (session ? buildResult(session) : null)
    return { data: staticData, ready: true }
  }

  return { data, ready }
}
