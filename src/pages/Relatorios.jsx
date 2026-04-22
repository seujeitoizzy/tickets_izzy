import React, { useState, useMemo, useRef } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import Icon from '../components/Icon'
import { exportProfessionalReport, exportToExcel } from '../lib/exportPdf'
import './Relatorios.css'

const PERIODS = [
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: '90d', label: '90 dias' },
]

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '18', color }}>
        <Icon name={icon} size={18} />
      </div>
      <div className="stat-info">
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return <h3 className="report-section-title">{children}</h3>
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

export default function Relatorios({ store }) {
  const [period, setPeriod] = useState('30d')

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90

  const stats = useMemo(() => {
    const now = new Date()
    const cutoff = new Date(now - days * 86400000)
    const tickets = store.tickets

    const inPeriod = tickets.filter(t => new Date(t.createdAt) >= cutoff)
    const closed = tickets.filter(t => t.status === 'closed')
    const closedInPeriod = inPeriod.filter(t => t.status === 'closed')
    const open = tickets.filter(t => t.status !== 'closed')
    const critical = tickets.filter(t => t.priority === 'critical' && t.status !== 'closed')

    // Tempo médio de resolução (em horas)
    const resolved = tickets.filter(t => t.status === 'closed' && t.createdAt && t.updatedAt)
    const avgResolutionHours = resolved.length
      ? Math.round(resolved.reduce((acc, t) => {
          return acc + (new Date(t.updatedAt) - new Date(t.createdAt)) / 3600000
        }, 0) / resolved.length)
      : 0

    // Volume por dia
    const volumeMap = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000)
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      volumeMap[key] = { date: key, criados: 0, fechados: 0 }
    }
    tickets.forEach(t => {
      const d = new Date(t.createdAt)
      if (d >= cutoff) {
        const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        if (volumeMap[key]) volumeMap[key].criados++
      }
      if (t.status === 'closed') {
        const d2 = new Date(t.updatedAt)
        if (d2 >= cutoff) {
          const key = d2.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          if (volumeMap[key]) volumeMap[key].fechados++
        }
      }
    })
    const volumeData = Object.values(volumeMap)

    // Por status
    const statusData = store.statuses.map(s => ({
      name: s.label,
      value: tickets.filter(t => t.status === s.id).length,
      color: s.color,
    })).filter(s => s.value > 0)

    // Por categoria
    const catData = store.categories.map(c => ({
      name: c.label,
      total: tickets.filter(t => t.categoryId === c.id).length,
      color: c.color,
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

    // Por prioridade
    const prioData = [
      { name: 'Crítica', value: tickets.filter(t => t.priority === 'critical').length, color: '#ef4444' },
      { name: 'Alta',    value: tickets.filter(t => t.priority === 'high').length,     color: '#f97316' },
      { name: 'Média',   value: tickets.filter(t => t.priority === 'medium').length,   color: '#f59e0b' },
      { name: 'Baixa',   value: tickets.filter(t => t.priority === 'low').length,      color: '#22c55e' },
    ].filter(p => p.value > 0)

    // Por agente
    const agentMap = {}
    tickets.forEach(t => {
      if (!t.assignee) return
      if (!agentMap[t.assignee]) agentMap[t.assignee] = { name: t.assignee, abertos: 0, fechados: 0 }
      if (t.status === 'closed') agentMap[t.assignee].fechados++
      else agentMap[t.assignee].abertos++
    })
    const agentData = Object.values(agentMap).sort((a, b) => (b.abertos + b.fechados) - (a.abertos + a.fechados)).slice(0, 8)

    // Top clientes
    const clientMap = {}
    tickets.forEach(t => {
      if (!t.clientName) return
      if (!clientMap[t.clientName]) clientMap[t.clientName] = { name: t.clientName, total: 0, abertos: 0 }
      clientMap[t.clientName].total++
      if (t.status !== 'closed') clientMap[t.clientName].abertos++
    })
    const clientData = Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 8)

    const resolutionRate = tickets.length ? Math.round((closed.length / tickets.length) * 100) : 0

    return {
      total: tickets.length,
      inPeriod: inPeriod.length,
      open: open.length,
      closed: closed.length,
      closedInPeriod: closedInPeriod.length,
      critical: critical.length,
      avgResolutionHours,
      resolutionRate,
      volumeData,
      statusData,
      catData,
      prioData,
      agentData,
      clientData,
    }
  }, [store.tickets, store.statuses, store.categories, period])

  if (store.loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="relatorios-wrap" id="relatorios-content">
      <div className="relatorios-header">
        <h2>Relatórios</h2>
        <div className="relatorios-header-right">
          <div className="period-tabs">
            {PERIODS.map(p => (
              <button key={p.id} className={`period-tab ${period === p.id ? 'active' : ''}`} onClick={() => setPeriod(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
          <button
            className="btn-export"
            onClick={() => {
              exportProfessionalReport(
                stats,
                store.tickets,
                store.categories,
                store.types,
                store.statuses,
                period,
                `relatorio-${period}-${new Date().toISOString().split('T')[0]}.pdf`
              )
            }}
          >
            <Icon name="fileEdit" size={14} />
            Exportar PDF
          </button>
          <button
            className="btn-export btn-export-excel-rel"
            onClick={() => exportToExcel(
              store.tickets,
              store.categories,
              store.types,
              store.statuses,
              `relatorio-${period}-${new Date().toISOString().split('T')[0]}.xlsx`
            )}
          >
            <Icon name="fileEdit" size={14} />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid">
        <StatCard label="Total de Tickets" value={stats.total} sub={`+${stats.inPeriod} no período`} color="#6366f1" icon="ticket" />
        <StatCard label="Em Aberto" value={stats.open} sub="aguardando resolução" color="#60a5fa" icon="inbox" />
        <StatCard label="Fechados" value={stats.closed} sub={`${stats.resolutionRate}% taxa de resolução`} color="#4ade80" icon="checkCircle" />
        <StatCard label="Críticos Abertos" value={stats.critical} sub="requerem atenção" color="#ef4444" icon="alert" />
        <StatCard label="Tempo Médio" value={`${stats.avgResolutionHours}h`} sub="para resolução" color="#f59e0b" icon="clock" />
        <StatCard label="Fechados no Período" value={stats.closedInPeriod} sub={`últimos ${days} dias`} color="#a78bfa" icon="checkCircle" />
      </div>

      {/* Volume por dia */}
      <SectionTitle>Volume de Tickets — Últimos {days} dias</SectionTitle>
      <div className="chart-card">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={stats.volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCriados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradFechados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false}
              interval={days > 30 ? 6 : days > 7 ? 3 : 0} />
            <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
            <Area type="monotone" dataKey="criados" name="Criados" stroke="#6366f1" fill="url(#gradCriados)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="fechados" name="Fechados" stroke="#4ade80" fill="url(#gradFechados)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="charts-row">
        {/* Por status */}
        <div className="chart-card chart-card-sm">
          <h4>Por Status</h4>
          {stats.statusData.length === 0 ? <p className="chart-empty">Sem dados</p> : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {stats.statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por prioridade */}
        <div className="chart-card chart-card-sm">
          <h4>Por Prioridade</h4>
          {stats.prioData.length === 0 ? <p className="chart-empty">Sem dados</p> : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={stats.prioData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {stats.prioData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por categoria */}
        <div className="chart-card chart-card-sm">
          <h4>Por Categoria</h4>
          {stats.catData.length === 0 ? <p className="chart-empty">Sem dados</p> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.catData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Tickets" radius={[0, 4, 4, 0]}>
                  {stats.catData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Por agente */}
      {stats.agentData.length > 0 && (
        <>
          <SectionTitle>Tickets por Agente</SectionTitle>
          <div className="chart-card">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.agentData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                <Bar dataKey="abertos" name="Abertos" fill="#6366f1" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="fechados" name="Fechados" fill="#4ade80" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Top clientes */}
      {stats.clientData.length > 0 && (
        <>
          <SectionTitle>Top Clientes</SectionTitle>
          <div className="chart-card">
            <table className="client-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Em Aberto</th>
                  <th>Resolvidos</th>
                  <th>Taxa</th>
                </tr>
              </thead>
              <tbody>
                {stats.clientData.map((c, i) => {
                  const resolved = c.total - c.abertos
                  const rate = Math.round((resolved / c.total) * 100)
                  return (
                    <tr key={i}>
                      <td className="client-name">
                        <Icon name="user" size={12} style={{ color: '#475569' }} />
                        {c.name}
                      </td>
                      <td>{c.total}</td>
                      <td><span className="badge-open">{c.abertos}</span></td>
                      <td><span className="badge-closed">{resolved}</span></td>
                      <td>
                        <div className="rate-bar-wrap">
                          <div className="rate-bar" style={{ width: `${rate}%` }} />
                          <span>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
