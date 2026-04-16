import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useChatwoot } from '../hooks/useChatwoot'
import { PRIORITIES, STATUSES } from '../data/defaults'
import Icon from '../components/Icon'
import TicketDetail from '../components/TicketDetail'
import './VerificarTicket.css'
import './PageLoading.css'

function fmt(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function VerificarTicket() {
  const navigate = useNavigate()
  const store = useStore()
  const { data: chatwoot, ready } = useChatwoot(null, { ignoreSession: true })
  const [selectedId, setSelectedId] = useState(null)

  const tickets = store.tickets.filter(t => {
    // Normaliza o conversationId do ticket (remove # e espaços)
    const ticketConvId = String(t.chatwootConversationId || '').replace('#', '').trim()
    const activeConvId = String(chatwoot?.conversationId || '').replace('#', '').trim()

    const matchConv = activeConvId && ticketConvId && ticketConvId === activeConvId
    const matchName = chatwoot?.clientName &&
      t.clientName?.trim().toLowerCase() === chatwoot.clientName.trim().toLowerCase()

    return matchConv || matchName
  })

  if (!ready) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Aguardando dados da conversa...</p>
      </div>
    )
  }

  // Se só tem 1 ticket, abre direto no detalhe
  if (tickets.length === 1 && !selectedId) {
    return (
      <TicketDetail
        ticket={store.tickets.find(t => t.id === tickets[0].id)}
        categories={store.categories}
        types={store.types}
        onBack={() => navigate('/')}
        onUpdate={(id, changes) => store.updateTicket(id, changes)}
        onDelete={(id) => { store.deleteTicket(id); navigate('/') }}
        onAction={(id, action) => store.addAction(id, action)}
      />
    )
  }

  // Abre detalhe do ticket selecionado na lista
  if (selectedId) {
    const ticket = store.tickets.find(t => t.id === selectedId)
    if (ticket) {
      return (
        <TicketDetail
          ticket={ticket}
          categories={store.categories}
          types={store.types}
          onBack={() => setSelectedId(null)}
          onUpdate={(id, changes) => store.updateTicket(id, changes)}
          onDelete={(id) => { store.deleteTicket(id); setSelectedId(null) }}
          onAction={(id, action) => store.addAction(id, action)}
        />
      )
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <Icon name="back" size={14} /> Voltar
        </button>
        <h2>Tickets do Cliente</h2>
      </div>

      {chatwoot?.clientName && (
        <div className="client-info-bar">
          <Icon name="user" size={13} />
          <span>{chatwoot.clientName}</span>
          {chatwoot.conversationLabel && <span className="conv-id">{chatwoot.conversationLabel}</span>}
          {chatwoot.chatwootLink && (
            <a href={chatwoot.chatwootLink} target="_blank" rel="noreferrer" className="conv-link">
              <Icon name="externalLink" size={12} /> Abrir conversa
            </a>
          )}
        </div>
      )}

      <div className="verify-summary">
        <div className="summary-card">
          <span className="summary-num">{tickets.length}</span>
          <span className="summary-label">Total</span>
        </div>
        <div className="summary-card">
          <span className="summary-num" style={{ color: '#60a5fa' }}>
            {tickets.filter(t => t.status === 'open').length}
          </span>
          <span className="summary-label">Abertos</span>
        </div>
        <div className="summary-card">
          <span className="summary-num" style={{ color: '#fbbf24' }}>
            {tickets.filter(t => t.status === 'in_progress').length}
          </span>
          <span className="summary-label">Em Progresso</span>
        </div>
        <div className="summary-card">
          <span className="summary-num" style={{ color: '#4ade80' }}>
            {tickets.filter(t => t.status === 'closed').length}
          </span>
          <span className="summary-label">Fechados</span>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-box">
          <Icon name="inbox" size={32} style={{ color: '#334155' }} />
          <p>Nenhum ticket encontrado para este cliente.</p>
          <button className="btn-primary" onClick={() => navigate('/novo')}>
            <Icon name="plus" size={13} /> Criar ticket
          </button>
        </div>
      ) : (
        <div className="verify-list">
          {tickets.map(ticket => {
            const status = STATUSES.find(s => s.id === ticket.status)
            const priority = PRIORITIES.find(p => p.id === ticket.priority)
            const cat = store.categories.find(c => c.id === ticket.categoryId)
            return (
              <div key={ticket.id} className="verify-card" onClick={() => setSelectedId(ticket.id)}>
                <div className="vc-top">
                  <span className="vc-title">{ticket.title}</span>
                  <span className="vc-status" style={{ color: status?.color, borderColor: status?.color + '44', background: status?.color + '12' }}>
                    {status?.label}
                  </span>
                </div>
                <div className="vc-meta">
                  {cat && <span className="vc-cat" style={{ color: cat.color }}>{cat.label}</span>}
                  <span style={{ color: priority?.color }}>● {priority?.label}</span>
                  {ticket.assignee && <span><Icon name="user" size={11} /> {ticket.assignee}</span>}
                  <span><Icon name="clock" size={11} /> {fmt(ticket.createdAt)}</span>
                  <span><Icon name="message" size={11} /> {ticket.timeline?.filter(e => e.type === 'action').length || 0} ações</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="verify-actions">
        <button className="btn-primary" onClick={() => navigate('/novo')}>
          <Icon name="plus" size={13} /> Novo ticket
        </button>
      </div>
    </div>
  )
}
