import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ccnbkympqhtgfotrmguz.supabase.co'
const supabaseAnonKey = 'sb_publishable_wmTgwCt0uCR4RrKPOThE2w_vb4iLvee'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
