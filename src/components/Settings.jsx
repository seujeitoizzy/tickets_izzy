import React, { useState } from 'react'
import './Settings.css'
import Icon from './Icon'

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#14b8a6']

// Available icon options for types (using Icon component names)
const TYPE_ICONS = [
  { id: 'alert', label: 'Alerta' },
  { id: 'inbox', label: 'Caixa' },
  { id: 'message', label: 'Mensagem' },
  { id: 'checkCircle', label: 'Concluído' },
  { id: 'zap', label: 'Urgente' },
  { id: 'tool', label: 'Ferramenta' },
  { id: 'star', label: 'Destaque' },
  { id: 'bug', label: 'Bug' },
  { id: 'arrowUp', label: 'Escalar' },
  { id: 'pin', label: 'Fixado' },
]

function CategoryManager({ categories, onAdd, onRemove }) {
  const [form, setForm] = useState({ label: '', color: COLORS[0] })
  const [showColorPicker, setShowColorPicker] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (!form.label.trim()) return
    onAdd({ ...form, icon: 'pin' })
    setForm({ label: '', color: COLORS[0] })
    setShowColorPicker(false)
  }

  return (
    <div className="settings-section">
      <h3>Categorias</h3>
      <div className="items-list">
        {categories.length === 0 && <p className="items-empty">Nenhuma categoria cadastrada.</p>}
        {categories.map(c => (
          <div key={c.id} className="settings-item">
            <span className="item-color" style={{ background: c.color }} />
            <span className="item-label">{c.label}</span>
            <button className="btn-remove" onClick={() => onRemove(c.id)} title="Remover">
              <Icon name="close" size={11} />
            </button>
          </div>
        ))}
      </div>
      <form className="add-form" onSubmit={submit}>
        <div className="inline-form-row">
          <div className="color-dropdown-wrap">
            <button
              type="button"
              className="color-dropdown-btn"
              style={{ background: form.color }}
              onClick={() => setShowColorPicker(v => !v)}
            />
            {showColorPicker && (
              <div className="color-dropdown-menu">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-menu-item ${form.color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => {
                      setForm(p => ({ ...p, color: c }))
                      setShowColorPicker(false)
                    }}
                    title={c}
                  />
                ))}
              </div>
            )}
          </div>
          <input
            className="inline-input"
            placeholder="Nome da categoria"
            value={form.label}
            onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
          />
          <button type="submit" className="btn-add-inline">
            <Icon name="plus" size={13} />
          </button>
        </div>
      </form>
    </div>
  )
}

function TypeManager({ types, onAdd, onRemove }) {
  const [form, setForm] = useState({ label: '', icon: TYPE_ICONS[0].id })
  const [showIconPicker, setShowIconPicker] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (!form.label.trim()) return
    onAdd(form)
    setForm({ label: '', icon: TYPE_ICONS[0].id })
    setShowIconPicker(false)
  }

  return (
    <div className="settings-section">
      <h3>Tipos de Ticket</h3>
      <div className="items-list">
        {types.length === 0 && <p className="items-empty">Nenhum tipo cadastrado.</p>}
        {types.map(t => (
          <div key={t.id} className="settings-item">
            <Icon name={t.icon} size={14} style={{ color: '#64748b' }} />
            <span className="item-label">{t.label}</span>
            <button className="btn-remove" onClick={() => onRemove(t.id)} title="Remover">
              <Icon name="close" size={11} />
            </button>
          </div>
        ))}
      </div>
      <form className="add-form" onSubmit={submit}>
        <div className="inline-form-row">
          <div className="icon-dropdown-wrap">
            <button
              type="button"
              className="icon-dropdown-btn"
              onClick={() => setShowIconPicker(v => !v)}
            >
              <Icon name={form.icon} size={16} />
            </button>
            {showIconPicker && (
              <div className="icon-dropdown-menu">
                {TYPE_ICONS.map(ic => (
                  <button
                    key={ic.id}
                    type="button"
                    className={`icon-menu-item ${form.icon === ic.id ? 'selected' : ''}`}
                    onClick={() => {
                      setForm(p => ({ ...p, icon: ic.id }))
                      setShowIconPicker(false)
                    }}
                    title={ic.label}
                  >
                    <Icon name={ic.id} size={15} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            className="inline-input"
            placeholder="Nome do tipo"
            value={form.label}
            onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
          />
          <button type="submit" className="btn-add-inline">
            <Icon name="plus" size={13} />
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Settings({ categories, types, onAddCategory, onRemoveCategory, onAddType, onRemoveType }) {
  return (
    <div className="settings-wrap">
      <h2>Configurações</h2>
      <div className="settings-grid">
        <CategoryManager categories={categories} onAdd={onAddCategory} onRemove={onRemoveCategory} />
        <TypeManager types={types} onAdd={onAddType} onRemove={onRemoveType} />
      </div>
    </div>
  )
}
