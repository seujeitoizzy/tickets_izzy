import React, { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import './Auditoria.css'

const ACTION_LABELS = {
  ticket_created:   { label: 'Ticket Criado',          color: '#4ade80', icon: 'plus' },
  ticket_deleted:   { label: 'Ticket Excluído',         color: '#ef4444', icon: 'trash' },
  status_changed:   { label: 'Status Alterado',         color: '#f59e0b', icon: 'check' },
  assignee_changed: { label: 'Responsável Alterado',    color: '#6366f1', icon: 'user' },
  priority_changed: { label: 'Prioridade Alterada',     color: '#f97316', icon: 'arrowUp' },
}

function fmt(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Auditoria({ store }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await store.fetchAuditLogs(200)
      setLogs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.action_type === filter)

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Carregando logs...</p>
      </div>
    )
  }

  return (
    <div className="auditoria-wrap">
      <div className="auditoria-header">
        <h2>Auditoria</h2>
        <div className="audit-filters">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'ticket_created', label: 'Criações' },
            { id: 'ticket_deleted', label: 'Exclusões' },
            { id: 'status_changed', label: 'Status' },
            { id: 'assignee_changed', label: 'Responsável' },
            { id: 'priority_changed', label: 'Prioridade' },
          ].map(f => (
            <button
              key={f.id}
              className={`audit-filter-btn ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="audit-empty">
          <Icon name="inbox" size={32} style={{ color: '#334155' }} />
          <p>Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Ação</th>
                <th>Ticket</th>
                <th>Realizado por</th>
                <th>Detalhes</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const action = ACTION_LABELS[log.action_type] || { label: log.action_type, color: '#64748b', icon: 'pin' }
                const ticketNum = log.ticket_number ? `#${String(log.ticket_number).padStart(4, '0')}` : '—'
                const details = log.details || {}

                let detailText = ''
                if (log.action_type === 'status_changed') detailText = `${details.from} → ${details.toLabel || details.to}`
                else if (log.action_type === 'assignee_changed') detailText = `${details.from || '—'} → ${details.to || '—'}`
                else if (log.action_type === 'priority_changed') detailText = `${details.from} → ${details.to}`
                else if (log.action_type === 'ticket_deleted') detailText = `Cliente: ${details.clientName || '—'}`
                else if (log.action_type === 'ticket_created') detailText = `Cliente: ${details.clientName || '—'}`

                return (
                  <tr key={log.id}>
                    <td>
                      <span className="audit-action-badge" style={{ color: action.color, background: action.color + '18', borderColor: action.color + '44' }}>
                        <Icon name={action.icon} size={11} />
                        {action.label}
                      </span>
                    </td>
                    <td>
                      <div className="audit-ticket">
                        <span className="audit-ticket-num">{ticketNum}</span>
                        <span className="audit-ticket-title">{log.ticket_title || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="audit-author">
                        <Icon name="user" size={12} style={{ color: '#475569' }} />
                        {log.performed_by || '—'}
                      </span>
                    </td>
                    <td className="audit-details">{detailText || '—'}</td>
                    <td className="audit-date">{fmt(log.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
