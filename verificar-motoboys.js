import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://ccnbkympqhtgfotrmguz.supabase.co', 'sb_publishable_wmTgwCt0uCR4RrKPOThE2w_vb4iLvee')

const verificar = async () => {
  const { data } = await supabase
    .from('entregas')
    .select(`
      requisicao,
      regiao,
      motoboy:motoboys(nome)
    `)

  console.log('Entregas:')
  data.forEach(e => {
    console.log(`  ${e.requisicao} - ${e.regiao} - Motoboy: ${e.motoboy?.nome || 'SEM MOTOBOY'}`)
  })
}

verificar()
