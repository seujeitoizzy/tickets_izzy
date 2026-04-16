import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import './FecharTicket.css'
import './PageLoading.css'

export default function FecharTicket({ store, chatwoot }) {
  const navigate = useNavigate()
  const [resolved, setResolved] = useState(false)
  const [note, setNote] = useState('')
  const [ready, setReady] = useState(!!chatwoot)

  useEffect(() => {
    if (chatwoot) { setReady(true); return }
    const t = setTimeout(() => setReady(true), 1500)
    return () => clearTimeout(t)
  }, [chatwoot])

  const tickets = ready ? store.tickets.filter(t => {
    const ticketConvId = String(t.chatwootConversationId || '').replace('#', '').trim()
    const activeConvId = String(chatwoot?.conversationId || '').replace('#', '').trim()
    const matchConv = activeConvId && ticketConvId && ticketConvId === activeConvId
    const matchName = chatwoot?.clientName &&
      t.clientName?.trim().toLowerCase() === chatwoot.clientName.trim().toLowerCase()
    return t.status !== 'closed' && (matchConv || matchName)
  }) : []

  function resolveTicket(ticket) {
    store.updateTicket(ticket.id, { status: 'closed' })
    store.addAction(ticket.id, {
      actionType: 'resolution',
      content: note.trim() || 'Ticket encerrado via Chatwoot',
      author: chatwoot?.agentName || 'Agente',
    })
    setResolved(true)
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
    <div className="page-wrap">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <Icon name="back" size={14} /> Voltar
        </button>
        <h2>Fechar Ticket</h2>
      </div>

      {chatwoot?.clientName && (
        <div className="client-info-bar">
          <Icon name="user" size={13} />
          <span>{chatwoot.clientName}</span>
          {chatwoot.conversationLabel && <span className="conv-id">{chatwoot.conversationLabel}</span>}
        </div>
      )}

      {resolved ? (
        <div className="success-box">
          <Icon name="checkCircle" size={32} style={{ color: '#4ade80' }} />
          <p>Ticket encerrado com sucesso!</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Ver todos os tickets</button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-box">
          <Icon name="inbox" size={32} style={{ color: '#334155' }} />
          <p>Nenhum ticket aberto encontrado para esta conversa.</p>
          <button className="btn-secondary" onClick={() => navigate('/novo')}>
            <Icon name="plus" size={13} /> Criar novo ticket
          </button>
        </div>
      ) : (
        <div className="ticket-close-list">
          {tickets.map(ticket => (
            <div key={ticket.id} className="ticket-close-card">
              <div className="tcc-title">{ticket.title}</div>
              {ticket.description && <p className="tcc-desc">{ticket.description.slice(0, 100)}…</p>}
              <div className="tcc-note">
                <label>Observação de encerramento (opcional)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ex: Problema resolvido, cliente orientado..."
                  rows={2}
                />
              </div>
              <button className="btn-resolve" onClick={() => resolveTicket(ticket)}>
                <Icon name="checkCircle" size={14} /> Encerrar ticket
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
