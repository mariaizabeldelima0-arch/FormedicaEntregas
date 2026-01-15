import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ccnbkympqhtgfotrmguz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbmJreW1wcWh0Z2ZvdHJtZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NzAxNzcsImV4cCI6MjA4MTE0NjE3N30.2uhxv75YfnO_eqsCR_-r2v78S-fe_sWAYp6vKOUrWm0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
