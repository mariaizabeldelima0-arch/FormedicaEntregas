const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ccnbkympqhtgfotrmguz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbmJreW1wcWh0Z2ZvdHJtZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NzAxNzcsImV4cCI6MjA4MTE0NjE3N30.2uhxv75YfnO_eqsCR_-r2v78S-fe_sWAYp6vKOUrWm0'
);

// IDs dos motoboys
const MOTOBOYS = {
  Bruno: 'e38b6f85-f87e-4110-b782-edb44b79969f',
  Marcio: '8d65813d-01c6-49cf-8bfb-6cf94e71fe11'
};

// Endereços reais por região
const ENDERECOS_REAIS = [
  // BC - Balneário Camboriú Centro
  { logradouro: 'Avenida Atlântica', numero: '1500', bairro: 'Centro', cidade: 'Balneário Camboriú', cep: '88330-027', regiao: 'BC' },
  { logradouro: 'Rua 1500', numero: '200', bairro: 'Centro', cidade: 'Balneário Camboriú', cep: '88330-620', regiao: 'BC' },
  // NOVA ESPERANÇA
  { logradouro: 'Rua José Elias da Silva', numero: '150', bairro: 'Nova Esperança', cidade: 'Balneário Camboriú', cep: '88337-220', regiao: 'NOVA ESPERANÇA' },
  // CAMBORIÚ
  { logradouro: 'Rua Nereu Ramos', numero: '800', bairro: 'Centro', cidade: 'Camboriú', cep: '88340-000', regiao: 'CAMBORIÚ' },
  // TABULEIRO
  { logradouro: 'Rua Antônio Borges dos Santos', numero: '300', bairro: 'Tabuleiro', cidade: 'Camboriú', cep: '88340-335', regiao: 'TABULEIRO' },
  // BARRA
  { logradouro: 'Avenida do Estado', numero: '4500', bairro: 'Barra Sul', cidade: 'Balneário Camboriú', cep: '88331-000', regiao: 'BARRA' },
  // ITAJAÍ
  { logradouro: 'Rua Hercílio Luz', numero: '500', bairro: 'Centro', cidade: 'Itajaí', cep: '88301-030', regiao: 'ITAJAI' },
  { logradouro: 'Rua Samuel Heusi', numero: '250', bairro: 'Vila Real', cidade: 'Itajaí', cep: '88306-100', regiao: 'ITAJAI' },
  // ESPINHEIROS
  { logradouro: 'Rua Joaquim Nabuco', numero: '1200', bairro: 'Espinheiros', cidade: 'Itajaí', cep: '88305-230', regiao: 'ESPINHEIROS' },
  // PRAIA BRAVA
  { logradouro: 'Avenida José Medeiros Vieira', numero: '800', bairro: 'Praia Brava', cidade: 'Itajaí', cep: '88306-600', regiao: 'PRAIA BRAVA' },
  // ITAPEMA
  { logradouro: 'Avenida Nereu Ramos', numero: '2000', bairro: 'Meia Praia', cidade: 'Itapema', cep: '88220-000', regiao: 'ITAPEMA' },
  // NAVEGANTES
  { logradouro: 'Rua João Emílio Falcão', numero: '600', bairro: 'Centro', cidade: 'Navegantes', cep: '88370-446', regiao: 'NAVEGANTES' },
  // PENHA
  { logradouro: 'Avenida Nereu Ramos', numero: '1500', bairro: 'Armação', cidade: 'Penha', cep: '88385-000', regiao: 'PENHA' },
  // PORTO BELO
  { logradouro: 'Avenida Governador Celso Ramos', numero: '1200', bairro: 'Centro', cidade: 'Porto Belo', cep: '88210-000', regiao: 'PORTO BELO' },
  // BOMBINHAS
  { logradouro: 'Avenida Leopoldo Zarling', numero: '400', bairro: 'Bombas', cidade: 'Bombinhas', cep: '88215-000', regiao: 'BOMBINHAS' },
];

// Formas de pagamento para teste
const FORMAS_PAGAMENTO = [
  'Pago Dinheiro',
  'Pago Máquina',
  'Pago Pix',
  'Receber Dinheiro',
  'Receber Máquina',
  'Pagar MP',
  'Aguardando',
  'Via na Pasta',
  'Só Entregar',
];

// Status possíveis
const STATUS = [
  'Produzindo no Laboratório',
  'Preparando no Setor de Entregas',
  'Em Rota',
  'Entregue',
  'Pendente',
];

// Nomes de clientes de teste
const NOMES_CLIENTES = [
  'Maria Silva',
  'João Pereira',
  'Ana Oliveira',
  'Carlos Santos',
  'Fernanda Lima',
  'Roberto Costa',
  'Patricia Souza',
  'Lucas Mendes',
  'Juliana Alves',
  'Ricardo Ferreira',
  'Beatriz Nunes',
  'André Martins',
  'Camila Rocha',
  'Diego Araújo',
  'Larissa Freitas',
];

// Motoboy por região
const MOTOBOY_POR_REGIAO = {
  'BC': 'Marcio',
  'NOVA ESPERANÇA': 'Marcio',
  'CAMBORIÚ': 'Marcio',
  'TABULEIRO': 'Marcio',
  'MONTE ALEGRE': 'Marcio',
  'BARRA': 'Marcio',
  'ESTALEIRO': 'Marcio',
  'CLINICA': 'Marcio',
  'TAQUARAS': 'Bruno',
  'LARANJEIRAS': 'Bruno',
  'ITAJAI': 'Bruno',
  'ESPINHEIROS': 'Bruno',
  'PRAIA DOS AMORES': 'Bruno',
  'PRAIA BRAVA': 'Bruno',
  'ITAPEMA': 'Bruno',
  'NAVEGANTES': 'Bruno',
  'PENHA': 'Bruno',
  'PORTO BELO': 'Bruno',
  'TIJUCAS': 'Bruno',
  'PIÇARRAS': 'Bruno',
  'BOMBINHAS': 'Bruno'
};

// Valores por região e motoboy
const VALORES_ENTREGA = {
  Marcio: {
    'BC': 9, 'NOVA ESPERANÇA': 11, 'CAMBORIÚ': 16, 'TABULEIRO': 11,
    'MONTE ALEGRE': 11, 'BARRA': 11, 'ESTALEIRO': 16, 'TAQUARAS': 16,
    'LARANJEIRAS': 16, 'ITAJAI': 19, 'ESPINHEIROS': 23, 'PRAIA DOS AMORES': 13.50,
    'PRAIA BRAVA': 13.50, 'ITAPEMA': 27, 'NAVEGANTES': 30, 'PENHA': 52,
    'PORTO BELO': 52, 'TIJUCAS': 52, 'PIÇARRAS': 52, 'BOMBINHAS': 72, 'CLINICA': 9
  },
  Bruno: {
    'BC': 7, 'NOVA ESPERANÇA': 9, 'CAMBORIÚ': 14, 'TABULEIRO': 9,
    'MONTE ALEGRE': 9, 'BARRA': 9, 'ESTALEIRO': 14, 'TAQUARAS': 14,
    'LARANJEIRAS': 14, 'ITAJAI': 17, 'ESPINHEIROS': 21, 'PRAIA DOS AMORES': 11.50,
    'PRAIA BRAVA': 11.50, 'ITAPEMA': 25, 'NAVEGANTES': 40, 'PENHA': 50,
    'PORTO BELO': 30, 'TIJUCAS': 50, 'PIÇARRAS': 50, 'BOMBINHAS': 50, 'CLINICA': 7
  }
};

function getDataFormatada(diasOffset) {
  const data = new Date();
  data.setDate(data.getDate() + diasOffset);
  return data.toISOString().split('T')[0];
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBool(probability = 0.3) {
  return Math.random() < probability;
}

async function seed() {
  console.log('🚀 Iniciando seed de dados de teste...\n');

  // 1. Deletar todas as entregas existentes
  console.log('🗑️  Deletando entregas existentes...');
  const { error: deleteError } = await supabase.from('entregas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) {
    console.error('Erro ao deletar entregas:', deleteError);
    return;
  }
  console.log('✅ Entregas deletadas!\n');

  // 2. Buscar clientes existentes
  console.log('👤 Buscando clientes existentes...');
  const { data: clientesExistentes, error: clientesError } = await supabase
    .from('clientes')
    .select('*')
    .limit(20);

  if (clientesError) {
    console.error('Erro ao buscar clientes:', clientesError);
    return;
  }

  let clientes = clientesExistentes || [];
  console.log(`📊 ${clientes.length} clientes encontrados.\n`);

  // 3. Se não houver clientes suficientes, criar novos
  if (clientes.length < 10) {
    console.log('👤 Criando clientes adicionais...');
    const clientesParaCriar = NOMES_CLIENTES.slice(0, 10 - clientes.length).map((nome, i) => ({
      nome,
      cpf: `${String(i + 10).padStart(3, '0')}.${String(i + 20).padStart(3, '0')}.${String(i + 30).padStart(3, '0')}-${String(i + 40).padStart(2, '0')}`,
      telefone: `(47) 9990${i}-${String(i).padStart(4, '0')}`,
      email: `${nome.toLowerCase().replace(' ', '.')}@email.com`
    }));

    if (clientesParaCriar.length > 0) {
      const { data: novosClientes, error: insertError } = await supabase
        .from('clientes')
        .insert(clientesParaCriar)
        .select();

      if (insertError) {
        console.error('Erro ao criar clientes:', insertError);
      } else {
        clientes = [...clientes, ...novosClientes];
        console.log(`✅ ${novosClientes.length} clientes criados.`);
      }
    }
  }

  console.log(`📊 ${clientes.length} clientes prontos.\n`);

  // 4. Criar entregas de teste (sem precisar de endereços no banco)
  console.log('📦 Criando entregas de teste...\n');

  const entregas = [];
  let requisicaoNum = 2000;

  // Criar entregas para os últimos 5 dias, hoje e próximos 2 dias
  for (let dia = -5; dia <= 2; dia++) {
    const dataEntrega = getDataFormatada(dia);
    const numEntregas = dia === 0 ? 8 : (dia > 0 ? 4 : 5); // Mais entregas para hoje

    console.log(`📅 ${dataEntrega} (${dia === 0 ? 'HOJE' : dia > 0 ? `+${dia} dias` : `${dia} dias`}): ${numEntregas} entregas`);

    for (let i = 0; i < numEntregas; i++) {
      const cliente = clientes[Math.floor(Math.random() * clientes.length)];
      const enderecoData = ENDERECOS_REAIS[Math.floor(Math.random() * ENDERECOS_REAIS.length)];
      const regiao = enderecoData.regiao;
      const motoboyNome = MOTOBOY_POR_REGIAO[regiao] || 'Bruno';
      const motoboyId = MOTOBOYS[motoboyNome];
      const valorEntrega = VALORES_ENTREGA[motoboyNome][regiao] || 10;

      // Determinar forma de pagamento
      const formaPagamento = randomItem(FORMAS_PAGAMENTO);
      const precisaReceber = ['Receber Dinheiro', 'Receber Máquina', 'Pagar MP'].includes(formaPagamento);
      const jaFoiPago = formaPagamento.startsWith('Pago');

      // Valor de venda (quando precisa receber)
      const valorVenda = precisaReceber ? Math.round((Math.random() * 200 + 50) * 100) / 100 : 0;

      // Determinar status baseado na data
      let status;
      if (dia < -1) {
        status = randomBool(0.8) ? 'Entregue' : randomItem(['Voltou p/ Farmácia', 'Cancelado']);
      } else if (dia === -1 || dia === 0) {
        status = randomItem(STATUS);
      } else {
        status = randomItem(['Produzindo no Laboratório', 'Preparando no Setor de Entregas', 'Pendente']);
      }

      const entrega = {
        requisicao: String(requisicaoNum++),
        cliente_id: cliente.id,
        endereco_destino: `${enderecoData.logradouro}, ${enderecoData.numero} - ${enderecoData.bairro}, ${enderecoData.cidade}`,
        endereco_logradouro: enderecoData.logradouro,
        endereco_numero: enderecoData.numero,
        endereco_complemento: null,
        endereco_bairro: enderecoData.bairro,
        endereco_cidade: enderecoData.cidade,
        endereco_cep: enderecoData.cep,
        regiao: regiao,
        tipo: 'moto',
        data_criacao: new Date().toISOString(),
        data_entrega: dataEntrega + 'T12:00:00',
        periodo: randomItem(['Manhã', 'Tarde']),
        status: status,
        motoboy_id: motoboyId,
        forma_pagamento: formaPagamento,
        valor: valorEntrega,
        valor_venda: valorVenda,
      };

      // Definir campos booleanos separadamente para poder referenciar
      const itemGeladeira = randomBool(0.2);
      const buscarReceita = randomBool(0.4);

      entrega.item_geladeira = itemGeladeira;
      entrega.buscar_receita = buscarReceita;
      entrega.observacoes = randomBool(0.3) ? randomItem([
        'Cliente solicita ligar antes',
        'Deixar na portaria',
        'Entregar após 14h',
        'Cliente idoso, ter paciência',
        'Apartamento 302, bloco B'
      ]) : null;
      entrega.atendente = randomItem(['Atendente 1', 'Atendente 2']);
      entrega.pagamento_recebido = jaFoiPago || (status === 'Entregue' && precisaReceber && randomBool(0.5));
      entrega.precisa_troco = formaPagamento === 'Receber Dinheiro' && randomBool(0.3);
      entrega.valor_troco = formaPagamento === 'Receber Dinheiro' && randomBool(0.3) ? Math.round(Math.random() * 50 + 10) : 0;
      // Receita recebida - apenas para entregas que buscam receita e já foram entregues
      entrega.receita_recebida = buscarReceita && status === 'Entregue' && randomBool(0.6);

      entregas.push(entrega);
      console.log(`  📦 #${entrega.requisicao} - ${cliente.nome} - ${regiao} - ${formaPagamento} - ${status}${entrega.buscar_receita ? ' 📋' : ''}${entrega.item_geladeira ? ' ❄️' : ''}`);
    }
  }

  // Inserir entregas
  console.log('\n💾 Salvando entregas no banco...');
  const { data: entregasSalvas, error: entregasError } = await supabase
    .from('entregas')
    .insert(entregas)
    .select();

  if (entregasError) {
    console.error('❌ Erro ao inserir entregas:', entregasError);
    return;
  }

  console.log(`\n✅ ${entregasSalvas.length} entregas criadas com sucesso!`);

  // Resumo
  const comReceita = entregas.filter(e => e.buscar_receita).length;
  const itemGeladeira = entregas.filter(e => e.item_geladeira).length;
  const aReceber = entregas.filter(e => ['Receber Dinheiro', 'Receber Máquina', 'Pagar MP'].includes(e.forma_pagamento)).length;
  const pagamentosPendentes = entregas.filter(e => !e.pagamento_recebido && ['Receber Dinheiro', 'Receber Máquina', 'Pagar MP'].includes(e.forma_pagamento)).length;

  console.log('\n📊 RESUMO:');
  console.log(`   - Total de entregas: ${entregasSalvas.length}`);
  console.log(`   - Com receita (buscar_receita): ${comReceita}`);
  console.log(`   - Item geladeira: ${itemGeladeira}`);
  console.log(`   - Formas "a receber" (Dinheiro/Máquina/MP): ${aReceber}`);
  console.log(`   - Pagamentos pendentes: ${pagamentosPendentes}`);
  console.log('\n🎉 Seed concluído!');
}

seed().catch(console.error);
