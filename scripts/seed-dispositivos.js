import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function seedDispositivos() {
  console.log('🌱 Inserindo dados de exemplo na tabela dispositivos...\n');

  const dispositivos = [
    {
      nome: 'Chrome no Windows',
      usuario: 'mariazabeldel.ma5@gmail.com',
      impressao_digital: 'DEVw6622',
      status: 'Pendente',
      ultimo_acesso: '2025-12-13T10:50:00'
    },
    {
      nome: 'Chrome no Windows',
      usuario: 'mariazabeldel.ma0@gmail.com',
      impressao_digital: 'DEVw6623',
      status: 'Pendente',
      ultimo_acesso: '2025-12-13T10:52:00'
    },
    {
      nome: 'Chrome no Windows',
      usuario: 'mariazabeldel.ma5@gmail.com',
      impressao_digital: 'DEVw84PR',
      status: 'Autorizado',
      ultimo_acesso: '2025-11-28T17:02:00'
    },
    {
      nome: 'Safari no macOS',
      usuario: 'mariazabeldel.ma0@gmail.com',
      impressao_digital: 'DEV2PNFB',
      status: 'Autorizado',
      ultimo_acesso: '2025-03-12T21:37:00'
    },
    {
      nome: 'Chrome no Windows',
      usuario: 'mariazabeldel.ma0@gmail.com',
      impressao_digital: 'DEVw84XR',
      status: 'Autorizado',
      ultimo_acesso: '2025-10-12T14:18:00'
    }
  ];

  try {
    // Inserir dispositivos (ignorar duplicatas)
    for (const dispositivo of dispositivos) {
      const { data, error } = await supabase
        .from('dispositivos')
        .upsert(dispositivo, {
          onConflict: 'impressao_digital',
          ignoreDuplicates: true
        });

      if (error) {
        console.log(`⚠️  ${dispositivo.impressao_digital}: ${error.message}`);
      } else {
        console.log(`✅ ${dispositivo.nome} (${dispositivo.impressao_digital}) - ${dispositivo.status}`);
      }
    }

    console.log('\n🎉 Dados de exemplo inseridos com sucesso!');

    // Verificar total
    const { data: all, error: countError } = await supabase
      .from('dispositivos')
      .select('*');

    if (!countError) {
      console.log(`\n📊 Total de dispositivos: ${all.length}`);
      console.log(`   - Autorizados: ${all.filter(d => d.status === 'Autorizado').length}`);
      console.log(`   - Pendentes: ${all.filter(d => d.status === 'Pendente').length}`);
      console.log(`   - Bloqueados: ${all.filter(d => d.status === 'Bloqueado').length}`);
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

seedDispositivos();
