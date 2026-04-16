import React from 'react'
import './TicketList.css'
import { PRIORITIES } from '../data/defaults'
import Icon from './Icon'

function fmt(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function DeadlineCell({ ticket }) {
  if (ticket.deadlineIndeterminate) return <span className="deadline-indeterminate">Indeterminado</span>
  if (!ticket.deadline) return <span className="deadline-none">—</span>

  const diffH = (new Date(ticket.deadline) - new Date()) / 3600000
  const overdue = diffH < 0
  const urgent = diffH >= 0 && diffH < 24
  const color = overdue ? '#ef4444' : urgent ? '#f97316' : '#4ade80'

  return (
    <span className="deadline-cell" style={{ color, background: color + '12', borderColor: color + '33' }}>
      <Icon name="clock" size={11} />
      {new Date(ticket.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
      {overdue && ' · Vencido'}
      {urgent && !overdue && ' · Urgente'}
    </span>
  )
}

export default function TicketList({ tickets, categories, types, statuses = [], onSelect }) {
  if (tickets.length === 0) {
    return (
      <div className="empty">
        <Icon name="inbox" size={40} style={{ color: '#334155' }} />
        <p>Nenhum ticket encontrado</p>
      </div>
    )
  }

  return (
    <div className="ticket-table-wrap">
      <table className="ticket-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Nº / Título</th>
            <th>Cliente</th>
            <th>Tipo</th>
            <th>Categoria</th>
            <th>Responsável</th>
            <th>Prioridade</th>
            <th>Prazo Final</th>
            <th>Criado em</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket, idx) => {
            const cat = categories.find(c => c.id === ticket.categoryId)
            const type = types.find(t => t.id === ticket.typeId)
            const priority = PRIORITIES.find(p => p.id === ticket.priority)
            const status = statuses.find(s => s.id === ticket.status)
            const ticketNum = `#${String(idx + 1).padStart(4, '0')}`

            return (
              <tr key={ticket.id} className="ticket-row" onClick={() => onSelect(ticket)}>
                {/* Status */}
                <td>
                  <span
                    className="tbl-status"
                    style={{ color: status?.color, background: status?.color + '15', borderColor: status?.color + '44' }}
                  >
                    <span className="tbl-status-dot" style={{ background: status?.color }} />
                    {status?.label || ticket.status}
                  </span>
                </td>

                {/* Nº / Título */}
                <td className="tbl-title-cell">
                  <span className="tbl-num">{ticketNum}</span>
                  <span className="tbl-title">{ticket.title}</span>
                </td>

                {/* Cliente */}
                <td>
                  {ticket.clientName ? (
                    <div className="tbl-client">
                      <span className="tbl-client-name">{ticket.clientName}</span>
                      {ticket.chatwootConversationId && (
                        <span className="tbl-conv-id">{ticket.chatwootConversationId}</span>
                      )}
                    </div>
                  ) : <span className="tbl-empty-val">—</span>}
                </td>

                {/* Tipo */}
                <td>
                  {type ? (
                    <span className="tbl-type">
                      <Icon name={type.icon} size={12} style={{ color: '#64748b' }} />
                      {type.label}
                    </span>
                  ) : <span className="tbl-empty-val">—</span>}
                </td>

                {/* Categoria */}
                <td>
                  {cat ? (
                    <span className="tbl-cat" style={{ color: cat.color, background: cat.color + '15', borderColor: cat.color + '44' }}>
                      {cat.label}
                    </span>
                  ) : <span className="tbl-empty-val">—</span>}
                </td>

                {/* Responsável */}
                <td>
                  {ticket.assignee ? (
                    <span className="tbl-assignee">
                      <span className="tbl-avatar">{ticket.assignee.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                      {ticket.assignee}
                    </span>
                  ) : <span className="tbl-empty-val">—</span>}
                </td>

                {/* Prioridade */}
                <td>
                  <span className="tbl-priority" style={{ color: priority?.color }}>
                    <span className="tbl-priority-bar" style={{ background: priority?.color }} />
                    {priority?.label}
                  </span>
                </td>

                {/* Prazo */}
                <td><DeadlineCell ticket={ticket} /></td>

                {/* Criado em */}
                <td className="tbl-date">{fmt(ticket.createdAt)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
