import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Chave da API base44
const BASE44_API_KEY = '6df51dc4063c4b35b89cc39c9abcf0c2';

// Possíveis URLs da API base44
const POSSIBLE_URLS = [
  'https://api.base44.com.br',
  'https://ccnbkympqhtgfotrmguz.supabase.co', // Pode ser que já esteja usando Supabase
  'https://app.base44.com.br/api',
  'https://base44.com.br/api'
];

let BASE44_URL = null;

// Função para testar conectividade
async function testarConexao() {
  console.log('\n🔍 Testando conectividade com base44...\n');

  for (const url of POSSIBLE_URLS) {
    console.log(`   Tentando: ${url}`);

    try {
      const testUrl = `${url}/entities/Cliente?apiKey=${BASE44_API_KEY}&limit=1`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`   Status: ${response.status}`);

      if (response.ok) {
        console.log(`   ✅ Conexão bem-sucedida!\n`);
        BASE44_URL = url;
        return true;
      }
    } catch (error) {
      console.log(`   ❌ Falhou: ${error.message}`);
    }
  }

  console.log('\n❌ Não foi possível conectar em nenhuma URL\n');
  return false;
}

// Função para buscar dados do base44
async function fetchFromBase44(entity, sort = '-created_date') {
  if (!BASE44_URL) {
    console.error('❌ URL da API não configurada');
    return [];
  }

  const url = `${BASE44_URL}/entities/${entity}?apiKey=${BASE44_API_KEY}&sort=${sort}&limit=1000`;

  console.log(`   🔗 Buscando: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`   📡 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log(`   📦 Dados recebidos: ${data.length || 0} registros`);
    return data;
  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}`);
    return [];
  }
}

// Função para limpar dados antigos do Supabase
async function limparDadosAntigos() {
  console.log('\n🗑️  Limpando dados antigos do Supabase...');

  const tabelas = ['entregas', 'enderecos', 'clientes', 'motoboys'];

  for (const tabela of tabelas) {
    try {
      const { error } = await supabase
        .from(tabela)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos exceto um ID impossível

      if (error && error.code !== 'PGRST116') { // Ignora erro de "nenhuma linha encontrada"
        console.error(`   ⚠️  Erro ao limpar ${tabela}:`, error.message);
      } else {
        console.log(`   ✅ ${tabela} limpa`);
      }
    } catch (error) {
      console.error(`   ⚠️  Erro ao limpar ${tabela}:`, error.message);
    }
  }
}

// Migrar Clientes
async function migrarClientes() {
  console.log('\n👥 Migrando Clientes...');

  const clientes = await fetchFromBase44('Cliente');

  if (!clientes || clientes.length === 0) {
    console.log('   ⚠️  Nenhum cliente encontrado no base44');
    return new Map();
  }

  console.log(`   📊 ${clientes.length} clientes encontrados`);

  const clienteMap = new Map(); // Mapeia ID antigo -> ID novo

  for (const cliente of clientes) {
    try {
      // Inserir cliente no Supabase
      const { data: novoCliente, error } = await supabase
        .from('clientes')
        .insert([{
          nome: cliente.nome || '',
          cpf: cliente.cpf || null,
          telefone: cliente.telefone || null,
          email: cliente.email || null,
          created_at: cliente.created_date || new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Erro ao migrar cliente ${cliente.nome}:`, error.message);
        continue;
      }

      clienteMap.set(cliente.id, novoCliente.id);

      // Migrar endereços do cliente
      if (cliente.enderecos && Array.isArray(cliente.enderecos) && cliente.enderecos.length > 0) {
        for (let i = 0; i < cliente.enderecos.length; i++) {
          const end = cliente.enderecos[i];

          const { error: endError } = await supabase
            .from('enderecos')
            .insert([{
              cliente_id: novoCliente.id,
              logradouro: end.rua || end.logradouro || '',
              numero: end.numero || '',
              complemento: end.complemento || null,
              bairro: end.bairro || null,
              cidade: end.cidade || null,
              cep: end.cep || null,
              regiao: end.cidade || null,
              ponto_referencia: end.ponto_referencia || null,
              observacoes: end.observacoes || null,
              is_principal: i === 0
            }]);

          if (endError) {
            console.error(`      ⚠️  Erro ao migrar endereço:`, endError.message);
          }
        }
      }

      console.log(`   ✅ Cliente migrado: ${cliente.nome} (${cliente.enderecos?.length || 0} endereços)`);
    } catch (error) {
      console.error(`   ❌ Erro inesperado ao migrar cliente:`, error.message);
    }
  }

  console.log(`\n   🎉 Total: ${clienteMap.size} clientes migrados`);
  return clienteMap;
}

// Migrar Motoboys
async function migrarMotoboys() {
  console.log('\n🏍️  Migrando Motoboys...');

  const motoboys = await fetchFromBase44('Motoboy');

  if (!motoboys || motoboys.length === 0) {
    console.log('   ⚠️  Nenhum motoboy encontrado no base44');
    return new Map();
  }

  console.log(`   📊 ${motoboys.length} motoboys encontrados`);

  const motoboyMap = new Map();

  for (const motoboy of motoboys) {
    try {
      const { data: novoMotoboy, error } = await supabase
        .from('motoboys')
        .insert([{
          nome: motoboy.nome || '',
          telefone: motoboy.telefone || null,
          placa_moto: motoboy.placa_moto || null,
          ativo: motoboy.ativo !== false,
          created_at: motoboy.created_date || new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Erro ao migrar motoboy ${motoboy.nome}:`, error.message);
        continue;
      }

      motoboyMap.set(motoboy.id, novoMotoboy.id);
      console.log(`   ✅ Motoboy migrado: ${motoboy.nome}`);
    } catch (error) {
      console.error(`   ❌ Erro inesperado ao migrar motoboy:`, error.message);
    }
  }

  console.log(`\n   🎉 Total: ${motoboyMap.size} motoboys migrados`);
  return motoboyMap;
}

// Migrar Romaneios/Entregas
async function migrarRomaneios(clienteMap, motoboyMap) {
  console.log('\n📦 Migrando Romaneios/Entregas...');

  const romaneios = await fetchFromBase44('Romaneio');

  if (!romaneios || romaneios.length === 0) {
    console.log('   ⚠️  Nenhum romaneio encontrado no base44');
    return;
  }

  console.log(`   📊 ${romaneios.length} romaneios encontrados`);

  let migrados = 0;
  let erros = 0;

  for (const romaneio of romaneios) {
    try {
      // Mapear cliente_id antigo para novo
      const novoClienteId = clienteMap.get(romaneio.cliente_id);
      if (!novoClienteId) {
        console.error(`   ⚠️  Cliente não encontrado para romaneio ${romaneio.numero_requisicao}`);
        erros++;
        continue;
      }

      // Mapear motoboy_id antigo para novo
      let novoMotoboyId = null;
      if (romaneio.motoboy_id) {
        novoMotoboyId = motoboyMap.get(romaneio.motoboy_id);
      } else if (romaneio.motoboy) {
        // Buscar motoboy por nome
        const { data: motoboy } = await supabase
          .from('motoboys')
          .select('id')
          .ilike('nome', romaneio.motoboy)
          .single();

        novoMotoboyId = motoboy?.id || null;
      }

      // Buscar endereco_id se existir
      let enderecoId = null;
      if (romaneio.endereco && typeof romaneio.endereco === 'object') {
        // Tentar encontrar o endereço do cliente que corresponda
        const { data: enderecos } = await supabase
          .from('enderecos')
          .select('id')
          .eq('cliente_id', novoClienteId)
          .limit(1);

        enderecoId = enderecos?.[0]?.id || null;
      }

      // Montar endereço de destino como texto
      let enderecoDestino = romaneio.endereco_completo || '';
      if (!enderecoDestino && romaneio.endereco && typeof romaneio.endereco === 'object') {
        const end = romaneio.endereco;
        enderecoDestino = `${end.rua || ''}, ${end.numero || ''} - ${end.bairro || ''} - ${end.cidade || ''}`;
      }

      // Determinar status
      let status = 'Produzindo no Laboratório';
      if (romaneio.status) {
        status = romaneio.status;
      } else if (romaneio.entregue) {
        status = 'Entregue';
      } else if (romaneio.a_caminho) {
        status = 'A Caminho';
      }

      // Inserir entrega
      const { error } = await supabase
        .from('entregas')
        .insert([{
          cliente_id: novoClienteId,
          endereco_id: enderecoId,
          requisicao: romaneio.numero_requisicao || romaneio.requisicao || null,
          endereco_destino: enderecoDestino,
          regiao: romaneio.cidade_regiao || romaneio.regiao || null,
          outra_cidade: null,
          tipo: romaneio.tipo || 'moto',
          data_criacao: romaneio.created_date || new Date().toISOString(),
          data_entrega: romaneio.data_entrega || romaneio.data || null,
          periodo: romaneio.periodo || 'Tarde',
          status: status,
          motoboy_id: novoMotoboyId,
          forma_pagamento: romaneio.forma_pagamento || null,
          valor: romaneio.valor || 0,
          item_geladeira: romaneio.item_geladeira || false,
          buscar_receita: romaneio.buscar_receita || false,
          observacoes: romaneio.observacoes || null
        }]);

      if (error) {
        console.error(`   ❌ Erro ao migrar romaneio ${romaneio.numero_requisicao}:`, error.message);
        erros++;
        continue;
      }

      migrados++;

      if (migrados % 10 === 0) {
        console.log(`   📊 Progresso: ${migrados}/${romaneios.length} romaneios migrados...`);
      }
    } catch (error) {
      console.error(`   ❌ Erro inesperado ao migrar romaneio:`, error.message);
      erros++;
    }
  }

  console.log(`\n   🎉 Total: ${migrados} romaneios migrados`);
  if (erros > 0) {
    console.log(`   ⚠️  ${erros} romaneios com erro`);
  }
}

// Função principal
async function migrar() {
  console.log('\n🚀 Iniciando migração do base44 para Supabase...\n');
  console.log('⚙️  Configuração:');
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   API Key: ${BASE44_API_KEY.substring(0, 8)}...`);

  // Testar conexão primeiro
  const conectado = await testarConexao();
  if (!conectado) {
    console.error('\n❌ Não foi possível conectar à API do base44.');
    console.error('   Verifique:');
    console.error('   1. A chave da API está correta?');
    console.error('   2. A URL da API está acessível?');
    console.error('   3. Você tem permissão para acessar os dados?');
    process.exit(1);
  }

  console.log(`✅ Usando URL: ${BASE44_URL}\n`);

  try {
    // Perguntar se deseja limpar dados antigos
    console.log('⚠️  ATENÇÃO: Esta operação irá substituir todos os dados no Supabase!');
    console.log('   Os dados antigos serão apagados antes da migração.');

    // Limpar dados antigos
    await limparDadosAntigos();

    // Migrar dados
    const clienteMap = await migrarClientes();
    const motoboyMap = await migrarMotoboys();
    await migrarRomaneios(clienteMap, motoboyMap);

    console.log('\n✅ Migração concluída com sucesso!\n');

    // Estatísticas finais
    console.log('📊 Resumo da Migração:');
    console.log(`   Clientes: ${clienteMap.size}`);
    console.log(`   Motoboys: ${motoboyMap.size}`);
    console.log(`   Entregas: (ver log acima)`);

  } catch (error) {
    console.error('\n❌ Erro fatal na migração:', error);
    process.exit(1);
  }
}

// Executar migração
migrar();
