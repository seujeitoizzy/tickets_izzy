export const DEFAULT_CATEGORIES = [
  { id: 'bug', label: 'Bug', color: '#ef4444', icon: 'bug' },
  { id: 'feature', label: 'Feature', color: '#6366f1', icon: 'star' },
  { id: 'support', label: 'Suporte', color: '#3b82f6', icon: 'message' },
  { id: 'improvement', label: 'Melhoria', color: '#f59e0b', icon: 'zap' },
]

export const DEFAULT_TYPES = [
  { id: 'incident', label: 'Incidente', icon: 'alert' },
  { id: 'request', label: 'Solicitação', icon: 'inbox' },
  { id: 'question', label: 'Dúvida', icon: 'message' },
  { id: 'task', label: 'Tarefa', icon: 'checkCircle' },
]

export const ACTION_TYPES = [
  { id: 'contact', label: 'Contato realizado', icon: 'phone' },
  { id: 'transfer', label: 'Transferência', icon: 'transfer' },
  { id: 'update', label: 'Atualização de registro', icon: 'fileEdit' },
  { id: 'note', label: 'Observação', icon: 'note' },
  { id: 'resolution', label: 'Resolução aplicada', icon: 'checkCircle' },
  { id: 'escalation', label: 'Escalonamento', icon: 'arrowUp' },
  { id: 'other', label: 'Outro', icon: 'pin' },
]

export const PRIORITIES = [
  { id: 'low', label: 'Baixa', color: '#22c55e' },
  { id: 'medium', label: 'Média', color: '#f59e0b' },
  { id: 'high', label: 'Alta', color: '#f97316' },
  { id: 'critical', label: 'Crítica', color: '#ef4444' },
]

export const STATUSES = [
  { id: 'open', label: 'Aberto', color: '#60a5fa' },
  { id: 'in_progress', label: 'Em Progresso', color: '#fbbf24' },
  { id: 'waiting', label: 'Aguardando', color: '#a78bfa' },
  { id: 'closed', label: 'Fechado', color: '#4ade80' },
]
