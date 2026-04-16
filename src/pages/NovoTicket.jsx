import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import TicketForm from '../components/TicketForm'
import './PageLoading.css'

export default function NovoTicket({ store, chatwoot }) {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const prevConvId = useRef(null)

  useEffect(() => {
    if (chatwoot?.conversationId) {
      // Se mudou de conversa, força re-render do formulário com dados novos
      if (prevConvId.current && prevConvId.current !== chatwoot.conversationId) {
        setFormKey(k => k + 1)
      }
      prevConvId.current = chatwoot.conversationId
      setReady(true)
    } else {
      // Sem dados ainda, aguarda 1.5s e abre mesmo assim
      const t = setTimeout(() => setReady(true), 1500)
      return () => clearTimeout(t)
    }
  }, [chatwoot?.conversationId])

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
      key={formKey}
      categories={store.categories}
      types={store.types}
      chatwootInitial={chatwoot}
      onSubmit={handleCreate}
      onCancel={() => navigate('/')}
    />
  )
}
