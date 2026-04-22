import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'app_theme'

// Detecta o tema do sistema operacional
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    // 1. Tenta localStorage (preferência salva localmente)
    const local = localStorage.getItem(STORAGE_KEY)
    if (local === 'dark' || local === 'light' || local === 'system') return local
    return 'system' // padrão: seguir o SO
  })

  // Aplica o tema no <html>
  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme
    document.documentElement.setAttribute('data-theme', resolved)
  }, [theme])

  // Escuta mudanças no tema do SO (quando theme === 'system')
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  // Carrega preferência salva no Supabase
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ast_settings')
        .select('value')
        .eq('key', STORAGE_KEY)
        .single()

      if (data?.value) {
        setTheme(data.value)
        localStorage.setItem(STORAGE_KEY, data.value)
      }
    }
    load()
  }, [])

  async function setAndSave(newTheme) {
    setTheme(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)

    await supabase
      .from('ast_settings')
      .upsert({ key: STORAGE_KEY, value: newTheme, updated_at: new Date().toISOString() })
      .eq('key', STORAGE_KEY)
  }

  const resolved = theme === 'system' ? getSystemTheme() : theme

  return { theme, resolved, setTheme: setAndSave }
}
