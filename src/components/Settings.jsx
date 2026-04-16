import React, { useState } from 'react'
import './Settings.css'
import Icon from './Icon'

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

  return (
    <SectionCard title="Status">
      <p className="section-hint">Define os status disponíveis para os tickets.</p>
      <ItemList items={statuses} renderItem={s => (
        <div key={s.id} className="settings-item">
          <span className="item-color" style={{ background: s.color }} />
          <span className="item-label">{s.label}</span>
          <button className="btn-remove" onClick={() => onRemove(s.id)}><Icon name="close" size={11} /></button>
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

function AgentManager({ agents, onAdd, onRemove }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', avatarColor: COLORS[5] })
  const [showPicker, setShowPicker] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [apiToken, setApiToken] = useState(() => localStorage.getItem('chatwoot_api_token') || '')
  const [showTokenInput, setShowTokenInput] = useState(false)

  const CHATWOOT_HOST = 'https://chat.izzy.app.br'

  function getAccountId() {
    try {
      const ctx = JSON.parse(sessionStorage.getItem('chatwoot.context') || '{}')
      return ctx.accountId
    } catch { return null }
  }

  async function importFromChatwoot() {
    const accountId = getAccountId()
    if (!accountId) {
      setImportError('Account ID não encontrado. Abra o app dentro do Chatwoot primeiro.')
      return
    }
    if (!apiToken.trim()) {
      setShowTokenInput(true)
      return
    }

    setImporting(true)
    setImportError('')

    try {
      const res = await fetch(`${CHATWOOT_HOST}/api/v1/accounts/${accountId}/agents`, {
        headers: {
          'api_access_token': apiToken.trim(),
          'Content-Type': 'application/json',
        }
      })

      if (!res.ok) {
        setImportError(`Erro ${res.status}: verifique o token de acesso.`)
        setImporting(false)
        return
      }

      const data = await res.json()
      const existingNames = new Set(agents.map(a => a.name.toLowerCase()))
      let added = 0

      for (const agent of data) {
        if (!existingNames.has(agent.name.toLowerCase())) {
          await onAdd({
            name: agent.name,
            email: agent.email || '',
            phone: '',
            avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
          })
          added++
        }
      }

      if (added === 0) setImportError('Todos os agentes já estão cadastrados.')
      else setImportError(`${added} agente(s) importado(s) com sucesso!`)
    } catch (e) {
      setImportError('Erro de conexão. Verifique o token e tente novamente.')
    }

    setImporting(false)
  }

  function saveToken() {
    localStorage.setItem('chatwoot_api_token', apiToken)
    setShowTokenInput(false)
    importFromChatwoot()
  }

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onAdd(form)
    setForm({ name: '', email: '', phone: '', avatarColor: COLORS[5] })
    setShowForm(false)
    setShowPicker(false)
  }

  function initials(name) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <SectionCard title="Responsáveis">
      {/* Botão importar */}
      <div className="agent-import-bar">
        <button
          type="button"
          className="btn-import"
          onClick={importFromChatwoot}
          disabled={importing}
        >
          {importing
            ? <><div className="btn-spinner" /> Importando...</>
            : <><Icon name="transfer" size={13} /> Importar do Chatwoot</>
          }
        </button>
        {importError && (
          <span className={`import-msg ${importError.includes('sucesso') ? 'success' : 'error'}`}>
            {importError}
          </span>
        )}
      </div>

      {/* Token input */}
      {showTokenInput && (
        <div className="token-form">
          <p className="token-hint">
            Acesse o Chatwoot → Configurações de Perfil → Copie o <strong>Access Token</strong>
          </p>
          <div className="inline-form-row">
            <input
              className="inline-input"
              placeholder="Cole seu API Access Token aqui"
              value={apiToken}
              onChange={e => setApiToken(e.target.value)}
              type="password"
            />
            <button type="button" className="btn-add-inline" onClick={saveToken}>
              <Icon name="check" size={13} />
            </button>
          </div>
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
        <button className="btn-add" onClick={() => setShowForm(true)}>
          <Icon name="plus" size={13} /> Adicionar manualmente
        </button>
      ) : (
        <form className="agent-form" onSubmit={submit}>
          <div className="agent-form-header">
            <div className="color-dropdown-wrap">
              <button type="button" className="agent-avatar-btn" style={{ background: form.avatarColor }} onClick={() => setShowPicker(v => !v)}>
                {form.name
                  ? <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                  : <Icon name="user" size={16} style={{ color: '#fff' }} />
                }
              </button>
              {showPicker && (
                <div className="color-dropdown-menu">
                  {COLORS.map(c => (
                    <button key={c} type="button" className={`color-menu-item ${form.avatarColor === c ? 'selected' : ''}`}
                      style={{ background: c }} onClick={() => { setForm(p => ({ ...p, avatarColor: c })); setShowPicker(false) }} />
                  ))}
                </div>
              )}
            </div>
            <div className="agent-form-fields">
              <input className="agent-input" placeholder="Nome completo *" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              <div className="agent-form-row">
                <input className="agent-input" placeholder="E-mail" type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                <input className="agent-input" placeholder="Telefone" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
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

export default function Settings({ categories, types, statuses, agents, onAddCategory, onRemoveCategory, onAddType, onRemoveType, onAddStatus, onRemoveStatus, onAddAgent, onRemoveAgent }) {
  return (
    <div className="settings-wrap">
      <h2>Configurações</h2>
      <div className="settings-grid">
        <CategoryManager categories={categories} onAdd={onAddCategory} onRemove={onRemoveCategory} />
        <TypeManager types={types} onAdd={onAddType} onRemove={onRemoveType} />
        <StatusManager statuses={statuses} onAdd={onAddStatus} onRemove={onRemoveStatus} />
        <AgentManager agents={agents} onAdd={onAddAgent} onRemove={onRemoveAgent} />
      </div>
    </div>
  )
}
