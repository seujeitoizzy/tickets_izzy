import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_CATEGORIES, DEFAULT_TYPES, STATUSES } from '../data/defaults'

// Converte snake_case do banco para camelCase do app
function mapTicket(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    categoryId: row.category_id,
    typeId: row.type_id,
    assignee: row.assignee,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    chatwootLink: row.chatwoot_link,
    chatwootConversationId: row.chatwoot_conversation_id,
    chatwootAccountId: row.chatwoot_account_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    timeline: (row.ast_ticket_timeline || []).map(mapTimeline),
  }
}

function mapTimeline(row) {
  return {
    id: row.id,
    type: row.type,
    actionType: row.action_type,
    content: row.content,
    status: row.status,
    author: row.author,
    createdAt: row.created_at,
  }
}

function mapCategory(row) {
  return { id: row.id, label: row.label, color: row.color, icon: row.icon }
}

function mapType(row) {
  return { id: row.id, label: row.label, icon: row.icon }
}

export function useStore() {
  const [tickets, setTickets] = useState([])
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [types, setTypes] = useState(DEFAULT_TYPES)
  const [loading, setLoading] = useState(true)

  // Carrega tudo ao montar
  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      await Promise.all([fetchTickets(), fetchCategories(), fetchTypes()])
      setLoading(false)
    }
    fetchAll()

    // Realtime: re-busca tickets quando houver qualquer mudança nas tabelas
    const ticketSub = supabase
      .channel('ast_tickets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ast_tickets' }, () => {
        fetchTickets()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ast_ticket_timeline' }, () => {
        fetchTickets()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ticketSub)
    }
  }, [])

  async function fetchTickets() {
    const { data, error } = await supabase
      .from('ast_tickets')
      .select(`*, ast_ticket_timeline(*)`)
      .order('created_at', { ascending: false })

    if (error) { console.error('[fetchTickets]', error); return }
    setTickets(data.map(mapTicket))
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('ast_categories')
      .select('*')
      .order('created_at')

    if (error) { console.error('[fetchCategories]', error); return }
    if (data?.length) setCategories(data.map(mapCategory))
  }

  async function fetchTypes() {
    const { data, error } = await supabase
      .from('ast_ticket_types')
      .select('*')
      .order('created_at')

    if (error) { console.error('[fetchTypes]', error); return }
    if (data?.length) setTypes(data.map(mapType))
  }

  // --- Tickets ---
  async function createTicket(data) {
    const { data: row, error } = await supabase
      .from('ast_tickets')
      .insert({
        title: data.title,
        description: data.description || null,
        status: 'open',
        priority: data.priority || 'medium',
        category_id: data.categoryId || null,
        type_id: data.typeId || null,
        assignee: data.assignee || null,
        client_name: data.clientName || null,
        client_phone: data.clientPhone || null,
        chatwoot_link: data.chatwootLink || null,
        chatwoot_conversation_id: data.chatwootConversationId || null,
        chatwoot_account_id: data.chatwootAccountId || null,
      })
      .select()
      .single()

    if (error) { console.error('[createTicket]', error.message); return }

    await supabase.from('ast_ticket_timeline').insert({
      ticket_id: row.id,
      type: 'status_change',
      content: 'Ticket criado',
      status: 'open',
      author: data.assignee || 'Sistema',
    })

    await fetchTickets()
    return row
  }

  async function updateTicket(id, changes) {
    const ticket = tickets.find(t => t.id === id)
    if (!ticket) return

    const update = {}
    if (changes.title !== undefined)       update.title = changes.title
    if (changes.description !== undefined) update.description = changes.description
    if (changes.status !== undefined)      update.status = changes.status
    if (changes.priority !== undefined)    update.priority = changes.priority
    if (changes.categoryId !== undefined)  update.category_id = changes.categoryId
    if (changes.typeId !== undefined)      update.type_id = changes.typeId
    if (changes.assignee !== undefined)    update.assignee = changes.assignee
    if (changes.clientName !== undefined)  update.client_name = changes.clientName
    if (changes.chatwootLink !== undefined) update.chatwoot_link = changes.chatwootLink
    if (changes.chatwootConversationId !== undefined) update.chatwoot_conversation_id = changes.chatwootConversationId

    const { error } = await supabase
      .from('ast_tickets')
      .update(update)
      .eq('id', id)

    if (error) { console.error('[updateTicket]', error); return }

    // Registra mudança de status na timeline
    if (changes.status && changes.status !== ticket.status) {
      const statusObj = STATUSES.find(s => s.id === changes.status)
      await supabase.from('ast_ticket_timeline').insert({
        ticket_id: id,
        type: 'status_change',
        content: `Status alterado para "${statusObj?.label || changes.status}"`,
        status: changes.status,
        author: changes._author || 'Sistema',
      })
    }

    await fetchTickets()
  }

  async function deleteTicket(id) {
    const { error } = await supabase
      .from('ast_tickets')
      .delete()
      .eq('id', id)

    if (error) { console.error('[deleteTicket]', error); return }
    setTickets(prev => prev.filter(t => t.id !== id))
  }

  async function addAction(ticketId, action) {
    const { error } = await supabase.from('ast_ticket_timeline').insert({
      ticket_id: ticketId,
      type: 'action',
      action_type: action.actionType,
      content: action.content,
      author: action.author || null,
    })

    if (error) { console.error('[addAction]', error); return }
    await fetchTickets()
  }

  // --- Categories ---
  async function addCategory(cat) {
    const { error } = await supabase
      .from('ast_categories')
      .insert({ label: cat.label, color: cat.color, icon: cat.icon || 'pin' })

    if (error) { console.error('[addCategory]', error); return }
    await fetchCategories()
  }

  async function removeCategory(id) {
    const { error } = await supabase
      .from('ast_categories')
      .delete()
      .eq('id', id)

    if (error) { console.error('[removeCategory]', error); return }
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  // --- Types ---
  async function addType(type) {
    const { error } = await supabase
      .from('ast_ticket_types')
      .insert({ label: type.label, icon: type.icon || 'inbox' })

    if (error) { console.error('[addType]', error); return }
    await fetchTypes()
  }

  async function removeType(id) {
    const { error } = await supabase
      .from('ast_ticket_types')
      .delete()
      .eq('id', id)

    if (error) { console.error('[removeType]', error); return }
    setTypes(prev => prev.filter(t => t.id !== id))
  }

  return {
    tickets, categories, types, loading,
    createTicket, updateTicket, deleteTicket, addAction,
    addCategory, removeCategory, addType, removeType,
  }
}
