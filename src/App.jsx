import React, { useState } from 'react'
import { useStore } from './store/useStore'
import { STATUSES } from './data/defaults'
import TicketForm from './components/TicketForm'
import TicketList from './components/TicketList'
import TicketDetail from './components/TicketDetail'
import Settings from './components/Settings'
import Icon from './components/Icon'
import './App.css'

export default function App() {
  const store = useStore()
  const [view, setView] = useState('list')
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const selectedTicket = store.tickets.find(t => t.id === selectedId)

  function handleCreate(data) {
    store.createTicket(data)
    setView('list')
  }

  function openDetail(ticket) {
    setSelectedId(ticket.id)
    setView('detail')
  }

  const filtered = store.tickets.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      t.title?.toLowerCase().includes(q) ||
      t.clientName?.toLowerCase().includes(q) ||
      t.assignee?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const counts = { all: store.tickets.length }
  STATUSES.forEach(s => { counts[s.id] = store.tickets.filter(t => t.status === s.id).length })

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Icon name="ticket" size={20} />
          <span>Tickets</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${view !== 'settings' && filter === 'all' ? 'active' : ''}`}
            onClick={() => { setFilter('all'); setView('list') }}
          >
            <Icon name="all" size={15} />
            <span>Todos os tickets</span>
            <span className="nav-badge">{counts.all}</span>
          </button>

          <div className="nav-section-label">Por status</div>

          {STATUSES.map(s => (
            <button
              key={s.id}
              className={`nav-item ${view === 'list' && filter === s.id ? 'active' : ''}`}
              onClick={() => { setFilter(s.id); setView('list') }}
            >
              <span className="nav-dot" style={{ background: s.color }} />
              {s.label}
              <span className="nav-badge">{counts[s.id] || 0}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${view === 'settings' ? 'active' : ''}`}
            onClick={() => setView('settings')}
          >
            <Icon name="settings" size={15} />
            <span>Configurações</span>
          </button>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          {view === 'list' && (
            <div className="search-wrap">
              <Icon name="search" size={14} className="search-icon" />
              <input
                className="search-input"
                placeholder="Buscar por título, cliente ou responsável..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}
          {view !== 'settings' && view !== 'new' && (
            <button className="btn-primary" onClick={() => setView('new')}>
              <Icon name="plus" size={14} />
              Novo Ticket
            </button>
          )}
        </header>

        <main className="main">
          {view === 'new' && (
            <TicketForm
              categories={store.categories}
              types={store.types}
              onSubmit={handleCreate}
              onCancel={() => setView('list')}
            />
          )}

          {view === 'detail' && selectedTicket && (
            <TicketDetail
              ticket={selectedTicket}
              categories={store.categories}
              types={store.types}
              onBack={() => setView('list')}
              onUpdate={(id, changes) => store.updateTicket(id, changes)}
              onDelete={(id) => { store.deleteTicket(id); setView('list') }}
              onAction={(id, action) => store.addAction(id, action)}
            />
          )}

          {view === 'list' && (
            <TicketList
              tickets={filtered}
              categories={store.categories}
              types={store.types}
              onSelect={openDetail}
            />
          )}

          {view === 'settings' && (
            <Settings
              categories={store.categories}
              types={store.types}
              onAddCategory={store.addCategory}
              onRemoveCategory={store.removeCategory}
              onAddType={store.addType}
              onRemoveType={store.removeType}
            />
          )}
        </main>
      </div>
    </div>
  )
}
