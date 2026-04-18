import React, { useState, useCallback } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from './store/useStore'
import TicketList from './components/TicketList'
import TicketDetail from './components/TicketDetail'
import Settings from './components/Settings'
import Icon from './components/Icon'
import { useChatwoot } from './hooks/useChatwoot'
import NovoTicket from './pages/NovoTicket'
import FecharTicket from './pages/FecharTicket'
import VerificarTicket from './pages/VerificarTicket'
import Relatorios from './pages/Relatorios'
import { exportTableToPdf, exportElementToPdf } from './lib/exportPdf'
import { useSetting } from './hooks/useSettings'
import './App.css'
import './pages/PageLoading.css'

function NavGroup({ label, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="nav-group">
      <button className="nav-group-header" onClick={() => setOpen(v => !v)}>
        <Icon name={icon} size={14} />
        <span>{label}</span>
        <span className={`nav-chevron ${open ? 'open' : ''}`}>
          <Icon name="back" size={11} style={{ transform: open ? 'rotate(-90deg)' : 'rotate(-180deg)', transition: 'transform 0.2s' }} />
        </span>
      </button>
      {open && <div className="nav-group-items">{children}</div>}
    </div>
  )
}

function Layout({ children, store, filter, setFilter, search, setSearch, onExport }) {
  const navigate = useNavigate()
  const location = useLocation()
  // Inicializar sidebar fechada em mobile, aberta em desktop
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)
  const isSettings = location.pathname === '/settings'
  const isList = location.pathname === '/'

  const counts = { all: store.tickets.length }
  store.statuses.forEach(s => {
    counts[s.id] = store.tickets.filter(t => t.status === s.id).length
  })

  // Fechar sidebar ao clicar no overlay (mobile)
  const handleOverlayClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="app">
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={handleOverlayClick}
        />
      )}
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-logo">
          <Icon name="ticket" size={20} />
          <span>Tickets</span>
        </div>

        <nav className="sidebar-nav">
          {/* Tickets */}
          <NavGroup label="Tickets" icon="ticket" defaultOpen={true}>
            <button
              className={`nav-item ${isList && filter === 'all' ? 'active' : ''}`}
              onClick={() => { setFilter('all'); navigate('/') }}
            >
              <Icon name="all" size={13} />
              <span>Todos</span>
              <span className="nav-badge">{counts.all}</span>
            </button>
            {store.statuses.map(s => (
              <button
                key={s.id}
                className={`nav-item ${isList && filter === s.id ? 'active' : ''}`}
                onClick={() => { setFilter(s.id); navigate('/') }}
              >
                <span className="nav-dot" style={{ background: s.color }} />
                <span>{s.label}</span>
                <span className="nav-badge">{counts[s.id] || 0}</span>
              </button>
            ))}
          </NavGroup>

          {/* Relatórios */}
          <NavGroup label="Relatórios" icon="star">
            <button
              className={`nav-item ${location.pathname === '/relatorios' ? 'active' : ''}`}
              onClick={() => navigate('/relatorios')}
            >
              <Icon name="zap" size={13} />
              <span>Visão Geral</span>
            </button>
          </NavGroup>

          {/* Configurações */}
          <NavGroup label="Configurações" icon="settings">
            <button
              className={`nav-item ${isSettings ? 'active' : ''}`}
              onClick={() => navigate('/settings')}
            >
              <Icon name="tool" size={13} />
              <span>Tipos, Categorias e Status</span>
            </button>
          </NavGroup>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-version">v1.0.0</div>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <button 
            className="hamburger-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            <Icon name="menu" size={16} />
          </button>
          
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
          {location.pathname !== '/novo' && (
            <div className="topbar-actions">
              {isList && onExport && (
                <button className="btn-export-top" onClick={onExport}>
                  <Icon name="fileEdit" size={13} />
                  Exportar PDF
                </button>
              )}
              <button className="btn-primary" onClick={() => navigate('/novo')}>
                <Icon name="plus" size={14} />
                Novo Ticket
              </button>
            </div>
          )}
        </header>

        <main className="main">
          {children}
        </main>
      </div>
    </div>
  )
}

function SummaryCards({ tickets, statuses, visibleCards, onToggleCard }) {
  const total = tickets.length
  const byStatus = {}
  statuses.forEach(s => { byStatus[s.id] = tickets.filter(t => t.status === s.id).length })
  const critical = tickets.filter(t => t.priority === 'critical' && t.status !== 'closed').length
  const overdue = tickets.filter(t => t.deadline && !t.deadlineIndeterminate && new Date(t.deadline) < new Date() && t.status !== 'closed').length
  const statusIcons = ['inbox', 'zap', 'message', 'checkCircle', 'arrowUp', 'star']

  const allCards = [
    { id: 'total', label: 'Total de Chamados' },
    ...statuses.map(s => ({ id: `status_${s.id}`, label: s.label })),
    { id: 'critical', label: 'Críticos Abertos' },
    { id: 'overdue', label: 'Prazo Vencido' },
  ]

  const show = (id) => !visibleCards || visibleCards.includes(id)

  return (
    <div className="summary-cards-wrap">
      <div className="summary-cards">
        {show('total') && (
          <div className="summary-card sc-total">
            <div className="sc-icon-wrap" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
              <Icon name="ticket" size={18} style={{ color: '#fff' }} />
            </div>
            <div className="sc-info">
              <span className="sc-value">{total}</span>
              <span className="sc-label">Total de Chamados</span>
            </div>
            <div className="sc-bg-icon"><Icon name="ticket" size={52} style={{ color: '#6366f1', opacity: 0.06 }} /></div>
          </div>
        )}

        {statuses.map((s, i) => show(`status_${s.id}`) && (
          <div key={s.id} className="summary-card" style={{ borderTopColor: s.color }}>
            <div className="sc-icon-wrap" style={{ background: s.color + '22' }}>
              <Icon name={statusIcons[i % statusIcons.length]} size={18} style={{ color: s.color }} />
            </div>
            <div className="sc-info">
              <span className="sc-value" style={{ color: s.color }}>{byStatus[s.id] || 0}</span>
              <span className="sc-label">{s.label}</span>
            </div>
            <div className="sc-bg-icon"><Icon name={statusIcons[i % statusIcons.length]} size={52} style={{ color: s.color, opacity: 0.06 }} /></div>
          </div>
        ))}

        {show('critical') && (
          <div className="summary-card" style={{ borderTopColor: '#ef4444' }}>
            <div className="sc-icon-wrap" style={{ background: '#ef444422' }}>
              <Icon name="alert" size={18} style={{ color: '#ef4444' }} />
            </div>
            <div className="sc-info">
              <span className="sc-value" style={{ color: critical > 0 ? '#ef4444' : '#334155' }}>{critical}</span>
              <span className="sc-label">Críticos Abertos</span>
            </div>
            <div className="sc-bg-icon"><Icon name="alert" size={52} style={{ color: '#ef4444', opacity: 0.06 }} /></div>
          </div>
        )}

        {show('overdue') && (
          <div className="summary-card" style={{ borderTopColor: '#f97316' }}>
            <div className="sc-icon-wrap" style={{ background: '#f9731622' }}>
              <Icon name="clock" size={18} style={{ color: '#f97316' }} />
            </div>
            <div className="sc-info">
              <span className="sc-value" style={{ color: overdue > 0 ? '#f97316' : '#334155' }}>{overdue}</span>
              <span className="sc-label">Prazo Vencido</span>
            </div>
            <div className="sc-bg-icon"><Icon name="clock" size={52} style={{ color: '#f97316', opacity: 0.06 }} /></div>
          </div>
        )}
      </div>
    </div>
  )
}

function ListaTickets({ store, filter, search, setFilter, selectedId, setSelectedId }) {
  const [clientFilter, setClientFilter] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDrop, setShowClientDrop] = useState(false)
  const [showCardConfig, setShowCardConfig] = useState(false)
  const clientRef = React.useRef()
  const cardConfigRef = React.useRef()

  const allCardIds = React.useMemo(() => {
    const ids = ['total', ...store.statuses.map(s => `status_${s.id}`), 'critical', 'overdue']
    return ids
  }, [store.statuses])

  const { value: visibleCards, save: saveCards, clear: resetCards } = useSetting('dashboard_visible_cards', null)

  function toggleCard(id) {
    const current = visibleCards || allCardIds
    const next = current.includes(id) ? current.filter(c => c !== id) : [...current, id]
    saveCards(next)
  }

  React.useEffect(() => {
    function handleClick(e) {
      if (clientRef.current && !clientRef.current.contains(e.target)) setShowClientDrop(false)
      if (cardConfigRef.current && !cardConfigRef.current.contains(e.target)) setShowCardConfig(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Lista única de clientes
  const clients = React.useMemo(() => {
    const names = [...new Set(store.tickets.map(t => t.clientName).filter(Boolean))].sort()
    return names
  }, [store.tickets])

  const filteredClients = clients.filter(c =>
    c.toLowerCase().includes(clientSearch.toLowerCase())
  )

  if (store.loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Carregando tickets...</p>
      </div>
    )
  }

  // Abre detalhe ANTES de calcular filtered
  if (selectedId) {
    const ticket = store.tickets.find(t => t.id === selectedId)
    if (ticket) {
      return (
        <TicketDetail
          ticket={ticket}
          categories={store.categories}
          types={store.types}
          statuses={store.statuses}
          onBack={() => setSelectedId(null)}
          onUpdate={(id, changes) => store.updateTicket(id, changes)}
          onDelete={(id) => { store.deleteTicket(id); setSelectedId(null) }}
          onAction={(id, action) => store.addAction(id, action)}
          onAddChecklist={(ticketId, text) => store.addChecklistItem(ticketId, text)}
          onToggleChecklist={(itemId, checked) => store.toggleChecklistItem(itemId, checked)}
          onRemoveChecklist={(itemId) => store.removeChecklistItem(itemId)}
          onAddComment={(ticketId, comment) => store.addComment(ticketId, comment)}
          onRemoveComment={(commentId) => store.removeComment(commentId)}
          onAddAttachment={(ticketId, file, author) => store.addAttachment(ticketId, file, author)}
          onRemoveAttachment={(attachmentId, fileUrl) => store.removeAttachment(attachmentId, fileUrl)}
        />
      )
    }
    // Ticket não encontrado, volta para lista
    setSelectedId(null)
  }

  const filtered = store.tickets.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      t.title?.toLowerCase().includes(q) ||
      t.clientName?.toLowerCase().includes(q) ||
      t.assignee?.toLowerCase().includes(q) ||
      (t.ticketNumber && `#${String(t.ticketNumber).padStart(4, '0')}`.includes(q)) ||
      (t.ticketNumber && String(t.ticketNumber).includes(q.replace('#', '')))

    let matchFilter = true
    if (filter === '__critical') matchFilter = t.priority === 'critical' && t.status !== 'closed'
    else if (filter === '__overdue') matchFilter = t.deadline && !t.deadlineIndeterminate && new Date(t.deadline) < new Date() && t.status !== 'closed'
    else if (filter !== 'all') matchFilter = t.status === filter

    const matchClient = !clientFilter || t.clientName === clientFilter

    return matchFilter && matchSearch && matchClient
  })

  const counts = { all: store.tickets.length }
  store.statuses.forEach(s => { counts[s.id] = store.tickets.filter(t => t.status === s.id).length })

  return (
    <>
      <SummaryCards tickets={store.tickets} statuses={store.statuses} visibleCards={visibleCards} />

      {/* Barra: filtros + configurar visualização */}
      <div className="dashboard-bar">
        <div className="quick-filters">
          <button
            className={`qf-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <Icon name="all" size={13} />
            Todos
            <span className="qf-count">{counts.all}</span>
          </button>

        {store.statuses.map(s => (
          <button
            key={s.id}
            className={`qf-btn ${filter === s.id ? 'active' : ''}`}
            style={filter === s.id ? { borderColor: s.color, color: s.color, background: s.color + '15' } : {}}
            onClick={() => setFilter(s.id)}
          >
            <span className="qf-dot" style={{ background: s.color }} />
            {s.label}
            <span className="qf-count">{counts[s.id] || 0}</span>
          </button>
        ))}

        <div className="qf-separator" />

        <button
          className={`qf-btn ${filter === '__critical' ? 'active' : ''}`}
          style={filter === '__critical' ? { borderColor: '#ef4444', color: '#ef4444', background: '#ef444415' } : {}}
          onClick={() => setFilter(filter === '__critical' ? 'all' : '__critical')}
        >
          <Icon name="alert" size={13} style={{ color: '#ef4444' }} />
          Críticos
          <span className="qf-count">{store.tickets.filter(t => t.priority === 'critical' && t.status !== 'closed').length}</span>
        </button>

        <button
          className={`qf-btn ${filter === '__overdue' ? 'active' : ''}`}
          style={filter === '__overdue' ? { borderColor: '#f97316', color: '#f97316', background: '#f9731615' } : {}}
          onClick={() => setFilter(filter === '__overdue' ? 'all' : '__overdue')}
        >
          <Icon name="clock" size={13} style={{ color: '#f97316' }} />
          Vencidos
          <span className="qf-count">{store.tickets.filter(t => t.deadline && !t.deadlineIndeterminate && new Date(t.deadline) < new Date() && t.status !== 'closed').length}</span>
        </button>

        <div className="qf-separator" />

        {/* Filtro por cliente */}
        <div className="qf-client-wrap" ref={clientRef}>
          <button
            className={`qf-btn qf-client-btn ${clientFilter ? 'active' : ''}`}
            style={clientFilter ? { borderColor: '#6366f1', color: '#a5b4fc', background: '#6366f115' } : {}}
            onClick={() => setShowClientDrop(v => !v)}
          >
            <Icon name="user" size={13} />
            {clientFilter || 'Cliente'}
            {clientFilter && (
              <span
                className="qf-clear"
                onClick={e => { e.stopPropagation(); setClientFilter(''); setClientSearch('') }}
              >
                <Icon name="close" size={10} />
              </span>
            )}
          </button>

          {showClientDrop && (
            <div className="qf-client-dropdown">
              <div className="qf-client-search">
                <Icon name="search" size={13} style={{ color: '#475569', flexShrink: 0 }} />
                <input
                  autoFocus
                  placeholder="Buscar cliente..."
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                />
              </div>
              <div className="qf-client-list">
                {filteredClients.length === 0 && (
                  <p className="qf-client-empty">Nenhum cliente encontrado</p>
                )}
                {filteredClients.map(c => (
                  <button
                    key={c}
                    className={`qf-client-item ${clientFilter === c ? 'selected' : ''}`}
                    onClick={() => { setClientFilter(c); setClientSearch(''); setShowClientDrop(false) }}
                  >
                    <Icon name="user" size={12} style={{ color: '#475569', flexShrink: 0 }} />
                    {c}
                    {clientFilter === c && <Icon name="check" size={12} style={{ color: '#6366f1', marginLeft: 'auto' }} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>{/* end quick-filters */}

        {/* Botão configurar visualização */}
        <div className="card-config-wrap" ref={cardConfigRef}>
          <button
            className={`btn-card-config ${showCardConfig ? 'active' : ''}`}
            onClick={() => setShowCardConfig(v => !v)}
          >
            <Icon name="settings" size={13} />
            Visualização
          </button>
          {showCardConfig && (
            <div className="card-config-dropdown">
              <div className="card-config-header">
                <span>Exibir cards</span>
                <button className="card-config-reset" onClick={resetCards}>Restaurar</button>
              </div>
              {[
                { id: 'total', label: 'Total de Chamados' },
                ...store.statuses.map(s => ({ id: `status_${s.id}`, label: s.label })),
                { id: 'critical', label: 'Críticos Abertos' },
                { id: 'overdue', label: 'Prazo Vencido' },
              ].map(card => {
                const active = !visibleCards || visibleCards.includes(card.id)
                return (
                  <label key={card.id} className="card-config-item">
                    <span className={`card-config-check ${active ? 'on' : ''}`}>
                      {active && <Icon name="check" size={10} />}
                    </span>
                    <span>{card.label}</span>
                    <input type="checkbox" checked={active} onChange={() => toggleCard(card.id)} style={{ display: 'none' }} />
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <TicketList
        tickets={filtered}
        categories={store.categories}
        types={store.types}
        statuses={store.statuses}
        onSelect={t => setSelectedId(t.id)}
      />
    </>
  )
}

export default function App() {
  const store = useStore()
  const location = useLocation()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const addLog = useCallback((msg) => {
    console.log(`[Chatwoot] ${msg}`)
  }, [])

  const { data: chatwoot } = useChatwoot(addLog)

  function handleExport() {
    const tickets = store.tickets
    exportTableToPdf(tickets, store.categories, store.types, store.statuses, 'tickets.pdf')
  }

  return (
    <Layout store={store} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} onExport={handleExport}>
      <Routes>
        <Route path="/" element={
          <ListaTickets
            store={store}
            filter={filter}
            search={search}
            setFilter={setFilter}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
        } />
        <Route path="/novo" element={<NovoTicket store={store} />} />
        <Route path="/fechar" element={<FecharTicket store={store} />} />
        <Route path="/verificar" element={<VerificarTicket store={store} />} />
        <Route path="/relatorios" element={<Relatorios store={store} />} />
        <Route path="/settings" element={
          <Settings
            categories={store.categories}
            types={store.types}
            statuses={store.statuses}
            agents={store.agents}
            onAddCategory={store.addCategory}
            onRemoveCategory={store.removeCategory}
            onAddType={store.addType}
            onRemoveType={store.removeType}
            onAddStatus={store.addStatus}
            onRemoveStatus={store.removeStatus}
            onAddAgent={store.addAgent}
            onBulkAddAgents={store.bulkAddAgents}
            onRemoveAgent={store.removeAgent}
          />
        } />
      </Routes>
    </Layout>
  )
}
