import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function listDispositivos() {
  console.log('📋 Listando dispositivos do Supabase...\n');

  try {
    const { data, error } = await supabase
      .from('dispositivos')
      .select('*')
      .order('ultimo_acesso', { ascending: false });

    if (error) {
      console.error('❌ Erro ao listar:', error);
      console.log('\n💡 Isso pode ser normal se o RLS estiver ativo e você não estiver autenticado.');
      console.log('   Os dados ainda existem no banco, mas só podem ser acessados por usuários autenticados.');
    } else {
      console.log(`✅ Total de dispositivos: ${data.length}\n`);

      if (data.length > 0) {
        data.forEach((d, idx) => {
          console.log(`${idx + 1}. ${d.nome}`);
          console.log(`   Usuário: ${d.usuario}`);
          console.log(`   Status: ${d.status}`);
          console.log(`   Impressão: ${d.impressao_digital}`);
          console.log(`   Último acesso: ${d.ultimo_acesso}`);
          console.log('');
        });

        const stats = {
          autorizados: data.filter(d => d.status === 'Autorizado').length,
          pendentes: data.filter(d => d.status === 'Pendente').length,
          bloqueados: data.filter(d => d.status === 'Bloqueado').length,
        };

        console.log('📊 Estatísticas:');
        console.log(`   ✅ Autorizados: ${stats.autorizados}`);
        console.log(`   ⏳ Pendentes: ${stats.pendentes}`);
        console.log(`   ❌ Bloqueados: ${stats.bloqueados}`);
      } else {
        console.log('⚠️  Nenhum dispositivo encontrado.');
      }
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
}

listDispositivos();
