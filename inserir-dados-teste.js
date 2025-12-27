import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ccnbkympqhtgfotrmguz.supabase.co'
const supabaseKey = 'sb_publishable_wmTgwCt0uCR4RrKPOThE2w_vb4iLvee'

const supabase = createClient(supabaseUrl, supabaseKey)

async function inserirDadosTeste() {
  try {
    console.log('🚀 Iniciando inserção de dados de teste...\n')

    // 0. Verificar e criar motoboys se não existirem
    console.log('🏍️ Verificando motoboys...')
    const { data: motoboysBD } = await supabase.from('motoboys').select('*')

    if (!motoboysBD || motoboysBD.length === 0) {
      console.log('Criando motoboys Marcio e Bruno...')
      await supabase
        .from('motoboys')
        .insert([
          { nome: 'Marcio', telefone: null, ativo: true },
          { nome: 'Bruno', telefone: null, ativo: true }
        ])
      console.log('✅ Motoboys criados!\n')
    } else {
      console.log(`✅ ${motoboysBD.length} motoboys já existem!\n`)
    }

    // 1. Inserir Clientes
    console.log('📋 Inserindo clientes...')

    // Verificar se clientes já existem
    const { data: clientesExistentes } = await supabase
      .from('clientes')
      .select('cpf')
      .in('cpf', ['12345678901', '98765432109', '11122233344', '55566677788', '99988877766'])

    const cpfsExistentes = new Set(clientesExistentes?.map(c => c.cpf) || [])

    const clientesParaInserir = [
      { nome: 'João Silva', cpf: '12345678901', telefone: '(47) 99999-9999', email: 'joao@email.com' },
      { nome: 'Maria Santos', cpf: '98765432109', telefone: '(47) 98888-8888', email: 'maria@email.com' },
      { nome: 'Pedro Oliveira', cpf: '11122233344', telefone: '(47) 97777-7777', email: 'pedro@email.com' },
      { nome: 'Ana Costa', cpf: '55566677788', telefone: '(47) 96666-6666', email: 'ana@email.com' },
      { nome: 'Carlos Mendes', cpf: '99988877766', telefone: '(47) 95555-5555', email: 'carlos@email.com' },
    ].filter(c => !cpfsExistentes.has(c.cpf))

    let clientes = []
    if (clientesParaInserir.length > 0) {
      const { data, error: erroClientes } = await supabase
        .from('clientes')
        .insert(clientesParaInserir)
        .select()

      if (erroClientes) {
        console.error('❌ Erro ao inserir clientes:', erroClientes)
        return
      }
      clientes = data
      console.log(`✅ ${clientes.length} clientes novos inseridos com sucesso!`)
    } else {
      console.log('⏭️ Todos os clientes já existem, pulando...')
    }

    // Buscar clientes novamente para ter os IDs corretos
    const { data: clientesBD } = await supabase
      .from('clientes')
      .select('*')
      .in('cpf', ['12345678901', '98765432109', '11122233344', '55566677788', '99988877766'])

    const clientesMap = {}
    clientesBD.forEach(c => clientesMap[c.cpf] = c.id)

    // 2. Inserir Endereços
    console.log('🏠 Inserindo endereços...')
    const { data: enderecos, error: erroEnderecos } = await supabase
      .from('enderecos')
      .insert([
        {
          cliente_id: clientesMap['12345678901'],
          logradouro: 'Rua das Flores',
          numero: '123',
          bairro: 'Centro',
          cidade: 'Balneário Camboriú',
          regiao: 'BC',
          is_principal: true,
          endereco_completo: 'Rua das Flores, 123 - Centro, Balneário Camboriú - SC'
        },
        {
          cliente_id: clientesMap['98765432109'],
          logradouro: 'Av. Brasil',
          numero: '456',
          bairro: 'Centro',
          cidade: 'Itajaí',
          regiao: 'ITAJAI',
          is_principal: true,
          endereco_completo: 'Av. Brasil, 456 - Centro, Itajaí - SC'
        },
        {
          cliente_id: clientesMap['98765432109'],
          logradouro: 'Rua São Paulo',
          numero: '789',
          complemento: 'Apto 102',
          bairro: 'Vila Real',
          cidade: 'Itajaí',
          regiao: 'ITAJAI',
          is_principal: false,
          endereco_completo: 'Rua São Paulo, 789 - Apto 102 - Vila Real, Itajaí - SC'
        },
        {
          cliente_id: clientesMap['11122233344'],
          logradouro: 'Rua Camboriú',
          numero: '321',
          bairro: 'Centro',
          cidade: 'Balneário Camboriú',
          regiao: 'CAMBORIÚ',
          is_principal: true,
          endereco_completo: 'Rua Camboriú, 321 - Centro, Balneário Camboriú - SC'
        },
        {
          cliente_id: clientesMap['55566677788'],
          logradouro: 'Av. Atlântica',
          numero: '1000',
          bairro: 'Praia Brava',
          cidade: 'Balneário Camboriú',
          regiao: 'PRAIA BRAVA',
          is_principal: true,
          endereco_completo: 'Av. Atlântica, 1000 - Praia Brava, Balneário Camboriú - SC'
        },
        {
          cliente_id: clientesMap['99988877766'],
          logradouro: 'Rua Itapema',
          numero: '555',
          bairro: 'Centro',
          cidade: 'Itapema',
          regiao: 'ITAPEMA',
          is_principal: true,
          endereco_completo: 'Rua Itapema, 555 - Centro, Itapema - SC'
        },
      ])
      .select()

    if (erroEnderecos) {
      console.error('❌ Erro ao inserir endereços:', erroEnderecos)
      return
    }
    console.log(`✅ ${enderecos.length} endereços inseridos com sucesso!\n`)

    // Buscar endereços para ter os IDs
    const { data: enderecosBD } = await supabase
      .from('enderecos')
      .select('*')
      .in('cliente_id', Object.values(clientesMap))

    // Mapear endereços principais por cliente
    const enderecosMap = {}
    enderecosBD.forEach(e => {
      if (e.is_principal) {
        enderecosMap[e.cliente_id] = e.id
      }
    })

    // Buscar motoboys
    const { data: motoboys } = await supabase
      .from('motoboys')
      .select('*')
      .in('nome', ['Marcio', 'Bruno'])

    const motoboyMarcio = motoboys.find(m => m.nome === 'Marcio')
    const motoboyBruno = motoboys.find(m => m.nome === 'Bruno')

    // 3. Inserir Entregas/Romaneios
    console.log('🏍️ Inserindo entregas...')

    const hoje = new Date().toISOString().split('T')[0]
    const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    const { data: entregas, error: erroEntregas } = await supabase
      .from('entregas')
      .insert([
        {
          cliente_id: clientesMap['12345678901'],
          endereco_id: enderecosMap[clientesMap['12345678901']],
          motoboy_id: motoboyMarcio?.id,
          requisicao: 'REQ-001',
          endereco_destino: 'Rua das Flores, 123 - Centro, Balneário Camboriú - SC',
          regiao: 'BC',
          data_entrega: hoje,
          periodo: 'Tarde',
          status: 'Produzindo no Laboratório',
          forma_pagamento: 'Pago',
          valor: 9.00,
          item_geladeira: false,
          buscar_receita: false
        },
        {
          cliente_id: clientesMap['98765432109'],
          endereco_id: enderecosMap[clientesMap['98765432109']],
          motoboy_id: motoboyBruno?.id,
          requisicao: 'REQ-002',
          endereco_destino: 'Av. Brasil, 456 - Centro, Itajaí - SC',
          regiao: 'ITAJAI',
          data_entrega: hoje,
          periodo: 'Tarde',
          status: 'A Caminho',
          forma_pagamento: 'Dinheiro',
          valor: 17.00,
          item_geladeira: true,
          buscar_receita: false
        },
        {
          cliente_id: clientesMap['11122233344'],
          endereco_id: enderecosMap[clientesMap['11122233344']],
          motoboy_id: motoboyMarcio?.id,
          requisicao: 'REQ-003',
          endereco_destino: 'Rua Camboriú, 321 - Centro, Balneário Camboriú - SC',
          regiao: 'CAMBORIÚ',
          data_entrega: hoje,
          periodo: 'Manhã',
          status: 'Entregue',
          forma_pagamento: 'Maquina',
          valor: 16.00,
          item_geladeira: false,
          buscar_receita: true
        },
        {
          cliente_id: clientesMap['55566677788'],
          endereco_id: enderecosMap[clientesMap['55566677788']],
          motoboy_id: motoboyBruno?.id,
          requisicao: 'REQ-004',
          endereco_destino: 'Av. Atlântica, 1000 - Praia Brava, Balneário Camboriú - SC',
          regiao: 'PRAIA BRAVA',
          data_entrega: hoje,
          periodo: 'Tarde',
          status: 'Produzindo no Laboratório',
          forma_pagamento: 'Pix - Aguardando',
          valor: 11.50,
          item_geladeira: true,
          buscar_receita: false
        },
        {
          cliente_id: clientesMap['99988877766'],
          endereco_id: enderecosMap[clientesMap['99988877766']],
          motoboy_id: motoboyBruno?.id,
          requisicao: 'REQ-005',
          endereco_destino: 'Rua Itapema, 555 - Centro, Itapema - SC',
          regiao: 'ITAPEMA',
          data_entrega: amanha,
          periodo: 'Manhã',
          status: 'Produzindo no Laboratório',
          forma_pagamento: 'Só Entregar',
          valor: 25.00,
          item_geladeira: false,
          buscar_receita: true
        },
        {
          cliente_id: clientesMap['12345678901'],
          endereco_id: enderecosMap[clientesMap['12345678901']],
          motoboy_id: motoboyMarcio?.id,
          requisicao: 'REQ-006',
          endereco_destino: 'Rua das Flores, 123 - Centro, Balneário Camboriú - SC',
          regiao: 'BC',
          data_entrega: hoje,
          periodo: 'Tarde',
          status: 'A Caminho',
          forma_pagamento: 'Troco P/',
          valor: 9.00,
          item_geladeira: false,
          buscar_receita: false
        },
      ])
      .select()

    if (erroEntregas) {
      console.error('❌ Erro ao inserir entregas:', erroEntregas)
      console.error('Detalhes:', erroEntregas.message)
      return
    }
    console.log(`✅ ${entregas.length} entregas inseridas com sucesso!\n`)

    // Verificar totais
    console.log('📊 Resumo dos dados inseridos:')
    const { count: totalClientes } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
    const { count: totalEnderecos } = await supabase.from('enderecos').select('*', { count: 'exact', head: true })
    const { count: totalEntregas } = await supabase.from('entregas').select('*', { count: 'exact', head: true })

    console.log(`   Clientes: ${totalClientes}`)
    console.log(`   Endereços: ${totalEnderecos}`)
    console.log(`   Entregas: ${totalEntregas}`)
    console.log('\n✨ Dados de teste inseridos com sucesso!')

  } catch (erro) {
    console.error('💥 Erro geral:', erro)
  }
}

inserirDadosTeste()
