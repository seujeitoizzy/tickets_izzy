import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TicketForm from '../components/TicketForm'
import './PageLoading.css'

export default function NovoTicket({ store, chatwoot }) {
  const navigate = useNavigate()
  const [ready, setReady] = useState(!!chatwoot)

  // Se chatwoot ainda não chegou, aguarda até 1.5s
  useEffect(() => {
    if (chatwoot) { setReady(true); return }
    const t = setTimeout(() => setReady(true), 1500)
    return () => clearTimeout(t)
  }, [chatwoot])

  function handleCreate(data) {
    store.createTicket(data)
    navigate('/')
  }

  if (!ready) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Aguardando dados da conversa...</p>
      </div>
    )
  }

  return (
    <TicketForm
      categories={store.categories}
      types={store.types}
      chatwootInitial={chatwoot}
      onSubmit={handleCreate}
      onCancel={() => navigate('/')}
    />
  )
}
