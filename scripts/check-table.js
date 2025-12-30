import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTable() {
  console.log('🔍 Verificando estrutura da tabela dispositivos...\n');

  try {
    // Tentar inserir um registro simples
    const { data, error } = await supabase
      .from('dispositivos')
      .insert({
        nome: 'Teste',
        usuario: 'teste@teste.com',
        impressao_digital: 'TEST123',
        status: 'Pendente'
      })
      .select();

    if (error) {
      console.error('❌ Erro ao inserir:', error);
      console.log('\n💡 A tabela precisa ser criada no Supabase Dashboard');
    } else {
      console.log('✅ Registro inserido com sucesso!');
      console.log(data);

      // Remover o registro de teste
      if (data && data[0]) {
        await supabase
          .from('dispositivos')
          .delete()
          .eq('id', data[0].id);
        console.log('\n🧹 Registro de teste removido');
      }
    }

    // Tentar listar
    const { data: all, error: listError } = await supabase
      .from('dispositivos')
      .select('*')
      .limit(1);

    if (listError) {
      console.error('\n❌ Erro ao listar:', listError);
    } else {
      console.log('\n✅ Tabela acessível');
      if (all && all.length > 0) {
        console.log('📋 Estrutura de um registro:');
        console.log(JSON.stringify(all[0], null, 2));
      }
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
}

checkTable();
