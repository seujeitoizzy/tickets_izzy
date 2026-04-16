import React, { useState } from 'react'
import './TicketDetail.css'
import { PRIORITIES, STATUSES, ACTION_TYPES } from '../data/defaults'
import TicketForm from './TicketForm'
import Icon from './Icon'

function fmt(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function TimelineEntry({ entry }) {
  if (entry.type === 'status_change') {
    const status = STATUSES.find(s => s.id === entry.status)
    return (
      <div className="tl-entry tl-status">
        <div className="tl-dot tl-dot-status" style={{ borderColor: status?.color, background: status?.color + '22' }}>
          <Icon name="check" size={10} style={{ color: status?.color }} />
        </div>
        <div className="tl-body">
          <span className="tl-text">{entry.content}</span>
          <span className="tl-time">{fmt(entry.createdAt)}</span>
        </div>
      </div>
    )
  }

  const actionType = ACTION_TYPES.find(a => a.id === entry.actionType)
  return (
    <div className="tl-entry tl-action">
      <div className="tl-dot tl-dot-action">
        <Icon name={actionType?.icon || 'pin'} size={11} style={{ color: '#6366f1' }} />
      </div>
      <div className="tl-body tl-action-body">
        <div className="tl-action-header">
          <span className="tl-action-type">{actionType?.label || 'Ação'}</span>
          {entry.author && <span className="tl-author">— {entry.author}</span>}
        </div>
        <p className="tl-content">{entry.content}</p>
        <span className="tl-time">{fmt(entry.createdAt)}</span>
      </div>
    </div>
  )
}

export default function TicketDetail({ ticket, categories, types, onBack, onUpdate, onDelete, onAction }) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionForm, setActionForm] = useState({ actionType: 'note', content: '', author: '' })
  const [showActionForm, setShowActionForm] = useState(false)

  const cat = categories.find(c => c.id === ticket.categoryId)
  const type = types.find(t => t.id === ticket.typeId)
  const priority = PRIORITIES.find(p => p.id === ticket.priority)
  const status = STATUSES.find(s => s.id === ticket.status)

  function submitAction(e) {
    e.preventDefault()
    if (!actionForm.content.trim()) return
    onAction(ticket.id, actionForm)
    setActionForm({ actionType: 'note', content: '', author: actionForm.author })
    setShowActionForm(false)
  }

  function resolveTicket() {
    onUpdate(ticket.id, { status: 'closed', _author: 'Sistema' })
    onAction(ticket.id, {
      actionType: 'resolution',
      content: 'Ticket marcado como resolvido',
      author: 'Sistema',
    })
  }

  if (editing) {
    return (
      <TicketForm
        initial={ticket}
        categories={categories}
        types={types}
        onSubmit={data => { onUpdate(ticket.id, data); setEditing(false) }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  const timeline = [...(ticket.timeline || [])].reverse()

  return (
    <div className="detail-wrap">
      <div className="detail-topbar">
        <button className="back-btn" onClick={onBack}>
          <Icon name="back" size={14} />
          Voltar
        </button>
        <div className="detail-topbar-actions">
          {ticket.status !== 'closed' && (
            <button className="btn-resolve" onClick={resolveTicket}>
              <Icon name="checkCircle" size={14} />
              Resolver Ticket
            </button>
          )}
          <button className="btn-edit" onClick={() => setEditing(true)}>
            <Icon name="edit" size={13} />
            Editar
          </button>
          {!confirmDelete
            ? (
              <button className="btn-delete" onClick={() => setConfirmDelete(true)}>
                <Icon name="trash" size={13} />
                Excluir
              </button>
            ) : (
              <>
                <span className="confirm-text">Confirmar exclusão?</span>
                <button className="btn-delete" onClick={() => onDelete(ticket.id)}>Sim</button>
                <button className="btn-cancel-sm" onClick={() => setConfirmDelete(false)}>Não</button>
              </>
            )
          }
        </div>
      </div>

      <div className="detail-layout">
        {/* LEFT */}
        <div className="detail-main">
          <div className="detail-card">
            <h1 className="detail-title">{ticket.title}</h1>

            {(ticket.clientName || ticket.chatwootLink) && (
              <div className="chatwoot-block">
                <div className="chatwoot-label">Chatwoot</div>
                <div className="chatwoot-info">
                  {ticket.clientName && (
                    <div className="chatwoot-row">
                      <Icon name="user" size={13} style={{ color: '#475569' }} />
                      <span className="ci-val">{ticket.clientName}</span>
                      {ticket.chatwootConversationId && (
                        <span className="ci-conv">{ticket.chatwootConversationId}</span>
                      )}
                    </div>
                  )}
                  {ticket.chatwootLink && (
                    <div className="chatwoot-row">
                      <Icon name="externalLink" size={13} style={{ color: '#475569' }} />
                      <a href={ticket.chatwootLink} target="_blank" rel="noreferrer" className="ci-link">
                        Abrir conversa
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="meta-grid">
              <div className="meta-item meta-full">
                <span className="meta-label">Status</span>
                <div className="status-btns">
                  {STATUSES.map(s => (
                    <button
                      key={s.id}
                      className={`status-opt ${ticket.status === s.id ? 'active' : ''}`}
                      style={ticket.status === s.id
                        ? { background: s.color + '20', color: s.color, borderColor: s.color + '80' }
                        : {}}
                      onClick={() => onUpdate(ticket.id, { status: s.id })}
                    >
                      {ticket.status === s.id && <Icon name="check" size={11} />}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="meta-item">
                <span className="meta-label">Prioridade</span>
                <span className="meta-val priority-val" style={{ color: priority?.color }}>
                  <span className="priority-bar" style={{ background: priority?.color }} />
                  {priority?.label}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Tipo</span>
                <span className="meta-val type-val">
                  {type && <Icon name={type.icon} size={13} style={{ color: '#64748b' }} />}
                  {type?.label || '—'}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Categoria</span>
                {cat
                  ? <span className="cat-tag" style={{ background: cat.color + '18', color: cat.color, borderColor: cat.color + '44' }}>{cat.label}</span>
                  : <span className="meta-val">—</span>
                }
              </div>

              <div className="meta-item">
                <span className="meta-label">Responsável</span>
                <span className="meta-val assignee-val">
                  {ticket.assignee
                    ? <><Icon name="user" size={13} style={{ color: '#64748b' }} />{ticket.assignee}</>
                    : '—'
                  }
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Criado em</span>
                <span className="meta-val">
                  <Icon name="clock" size={13} style={{ color: '#64748b' }} />
                  {fmt(ticket.createdAt)}
                </span>
              </div>
            </div>

            {ticket.description && (
              <div className="detail-desc-block">
                <div className="meta-label">Descrição</div>
                <p className="detail-desc">{ticket.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: timeline */}
        <div className="detail-timeline">
          <div className="tl-header">
            <span>Timeline</span>
            <button className="btn-add-action" onClick={() => setShowActionForm(v => !v)}>
              {showActionForm
                ? <><Icon name="close" size={12} /> Cancelar</>
                : <><Icon name="plus" size={12} /> Registrar Ação</>
              }
            </button>
          </div>

          {showActionForm && (
            <form className="action-form" onSubmit={submitAction}>
              <div className="af-field">
                <label>Tipo de Ação</label>
                <select value={actionForm.actionType} onChange={e => setActionForm(p => ({ ...p, actionType: e.target.value }))}>
                  {ACTION_TYPES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
              <div className="af-field">
                <label>Descrição *</label>
                <textarea
                  value={actionForm.content}
                  onChange={e => setActionForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="Ex: Passei o contato para Fulano, atualizei o registro..."
                  rows={3}
                  required
                />
              </div>
              <div className="af-field">
                <label>Responsável</label>
                <input
                  value={actionForm.author}
                  onChange={e => setActionForm(p => ({ ...p, author: e.target.value }))}
                  placeholder="Seu nome"
                />
              </div>
              <button type="submit" className="btn-primary-sm">
                <Icon name="check" size={12} />
                Registrar
              </button>
            </form>
          )}

          <div className="tl-list">
            {timeline.length === 0 && <p className="tl-empty">Nenhum evento registrado.</p>}
            {timeline.map(entry => (
              <TimelineEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
