import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportElementToPdf(elementId, filename = 'relatorio.pdf') {
  const element = document.getElementById(elementId)
  if (!element) return

  const canvas = await html2canvas(element, {
    backgroundColor: '#0f172a',
    scale: 1.5,
    useCORS: true,
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height],
  })

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(filename)
}

export function exportTableToPdf(tickets, categories, types, statuses, filename = 'tickets.pdf') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 12
  let y = margin

  // Header
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageW, 20, 'F')
  doc.setTextColor(241, 245, 249)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Ticket Manager — Relatório de Tickets', margin, 13)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, pageW - margin, 13, { align: 'right' })

  y = 26

  // Columns
  const cols = [
    { label: 'Status',       w: 24 },
    { label: 'Título',       w: 60 },
    { label: 'Cliente',      w: 40 },
    { label: 'Tipo',         w: 24 },
    { label: 'Categoria',    w: 24 },
    { label: 'Responsável',  w: 36 },
    { label: 'Prioridade',   w: 22 },
    { label: 'Prazo',        w: 28 },
    { label: 'Criado em',    w: 32 },
  ]

  // Header row
  doc.setFillColor(30, 41, 59)
  doc.rect(margin, y, pageW - margin * 2, 7, 'F')
  doc.setTextColor(71, 85, 105)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')

  let x = margin
  cols.forEach(col => {
    doc.text(col.label.toUpperCase(), x + 2, y + 5)
    x += col.w
  })
  y += 9

  // Rows
  tickets.forEach((ticket, i) => {
    if (y > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      y = margin
    }

    const cat = categories.find(c => c.id === ticket.categoryId)
    const type = types.find(t => t.id === ticket.typeId)
    const status = statuses.find(s => s.id === ticket.status)

    const prioLabel = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' }[ticket.priority] || '—'
    const deadline = ticket.deadlineIndeterminate
      ? 'Indeterminado'
      : ticket.deadline
        ? new Date(ticket.deadline).toLocaleDateString('pt-BR')
        : '—'
    const createdAt = new Date(ticket.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

    // Row bg alternado
    if (i % 2 === 0) {
      doc.setFillColor(15, 23, 42)
      doc.rect(margin, y - 1, pageW - margin * 2, 7, 'F')
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)

    const values = [
      status?.label || ticket.status,
      ticket.title?.slice(0, 35) || '—',
      ticket.clientName?.slice(0, 22) || '—',
      type?.label || '—',
      cat?.label || '—',
      ticket.assignee?.split(' ')[0] || '—',
      prioLabel,
      deadline,
      createdAt,
    ]

    x = margin
    values.forEach((val, vi) => {
      // Cor do status
      if (vi === 0 && status?.color) {
        const hex = status.color
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        doc.setTextColor(r, g, b)
      } else {
        doc.setTextColor(148, 163, 184)
      }
      doc.text(String(val), x + 2, y + 4)
      x += cols[vi].w
    })

    y += 7
  })

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(7)
    doc.setTextColor(71, 85, 105)
    doc.text(`Página ${p} de ${totalPages}`, pageW / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' })
  }

  doc.save(filename)
}
