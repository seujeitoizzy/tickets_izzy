import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_CATEGORIES, DEFAULT_TYPES, DEFAULT_STATUSES, DEFAULT_AGENTS } from '../data/defaults'

// Converte snake_case do banco para camelCase do app
function mapTicket(row) {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
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
    deadline: row.deadline,
    deadlineIndeterminate: row.deadline_indeterminate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    timeline: (row.ast_ticket_timeline || []).map(mapTimeline),
    checklist: (row.ast_checklist_items || [])
      .sort((a, b) => a.order_num - b.order_num)
      .map(c => ({ id: c.id, text: c.text, checked: c.checked, orderNum: c.order_num })),
    comments: (row.ast_ticket_comments || [])
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map(c => ({ id: c.id, author: c.author, content: c.content, isInternal: c.is_internal, createdAt: c.created_at })),
    attachments: (row.ast_ticket_attachments || [])
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map(a => ({ id: a.id, filename: a.filename, fileUrl: a.file_url, fileType: a.file_type, fileSize: a.file_size, uploadedBy: a.uploaded_by, createdAt: a.created_at })),
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

// Cores fixas por label de status (sobrescreve o banco)
const STATUS_FIXED_COLORS = {
  'Aberto': '#f59e0b',       // Amarelo
  'Em Progresso': '#3b82f6', // Azul
}

function mapStatus(row) {
  const fixedColor = STATUS_FIXED_COLORS[row.label]
  return { id: row.id, label: row.label, color: fixedColor || row.color, orderNum: row.order_num }
}

function mapAgent(row) {
  return { id: row.id, name: row.name, email: row.email, phone: row.phone, avatarColor: row.avatar_color, active: row.active }
}

export function useStore() {
  const [tickets, setTickets] = useState([])
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [types, setTypes] = useState(DEFAULT_TYPES)
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES)
  const [agents, setAgents] = useState(DEFAULT_AGENTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      await Promise.all([fetchTickets(), fetchCategories(), fetchTypes(), fetchStatuses(), fetchAgents()])
      setLoading(false)
    }
    fetchAll()

    const ticketSub = supabase
      .channel('ast_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ast_tickets' }, () => fetchTickets())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ast_ticket_timeline' }, () => fetchTickets())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ast_agents' }, () => fetchAgents())
      .subscribe()

    return () => { supabase.removeChannel(ticketSub) }
  }, [])

  async function fetchTickets() {
    const { data, error } = await supabase
      .from('ast_tickets')
      .select(`*, ast_ticket_timeline(*), ast_checklist_items(*), ast_ticket_comments(*), ast_ticket_attachments(*)`)
      .order('created_at', { ascending: false })

    if (error) {
      if (error.message?.includes('ast_checklist_items') || error.message?.includes('ast_ticket_comments') || error.message?.includes('ast_ticket_attachments')) {
        const { data: data2, error: error2 } = await supabase
          .from('ast_tickets')
          .select(`*, ast_ticket_timeline(*)`)
          .order('created_at', { ascending: false })
        if (error2) { console.error('[fetchTickets]', error2); return }
        setTickets(data2.map(r => mapTicket({ ...r, ast_checklist_items: [], ast_ticket_comments: [], ast_ticket_attachments: [] })))
        return
      }
      console.error('[fetchTickets]', error)
      return
    }
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

  async function fetchStatuses() {
    const { data, error } = await supabase
      .from('ast_statuses')
      .select('*')
      .order('order_num')

    if (error) { console.error('[fetchStatuses]', error); return }
    if (data?.length) setStatuses(data.map(mapStatus))
  }

  async function fetchAgents() {
    const { data, error } = await supabase
      .from('ast_agents')
      .select('*')
      .eq('active', true)
      .order('name')

    if (error) { console.error('[fetchAgents]', error); return }
    setAgents(data.map(mapAgent))
  }  // --- Audit Log ---
  async function auditLog(actionType, ticket, details = {}) {
    const { error } = await supabase.from('ast_audit_logs').insert({
      action_type: actionType,
      ticket_id: ticket?.id || null,
      ticket_number: ticket?.ticketNumber || null,
      ticket_title: ticket?.title || null,
      performed_by: details.author || 'Sistema',
      details,
    })
    if (error) console.error('[auditLog] ERRO:', error.message, error.details, error.hint)
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
        deadline: data.deadline || null,
        deadline_indeterminate: data.deadlineIndeterminate || false,
      })
      .select()
      .single()

    if (error) { console.error('[createTicket]', error.message); return }

    // Timeline inicial
    await supabase.from('ast_ticket_timeline').insert({
      ticket_id: row.id,
      type: 'status_change',
      content: 'Ticket criado',
      status: 'open',
      author: data.assignee || 'Sistema',
    })

    // Checklist inicial
    if (data.checklist?.length) {
      const items = data.checklist.map((text, i) => ({
        ticket_id: row.id, text, checked: false, order_num: i,
      }))
      await supabase.from('ast_checklist_items').insert(items)
    }

    await fetchTickets()
    auditLog('ticket_created', { id: row.id, ticketNumber: row.ticket_number, title: row.title }, {
      author: data.assignee || 'Sistema',
      clientName: data.clientName,
      status: 'open',
      priority: data.priority,
    })
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
    if (changes.deadline !== undefined) update.deadline = changes.deadline || null
    if (changes.deadlineIndeterminate !== undefined) update.deadline_indeterminate = changes.deadlineIndeterminate

    const { error } = await supabase
      .from('ast_tickets')
      .update(update)
      .eq('id', id)

    if (error) { console.error('[updateTicket]', error); return }

    // Registra mudança de status na timeline
    if (changes.status && changes.status !== ticket.status) {
      const statusObj = statuses.find(s => s.id === changes.status)
      await supabase.from('ast_ticket_timeline').insert({
        ticket_id: id,
        type: 'status_change',
        content: `Status alterado para "${statusObj?.label || changes.status}"`,
        status: changes.status,
        author: changes._author || 'Sistema',
      })
      auditLog('status_changed', ticket, {
        author: changes._author || 'Sistema',
        from: ticket.status,
        to: changes.status,
        toLabel: statusObj?.label || changes.status,
      })
    }

    if (changes.assignee !== undefined && changes.assignee !== ticket.assignee) {
      auditLog('assignee_changed', ticket, {
        author: changes._author || 'Sistema',
        from: ticket.assignee,
        to: changes.assignee,
      })
    }

    if (changes.priority !== undefined && changes.priority !== ticket.priority) {
      auditLog('priority_changed', ticket, {
        author: changes._author || 'Sistema',
        from: ticket.priority,
        to: changes.priority,
      })
    }

    await fetchTickets()
  }

  async function deleteTicket(id) {
    const ticket = tickets.find(t => t.id === id)

    // Salva log ANTES de deletar (ticket ainda existe)
    await auditLog('ticket_deleted', ticket, {
      author: ticket?.assignee || 'Sistema',
      clientName: ticket?.clientName,
      status: ticket?.status,
      priority: ticket?.priority,
    })

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

  async function addStatus(status) {
    const { error } = await supabase
      .from('ast_statuses')
      .insert({ label: status.label, color: status.color, order_num: status.orderNum || 0 })
    if (error) { console.error('[addStatus]', error); return }
    await fetchStatuses()
  }

  async function removeStatus(id) {
    const { error } = await supabase.from('ast_statuses').delete().eq('id', id)
    if (error) { console.error('[removeStatus]', error); return }
    setStatuses(prev => prev.filter(s => s.id !== id))
  }

  async function addAgent(agent) {
    const { data, error } = await supabase
      .from('ast_agents')
      .insert({ name: agent.name, email: agent.email || null, avatar_color: agent.avatarColor || '#6366f1' })
      .select()
      .single()
    if (error) { console.error('[addAgent]', error.code, error.message); return }
    await fetchAgents()
  }

  async function bulkAddAgents(agentList) {
    const { data: existing, error: fetchError } = await supabase
      .from('ast_agents').select('name').eq('active', true)
    if (fetchError) { console.error('[bulkAddAgents]', fetchError); return 0 }

    const existingNames = new Set((existing || []).map(a => a.name.toLowerCase()))
    const toInsert = agentList
      .filter(a => !existingNames.has(a.name.toLowerCase()))
      .map(a => ({ name: a.name, email: a.email || null, avatar_color: a.avatarColor || '#6366f1' }))

    if (toInsert.length === 0) return 0

    const { data, error } = await supabase.from('ast_agents').insert(toInsert).select()
    if (error) { console.error('[bulkAddAgents]', error.code, error.message); return 0 }

    await fetchAgents()
    return data.length
  }

  async function removeAgent(id) {
    // Soft delete — marca como inativo
    const { error } = await supabase.from('ast_agents').update({ active: false }).eq('id', id)
    if (error) { console.error('[removeAgent]', error); return }
    setAgents(prev => prev.filter(a => a.id !== id))
  }

  // --- Checklist ---
  async function addChecklistItem(ticketId, text) {
    const ticket = tickets.find(t => t.id === ticketId)
    const orderNum = ticket?.checklist?.length || 0
    const { error } = await supabase.from('ast_checklist_items').insert({
      ticket_id: ticketId, text, checked: false, order_num: orderNum,
    })
    if (error) { console.error('[addChecklistItem]', error); return }
    await fetchTickets()
  }

  async function toggleChecklistItem(itemId, checked) {
    const { error } = await supabase.from('ast_checklist_items').update({ checked }).eq('id', itemId)
    if (error) { console.error('[toggleChecklistItem]', error); return }
    setTickets(prev => prev.map(t => ({
      ...t,
      checklist: (t.checklist || []).map(c => c.id === itemId ? { ...c, checked } : c)
    })))
  }

  async function removeChecklistItem(itemId) {
    const { error } = await supabase.from('ast_checklist_items').delete().eq('id', itemId)
    if (error) { console.error('[removeChecklistItem]', error); return }
    setTickets(prev => prev.map(t => ({
      ...t,
      checklist: (t.checklist || []).filter(c => c.id !== itemId)
    })))
  }

  // --- Comments ---
  async function addComment(ticketId, comment) {
    const { error } = await supabase.from('ast_ticket_comments').insert({
      ticket_id: ticketId,
      author: comment.author,
      content: comment.content,
      is_internal: comment.isInternal ?? true,
    })
    if (error) { console.error('[addComment]', error); return }
    await fetchTickets()
  }

  async function removeComment(commentId) {
    const { error } = await supabase.from('ast_ticket_comments').delete().eq('id', commentId)
    if (error) { console.error('[removeComment]', error); return }
    setTickets(prev => prev.map(t => ({
      ...t,
      comments: (t.comments || []).filter(c => c.id !== commentId)
    })))
  }

  // --- Attachments ---
  async function addAttachment(ticketId, file, uploadedBy) {
    const ext = file.name.split('.').pop()
    const path = `${ticketId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('ticket-attachments')
      .upload(path, file)

    if (uploadError) { console.error('[addAttachment upload]', uploadError); return }

    const { data: urlData } = supabase.storage
      .from('ticket-attachments')
      .getPublicUrl(path)

    const { error } = await supabase.from('ast_ticket_attachments').insert({
      ticket_id: ticketId,
      filename: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: uploadedBy,
    })

    if (error) { console.error('[addAttachment]', error); return }
    await fetchTickets()
  }

  async function removeAttachment(attachmentId, fileUrl) {
    const path = fileUrl.split('/ticket-attachments/')[1]
    if (path) await supabase.storage.from('ticket-attachments').remove([path])
    const { error } = await supabase.from('ast_ticket_attachments').delete().eq('id', attachmentId)
    if (error) { console.error('[removeAttachment]', error); return }
    setTickets(prev => prev.map(t => ({
      ...t,
      attachments: (t.attachments || []).filter(a => a.id !== attachmentId)
    })))
  }

  async function fetchAuditLogs(limit = 100) {
    const { data, error } = await supabase
      .from('ast_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) { console.error('[fetchAuditLogs]', error); return [] }
    return data
  }

  return {
    tickets, categories, types, statuses, agents, loading,
    createTicket, updateTicket, deleteTicket, addAction,
    addCategory, removeCategory, addType, removeType,
    addStatus, removeStatus, addAgent, bulkAddAgents, removeAgent,
    addChecklistItem, toggleChecklistItem, removeChecklistItem,
    addComment, removeComment,
    addAttachment, removeAttachment,
    fetchAuditLogs,
  }
}
