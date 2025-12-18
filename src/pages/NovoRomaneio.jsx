import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { theme } from '@/lib/theme';
import { supabase } from '@/api/supabaseClient';

// Tabela de valores por região e motoboy
const VALORES_ENTREGA = {
  Marcio: {
    'BC': 9,
    'NOVA ESPERANÇA': 11,
    'CAMBORIÚ': 16,
    'TABULEIRO': 11,
    'MONTE ALEGRE': 11,
    'BARRA': 11,
    'ESTALEIRO': 16,
    'TAQUARAS': 16,
    'LARANJEIRAS': 16,
    'ITAJAI': 19,
    'ESPINHEIROS': 23,
    'PRAIA DOS AMORES': 13.50,
    'PRAIA BRAVA': 13.50,
    'ITAPEMA': 27,
    'NAVEGANTES': 30,
    'PENHA': 52,
    'PORTO BELO': 52,
    'TIJUCAS': 52,
    'PIÇARRAS': 52,
    'BOMBINHAS': 72,
    'CLINICA': 9
  },
  Bruno: {
    'BC': 7,
    'NOVA ESPERANÇA': 9,
    'CAMBORIÚ': 14,
    'TABULEIRO': 9,
    'MONTE ALEGRE': 9,
    'BARRA': 9,
    'ESTALEIRO': 14,
    'TAQUARAS': 14,
    'LARANJEIRAS': 14,
    'ITAJAI': 17,
    'ESPINHEIROS': 21,
    'PRAIA DOS AMORES': 11.50,
    'PRAIA BRAVA': 11.50,
    'ITAPEMA': 25,
    'NAVEGANTES': 40,
    'PENHA': 50,
    'PORTO BELO': 30,
    'TIJUCAS': 50,
    'PIÇARRAS': 50,
    'BOMBINHAS': 50,
    'CLINICA': 7
  }
};

// Motoboy automático por região
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

const REGIOES = [
  'BC', 'NOVA ESPERANÇA', 'CAMBORIÚ', 'TABULEIRO', 'MONTE ALEGRE', 
  'BARRA', 'ESTALEIRO', 'TAQUARAS', 'LARANJEIRAS', 'ITAJAI', 
  'ESPINHEIROS', 'PRAIA DOS AMORES', 'PRAIA BRAVA', 'ITAPEMA', 
  'NAVEGANTES', 'PENHA', 'PORTO BELO', 'TIJUCAS', 'PIÇARRAS', 
  'BOMBINHAS', 'CLINICA', 'OUTRO'
];

const FORMAS_PAGAMENTO = [
  'Pago', 'Dinheiro', 'Maquina', 'Troco P/', 'Via na Pasta',
  'Só Entregar', 'Aguardando', 'Pix - Aguardando',
  'Link - Aguardando', 'Boleto', 'Pagar MP'
];

// Mapeamento de cidades/bairros para regiões
const MAPEAMENTO_REGIOES = {
  'balneário camboriú': {
    'centro': 'BC',
    'estados': 'BC',
    'pioneiros': 'BC',
    'nova esperança': 'NOVA ESPERANÇA',
    'nações': 'BC',
    'barra': 'BARRA',
    'barra sul': 'BARRA',
    'estaleiro': 'ESTALEIRO',
    'estaleirinho': 'ESTALEIRO',
    'taquaras': 'TAQUARAS',
    'laranjeiras': 'LARANJEIRAS',
    'praia dos amores': 'PRAIA DOS AMORES',
    'praia brava': 'PRAIA BRAVA',
    'default': 'BC'
  },
  'camboriú': {
    'default': 'CAMBORIÚ'
  },
  'itajaí': {
    'default': 'ITAJAI'
  },
  'itapema': {
    'default': 'ITAPEMA'
  },
  'navegantes': {
    'default': 'NAVEGANTES'
  },
  'penha': {
    'default': 'PENHA'
  },
  'porto belo': {
    'default': 'PORTO BELO'
  },
  'tijucas': {
    'default': 'TIJUCAS'
  },
  'piçarras': {
    'default': 'PIÇARRAS'
  },
  'bombinhas': {
    'default': 'BOMBINHAS'
  }
};

// Função para detectar região automaticamente
const detectarRegiao = (cidade, bairro) => {
  const cidadeLower = cidade?.toLowerCase().trim() || '';
  const bairroLower = bairro?.toLowerCase().trim() || '';

  // Buscar por cidade
  if (MAPEAMENTO_REGIOES[cidadeLower]) {
    const mapa = MAPEAMENTO_REGIOES[cidadeLower];
    // Tentar encontrar por bairro específico
    if (bairroLower && mapa[bairroLower]) {
      return mapa[bairroLower];
    }
    // Usar região padrão da cidade
    return mapa.default;
  }

  return '';
};

export default function NovoRomaneio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [buscarCliente, setBuscarCliente] = useState('');
  const [clientesSugestoes, setClientesSugestoes] = useState([]);
  const [showCadastroCliente, setShowCadastroCliente] = useState(false);
  
  const [clienteEnderecos, setClienteEnderecos] = useState([]);
  const [showNovoEndereco, setShowNovoEndereco] = useState(false);
  const [novoEndereco, setNovoEndereco] = useState({
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    cep: ''
  });

  const [formData, setFormData] = useState({
    cliente_id: '',
    cliente_nome: '',
    numero_requisicao: '',
    endereco_id: '', // ID do endereço selecionado
    endereco: '', // Texto livre para novo endereço
    regiao: '',
    outra_cidade: '',
    data_entrega: new Date().toISOString().split('T')[0],
    periodo: 'Tarde',
    forma_pagamento: '',
    motoboy: '',
    valor_entrega: 0,
    item_geladeira: false,
    buscar_receita: false,
    observacoes: ''
  });

  const [errors, setErrors] = useState({});

  // Buscar clientes
  const handleBuscarCliente = async (termo) => {
    setBuscarCliente(termo);
    if (termo.length < 2) {
      setClientesSugestoes([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .ilike('nome', `%${termo}%`)
        .limit(5);

      if (error) throw error;
      setClientesSugestoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  // Selecionar cliente
  const selecionarCliente = (cliente) => {
    console.log('Cliente selecionado:', cliente);
    console.log('Vai buscar endereços agora...');

    setFormData({
      ...formData,
      cliente_id: cliente.id,
      cliente_nome: cliente.nome,
      endereco_id: '',
      endereco: ''
    });
    setBuscarCliente(cliente.nome);
    setClientesSugestoes([]);

    // Buscar endereços do cliente imediatamente
    carregarEnderecosCliente(cliente.id);
  };

  // Carregar endereços do cliente
  const carregarEnderecosCliente = async (clienteId) => {
    console.log('Buscando endereços para cliente ID:', clienteId);
    try {
      const { data, error } = await supabase
        .from('enderecos')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('is_principal', { ascending: false });

      console.log('Endereços encontrados:', data);
      console.log('Erro ao buscar endereços:', error);

      if (error) throw error;
      setClienteEnderecos(data || []);

      // Se só tem um endereço, seleciona automaticamente
      if (data && data.length === 1) {
        console.log('Selecionando endereço automaticamente:', data[0]);
        selecionarEndereco(data[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      setClienteEnderecos([]);
    }
  };

  // Selecionar endereço
  const selecionarEndereco = (endereco) => {
    console.log('Selecionando endereço:', endereco);

    setFormData(prevFormData => ({
      ...prevFormData,
      endereco_id: endereco.id,
      endereco: endereco.endereco_completo || `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro}`,
      regiao: endereco.regiao || ''
    }));

    setShowNovoEndereco(false);

    // Atualizar região e calcular valor
    if (endereco.regiao) {
      handleRegiaoChange(endereco.regiao);
    }
  };

  // Calcular valor automaticamente
  const calcularValor = (regiao, motoboy) => {
    if (regiao === 'OUTRO' || !regiao || !motoboy) return 0;
    return VALORES_ENTREGA[motoboy]?.[regiao] || 0;
  };

  // Atualizar região
  const handleRegiaoChange = (regiao) => {
    console.log('Mudando região para:', regiao);

    setFormData(prevFormData => {
      const motoboy = regiao === 'OUTRO' ? prevFormData.motoboy : (MOTOBOY_POR_REGIAO[regiao] || 'Marcio');
      const valor = calcularValor(regiao, motoboy);

      console.log('Novo motoboy:', motoboy, 'Novo valor:', valor);

      return {
        ...prevFormData,
        regiao,
        motoboy,
        valor_entrega: valor
      };
    });
  };

  // Atualizar motoboy
  const handleMotoboyChange = (motoboy) => {
    const valor = calcularValor(formData.regiao, motoboy);
    setFormData({
      ...formData,
      motoboy,
      valor_entrega: valor
    });
  };

  // Validar formulário
  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.cliente_id) novosErros.cliente = 'Selecione um cliente';
    if (!formData.numero_requisicao) novosErros.requisicao = 'Número de requisição obrigatório';

    // Validar endereço
    if (!formData.endereco_id) {
      // Se não tem endereço cadastrado selecionado, validar novo endereço
      if (!novoEndereco.logradouro || !novoEndereco.numero || !novoEndereco.bairro || !novoEndereco.cidade) {
        novosErros.endereco = 'Preencha todos os campos do endereço';
      }
    }

    if (!formData.regiao) novosErros.regiao = 'Selecione a região';
    if (formData.regiao === 'OUTRO' && !formData.outra_cidade) novosErros.outra_cidade = 'Informe a cidade';
    if (!formData.data_entrega) novosErros.data = 'Data obrigatória';
    if (!formData.forma_pagamento) novosErros.pagamento = 'Forma de pagamento obrigatória';
    if (!formData.motoboy) novosErros.motoboy = 'Selecione o motoboy';

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Salvar romaneio
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Criando romaneio...');

    try {
      // Verificar se número de requisição já existe
      const { data: existe } = await supabase
        .from('entregas')
        .select('id')
        .eq('requisicao', formData.numero_requisicao)
        .maybeSingle();

      if (existe) {
        toast.error('Já existe um romaneio com esse número de requisição!', { id: toastId });
        setLoading(false);
        return;
      }

      // Se não tem endereço selecionado, criar novo endereço no banco
      let enderecoIdFinal = formData.endereco_id;
      let enderecoTexto = formData.endereco;

      if (!formData.endereco_id && novoEndereco.logradouro) {
        const enderecoCompleto = `${novoEndereco.logradouro}, ${novoEndereco.numero}${novoEndereco.complemento ? ' - ' + novoEndereco.complemento : ''} - ${novoEndereco.bairro}, ${novoEndereco.cidade} - SC`;

        const { data: novoEnd, error: endError } = await supabase
          .from('enderecos')
          .insert([{
            cliente_id: formData.cliente_id,
            logradouro: novoEndereco.logradouro,
            numero: novoEndereco.numero,
            complemento: novoEndereco.complemento || null,
            bairro: novoEndereco.bairro,
            cidade: novoEndereco.cidade,
            estado: 'SC',
            cep: novoEndereco.cep || null,
            regiao: formData.regiao,
            is_principal: false,
            endereco_completo: enderecoCompleto
          }])
          .select()
          .single();

        if (endError) {
          console.error('Erro ao criar endereço:', endError);
        } else {
          enderecoIdFinal = novoEnd.id;
          enderecoTexto = enderecoCompleto;
        }
      }

      // Buscar ID do motoboy pelo nome
      let motoboyId = null;
      if (formData.motoboy) {
        const { data: motoboy } = await supabase
          .from('motoboys')
          .select('id')
          .eq('nome', formData.motoboy)
          .maybeSingle();

        motoboyId = motoboy?.id || null;
      }

      // Criar entrega
      const { data, error } = await supabase
        .from('entregas')
        .insert([{
          cliente_id: formData.cliente_id,
          endereco_id: enderecoIdFinal || null,
          requisicao: formData.numero_requisicao,
          endereco_destino: enderecoTexto,
          regiao: formData.regiao,
          outra_cidade: formData.regiao === 'OUTRO' ? formData.outra_cidade : null,
          tipo: 'moto',
          data_criacao: new Date().toISOString(),
          data_entrega: formData.data_entrega,
          periodo: formData.periodo,
          status: 'Produzindo no Laboratório',
          motoboy_id: motoboyId,
          forma_pagamento: formData.forma_pagamento,
          valor: formData.valor_entrega,
          item_geladeira: formData.item_geladeira,
          buscar_receita: formData.buscar_receita,
          observacoes: formData.observacoes
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Romaneio criado com sucesso!', { id: toastId });

      // Aguardar um pouco antes de navegar para o usuário ver o toast
      setTimeout(() => navigate('/'), 800);
    } catch (error) {
      console.error('Erro ao criar romaneio:', error);
      toast.error('Erro ao criar romaneio: ' + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.primary,
            fontSize: '0.875rem',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          ← Voltar
        </button>
        <h1 style={{ 
          fontSize: '1.875rem', 
          fontWeight: '700',
          color: theme.colors.text,
          marginBottom: '0.25rem'
        }}>
          Novo Romaneio
        </h1>
        <p style={{ color: theme.colors.textLight, fontSize: '0.875rem' }}>
          Crie uma nova ordem de entrega
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Informações do Romaneio */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: '1.5rem'
          }}>
            Informações do Romaneio
          </h3>

          {/* Cliente */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: theme.colors.text,
              marginBottom: '0.5rem'
            }}>
              Cliente(s) *
            </label>
            <input
              type="text"
              value={buscarCliente}
              onChange={(e) => handleBuscarCliente(e.target.value)}
              placeholder="Buscar cliente por nome, CPF ou telefone..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${errors.cliente ? theme.colors.danger : theme.colors.border}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
            {clientesSugestoes.length > 0 && (
              <div style={{
                position: 'absolute',
                zIndex: 10,
                background: 'white',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '0.375rem',
                marginTop: '0.25rem',
                maxHeight: '200px',
                overflowY: 'auto',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {clientesSugestoes.map(cliente => (
                  <div
                    key={cliente.id}
                    onClick={() => selecionarCliente(cliente)}
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${theme.colors.border}`
                    }}
                    onMouseEnter={(e) => e.target.style.background = theme.colors.background}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    <p style={{ fontWeight: '500', margin: 0 }}>{cliente.nome}</p>
                    <p style={{ fontSize: '0.75rem', color: theme.colors.textLight, margin: 0 }}>
                      {cliente.telefone}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {buscarCliente.length >= 2 && clientesSugestoes.length === 0 && (
              <button
                type="button"
                onClick={() => setShowCadastroCliente(true)}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: theme.colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                + Cadastrar Novo Cliente
              </button>
            )}
            {errors.cliente && (
              <p style={{ color: theme.colors.danger, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.cliente}
              </p>
            )}
          </div>

          {/* Endereço de Entrega */}
          {formData.cliente_id && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Endereço de Entrega *
              </label>

              {!showNovoEndereco && clienteEnderecos.length > 0 ? (
                <div>
                  <select
                    value={formData.endereco_id}
                    onChange={(e) => {
                      const enderecoSelecionado = clienteEnderecos.find(end => end.id === e.target.value);
                      if (enderecoSelecionado) {
                        selecionarEndereco(enderecoSelecionado);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.endereco ? theme.colors.danger : theme.colors.border}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <option value="">Selecione um endereço</option>
                    {clienteEnderecos.map(endereco => (
                      <option key={endereco.id} value={endereco.id}>
                        {endereco.endereco_completo || `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro}, ${endereco.cidade}`}
                        {endereco.is_principal ? ' (Principal)' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNovoEndereco(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'white',
                      color: theme.colors.primary,
                      border: `1px solid ${theme.colors.primary}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    + Usar outro endereço
                  </button>
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  background: theme.colors.background,
                  borderRadius: '0.375rem',
                  border: `1px solid ${theme.colors.border}`
                }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Novo Endereço
                  </h4>

                  {/* Grid: Logradouro e Número */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                        Rua/Logradouro *
                      </label>
                      <input
                        type="text"
                        value={novoEndereco.logradouro}
                        onChange={(e) => setNovoEndereco({...novoEndereco, logradouro: e.target.value})}
                        placeholder="Ex: Rua das Flores"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                        Número *
                      </label>
                      <input
                        type="text"
                        value={novoEndereco.numero}
                        onChange={(e) => setNovoEndereco({...novoEndereco, numero: e.target.value})}
                        placeholder="123"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Complemento */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={novoEndereco.complemento}
                      onChange={(e) => setNovoEndereco({...novoEndereco, complemento: e.target.value})}
                      placeholder="Ex: Apto 101, Casa 2"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  {/* Grid: Bairro e Cidade */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                        Bairro *
                      </label>
                      <input
                        type="text"
                        value={novoEndereco.bairro}
                        onChange={(e) => {
                          const novoBairro = e.target.value;
                          setNovoEndereco({...novoEndereco, bairro: novoBairro});
                          // Detectar região automaticamente
                          const regiaoDetectada = detectarRegiao(novoEndereco.cidade, novoBairro);
                          if (regiaoDetectada) {
                            handleRegiaoChange(regiaoDetectada);
                          }
                        }}
                        placeholder="Ex: Centro"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                        Cidade *
                      </label>
                      <input
                        type="text"
                        value={novoEndereco.cidade}
                        onChange={(e) => {
                          const novaCidade = e.target.value;
                          setNovoEndereco({...novoEndereco, cidade: novaCidade});
                          // Detectar região automaticamente
                          const regiaoDetectada = detectarRegiao(novaCidade, novoEndereco.bairro);
                          if (regiaoDetectada) {
                            handleRegiaoChange(regiaoDetectada);
                          }
                        }}
                        placeholder="Ex: Balneário Camboriú"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* CEP */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                      CEP
                    </label>
                    <input
                      type="text"
                      value={novoEndereco.cep}
                      onChange={(e) => setNovoEndereco({...novoEndereco, cep: e.target.value})}
                      placeholder="88330-000"
                      style={{
                        width: '200px',
                        padding: '0.5rem',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  {clienteEnderecos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowNovoEndereco(false);
                        setNovoEndereco({ logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', cep: '' });
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'white',
                        color: theme.colors.textLight,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      ← Voltar aos endereços cadastrados
                    </button>
                  )}
                </div>
              )}
              {errors.endereco && (
                <p style={{ color: theme.colors.danger, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.endereco}
                </p>
              )}
            </div>
          )}

          {/* Número da Requisição */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: theme.colors.text,
              marginBottom: '0.5rem'
            }}>
              Número da Requisição *
            </label>
            <input
              type="text"
              value={formData.numero_requisicao}
              onChange={(e) => setFormData({...formData, numero_requisicao: e.target.value})}
              placeholder="Ex: REQ-001"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${errors.requisicao ? theme.colors.danger : theme.colors.border}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
            {errors.requisicao && (
              <p style={{ color: theme.colors.danger, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.requisicao}
              </p>
            )}
          </div>

          {/* Grid: Região e Data */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Cidade/Região *
              </label>
              <select
                value={formData.regiao}
                onChange={(e) => handleRegiaoChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.regiao ? theme.colors.danger : theme.colors.border}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Selecione a cidade</option>
                {REGIOES.map(regiao => (
                  <option key={regiao} value={regiao}>{regiao}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Data de Entrega *
              </label>
              <input
                type="date"
                value={formData.data_entrega}
                onChange={(e) => setFormData({...formData, data_entrega: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          {/* Outra Cidade (se OUTRO) */}
          {formData.regiao === 'OUTRO' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Nome da Cidade *
              </label>
              <input
                type="text"
                value={formData.outra_cidade}
                onChange={(e) => setFormData({...formData, outra_cidade: e.target.value})}
                placeholder="Digite o nome da cidade"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.outra_cidade ? theme.colors.danger : theme.colors.border}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          )}

          {/* Grid: Período e Forma de Pagamento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Período de Entrega *
              </label>
              <select
                value={formData.periodo}
                onChange={(e) => setFormData({...formData, periodo: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Forma de Pagamento *
              </label>
              <select
                value={formData.forma_pagamento}
                onChange={(e) => setFormData({...formData, forma_pagamento: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.pagamento ? theme.colors.danger : theme.colors.border}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Selecione</option>
                {FORMAS_PAGAMENTO.map(forma => (
                  <option key={forma} value={forma}>{forma}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid: Motoboy e Valor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Motoboy *
              </label>
              <select
                value={formData.motoboy}
                onChange={(e) => handleMotoboyChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.motoboy ? theme.colors.danger : theme.colors.border}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Selecione o motoboy</option>
                <option value="Marcio">Marcio</option>
                <option value="Bruno">Bruno</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: theme.colors.textLight, marginTop: '0.25rem' }}>
                Valor calculado automaticamente
              </p>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Valor da Entrega (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valor_entrega}
                onChange={(e) => setFormData({...formData, valor_entrega: parseFloat(e.target.value) || 0})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: theme.colors.primary
                }}
              />
            </div>
          </div>

          {/* Item de Geladeira */}
          <div style={{
            padding: '1rem',
            background: formData.item_geladeira ? '#fef3c7' : theme.colors.background,
            borderRadius: '0.375rem',
            marginBottom: '1rem'
          }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: '0.5rem'
            }}>
              Item de Geladeira? *
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="geladeira"
                  checked={formData.item_geladeira === true}
                  onChange={() => setFormData({...formData, item_geladeira: true})}
                />
                <span style={{ fontSize: '0.875rem' }}>Sim</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="geladeira"
                  checked={formData.item_geladeira === false}
                  onChange={() => setFormData({...formData, item_geladeira: false})}
                />
                <span style={{ fontSize: '0.875rem' }}>Não</span>
              </label>
            </div>
          </div>

          {/* Buscar Receita */}
          <div style={{
            padding: '1rem',
            background: formData.buscar_receita ? '#fef3c7' : theme.colors.background,
            borderRadius: '0.375rem',
            marginBottom: '1rem'
          }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: '0.5rem'
            }}>
              Buscar Receita? *
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="receita"
                  checked={formData.buscar_receita === true}
                  onChange={() => setFormData({...formData, buscar_receita: true})}
                />
                <span style={{ fontSize: '0.875rem' }}>Sim</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="receita"
                  checked={formData.buscar_receita === false}
                  onChange={() => setFormData({...formData, buscar_receita: false})}
                />
                <span style={{ fontSize: '0.875rem' }}>Não</span>
              </label>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: theme.colors.text,
              marginBottom: '0.5rem'
            }}>
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              placeholder="Informações adicionais sobre a entrega"
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'white',
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '0.375rem',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: loading ? theme.colors.textLight : theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Criando...' : 'Criar Romaneio'}
          </button>
        </div>
      </form>
    </div>
  );
}