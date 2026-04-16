import React from 'react'
import { useNavigate } from 'react-router-dom'
import TicketForm from '../components/TicketForm'
import { useChatwoot } from '../hooks/useChatwoot'
import './PageLoading.css'

export default function NovoTicket({ store }) {
  const navigate = useNavigate()
  const { data: chatwoot } = useChatwoot()

  function handleCreate(data) {
    store.createTicket(data)
    navigate('/')
  }

  if (store.loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <TicketForm
      categories={store.categories}
      types={store.types}
      agents={store.agents}
      chatwootInitial={chatwoot}
      onSubmit={handleCreate}
      onCancel={() => navigate('/')}
    />
  )
}
