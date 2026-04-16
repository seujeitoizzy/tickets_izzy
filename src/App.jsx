import React, { useState, useCallback } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from './store/useStore'
import { STATUSES } from './data/defaults'
import TicketForm from './components/TicketForm'
import TicketList from './components/TicketList'
import TicketDetail from './components/TicketDetail'
import Settings from './components/Settings'
import Icon from './components/Icon'
import { useChatwoot } from './hooks/useChatwoot'
import NovoTicket from './pages/NovoTicket'
import FecharTicket from './pages/FecharTicket'
import VerificarTicket from './pages/VerificarTicket'
import './App.css'

function Layout({ children, store, view, setView, filter, setFilter, search, setSearch, chatwoot }) {
  const navigate = useNavigate()
  const location = useLocation()

  const counts = { all: store.tickets.length }
  STATUSES.forEach(s => { counts[s.id] = store.tickets.filter(t => t.status === s.id).length })

  const isSettings = location.pathname === '/settings'
  const isList = location.pathname === '/'

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Icon name="ticket" size={20} />
          <span>Tickets</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${isList && filter === 'all' ? 'active' : ''}`}
            onClick={() => { setFilter('all'); navigate('/') }}
          >
            <Icon name="all" size={15} />
            <span>Todos os tickets</span>
            <span className="nav-badge">{counts.all}</span>
          </button>

          <div className="nav-section-label">Por status</div>

          {STATUSES.map(s => (
            <button
              key={s.id}
              className={`nav-item ${isList && filter === s.id ? 'active' : ''}`}
              onClick={() => { setFilter(s.id); navigate('/') }}
            >
              <span className="nav-dot" style={{ background: s.color }} />
              {s.label}
              <span className="nav-badge">{counts[s.id] || 0}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${isSettings ? 'active' : ''}`}
            onClick={() => navigate('/settings')}
          >
            <Icon name="settings" size={15} />
            <span>Configurações</span>
          </button>
          <div className="sidebar-version">v1.0.16</div>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          {isList && (
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
          {!isSettings && location.pathname !== '/novo' && (
            <button className="btn-primary" onClick={() => navigate('/novo')}>
              <Icon name="plus" size={14} />
              Novo Ticket
            </button>
          )}
        </header>

        <main className="main">
          {children}
        </main>
      </div>
    </div>
  )
}

function ListaTickets({ store, filter, search }) {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(null)

  const filtered = store.tickets.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      t.title?.toLowerCase().includes(q) ||
      t.clientName?.toLowerCase().includes(q) ||
      t.assignee?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  if (selectedId) {
    const ticket = store.tickets.find(t => t.id === selectedId)
    if (ticket) {
      return (
        <TicketDetail
          ticket={ticket}
          categories={store.categories}
          types={store.types}
          onBack={() => setSelectedId(null)}
          onUpdate={(id, changes) => store.updateTicket(id, changes)}
          onDelete={(id) => { store.deleteTicket(id); setSelectedId(null) }}
          onAction={(id, action) => store.addAction(id, action)}
        />
      )
    }
  }

  return (
    <TicketList
      tickets={filtered}
      categories={store.categories}
      types={store.types}
      onSelect={t => setSelectedId(t.id)}
    />
  )
}

export default function App() {
  const store = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const addLog = useCallback((msg) => {
    console.log(`[Chatwoot] ${msg}`)
  }, [])

  const { data: chatwoot } = useChatwoot(addLog)

  return (
    <Layout store={store} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} chatwoot={chatwoot}>
      <Routes>
        <Route path="/" element={<ListaTickets store={store} filter={filter} search={search} />} />
        <Route path="/novo" element={<NovoTicket />} />
        <Route path="/fechar" element={<FecharTicket />} />
        <Route path="/verificar" element={<VerificarTicket />} />
        <Route path="/settings" element={
          <Settings
            categories={store.categories}
            types={store.types}
            onAddCategory={store.addCategory}
            onRemoveCategory={store.removeCategory}
            onAddType={store.addType}
            onRemoveType={store.removeType}
          />
        } />
      </Routes>
    </Layout>
  )
}
