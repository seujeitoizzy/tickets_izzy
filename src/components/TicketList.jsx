import React from 'react'
import './TicketList.css'
import { PRIORITIES, STATUSES } from '../data/defaults'
import Icon from './Icon'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

export default function TicketList({ tickets, categories, types, onSelect }) {
  if (tickets.length === 0) {
    return (
      <div className="empty">
        <Icon name="inbox" size={40} style={{ color: '#334155' }} />
        <p>Nenhum ticket encontrado</p>
      </div>
    )
  }

  return (
    <div className="ticket-list">
      {tickets.map(ticket => {
        const cat = categories.find(c => c.id === ticket.categoryId)
        const type = types.find(t => t.id === ticket.typeId)
        const priority = PRIORITIES.find(p => p.id === ticket.priority)
        const status = STATUSES.find(s => s.id === ticket.status)
        const actionCount = ticket.timeline?.filter(e => e.type === 'action').length || 0

        return (
          <div key={ticket.id} className="ticket-card" onClick={() => onSelect(ticket)}>
            <div className="tc-left">
              <div className="tc-top">
                {type && (
                  <span className="tc-type">
                    <Icon name={type.icon} size={12} />
                    {type.label}
                  </span>
                )}
                {cat && (
                  <span className="tc-cat" style={{ background: cat.color + '18', color: cat.color, borderColor: cat.color + '44' }}>
                    {cat.label}
                  </span>
                )}
                <span className="tc-priority" style={{ color: priority?.color }}>
                  {priority?.label}
                </span>
              </div>

              <div className="tc-title">{ticket.title}</div>

              {ticket.clientName && (
                <div className="tc-client">
                  <Icon name="user" size={12} style={{ color: '#475569' }} />
                  <span>{ticket.clientName}</span>
                  {ticket.chatwootConversationId && (
                    <span className="tc-conv-id">{ticket.chatwootConversationId}</span>
                  )}
                </div>
              )}

              {ticket.description && (
                <p className="tc-desc">{ticket.description.slice(0, 120)}{ticket.description.length > 120 ? '…' : ''}</p>
              )}
            </div>

            <div className="tc-right">
              <span className="status-badge" style={{ color: status?.color, borderColor: status?.color + '44', background: status?.color + '12' }}>
                {status?.label}
              </span>
              {ticket.assignee && (
                <span className="tc-meta">
                  <Icon name="user" size={11} />
                  {ticket.assignee}
                </span>
              )}
              <span className="tc-meta">
                <Icon name="clock" size={11} />
                {timeAgo(ticket.createdAt)}
              </span>
              <span className="tc-meta">
                <Icon name="message" size={11} />
                {actionCount} {actionCount === 1 ? 'ação' : 'ações'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
