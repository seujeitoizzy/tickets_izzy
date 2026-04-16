import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useChatwoot } from '../hooks/useChatwoot'
import { PRIORITIES, STATUSES } from '../data/defaults'
import Icon from '../components/Icon'
import './VerificarTicket.css'

function fmt(iso) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function VerificarTicket() {
  const navigate = useNavigate()
  const store = useStore()
  const chatwoot = useChatwoot()

  // Busca todos os tickets do cliente da conversa ativa
  const tickets = store.tickets.filter(t =>
    (chatwoot?.conversationId && t.chatwootConversationId === `#${chatwoot.conversationId}`) ||
    (chatwoot?.clientName && t.clientName === chatwoot.clientName)
  )

  return (
    <div className="page-wrap">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <Icon name="back" size={14} /> Voltar
        </button>
        <h2>Verificar Tickets</h2>
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
              <div key={ticket.id} className="verify-card" onClick={() => navigate('/', { state: { openTicketId: ticket.id } })}>
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
