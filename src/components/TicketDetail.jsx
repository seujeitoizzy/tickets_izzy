import React, { useState } from 'react'
import './TicketDetail.css'
import { PRIORITIES, ACTION_TYPES } from '../data/defaults'
import TicketForm from './TicketForm'
import Icon from './Icon'
import { useChatwootAgents } from '../hooks/useChatwootAgents'

function fmt(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function CopyBadge({ value }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button className={`copy-badge ${copied ? 'copied' : ''}`} onClick={copy} title="Copiar ID">
      <span className="copy-badge-num">{value}</span>
      <span className="copy-badge-icon">
        {copied
          ? <Icon name="check" size={11} />
          : <Icon name="fileEdit" size={11} />
        }
      </span>
    </button>
  )
}

function DeadlineBadge({ deadline }) {
  const now = new Date()
  const d = new Date(deadline)
  const diffH = (d - now) / 3600000
  const overdue = diffH < 0
  const urgent = diffH >= 0 && diffH < 24

  const color = overdue ? '#ef4444' : urgent ? '#f97316' : '#4ade80'
  const label = overdue
    ? `Vencido ${fmt(deadline)}`
    : `${fmt(deadline)}`

  return (
    <span className="deadline-badge" style={{ color, borderColor: color + '44', background: color + '12' }}>
      <Icon name="clock" size={12} />
      {label}
    </span>
  )
}

function TimelineEntry({ entry, statuses = [] }) {
  if (entry.type === 'status_change') {
    const status = statuses.find(s => s.id === entry.status) || LEGACY_STATUS[entry.status] || { color: '#6366f1' }
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

const LEGACY_STATUS = {
  open:        { id: 'open',        label: 'Aberto',       color: '#60a5fa' },
  in_progress: { id: 'in_progress', label: 'Em Progresso', color: '#fbbf24' },
  waiting:     { id: 'waiting',     label: 'Aguardando',   color: '#a78bfa' },
  closed:      { id: 'closed',      label: 'Fechado',      color: '#4ade80' },
}

export default function TicketDetail({ ticket, categories, types, statuses = [], onBack, onUpdate, onDelete, onAction, onAddChecklist, onToggleChecklist, onRemoveChecklist, onAddComment, onRemoveComment, onAddAttachment, onRemoveAttachment }) {
  const [tab, setTab] = useState('overview') // overview | comments | attachments | timeline
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionForm, setActionForm] = useState({ actionType: 'note', content: '', author: '' })
  const [showActionForm, setShowActionForm] = useState(false)
  const [checkInput, setCheckInput] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('')
  const [uploading, setUploading] = useState(false)
  const [editingAssignee, setEditingAssignee] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState(false)
  const [deadlineVal, setDeadlineVal] = useState(
    ticket.deadline ? new Date(ticket.deadline).toISOString().slice(0, 16) : ''
  )
  const [deadlineIndet, setDeadlineIndet] = useState(ticket.deadlineIndeterminate || false)

  const { agents: chatwootAgents } = useChatwootAgents()

  const cat = categories.find(c => c.id === ticket.categoryId)
  const type = types.find(t => t.id === ticket.typeId)
  const priority = PRIORITIES.find(p => p.id === ticket.priority)
  const status = statuses.find(s => s.id === ticket.status) || LEGACY_STATUS[ticket.status]

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
          {ticket.status !== 'closed' && (
            <button className="btn-resolve" onClick={resolveTicket}>
              <Icon name="checkCircle" size={14} />
              Resolver
            </button>
          )}
        </div>
      </div>

      <div className="detail-tabs">
        {[
          { id: 'overview', label: 'Visão Geral', icon: 'ticket' },
          { id: 'comments', label: 'Comentários', icon: 'message', count: ticket.comments?.length || 0 },
          { id: 'attachments', label: 'Anexos', icon: 'fileEdit', count: ticket.attachments?.length || 0 },
          { id: 'timeline', label: 'Timeline', icon: 'clock', count: ticket.timeline?.length || 0 },
        ].map(t => (
          <button
            key={t.id}
            className={`detail-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
            {t.count > 0 && <span className="tab-badge">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="detail-layout">
        {/* LEFT */}
        <div className="detail-main">
          <div className="detail-card">
            <h1 className="detail-title">
              {ticket.ticketNumber && (
                <CopyBadge value={`#${String(ticket.ticketNumber).padStart(4, '0')}`} />
              )}
              {ticket.title}
            </h1>

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
                  {statuses.map(s => (
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
                  ? <span className="cat-tag-sm" style={{ background: cat.color + '18', color: cat.color, borderColor: cat.color + '44' }}>{cat.label}</span>
                  : <span className="meta-val">—</span>
                }
              </div>

              <div className="meta-item">
                <span className="meta-label">Responsável</span>
                {editingAssignee ? (
                  <div className="meta-inline-edit">
                    <select
                      autoFocus
                      className="meta-select"
                      value={ticket.assignee || ''}
                      onChange={e => {
                        onUpdate(ticket.id, { assignee: e.target.value })
                        setEditingAssignee(false)
                      }}
                      onBlur={() => setEditingAssignee(false)}
                    >
                      <option value="">— Sem responsável —</option>
                      {chatwootAgents.map(a => (
                        <option key={a.id} value={a.name}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <button className="meta-editable" onClick={() => setEditingAssignee(true)}>
                    <span className="assignee-val">
                      {ticket.assignee
                        ? <><Icon name="user" size={13} style={{ color: '#64748b' }} />{ticket.assignee}</>
                        : <span style={{ color: '#334155' }}>Clique para definir</span>
                      }
                    </span>
                    <Icon name="edit" size={11} style={{ color: '#334155', marginLeft: 4 }} />
                  </button>
                )}
              </div>

              <div className="meta-item">
                <span className="meta-label">Criado em</span>
                <span className="meta-val">
                  <Icon name="clock" size={13} style={{ color: '#64748b' }} />
                  {fmt(ticket.createdAt)}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Prazo</span>
                {editingDeadline ? (
                  <div className="meta-inline-edit">
                    <label className="checkbox-label" style={{ fontSize: 13, color: '#94a3b8' }}>
                      <input type="checkbox" checked={deadlineIndet} onChange={e => setDeadlineIndet(e.target.checked)} style={{ display: 'none' }} />
                      <span className="checkbox-box" style={deadlineIndet ? { background: '#6366f1', borderColor: '#6366f1' } : {}} />
                      <span>Prazo indeterminado</span>
                    </label>
                    {!deadlineIndet && (
                      <input type="datetime-local" className="meta-date-input" value={deadlineVal} onChange={e => setDeadlineVal(e.target.value)} />
                    )}
                    <div className="meta-edit-actions">
                      <button className="meta-save-btn" onClick={() => {
                        onUpdate(ticket.id, { deadline: deadlineIndet ? null : (deadlineVal || null), deadlineIndeterminate: deadlineIndet })
                        setEditingDeadline(false)
                      }}>
                        <Icon name="check" size={12} /> Salvar
                      </button>
                      <button className="meta-cancel-btn" onClick={() => setEditingDeadline(false)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button className="meta-editable" onClick={() => setEditingDeadline(true)}>
                    {ticket.deadlineIndeterminate
                      ? <span style={{ color: '#64748b' }}>Indeterminado</span>
                      : ticket.deadline
                        ? <DeadlineBadge deadline={ticket.deadline} />
                        : <span style={{ color: '#334155' }}>Clique para definir</span>
                    }
                    <Icon name="edit" size={11} style={{ color: '#334155', marginLeft: 4 }} />
                  </button>
                )}
              </div>
            </div>

            {ticket.description && (
              <div className="detail-desc-block">
                <div className="meta-label">Descrição</div>
                <p className="detail-desc">{ticket.description}</p>
              </div>
            )}

            {/* Checklist */}
            <div className="checklist-block">
              <div className="checklist-header">
                <div className="meta-label">Checklist</div>
                {ticket.checklist?.length > 0 && (
                  <span className="checklist-progress">
                    {ticket.checklist.filter(c => c.checked).length}/{ticket.checklist.length}
                  </span>
                )}
              </div>

              {ticket.checklist?.length > 0 && (
                <div className="checklist-bar">
                  <div
                    className="checklist-bar-fill"
                    style={{ width: `${Math.round((ticket.checklist.filter(c => c.checked).length / ticket.checklist.length) * 100)}%` }}
                  />
                </div>
              )}

              <div className="checklist-items">
                {(ticket.checklist || []).map(item => (
                  <div key={item.id} className={`checklist-item ${item.checked ? 'checked' : ''}`}>
                    <button
                      className="checklist-checkbox"
                      onClick={() => onToggleChecklist?.(item.id, !item.checked)}
                    >
                      {item.checked && <Icon name="check" size={11} />}
                    </button>
                    <span className="checklist-text">{item.text}</span>
                    <button className="checklist-remove" onClick={() => onRemoveChecklist?.(item.id)}>
                      <Icon name="close" size={10} />
                    </button>
                  </div>
                ))}
              </div>

              <form
                className="checklist-add"
                onSubmit={e => {
                  e.preventDefault()
                  if (!checkInput.trim()) return
                  onAddChecklist?.(ticket.id, checkInput.trim())
                  setCheckInput('')
                }}
              >
                <input
                  value={checkInput}
                  onChange={e => setCheckInput(e.target.value)}
                  placeholder="Adicionar item ao checklist..."
                />
                <button type="submit" className="checklist-add-btn">
                  <Icon name="plus" size={13} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT: conteúdo da tab */}
        <div className="detail-timeline">
          {tab === 'overview' && (
            <>
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
              <TimelineEntry key={entry.id} entry={entry} statuses={statuses} />
            ))}
          </div>
          </>
          )}

          {/* Tab: Comentários */}
          {tab === 'comments' && (
            <div className="tab-comments">
              <div className="comments-list">
                {(ticket.comments || []).length === 0 && (
                  <div className="tab-empty">
                    <Icon name="message" size={28} style={{ color: '#334155' }} />
                    <p>Nenhum comentário ainda.</p>
                  </div>
                )}
                {(ticket.comments || []).map(c => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-avatar">
                      {c.author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="comment-body">
                      <div className="comment-header">
                        <span className="comment-author">{c.author}</span>
                        <span className="comment-time">{fmt(c.createdAt)}</span>
                        <button className="comment-delete" onClick={() => onRemoveComment?.(c.id)}>
                          <Icon name="close" size={10} />
                        </button>
                      </div>
                      <p className="comment-text">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form className="comment-form" onSubmit={e => {
                e.preventDefault()
                if (!commentText.trim()) return
                onAddComment?.(ticket.id, { author: commentAuthor || 'Agente', content: commentText.trim() })
                setCommentText('')
              }}>
                <input
                  className="comment-author-input"
                  placeholder="Seu nome"
                  value={commentAuthor}
                  onChange={e => setCommentAuthor(e.target.value)}
                />
                <div className="comment-input-wrap">
                  <textarea
                    placeholder="Escrever comentário interno..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    rows={3}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault()
                        if (!commentText.trim()) return
                        onAddComment?.(ticket.id, { author: commentAuthor || 'Agente', content: commentText.trim() })
                        setCommentText('')
                      }
                    }}
                  />
                  <button type="submit" className="btn-primary-sm">
                    <Icon name="message" size={13} /> Comentar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab: Anexos */}
          {tab === 'attachments' && (
            <div className="tab-attachments">
              <div className="attachments-list">
                {(ticket.attachments || []).length === 0 && (
                  <div className="tab-empty">
                    <Icon name="fileEdit" size={28} style={{ color: '#334155' }} />
                    <p>Nenhum anexo ainda.</p>
                  </div>
                )}
                {(ticket.attachments || []).map(a => {
                  const isImage = a.fileType?.startsWith('image/')
                  const sizeKb = a.fileSize ? `${(a.fileSize / 1024).toFixed(0)} KB` : ''
                  return (
                    <div key={a.id} className="attachment-item">
                      {isImage ? (
                        <a href={a.fileUrl} target="_blank" rel="noreferrer" className="attachment-thumb">
                          <img src={a.fileUrl} alt={a.filename} />
                        </a>
                      ) : (
                        <div className="attachment-icon">
                          <Icon name="fileEdit" size={20} style={{ color: '#6366f1' }} />
                        </div>
                      )}
                      <div className="attachment-info">
                        <a href={a.fileUrl} target="_blank" rel="noreferrer" className="attachment-name">
                          {a.filename}
                        </a>
                        <span className="attachment-meta">
                          {sizeKb} {a.uploadedBy && `· ${a.uploadedBy}`} · {fmt(a.createdAt)}
                        </span>
                      </div>
                      <button className="attachment-delete" onClick={() => onRemoveAttachment?.(a.id, a.fileUrl)}>
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <label className="upload-btn">
                {uploading ? (
                  <><div className="btn-spinner" style={{ borderTopColor: '#6366f1' }} /> Enviando...</>
                ) : (
                  <><Icon name="plus" size={13} /> Adicionar anexo</>
                )}
                <input
                  type="file"
                  style={{ display: 'none' }}
                  multiple
                  onChange={async e => {
                    const files = Array.from(e.target.files)
                    setUploading(true)
                    for (const file of files) {
                      await onAddAttachment?.(ticket.id, file, ticket.assignee || 'Agente')
                    }
                    setUploading(false)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          )}

          {/* Tab: Timeline */}
          {tab === 'timeline' && (
            <>
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
                    <textarea value={actionForm.content} onChange={e => setActionForm(p => ({ ...p, content: e.target.value }))} rows={3} required />
                  </div>
                  <div className="af-field">
                    <label>Responsável</label>
                    <input value={actionForm.author} onChange={e => setActionForm(p => ({ ...p, author: e.target.value }))} placeholder="Seu nome" />
                  </div>
                  <button type="submit" className="btn-primary-sm">
                    <Icon name="check" size={12} /> Registrar
                  </button>
                </form>
              )}
              <div className="tl-list">
                {timeline.length === 0 && <p className="tl-empty">Nenhum evento registrado.</p>}
                {timeline.map(entry => (
                  <TimelineEntry key={entry.id} entry={entry} statuses={statuses} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
