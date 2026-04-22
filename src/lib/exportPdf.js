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

/**
 * Exporta relatório profissional completo com KPIs e tabelas (versão nativa jsPDF)
 */
export function exportProfessionalReport(stats, tickets, categories, types, statuses, period, filename = 'relatorio-completo.pdf') {
  try {
    console.log('Iniciando exportação...', { stats, tickets: tickets?.length, period })
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 15
    let yPos = margin

    // ========== PÁGINA 1: CAPA E KPIs ==========
    
    // Cabeçalho com fundo
    doc.setFillColor(99, 102, 241) // Indigo
    doc.rect(0, 0, pageW, 50, 'F')
    
    // Título
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('Relatório de Tickets', pageW / 2, 25, { align: 'center' })
    
    // Subtítulo
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    const periodLabel = period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : '90 dias'
    doc.text(`Período: Últimos ${periodLabel}`, pageW / 2, 35, { align: 'center' })
    
    // Data de geração
    doc.setFontSize(9)
    doc.setTextColor(226, 232, 240)
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, pageW / 2, 42, { align: 'center' })
    
    yPos = 65

    // ========== SEÇÃO DE KPIs ==========
    doc.setTextColor(71, 85, 105)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Indicadores Principais', margin, yPos)
    yPos += 15

    // KPIs em formato de lista
    const kpis = [
      { label: 'Total de Tickets', value: stats.total, sub: `+${stats.inPeriod} no período` },
      { label: 'Em Aberto', value: stats.open, sub: 'aguardando resolução' },
      { label: 'Fechados', value: stats.closed, sub: `${stats.resolutionRate}% taxa de resolução` },
      { label: 'Críticos Abertos', value: stats.critical, sub: 'requerem atenção imediata' },
      { label: 'Tempo Médio', value: `${stats.avgResolutionHours}h`, sub: 'para resolução' },
      { label: 'Fechados no Período', value: stats.closedInPeriod, sub: `últimos ${periodLabel}` },
    ]

    kpis.forEach((kpi, i) => {
      // Fundo do card
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, yPos, pageW - margin * 2, 18, 'F')
      
      // Borda esquerda colorida
      doc.setFillColor(99, 102, 241)
      doc.rect(margin, yPos, 3, 18, 'F')

      // Valor
      doc.setTextColor(99, 102, 241)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(String(kpi.value), margin + 8, yPos + 8)

      // Label
      doc.setTextColor(71, 85, 105)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(kpi.label, margin + 50, yPos + 8)

      // Sub
      doc.setTextColor(100, 116, 139)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(kpi.sub, margin + 50, yPos + 14)

      yPos += 22
    })

    yPos += 10

    // ========== DISTRIBUIÇÃO POR STATUS ==========
    doc.setTextColor(71, 85, 105)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Distribuição por Status', margin, yPos)
    yPos += 10

    if (stats.statusData.length > 0) {
      // Cabeçalho da tabela
      doc.setFillColor(99, 102, 241)
      doc.rect(margin, yPos, pageW - margin * 2, 8, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Status', margin + 5, yPos + 5.5)
      doc.text('Quantidade', margin + 80, yPos + 5.5)
      doc.text('Percentual', margin + 130, yPos + 5.5)
      
      yPos += 8

      // Linhas da tabela
      stats.statusData.forEach((s, i) => {
        const percentage = Math.round((s.value / stats.total) * 100)
        
        // Fundo alternado
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(margin, yPos, pageW - margin * 2, 7, 'F')
        }

        // Status (com cor)
        if (s.color) {
          const hex = s.color
          const r = parseInt(hex.slice(1, 3), 16)
          const g = parseInt(hex.slice(3, 5), 16)
          const b = parseInt(hex.slice(5, 7), 16)
          doc.setTextColor(r, g, b)
        } else {
          doc.setTextColor(71, 85, 105)
        }
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(s.name, margin + 5, yPos + 5)

        // Quantidade
        doc.setTextColor(71, 85, 105)
        doc.setFont('helvetica', 'normal')
        doc.text(String(s.value), margin + 80, yPos + 5)

        // Percentual
        doc.text(`${percentage}%`, margin + 130, yPos + 5)

        yPos += 7
      })
    }

    // ========== NOVA PÁGINA: DISTRIBUIÇÃO POR PRIORIDADE ==========
    doc.addPage()
    yPos = margin

    doc.setTextColor(71, 85, 105)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Distribuição por Prioridade', margin, yPos)
    yPos += 10

    if (stats.prioData.length > 0) {
      // Cabeçalho da tabela
      doc.setFillColor(99, 102, 241)
      doc.rect(margin, yPos, pageW - margin * 2, 8, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Prioridade', margin + 5, yPos + 5.5)
      doc.text('Quantidade', margin + 80, yPos + 5.5)
      doc.text('Percentual', margin + 130, yPos + 5.5)
      
      yPos += 8

      // Linhas da tabela
      stats.prioData.forEach((p, i) => {
        const percentage = Math.round((p.value / stats.total) * 100)
        
        // Fundo alternado
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(margin, yPos, pageW - margin * 2, 7, 'F')
        }

        // Prioridade (com cor)
        if (p.color) {
          const hex = p.color
          const r = parseInt(hex.slice(1, 3), 16)
          const g = parseInt(hex.slice(3, 5), 16)
          const b = parseInt(hex.slice(5, 7), 16)
          doc.setTextColor(r, g, b)
        } else {
          doc.setTextColor(71, 85, 105)
        }
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(p.name, margin + 5, yPos + 5)

        // Quantidade
        doc.setTextColor(71, 85, 105)
        doc.setFont('helvetica', 'normal')
        doc.text(String(p.value), margin + 80, yPos + 5)

        // Percentual
        doc.text(`${percentage}%`, margin + 130, yPos + 5)

        yPos += 7
      })
    }

    yPos += 15

    // ========== DISTRIBUIÇÃO POR CATEGORIA ==========
    doc.setTextColor(71, 85, 105)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Distribuição por Categoria', margin, yPos)
    yPos += 10

    if (stats.catData.length > 0) {
      // Cabeçalho da tabela
      doc.setFillColor(99, 102, 241)
      doc.rect(margin, yPos, pageW - margin * 2, 8, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Categoria', margin + 5, yPos + 5.5)
      doc.text('Quantidade', margin + 80, yPos + 5.5)
      doc.text('Percentual', margin + 130, yPos + 5.5)
      
      yPos += 8

      // Linhas da tabela
      stats.catData.forEach((c, i) => {
        const percentage = Math.round((c.total / stats.total) * 100)
        
        // Fundo alternado
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(margin, yPos, pageW - margin * 2, 7, 'F')
        }

        // Categoria
        doc.setTextColor(71, 85, 105)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(c.name, margin + 5, yPos + 5)

        // Quantidade
        doc.setFont('helvetica', 'normal')
        doc.text(String(c.total), margin + 80, yPos + 5)

        // Percentual
        doc.text(`${percentage}%`, margin + 130, yPos + 5)

        yPos += 7
      })
    }

    // ========== TICKETS POR AGENTE ==========
    if (stats.agentData.length > 0) {
      if (yPos > pageH - 100) {
        doc.addPage()
        yPos = margin
      } else {
        yPos += 15
      }

      doc.setTextColor(71, 85, 105)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Performance por Agente', margin, yPos)
      yPos += 10

      // Cabeçalho da tabela
      doc.setFillColor(99, 102, 241)
      doc.rect(margin, yPos, pageW - margin * 2, 8, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Agente', margin + 5, yPos + 5.5)
      doc.text('Abertos', margin + 70, yPos + 5.5)
      doc.text('Fechados', margin + 100, yPos + 5.5)
      doc.text('Total', margin + 135, yPos + 5.5)
      doc.text('Taxa', margin + 160, yPos + 5.5)
      
      yPos += 8

      // Linhas da tabela
      stats.agentData.forEach((a, i) => {
        const total = a.abertos + a.fechados
        const taxa = total > 0 ? Math.round((a.fechados / total) * 100) : 0
        
        // Fundo alternado
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(margin, yPos, pageW - margin * 2, 7, 'F')
        }

        doc.setTextColor(71, 85, 105)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        
        // Nome do agente (truncado se muito longo)
        const agentName = a.name.length > 20 ? a.name.substring(0, 17) + '...' : a.name
        doc.text(agentName, margin + 5, yPos + 5)
        doc.text(String(a.abertos), margin + 70, yPos + 5)
        doc.text(String(a.fechados), margin + 100, yPos + 5)
        doc.text(String(total), margin + 135, yPos + 5)
        doc.text(`${taxa}%`, margin + 160, yPos + 5)

        yPos += 7
      })
    }

    // ========== TOP CLIENTES ==========
    if (stats.clientData.length > 0) {
      if (yPos > pageH - 100) {
        doc.addPage()
        yPos = margin
      } else {
        yPos += 15
      }

      doc.setTextColor(71, 85, 105)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Top Clientes', margin, yPos)
      yPos += 10

      // Cabeçalho da tabela
      doc.setFillColor(99, 102, 241)
      doc.rect(margin, yPos, pageW - margin * 2, 8, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Cliente', margin + 5, yPos + 5.5)
      doc.text('Total', margin + 90, yPos + 5.5)
      doc.text('Abertos', margin + 120, yPos + 5.5)
      doc.text('Resolvidos', margin + 150, yPos + 5.5)
      
      yPos += 8

      // Linhas da tabela
      stats.clientData.forEach((c, i) => {
        const resolved = c.total - c.abertos
        
        // Fundo alternado
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(margin, yPos, pageW - margin * 2, 7, 'F')
        }

        doc.setTextColor(71, 85, 105)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        
        // Nome do cliente (truncado se muito longo)
        const clientName = c.name.length > 25 ? c.name.substring(0, 22) + '...' : c.name
        doc.text(clientName, margin + 5, yPos + 5)
        doc.text(String(c.total), margin + 90, yPos + 5)
        doc.text(String(c.abertos), margin + 120, yPos + 5)
        doc.text(String(resolved), margin + 150, yPos + 5)

        yPos += 7
      })
    }

    // ========== RODAPÉ EM TODAS AS PÁGINAS ==========
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      
      // Linha separadora
      doc.setDrawColor(226, 232, 240)
      doc.line(margin, pageH - 15, pageW - margin, pageH - 15)
      
      // Texto do rodapé
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'normal')
      doc.text('Ticket Manager - Relatório Gerencial', margin, pageH - 10)
      doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 10, { align: 'right' })
    }

    doc.save(filename)
    console.log('PDF exportado com sucesso!')
  } catch (error) {
    console.error('Erro ao exportar PDF:', error)
    alert('Erro ao exportar PDF: ' + error.message)
  }
}

export function exportTableToPdf(tickets, categories, types, statuses, filename = 'tickets.pdf') {
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 12
    let yPos = margin

    // ========== CABEÇALHO PROFISSIONAL ==========
    // Fundo do cabeçalho
    doc.setFillColor(99, 102, 241) // Indigo
    doc.rect(0, 0, pageW, 25, 'F')
    
    // Título principal
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Ticket Manager', margin, 12)
    
    // Subtítulo
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Lista Completa de Tickets', margin, 19)
    
    // Data e total de tickets
    doc.setFontSize(9)
    doc.setTextColor(226, 232, 240)
    const totalTickets = tickets.length
    doc.text(`${totalTickets} tickets • Gerado em ${new Date().toLocaleString('pt-BR')}`, pageW - margin, 12, { align: 'right' })
    
    // Estatísticas rápidas
    const openTickets = tickets.filter(t => t.status !== 'closed').length
    const closedTickets = tickets.filter(t => t.status === 'closed').length
    const criticalTickets = tickets.filter(t => t.priority === 'critical').length
    
    doc.text(`${openTickets} abertos • ${closedTickets} fechados • ${criticalTickets} críticos`, pageW - margin, 19, { align: 'right' })

    yPos = 35

    // ========== CABEÇALHO DA TABELA ==========
    const cols = [
      { label: 'Status', w: 22, align: 'left' },
      { label: 'Título', w: 55, align: 'left' },
      { label: 'Cliente', w: 35, align: 'left' },
      { label: 'Tipo', w: 20, align: 'left' },
      { label: 'Categoria', w: 25, align: 'left' },
      { label: 'Responsável', w: 30, align: 'left' },
      { label: 'Prioridade', w: 20, align: 'center' },
      { label: 'Prazo', w: 25, align: 'center' },
      { label: 'Criado', w: 30, align: 'center' },
    ]

    // Fundo do cabeçalho da tabela
    doc.setFillColor(71, 85, 105)
    doc.rect(margin, yPos, pageW - margin * 2, 10, 'F')
    
    // Texto do cabeçalho
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')

    let xPos = margin + 2
    cols.forEach(col => {
      const textAlign = col.align === 'center' ? { align: 'center' } : {}
      const textX = col.align === 'center' ? xPos + col.w / 2 : xPos
      doc.text(col.label.toUpperCase(), textX, yPos + 6.5, textAlign)
      xPos += col.w
    })
    
    yPos += 12

    // ========== LINHAS DA TABELA ==========
    tickets.forEach((ticket, i) => {
      // Verificar se precisa de nova página
      if (yPos > pageH - 25) {
        doc.addPage()
        yPos = margin
        
        // Repetir cabeçalho na nova página
        doc.setFillColor(71, 85, 105)
        doc.rect(margin, yPos, pageW - margin * 2, 10, 'F')
        
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')

        xPos = margin + 2
        cols.forEach(col => {
          const textAlign = col.align === 'center' ? { align: 'center' } : {}
          const textX = col.align === 'center' ? xPos + col.w / 2 : xPos
          doc.text(col.label.toUpperCase(), textX, yPos + 6.5, textAlign)
          xPos += col.w
        })
        
        yPos += 12
      }

      // Buscar dados relacionados
      const cat = categories.find(c => c.id === ticket.categoryId)
      const type = types.find(t => t.id === ticket.typeId)
      const status = statuses.find(s => s.id === ticket.status)

      // Formatação dos dados
      const prioLabels = { 
        low: 'Baixa', 
        medium: 'Média', 
        high: 'Alta', 
        critical: 'Crítica' 
      }
      const prioLabel = prioLabels[ticket.priority] || '—'
      
      const deadline = ticket.deadlineIndeterminate
        ? 'Indeterminado'
        : ticket.deadline
          ? new Date(ticket.deadline).toLocaleDateString('pt-BR')
          : '—'
          
      const createdAt = new Date(ticket.createdAt).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
      })

      // Fundo alternado das linhas
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(margin, yPos, pageW - margin * 2, 8, 'F')
      }

      // Preparar dados da linha
      const rowData = [
        { text: status?.label || ticket.status, color: status?.color },
        { text: (ticket.title || '—').slice(0, 40) + (ticket.title?.length > 40 ? '...' : '') },
        { text: (ticket.clientName || '—').slice(0, 25) + (ticket.clientName?.length > 25 ? '...' : '') },
        { text: type?.label || '—' },
        { text: cat?.label || '—' },
        { text: (ticket.assignee || '—').split(' ')[0] },
        { text: prioLabel, priority: ticket.priority },
        { text: deadline },
        { text: createdAt },
      ]

      // Renderizar células
      xPos = margin + 2
      rowData.forEach((cell, cellIndex) => {
        const col = cols[cellIndex]
        
        // Definir cor do texto
        if (cellIndex === 0 && cell.color) {
          // Cor do status
          const hex = cell.color
          const r = parseInt(hex.slice(1, 3), 16)
          const g = parseInt(hex.slice(3, 5), 16)
          const b = parseInt(hex.slice(5, 7), 16)
          doc.setTextColor(r, g, b)
          doc.setFont('helvetica', 'bold')
        } else if (cellIndex === 6 && cell.priority) {
          // Cor da prioridade
          const prioColors = {
            critical: [239, 68, 68],   // Vermelho
            high: [245, 158, 11],      // Laranja
            medium: [59, 130, 246],    // Azul
            low: [34, 197, 94]         // Verde
          }
          const color = prioColors[cell.priority] || [71, 85, 105]
          doc.setTextColor(...color)
          doc.setFont('helvetica', 'bold')
        } else {
          doc.setTextColor(71, 85, 105)
          doc.setFont('helvetica', 'normal')
        }

        doc.setFontSize(8)
        
        // Posicionamento do texto
        const textAlign = col.align === 'center' ? { align: 'center' } : {}
        const textX = col.align === 'center' ? xPos + col.w / 2 : xPos
        
        doc.text(String(cell.text), textX, yPos + 5.5, textAlign)
        xPos += col.w
      })

      yPos += 8
    })

    // ========== RODAPÉ EM TODAS AS PÁGINAS ==========
    const totalPages = doc.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      
      // Linha separadora
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.5)
      doc.line(margin, pageH - 15, pageW - margin, pageH - 15)
      
      // Informações do rodapé
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'normal')
      
      // Lado esquerdo - nome do sistema
      doc.text('Ticket Manager - Sistema de Gestão de Tickets', margin, pageH - 8)
      
      // Lado direito - paginação
      doc.text(`Página ${p} de ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' })
      
      // Centro - resumo (apenas na primeira página)
      if (p === 1) {
        doc.text(`Total: ${totalTickets} tickets`, pageW / 2, pageH - 8, { align: 'center' })
      }
    }

    doc.save(filename)
    console.log('PDF da lista de tickets exportado com sucesso!')
    
  } catch (error) {
    console.error('Erro ao exportar PDF da lista:', error)
    alert('Erro ao exportar PDF: ' + error.message)
  }
}

/**
 * Exporta tickets para Excel (.xlsx)
 */
export function exportToExcel(tickets, categories, types, statuses, filename = 'tickets.xlsx') {
  try {
    import('xlsx').then(XLSX => {
      const prioLabels = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' }

      const rows = tickets.map(ticket => {
        const cat = categories.find(c => c.id === ticket.categoryId)
        const type = types.find(t => t.id === ticket.typeId)
        const status = statuses.find(s => s.id === ticket.status)
        const ticketNum = ticket.ticketNumber ? `#${String(ticket.ticketNumber).padStart(4, '0')}` : '—'
        const deadline = ticket.deadlineIndeterminate
          ? 'Indeterminado'
          : ticket.deadline ? new Date(ticket.deadline).toLocaleDateString('pt-BR') : '—'

        return {
          'Nº': ticketNum,
          'Título': ticket.title || '—',
          'Status': status?.label || ticket.status || '—',
          'Prioridade': prioLabels[ticket.priority] || '—',
          'Cliente': ticket.clientName || '—',
          'Tipo': type?.label || '—',
          'Categoria': cat?.label || '—',
          'Responsável': ticket.assignee || '—',
          'Prazo': deadline,
          'Criado em': new Date(ticket.createdAt).toLocaleString('pt-BR'),
          'Atualizado em': new Date(ticket.updatedAt).toLocaleString('pt-BR'),
        }
      })

      const ws = XLSX.utils.json_to_sheet(rows)

      // Largura das colunas
      ws['!cols'] = [
        { wch: 8 }, { wch: 40 }, { wch: 15 }, { wch: 12 },
        { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
        { wch: 18 }, { wch: 20 }, { wch: 20 },
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Tickets')
      XLSX.writeFile(wb, filename)
      console.log('Excel exportado com sucesso!')
    })
  } catch (error) {
    console.error('Erro ao exportar Excel:', error)
    alert('Erro ao exportar Excel: ' + error.message)
  }
}
