import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSetting(key, defaultValue = null) {
  const [value, setValue] = useState(() => {
    // Inicia com localStorage como cache imediato
    try {
      const cached = localStorage.getItem(`setting_${key}`)
      if (cached) return JSON.parse(cached)
    } catch {}
    return defaultValue
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('ast_settings')
        .select('value')
        .eq('key', key)
        .single()

      if (!error && data) {
        setValue(data.value)
        localStorage.setItem(`setting_${key}`, JSON.stringify(data.value))
      }
      setLoading(false)
    }
    load()
  }, [key])

  async function save(newValue) {
    setValue(newValue)
    localStorage.setItem(`setting_${key}`, JSON.stringify(newValue))

    await supabase
      .from('ast_settings')
      .upsert({ key, value: newValue, updated_at: new Date().toISOString() })
      .eq('key', key)
  }

  async function clear() {
    setValue(defaultValue)
    localStorage.removeItem(`setting_${key}`)
    await supabase.from('ast_settings').delete().eq('key', key)
  }

  return { value, loading, save, clear }
}
