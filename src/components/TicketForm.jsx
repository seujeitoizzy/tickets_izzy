import React, { useState } from 'react'
import './TicketForm.css'
import { PRIORITIES } from '../data/defaults'
import Icon from './Icon'

const AVAILABLE_ICONS = [
  'alert', 'inbox', 'message', 'checkCircle', 'zap', 'tool', 
  'star', 'bug', 'arrowUp', 'pin', 'phone', 'transfer'
]

export default function TicketForm({ onSubmit, onCancel, categories, types, initial = {}, chatwootInitial = null }) {
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    priority: initial.priority || 'medium',
    categoryId: initial.categoryId || (categories[0]?.id || ''),
    typeId: initial.typeId || (types[0]?.id || ''),
    assignee: initial.assignee || '',
    clientName: initial.clientName || chatwootInitial?.clientName || '',
    chatwootLink: initial.chatwootLink || chatwootInitial?.chatwootLink || '',
    chatwootConversationId: initial.chatwootConversationId || chatwootInitial?.conversationId || '',
  })

  function handle(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSubmit(form)
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
            <input name="assignee" value={form.assignee} onChange={handle} placeholder="Nome do responsável" />
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
