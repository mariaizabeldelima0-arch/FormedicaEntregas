import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function corrigir() {
  // Buscar entregas sem atendente_id mas com atendente (texto)
  const { data: entregas } = await supabase
    .from('entregas')
    .select('id, atendente, atendente_id')
    .is('atendente_id', null)
    .not('atendente', 'is', null)
    .neq('atendente', '');

  console.log('Entregas sem atendente_id:', entregas?.length || 0);

  // Buscar todos os usuários
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, usuario');

  let corrigidas = 0;
  for (const entrega of (entregas || [])) {
    const usuario = usuarios.find(u => u.usuario === entrega.atendente);
    if (usuario) {
      const { error } = await supabase
        .from('entregas')
        .update({ atendente_id: usuario.id })
        .eq('id', entrega.id);

      if (error) {
        console.log('ERRO:', entrega.id, error.message);
      } else {
        console.log('OK:', entrega.atendente, '→', usuario.id);
        corrigidas++;
      }
    } else {
      console.log('Usuario nao encontrado para:', entrega.atendente);
    }
  }
  console.log('\nTotal corrigidas:', corrigidas);
}

corrigir().catch(console.error);
