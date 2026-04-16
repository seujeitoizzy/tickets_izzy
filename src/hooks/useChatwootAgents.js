import { useState, useEffect } from 'react'
import { fetchChatwootAgents } from '../lib/chatwootApi'

// Busca agentes do Chatwoot e mantém em memória durante a sessão
let cachedAgents = null

export function useChatwootAgents() {
  const [agents, setAgents] = useState(cachedAgents || [])
  const [loading, setLoading] = useState(!cachedAgents)
  const [error, setError] = useState(null)
  const [needToken, setNeedToken] = useState(false)

  useEffect(() => {
    if (cachedAgents) return // já tem cache, não busca de novo

    async function load() {
      setLoading(true)
      try {
        const data = await fetchChatwootAgents()
        cachedAgents = data.map(a => ({
          id: a.id,
          name: a.name,
          email: a.email || '',
          avatarColor: stringToColor(a.name),
        }))
        setAgents(cachedAgents)
      } catch (e) {
        if (e.message === 'TOKEN_NEEDED') setNeedToken(true)
        else setError(e.message)
      }
      setLoading(false)
    }

    load()
  }, [])

  function refresh() {
    cachedAgents = null
    setAgents([])
    setLoading(true)
    setError(null)
    setNeedToken(false)
    fetchChatwootAgents()
      .then(data => {
        cachedAgents = data.map(a => ({
          id: a.id,
          name: a.name,
          email: a.email || '',
          avatarColor: stringToColor(a.name),
        }))
        setAgents(cachedAgents)
        setLoading(false)
      })
      .catch(e => {
        if (e.message === 'TOKEN_NEEDED') setNeedToken(true)
        else setError(e.message)
        setLoading(false)
      })
  }

  return { agents, loading, error, needToken, refresh }
}

function stringToColor(str) {
  const colors = ['#6366f1','#3b82f6','#22c55e','#f59e0b','#ef4444','#a855f7','#14b8a6','#f97316','#ec4899','#64748b']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
