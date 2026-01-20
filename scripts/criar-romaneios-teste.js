import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ccnbkympqhtgfotrmguz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbmJreW1wcWh0Z2ZvdHJtZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NzAxNzcsImV4cCI6MjA4MTE0NjE3N30.2uhxv75YfnO_eqsCR_-r2v78S-fe_sWAYp6vKOUrWm0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Data de hoje
const hoje = new Date().toISOString().split('T')[0];

// Endereços reais de BC, Itapema, Itajaí e Camboriú
const dadosTeste = [
  {
    cliente: { nome: 'Maria Silva', telefone: '47999001122' },
    endereco: {
      logradouro: 'Avenida Atlântica',
      numero: '2500',
      bairro: 'Centro',
      cidade: 'Balneário Camboriú',
      complemento: 'Apto 301',
      cep: '88330-027'
    },
    periodo: 'Manhã',
    status: 'Em Rota'
  },
  {
    cliente: { nome: 'João Santos', telefone: '47999112233' },
    endereco: {
      logradouro: 'Rua 3100',
      numero: '150',
      bairro: 'Centro',
      cidade: 'Balneário Camboriú',
      complemento: 'Casa',
      cep: '88330-282'
    },
    periodo: 'Manhã',
    status: 'Iniciar'
  },
  {
    cliente: { nome: 'Ana Costa', telefone: '47999223344' },
    endereco: {
      logradouro: 'Avenida Brasil',
      numero: '1200',
      bairro: 'Centro',
      cidade: 'Balneário Camboriú',
      complemento: 'Sala 5',
      cep: '88330-060'
    },
    periodo: 'Manhã',
    status: 'Pendente'
  },
  {
    cliente: { nome: 'Carlos Oliveira', telefone: '47999334455' },
    endereco: {
      logradouro: 'Avenida Nereu Ramos',
      numero: '500',
      bairro: 'Meia Praia',
      cidade: 'Itapema',
      complemento: 'Bloco A',
      cep: '88220-000'
    },
    periodo: 'Tarde',
    status: 'Em Rota'
  },
  {
    cliente: { nome: 'Fernanda Lima', telefone: '47999445566' },
    endereco: {
      logradouro: 'Rua 240',
      numero: '80',
      bairro: 'Meia Praia',
      cidade: 'Itapema',
      complemento: '',
      cep: '88220-000'
    },
    periodo: 'Tarde',
    status: 'Em Rota'
  },
  {
    cliente: { nome: 'Roberto Mendes', telefone: '47999556677' },
    endereco: {
      logradouro: 'Avenida Marcos Konder',
      numero: '1000',
      bairro: 'Centro',
      cidade: 'Itajaí',
      complemento: 'Loja 2',
      cep: '88301-303'
    },
    periodo: 'Manhã',
    status: 'Entregue'
  },
  {
    cliente: { nome: 'Patricia Souza', telefone: '47999667788' },
    endereco: {
      logradouro: 'Rua Hercílio Luz',
      numero: '350',
      bairro: 'Centro',
      cidade: 'Itajaí',
      complemento: '',
      cep: '88301-220'
    },
    periodo: 'Tarde',
    status: 'Em Rota'
  },
  {
    cliente: { nome: 'Lucas Pereira', telefone: '47999778899' },
    endereco: {
      logradouro: 'Rua Getúlio Vargas',
      numero: '200',
      bairro: 'Centro',
      cidade: 'Camboriú',
      complemento: 'Fundos',
      cep: '88340-000'
    },
    periodo: 'Manhã',
    status: 'Voltou p/ Farmácia'
  },
  {
    cliente: { nome: 'Juliana Martins', telefone: '47999889900' },
    endereco: {
      logradouro: 'Avenida Santa Catarina',
      numero: '800',
      bairro: 'Tabuleiro',
      cidade: 'Camboriú',
      complemento: 'Casa 3',
      cep: '88340-000'
    },
    periodo: 'Tarde',
    status: 'Iniciar'
  },
  {
    cliente: { nome: 'Marcos Almeida', telefone: '47999990011' },
    endereco: {
      logradouro: 'Rua Dinamarca',
      numero: '450',
      bairro: 'Nações',
      cidade: 'Balneário Camboriú',
      complemento: 'Apto 502',
      cep: '88338-220'
    },
    periodo: 'Tarde',
    status: 'Pendente'
  }
];

async function criarRomaneiosTeste() {
  console.log('Iniciando criação de romaneios de teste...\n');

  // Buscar um motoboy existente
  const { data: motoboys, error: motoboyError } = await supabase
    .from('motoboys')
    .select('id, nome')
    .limit(1);

  if (motoboyError || !motoboys || motoboys.length === 0) {
    console.error('Erro ao buscar motoboy:', motoboyError);
    console.log('Criando motoboy de teste...');

    const { data: novoMotoboy, error: createError } = await supabase
      .from('motoboys')
      .insert([{ nome: 'Motoboy Teste', telefone: '47999000000' }])
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar motoboy:', createError);
      return;
    }
    motoboys.push(novoMotoboy);
  }

  const motoboyId = motoboys[0].id;
  console.log(`Usando motoboy: ${motoboys[0].nome} (${motoboyId})\n`);

  for (let i = 0; i < dadosTeste.length; i++) {
    const dado = dadosTeste[i];
    const requisicao = `TEST${String(i + 1).padStart(4, '0')}`;

    try {
      // 1. Criar cliente
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .insert([dado.cliente])
        .select()
        .single();

      if (clienteError) {
        console.error(`Erro ao criar cliente ${dado.cliente.nome}:`, clienteError);
        continue;
      }

      // 2. Criar endereço
      const { data: endereco, error: enderecoError } = await supabase
        .from('enderecos')
        .insert([{
          ...dado.endereco,
          cliente_id: cliente.id,
          is_principal: true
        }])
        .select()
        .single();

      if (enderecoError) {
        console.error(`Erro ao criar endereço:`, enderecoError);
        continue;
      }

      // 3. Criar entrega
      const enderecoTexto = `${dado.endereco.logradouro}, ${dado.endereco.numero} - ${dado.endereco.bairro}, ${dado.endereco.cidade}`;

      const { data: entrega, error: entregaError } = await supabase
        .from('entregas')
        .insert([{
          cliente_id: cliente.id,
          endereco_id: endereco.id,
          motoboy_id: motoboyId,
          requisicao: requisicao,
          endereco_destino: enderecoTexto,
          tipo: 'moto',
          data_criacao: new Date().toISOString(),
          data_entrega: hoje,
          periodo: dado.periodo,
          status: dado.status,
          forma_pagamento: 'Pago',
          valor: (Math.random() * 50 + 10).toFixed(2),
          ordem_entrega: i + 1,
          endereco_logradouro: dado.endereco.logradouro,
          endereco_numero: dado.endereco.numero,
          endereco_complemento: dado.endereco.complemento,
          endereco_bairro: dado.endereco.bairro,
          endereco_cidade: dado.endereco.cidade,
          endereco_cep: dado.endereco.cep
        }])
        .select()
        .single();

      if (entregaError) {
        console.error(`Erro ao criar entrega:`, entregaError);
        continue;
      }

      console.log(`✓ Criado: ${requisicao} - ${dado.cliente.nome} - ${dado.endereco.cidade} (${dado.status})`);

    } catch (error) {
      console.error(`Erro geral:`, error);
    }
  }

  console.log('\n✅ Romaneios de teste criados com sucesso!');
  console.log(`📅 Data das entregas: ${hoje}`);
}

criarRomaneiosTeste();
