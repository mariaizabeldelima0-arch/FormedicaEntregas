import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ccnbkympqhtgfotrmguz.supabase.co'
const supabaseAnonKey = 'sb_publishable_wmTgwCt0uCR4RrKPOThE2w_vb4iLvee'

// sessionStorage (não localStorage): a sessão do Supabase Auth precisa
// sobreviver a um F5 durante o uso, mas exigir login de novo ao fechar
// o navegador — mesmo comportamento que o app já tinha antes do Supabase Auth.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
