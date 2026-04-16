import { useState, useEffect } from 'react'
import { DEFAULT_CATEGORIES, DEFAULT_TYPES, STATUSES } from '../data/defaults'

const KEYS = {
  tickets: 'tm-tickets',
  categories: 'tm-categories',
  types: 'tm-types',
}

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback }
  catch { return fallback }
}

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

export function useStore() {
  const [tickets, setTickets] = useState(() => load(KEYS.tickets, []))
  const [categories, setCategories] = useState(() => load(KEYS.categories, DEFAULT_CATEGORIES))
  const [types, setTypes] = useState(() => load(KEYS.types, DEFAULT_TYPES))

  useEffect(() => { save(KEYS.tickets, tickets) }, [tickets])
  useEffect(() => { save(KEYS.categories, categories) }, [categories])
  useEffect(() => { save(KEYS.types, types) }, [types])

  // --- Tickets ---
  function createTicket(data) {
    const ticket = {
      id: crypto.randomUUID(),
      ...data,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: crypto.randomUUID(),
          type: 'status_change',
          content: 'Ticket criado',
          status: 'open',
          author: data.assignee || 'Sistema',
          createdAt: new Date().toISOString(),
        }
      ],
    }
    setTickets(prev => [ticket, ...prev])
    return ticket
  }

  function updateTicket(id, changes) {
    setTickets(prev => prev.map(t => {
      if (t.id !== id) return t
      const events = []
      if (changes.status && changes.status !== t.status) {
        const statusObj = STATUSES.find(s => s.id === changes.status)
        events.push({
          id: crypto.randomUUID(),
          type: 'status_change',
          content: `Status alterado para "${statusObj?.label || changes.status}"`,
          status: changes.status,
          author: changes._author || 'Sistema',
          createdAt: new Date().toISOString(),
        })
      }
      return {
        ...t,
        ...changes,
        updatedAt: new Date().toISOString(),
        timeline: [...(t.timeline || []), ...events],
      }
    }))
  }

  function deleteTicket(id) {
    setTickets(prev => prev.filter(t => t.id !== id))
  }

  function addAction(ticketId, action) {
    const entry = {
      id: crypto.randomUUID(),
      type: 'action',
      actionType: action.actionType,
      content: action.content,
      author: action.author,
      createdAt: new Date().toISOString(),
    }
    setTickets(prev => prev.map(t =>
      t.id === ticketId
        ? { ...t, timeline: [...(t.timeline || []), entry], updatedAt: new Date().toISOString() }
        : t
    ))
  }

  // --- Settings ---
  function addCategory(cat) {
    setCategories(prev => [...prev, { id: crypto.randomUUID(), ...cat }])
  }
  function removeCategory(id) {
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  function addType(type) {
    setTypes(prev => [...prev, { id: crypto.randomUUID(), ...type }])
  }
  function removeType(id) {
    setTypes(prev => prev.filter(t => t.id !== id))
  }

  return {
    tickets, categories, types,
    createTicket, updateTicket, deleteTicket, addAction,
    addCategory, removeCategory, addType, removeType,
  }
}
