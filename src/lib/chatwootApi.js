const CHATWOOT_HOST = 'https://chat.izzy.app.br'
const AUTH_KEY = 'chatwoot.auth'
const SESSION_KEY = 'chatwoot.context'

function getAuth() {
  try {
    // 1. Tenta sessionStorage (salvo pelo hook)
    const stored = sessionStorage.getItem(AUTH_KEY)
    if (stored) return JSON.parse(stored)

    // 2. Tenta ler direto do cookie cw_d_session_info
    const cookieVal = document.cookie
      .split('; ')
      .find(r => r.startsWith('cw_d_session_info='))

    if (cookieVal) {
      const info = JSON.parse(decodeURIComponent(cookieVal.split('=').slice(1).join('=')))
      if (info['access-token']) {
        return {
          'access-token': info['access-token'],
          'client': info['client'],
          'uid': info['uid'],
          'token-type': info['token-type'] || 'Bearer',
        }
      }
    }
  } catch {}
  return null
}

function getAccountId() {
  try {
    const ctx = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}')
    return ctx.accountId
  } catch { return null }
}

export async function fetchChatwootAgents() {
  const accountId = getAccountId()
  if (!accountId) throw new Error('Account ID não encontrado. Abra o app dentro do Chatwoot primeiro.')

  // Tenta token salvo pelo usuário
  const savedToken = localStorage.getItem('chatwoot_user_token')
  if (!savedToken) throw new Error('TOKEN_NEEDED')

  const res = await fetch(`${CHATWOOT_HOST}/api/v1/accounts/${accountId}/agents`, {
    headers: {
      'api_access_token': savedToken,
      'Content-Type': 'application/json',
    }
  })

  if (res.status === 401) {
    localStorage.removeItem('chatwoot_user_token')
    throw new Error('Token inválido ou expirado. Informe novamente.')
  }
  if (!res.ok) throw new Error(`Erro ${res.status} ao buscar agentes.`)

  return await res.json()
}

export function saveToken(token) {
  localStorage.setItem('chatwoot_user_token', token.trim())
}

export function hasToken() {
  return !!localStorage.getItem('chatwoot_user_token')
}
