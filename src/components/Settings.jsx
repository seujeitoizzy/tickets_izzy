import React, { useState } from 'react'
import './Settings.css'
import Icon from './Icon'
import { fetchChatwootAgents, saveToken, hasToken } from '../lib/chatwootApi'

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#64748b']

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

function SectionCard({ title, children }) {
  return (
    <div className="settings-section">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

function ItemList({ items, renderItem }) {
  if (items.length === 0) return <p className="items-empty">Nenhum item cadastrado.</p>
  return <div className="items-list">{items.map(renderItem)}</div>
}

function CategoryManager({ categories, onAdd, onRemove }) {
  const [form, setForm] = useState({ label: '', color: COLORS[0] })
  const [showPicker, setShowPicker] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (!form.label.trim()) return
    onAdd({ ...form, icon: 'pin' })
    setForm({ label: '', color: COLORS[0] })
    setShowPicker(false)
  }

  return (
    <SectionCard title="Categorias">
      <ItemList items={categories} renderItem={c => (
        <div key={c.id} className="settings-item">
          <span className="item-color" style={{ background: c.color }} />
          <span className="item-label">{c.label}</span>
          <button className="btn-remove" onClick={() => onRemove(c.id)}><Icon name="close" size={11} /></button>
        </div>
      )} />
      <form className="add-form" onSubmit={submit}>
        <div className="inline-form-row">
          <div className="color-dropdown-wrap">
            <button type="button" className="color-dropdown-btn" style={{ background: form.color }} onClick={() => setShowPicker(v => !v)} />
            {showPicker && (
              <div className="color-dropdown-menu">
                {COLORS.map(c => (
                  <button key={c} type="button" className={`color-menu-item ${form.color === c ? 'selected' : ''}`}
                    style={{ background: c }} onClick={() => { setForm(p => ({ ...p, color: c })); setShowPicker(false) }} />
                ))}
              </div>
            )}
          </div>
          <input className="inline-input" placeholder="Nome da categoria" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
          <button type="submit" className="btn-add-inline"><Icon name="plus" size={13} /></button>
        </div>
      </form>
    </SectionCard>
  )
}

function TypeManager({ types, onAdd, onRemove }) {
  const [form, setForm] = useState({ label: '', icon: TYPE_ICONS[0].id })
  const [showPicker, setShowPicker] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (!form.label.trim()) return
    onAdd(form)
    setForm({ label: '', icon: TYPE_ICONS[0].id })
    setShowPicker(false)
  }

  return (
    <SectionCard title="Tipos de Ticket">
      <ItemList items={types} renderItem={t => (
        <div key={t.id} className="settings-item">
          <Icon name={t.icon} size={14} style={{ color: '#64748b' }} />
          <span className="item-label">{t.label}</span>
          <button className="btn-remove" onClick={() => onRemove(t.id)}><Icon name="close" size={11} /></button>
        </div>
      )} />
      <form className="add-form" onSubmit={submit}>
        <div className="inline-form-row">
          <div className="icon-dropdown-wrap">
            <button type="button" className="icon-dropdown-btn" onClick={() => setShowPicker(v => !v)}>
              <Icon name={form.icon} size={16} />
            </button>
            {showPicker && (
              <div className="icon-dropdown-menu">
                {TYPE_ICONS.map(ic => (
                  <button key={ic.id} type="button" className={`icon-menu-item ${form.icon === ic.id ? 'selected' : ''}`}
                    onClick={() => { setForm(p => ({ ...p, icon: ic.id })); setShowPicker(false) }} title={ic.label}>
                    <Icon name={ic.id} size={15} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <input className="inline-input" placeholder="Nome do tipo" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
          <button type="submit" className="btn-add-inline"><Icon name="plus" size={13} /></button>
        </div>
      </form>
    </SectionCard>
  )
}

// Status fixos que não podem ser excluídos
const FIXED_STATUSES = ['aberto', 'fechado', 'open', 'closed']

function StatusManager({ statuses, onAdd, onRemove }) {
  const [form, setForm] = useState({ label: '', color: COLORS[0] })
  const [showPicker, setShowPicker] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (!form.label.trim()) return
    onAdd({ label: form.label, color: form.color, orderNum: statuses.length })
    setForm({ label: '', color: COLORS[0] })
    setShowPicker(false)
  }

  function isFixed(s) {
    return FIXED_STATUSES.includes(s.label.toLowerCase()) || FIXED_STATUSES.includes(s.id?.toLowerCase())
  }

  return (
    <SectionCard title="Status">
      <p className="section-hint">Define os status disponíveis para os tickets. Status <strong>Aberto</strong> e <strong>Fechado</strong> são fixos.</p>
      <ItemList items={statuses} renderItem={s => (
        <div key={s.id} className="settings-item">
          <span className="item-color" style={{ background: s.color }} />
          <span className="item-label">{s.label}</span>
          {isFixed(s)
            ? <span className="item-fixed">fixo</span>
            : <button className="btn-remove" onClick={() => onRemove(s.id)}><Icon name="close" size={11} /></button>
          }
        </div>
      )} />
      <form className="add-form" onSubmit={submit}>
        <div className="inline-form-row">
          <div className="color-dropdown-wrap">
            <button type="button" className="color-dropdown-btn" style={{ background: form.color }} onClick={() => setShowPicker(v => !v)} />
            {showPicker && (
              <div className="color-dropdown-menu">
                {COLORS.map(c => (
                  <button key={c} type="button" className={`color-menu-item ${form.color === c ? 'selected' : ''}`}
                    style={{ background: c }} onClick={() => { setForm(p => ({ ...p, color: c })); setShowPicker(false) }} />
                ))}
              </div>
            )}
          </div>
          <input className="inline-input" placeholder="Nome do status" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
          <button type="submit" className="btn-add-inline"><Icon name="plus" size={13} /></button>
        </div>
      </form>
    </SectionCard>
  )
}

function AgentManager({ agents, onAdd, onBulkAdd, onRemove }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', avatarColor: COLORS[5] })
  const [showPicker, setShowPicker] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const [needToken, setNeedToken] = useState(false)
  const [tokenInput, setTokenInput] = useState('')

  async function doImport() {
    setImporting(true)
    setImportMsg(null)
    setNeedToken(false)
    try {
      const data = await fetchChatwootAgents()
      const toAdd = data.map(a => ({
        name: a.name,
        email: a.email || '',
        phone: '',
        avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      }))
      const added = await onBulkAdd(toAdd)
      setImportMsg(
        added === 0
          ? { text: 'Todos os agentes já estão cadastrados.', type: 'error' }
          : { text: `${added} agente(s) importado(s)!`, type: 'success' }
      )
    } catch (e) {
      if (e.message === 'TOKEN_NEEDED') setNeedToken(true)
      else setImportMsg({ text: e.message, type: 'error' })
    }
    setImporting(false)
  }

  function confirmToken() {
    if (!tokenInput.trim()) return
    saveToken(tokenInput)
    setTokenInput('')
    doImport()
  }

  function initials(name) { return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() }

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onAdd(form)
    setForm({ name: '', email: '', phone: '', avatarColor: COLORS[5] })
    setShowForm(false)
    setShowPicker(false)
  }

  return (
    <SectionCard title="Responsaveis">
      <div className="agent-import-bar">
        <button type="button" className="btn-import" onClick={doImport} disabled={importing}>
          {importing ? <><div className="btn-spinner" /> Importando...</> : <><Icon name="transfer" size={13} /> Sincronizar com Chatwoot</>}
        </button>
        {importMsg && <span className={`import-msg ${importMsg.type}`}>{importMsg.text}</span>}
      </div>

      {needToken && (
        <div className="token-form">
          <p className="token-hint">Informe seu <strong>API Access Token</strong> do Chatwoot.<br />Acesse: <strong>Perfil &rarr; Access Token</strong></p>
          <div className="inline-form-row">
            <input className="inline-input" placeholder="Cole o Access Token aqui" value={tokenInput} onChange={e => setTokenInput(e.target.value)} type="password" onKeyDown={e => e.key === 'Enter' && confirmToken()} />
            <button type="button" className="btn-add-inline" onClick={confirmToken}><Icon name="check" size={13} /></button>
          </div>
          <p className="token-hint" style={{ marginTop: 6, fontSize: 11 }}>Salvo localmente, nao enviado a servidores externos.</p>
        </div>
      )}

      <ItemList items={agents} renderItem={a => (
        <div key={a.id} className="settings-item agent-item">
          <span className="agent-avatar" style={{ background: a.avatarColor }}>{initials(a.name)}</span>
          <div className="agent-info">
            <span className="agent-name">{a.name}</span>
            <div className="agent-meta">
              {a.email && <span><Icon name="link" size={10} />{a.email}</span>}
              {a.phone && <span><Icon name="phone" size={10} />{a.phone}</span>}
            </div>
          </div>
          <button className="btn-remove" onClick={() => onRemove(a.id)}><Icon name="close" size={11} /></button>
        </div>
      )} />

      {!showForm ? (
        <button className="btn-add" onClick={() => setShowForm(true)}><Icon name="plus" size={13} /> Adicionar manualmente</button>
      ) : (
        <form className="agent-form" onSubmit={submit}>
          <div className="agent-form-header">
            <div className="color-dropdown-wrap">
              <button type="button" className="agent-avatar-btn" style={{ background: form.avatarColor }} onClick={() => setShowPicker(v => !v)}>
                {form.name ? <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span> : <Icon name="user" size={16} style={{ color: '#fff' }} />}
              </button>
              {showPicker && (
                <div className="color-dropdown-menu">
                  {COLORS.map(c => <button key={c} type="button" className={`color-menu-item ${form.avatarColor === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => { setForm(p => ({ ...p, avatarColor: c })); setShowPicker(false) }} />)}
                </div>
              )}
            </div>
            <div className="agent-form-fields">
              <input className="agent-input" placeholder="Nome completo *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              <div className="agent-form-row">
                <input className="agent-input" placeholder="E-mail" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                <input className="agent-input" placeholder="Telefone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="agent-form-actions">
            <button type="button" className="btn-cancel-sm" onClick={() => setShowForm(false)}>Cancelar</button>
            <button type="submit" className="btn-add"><Icon name="plus" size={13} /> Adicionar</button>
          </div>
        </form>
      )}
    </SectionCard>
  )
}

export default function Settings({ categories, types, statuses, agents, onAddCategory, onRemoveCategory, onAddType, onRemoveType, onAddStatus, onRemoveStatus, onAddAgent, onBulkAddAgents, onRemoveAgent }) {
  return (
    <div className="settings-wrap">
      <h2>Configurações</h2>
      <div className="settings-grid">
        <CategoryManager categories={categories} onAdd={onAddCategory} onRemove={onRemoveCategory} />
        <TypeManager types={types} onAdd={onAddType} onRemove={onRemoveType} />
        <StatusManager statuses={statuses} onAdd={onAddStatus} onRemove={onRemoveStatus} />
        <AgentManager agents={agents} onAdd={onAddAgent} onBulkAdd={onBulkAddAgents} onRemove={onRemoveAgent} />
      </div>
    </div>
  )
}

