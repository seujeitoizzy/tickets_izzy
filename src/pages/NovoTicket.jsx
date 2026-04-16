import React from 'react'
import { useNavigate } from 'react-router-dom'
import TicketForm from '../components/TicketForm'

export default function NovoTicket({ store, chatwoot }) {
  const navigate = useNavigate()

  function handleCreate(data) {
    store.createTicket(data)
    navigate('/')
  }

  // chatwoot já vem pronto do App — usa direto, sem loading
  return (
    <TicketForm
      key={chatwoot?.conversationId || 'new'}
      categories={store.categories}
      types={store.types}
      chatwootInitial={chatwoot}
      onSubmit={handleCreate}
      onCancel={() => navigate('/')}
    />
  )
}
