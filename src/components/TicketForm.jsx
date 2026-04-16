import React, { useState, useRef, useEffect } from 'react'
import './TicketForm.css'
import { PRIORITIES } from '../data/defaults'
import Icon from './Icon'
import { useChatwootAgents } from '../hooks/useChatwootAgents'
import { saveToken } from '../lib/chatwootApi'

function AgentSelect({ agents, value, onChange, loading = false }) {
  const [open, setOpen] = useState(false)
  const [manual, setManual] = useState(false)
  const [manualVal, setManualVal] = useState('')
  const ref = useRef()

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function initials(name) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const selected = agents.find(a => a.name === value)

  if (manual) {
    return (
      <div className="agent-select-manual">
        <input
          autoFocus
          value={manualVal}
          onChange={e => { setManualVal(e.target.value); onChange(e.target.value) }}
          placeholder="Digite o nome do responsável"
        />
        <button type="button" className="agent-select-back" onClick={() => { setManual(false); onChange('') }}>
          <Icon name="back" size={12} /> Lista
        </button>
      </div>
    )
  }

  return (
    <div className="agent-select-wrap" ref={ref}>
      <button type="button" className="agent-select-btn" onClick={() => !loading && setOpen(v => !v)}>
        {loading ? (
          <span className="agent-select-placeholder">
            <div style={{ width: 12, height: 12, border: '2px solid #334155', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Carregando agentes...
          </span>
        ) : selected ? (
          <>
            <span className="agent-select-avatar" style={{ background: selected.avatarColor }}>
              {initials(selected.name)}
            </span>
            <span className="agent-select-name">{selected.name}</span>
          </>
        ) : (
          <>
            <span className="agent-select-placeholder">
              <Icon name="user" size={14} style={{ color: '#475569' }} />
              Selecionar responsável
            </span>
          </>
        )}
        <Icon name="back" size={12} style={{ color: '#475569', transform: open ? 'rotate(-90deg)' : 'rotate(90deg)', marginLeft: 'auto', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div className="agent-select-dropdown">
          {agents.map(a => (
            <button
              key={a.id}
              type="button"
              className={`agent-select-item ${value === a.name ? 'selected' : ''}`}
              onClick={() => { onChange(a.name); setOpen(false) }}
            >
              <span className="agent-select-avatar" style={{ background: a.avatarColor }}>
                {initials(a.name)}
              </span>
              <div className="agent-select-info">
                <span>{a.name}</span>
                {a.email && <span className="agent-select-email">{a.email}</span>}
              </div>
              {value === a.name && <Icon name="check" size={13} style={{ color: '#6366f1', marginLeft: 'auto' }} />}
            </button>
          ))}
          <button type="button" className="agent-select-manual-btn" onClick={() => { setOpen(false); setManual(true) }}>
            <Icon name="edit" size={13} />
            Digitar manualmente
          </button>
        </div>
      )}
    </div>
  )
}

const AVAILABLE_ICONS = [
  'alert', 'inbox', 'message', 'checkCircle', 'zap', 'tool', 
  'star', 'bug', 'arrowUp', 'pin', 'phone', 'transfer'
]

export default function TicketForm({ onSubmit, onCancel, categories, types, agents: agentsProp = [], initial = {}, chatwootInitial = null }) {
  const { agents: chatwootAgents, loading: agentsLoading, needToken, refresh } = useChatwootAgents()
  const [tokenInput, setTokenInput] = useState('')
  const [showTokenInput, setShowTokenInput] = useState(false)

  // Mescla agentes do Chatwoot com os do banco (prop), sem duplicatas
  const allAgents = React.useMemo(() => {
    const names = new Set(chatwootAgents.map(a => a.name.toLowerCase()))
    const extra = agentsProp.filter(a => !names.has(a.name.toLowerCase()))
    return [...chatwootAgents, ...extra]
  }, [chatwootAgents, agentsProp])
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    priority: initial.priority || 'medium',
    categoryId: initial.categoryId || (categories[0]?.id || ''),
    typeId: initial.typeId || (types[0]?.id || ''),
    assignee: initial.assignee || chatwootInitial?.agentName || '',
    clientName: initial.clientName || chatwootInitial?.clientName || '',
    chatwootLink: initial.chatwootLink || chatwootInitial?.chatwootLink || '',
    chatwootConversationId: initial.chatwootConversationId || chatwootInitial?.conversationLabel || '',
    deadline: initial.deadline ? new Date(initial.deadline).toISOString().slice(0, 16) : '',
    deadlineIndeterminate: initial.deadlineIndeterminate || false,
  })

  function handle(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleCheck(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.checked }))
  }

  function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit({
      ...form,
      deadline: form.deadlineIndeterminate ? null : (form.deadline || null),
    })
  }

  const selectedType = types.find(t => t.id === form.typeId)

  return (
    <div className="form-wrap">
      <div className="form-card">
        <h2>{initial.id ? 'Editar Ticket' : 'Novo Ticket'}</h2>
        <form onSubmit={submit}>

          <div className="section-label">Dados do Cliente (Chatwoot)</div>
          <div className="row">
            <div className="field">
              <label>Nome do Cliente</label>
              <input name="clientName" value={form.clientName} onChange={handle} placeholder="Ex: João Silva" />
            </div>
            <div className="field">
              <label>ID da Conversa</label>
              <input name="chatwootConversationId" value={form.chatwootConversationId} onChange={handle} placeholder="Ex: #1234" />
            </div>
          </div>
          <div className="field">
            <label>Link da Conversa no Chatwoot</label>
            <input name="chatwootLink" value={form.chatwootLink} onChange={handle} placeholder="https://app.chatwoot.com/..." />
          </div>

          <div className="section-label">Detalhes do Ticket</div>
          <div className="field">
            <label>Título *</label>
            <input name="title" value={form.title} onChange={handle} placeholder="Descreva o problema brevemente" required />
          </div>
          <div className="field">
            <label>Descrição</label>
            <textarea name="description" value={form.description} onChange={handle} placeholder="Detalhes adicionais, contexto, passos para reproduzir..." rows={4} />
          </div>

          <div className="row">
            <div className="field">
              <label>Tipo</label>
              <div className="type-select-wrap">
                <div className="type-icon-preview">
                  {selectedType && <Icon name={selectedType.icon} size={16} />}
                </div>
                <select name="typeId" value={form.typeId} onChange={handle} className="type-select">
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Categoria</label>
              <select name="categoryId" value={form.categoryId} onChange={handle}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Prioridade</label>
              <select name="priority" value={form.priority} onChange={handle}>
                {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Responsável</label>
            {needToken && !showTokenInput ? (
              <button type="button" className="agent-token-btn" onClick={() => setShowTokenInput(true)}>
                <Icon name="user" size={13} /> Configurar token para ver agentes
              </button>
            ) : showTokenInput ? (
              <div className="agent-select-manual">
                <input
                  autoFocus
                  type="password"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  placeholder="Cole o API Access Token do Chatwoot"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      saveToken(tokenInput)
                      setShowTokenInput(false)
                      refresh()
                    }
                  }}
                />
                <button type="button" className="agent-select-back" onClick={() => {
                  saveToken(tokenInput)
                  setShowTokenInput(false)
                  refresh()
                }}>
                  <Icon name="check" size={12} />
                </button>
              </div>
            ) : (
              <AgentSelect
                agents={allAgents}
                value={form.assignee}
                onChange={val => setForm(p => ({ ...p, assignee: val }))}
                loading={agentsLoading}
              />
            )}
          </div>

          <div className="section-label">Prazo de Resolução</div>
          <div className="deadline-wrap">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="deadlineIndeterminate"
                checked={form.deadlineIndeterminate}
                onChange={handleCheck}
              />
              <span className="checkbox-box" />
              <span>Prazo indeterminado</span>
            </label>
            {!form.deadlineIndeterminate && (
              <div className="field" style={{ marginBottom: 0, marginTop: 12 }}>
                <label>Data e hora limite</label>
                <input
                  type="datetime-local"
                  name="deadline"
                  value={form.deadline}
                  onChange={handle}
                />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn-primary">{initial.id ? 'Salvar' : 'Criar Ticket'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
