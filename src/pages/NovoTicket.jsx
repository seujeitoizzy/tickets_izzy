import React from 'react'
import { useNavigate } from 'react-router-dom'
import TicketForm from '../components/TicketForm'
import { useStore } from '../store/useStore'
import { useChatwoot } from '../hooks/useChatwoot'
import Icon from '../components/Icon'
import './PageLoading.css'

export default function NovoTicket() {
  const navigate = useNavigate()
  const store = useStore()
  const { data: chatwoot, ready } = useChatwoot(null, { ignoreSession: true })

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
