import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yamfgrfllhmrckhxsuwx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbWZncmZsbGhtcmNraHhzdXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3MjM2NTQsImV4cCI6MjA1MDI5OTY1NH0.xIrUfoWdT-6hCosRNEeE-3Zg9bTn0Oj3aaiFI9fUYpo'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
