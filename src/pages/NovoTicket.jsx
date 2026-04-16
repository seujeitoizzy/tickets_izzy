import React from 'react'
import { useNavigate } from 'react-router-dom'
import TicketForm from '../components/TicketForm'
import { useStore } from '../store/useStore'
import { useChatwoot } from '../hooks/useChatwoot'

export default function NovoTicket() {
  const navigate = useNavigate()
  const store = useStore()
  const chatwoot = useChatwoot()

  function handleCreate(data) {
    store.createTicket(data)
    navigate('/')
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
