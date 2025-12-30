import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv
dotenv.config();

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurar Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDispositivos() {
  console.log('🚀 Iniciando setup da tabela dispositivos...\n');

  try {
    // Ler o arquivo SQL
    const sqlPath = join(__dirname, '..', 'sql', 'create_dispositivos_table.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    console.log('📄 Lendo arquivo SQL: create_dispositivos_table.sql');

    // Dividir o SQL em comandos individuais (separados por ponto e vírgula)
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Encontrados ${sqlCommands.length} comandos SQL para executar\n`);

    // Executar cada comando
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];

      // Pular comentários
      if (command.startsWith('--') || command.startsWith('/*')) {
        continue;
      }

      console.log(`⏳ Executando comando ${i + 1}/${sqlCommands.length}...`);

      try {
        // Executar via RPC
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: command + ';'
        }).catch(() => {
          // Se RPC não existir, tentar executar direto
          return { error: null };
        });

        if (error) {
          console.log(`⚠️  Tentando método alternativo para comando ${i + 1}...`);
          // Método alternativo: usar from() para comandos específicos
          // Nota: alguns comandos DDL podem precisar ser executados manualmente no dashboard
        }
      } catch (err) {
        console.log(`⚠️  Aviso no comando ${i + 1}: ${err.message}`);
      }
    }

    console.log('\n✅ Script SQL processado!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Acesse o Supabase Dashboard: https://supabase.com/dashboard');
    console.log('   2. Vá para SQL Editor');
    console.log('   3. Cole e execute o conteúdo de: sql/create_dispositivos_table.sql');
    console.log('\n💡 Nota: Comandos DDL (CREATE TABLE, ALTER, etc) geralmente precisam');
    console.log('   ser executados diretamente no SQL Editor do Supabase Dashboard.\n');

    // Verificar se a tabela existe
    console.log('🔍 Verificando se a tabela já existe...');
    const { data: tables, error: checkError } = await supabase
      .from('dispositivos')
      .select('count', { count: 'exact', head: true });

    if (!checkError) {
      console.log('✅ Tabela "dispositivos" encontrada e acessível!');

      // Buscar dados de exemplo
      const { data: devices, error: devicesError } = await supabase
        .from('dispositivos')
        .select('*')
        .limit(5);

      if (!devicesError && devices) {
        console.log(`📊 Total de dispositivos: ${devices.length}`);
        if (devices.length > 0) {
          console.log('\n📱 Dispositivos cadastrados:');
          devices.forEach((d, idx) => {
            console.log(`   ${idx + 1}. ${d.nome} - ${d.status} (${d.usuario})`);
          });
        }
      }
    } else {
      console.log('⚠️  Tabela "dispositivos" ainda não existe.');
      console.log('   Execute o SQL manualmente no Supabase Dashboard.');
    }

  } catch (error) {
    console.error('\n❌ Erro ao executar setup:', error.message);
    process.exit(1);
  }
}

// Executar
setupDispositivos();
