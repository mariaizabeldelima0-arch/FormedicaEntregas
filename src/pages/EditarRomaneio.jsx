import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    'tabuleiro': 'TABULEIRO',
    'monte alegre': 'MONTE ALEGRE',
    'default': 'BC'
  },
  'bc': {
    'default': 'BC'
  },
  'balneario camboriu': {
    'centro': 'BC',
    'estados': 'BC',
    'pioneiros': 'BC',
    'nova esperança': 'NOVA ESPERANÇA',
    'nova esperanca': 'NOVA ESPERANÇA',
    'nações': 'BC',
    'nacoes': 'BC',
    'barra': 'BARRA',
    'barra sul': 'BARRA',
    'estaleiro': 'ESTALEIRO',
    'estaleirinho': 'ESTALEIRO',
    'taquaras': 'TAQUARAS',
    'laranjeiras': 'LARANJEIRAS',
    'praia dos amores': 'PRAIA DOS AMORES',
    'praia brava': 'PRAIA BRAVA',
    'tabuleiro': 'TABULEIRO',
    'monte alegre': 'MONTE ALEGRE',
    'default': 'BC'
  },
  'camboriú': {
    'default': 'CAMBORIÚ'
  },
  'camboriu': {
    'default': 'CAMBORIÚ'
  },
  'itajaí': {
    'centro': 'ITAJAI',
    'vila real': 'ITAJAI',
    'espinheiros': 'ESPINHEIROS',
    'default': 'ITAJAI'
  },
  'itajai': {
    'centro': 'ITAJAI',
    'vila real': 'ITAJAI',
    'espinheiros': 'ESPINHEIROS',
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
  'picarras': {
    'default': 'PIÇARRAS'
  },
  'bombinhas': {
    'default': 'BOMBINHAS'
  }
};

// Normalizar nome de cidade (substituir BC por Balneário Camboriú)
const normalizarCidade = (cidade) => {
  const cidadeTrim = cidade?.trim() || '';
  if (cidadeTrim.toUpperCase() === 'BC') {
    return 'Balneário Camboriú';
  }
  return cidadeTrim;
};

// Função para detectar região automaticamente
const detectarRegiao = (cidade, bairro) => {
  const cidadeLower = cidade?.toLowerCase().trim() || '';
  const bairroLower = bairro?.toLowerCase().trim() || '';

  console.log('🔍 Detectando região:', { cidade: cidadeLower, bairro: bairroLower });

  // Buscar por cidade
  if (MAPEAMENTO_REGIOES[cidadeLower]) {
    const mapa = MAPEAMENTO_REGIOES[cidadeLower];

    // Se o bairro for "centro", sempre usar região padrão da cidade
    if (bairroLower === 'centro') {
      console.log('✅ Bairro Centro - usando região padrão da cidade:', mapa.default);
      return mapa.default;
    }

    // Se o bairro estiver mapeado E for diferente do default, usar a região do bairro
    if (bairroLower && mapa[bairroLower] && mapa[bairroLower] !== mapa.default) {
      console.log('✅ Região detectada por bairro cadastrado:', mapa[bairroLower]);
      return mapa[bairroLower];
    }

    // Usar região padrão da cidade (bairro não cadastrado ou sem bairro)
    console.log('✅ Região detectada por cidade (default):', mapa.default);
    return mapa.default;
  }

  console.log('❌ Nenhuma região detectada');
  return '';
};

export default function EditarRomaneio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const entregaId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [loadingEntrega, setLoadingEntrega] = useState(true);
  const [buscarCliente, setBuscarCliente] = useState('');
  const [clientesSugestoes, setClientesSugestoes] = useState([]);
  const [showCadastroCliente, setShowCadastroCliente] = useState(false);
  
  const [clienteEnderecos, setClienteEnderecos] = useState([]);
  const [showNovoEndereco, setShowNovoEndereco] = useState(false);
  const [enderecoEditando, setEnderecoEditando] = useState(null);
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

  // Detectar região automaticamente quando cidade ou bairro do novo endereço mudam
  useEffect(() => {
    if (novoEndereco.cidade && novoEndereco.bairro && showNovoEndereco) {
      const regiaoDetectada = detectarRegiao(novoEndereco.cidade, novoEndereco.bairro);
      console.log('🔍 useEffect detectando região:', { cidade: novoEndereco.cidade, bairro: novoEndereco.bairro, regiaoDetectada });
      if (regiaoDetectada && regiaoDetectada !== formData.regiao) {
        console.log('✅ Atualizando região para:', regiaoDetectada);
        handleRegiaoChange(regiaoDetectada);
      }
    }
  }, [novoEndereco.cidade, novoEndereco.bairro, showNovoEndereco]);

  // Carregar dados da entrega ao montar o componente
  useEffect(() => {
    if (!entregaId) {
      toast.error('ID da entrega não fornecido');
      navigate('/');
      return;
    }

    async function carregarEntrega() {
      try {
        setLoadingEntrega(true);

        const { data: entrega, error } = await supabase
          .from('entregas')
          .select(`
            *,
            cliente:clientes(id, nome, telefone),
            endereco:enderecos(id, endereco_completo, logradouro, numero, complemento, bairro, cidade, cep, regiao),
            motoboy:motoboys(id, nome)
          `)
          .eq('id', entregaId)
          .single();

        if (error) throw error;

        if (!entrega) {
          toast.error('Entrega não encontrada');
          navigate('/');
          return;
        }

        // Preencher formulário com dados da entrega
        setFormData({
          cliente_id: entrega.cliente_id,
          cliente_nome: entrega.cliente?.nome || '',
          numero_requisicao: entrega.requisicao,
          endereco_id: entrega.endereco_id || '',
          endereco: entrega.endereco?.endereco_completo || entrega.endereco_destino || '',
          regiao: entrega.regiao || '',
          outra_cidade: entrega.outra_cidade || '',
          data_entrega: entrega.data_entrega || '',
          periodo: entrega.periodo || 'Tarde',
          forma_pagamento: entrega.forma_pagamento || '',
          motoboy: entrega.motoboy?.nome || '',
          valor_entrega: entrega.valor || 0,
          item_geladeira: entrega.item_geladeira || false,
          buscar_receita: entrega.buscar_receita || false,
          observacoes: entrega.observacoes || ''
        });

        setBuscarCliente(entrega.cliente?.nome || '');

        // Carregar endereços do cliente
        if (entrega.cliente_id) {
          await carregarEnderecosCliente(entrega.cliente_id);
        }

        setLoadingEntrega(false);
      } catch (error) {
        console.error('Erro ao carregar entrega:', error);
        toast.error('Erro ao carregar dados da entrega');
        setLoadingEntrega(false);
      }
    }

    carregarEntrega();
  }, [entregaId, navigate]);

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

  // Excluir endereço
  const handleExcluirEndereco = async (enderecoId) => {
    if (!window.confirm('Tem certeza que deseja excluir este endereço?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('enderecos')
        .delete()
        .eq('id', enderecoId);

      if (error) throw error;

      // Atualizar lista de endereços
      setClienteEnderecos(prev => prev.filter(e => e.id !== enderecoId));

      // Se o endereço excluído estava selecionado, limpar seleção
      if (formData.endereco_id === enderecoId) {
        setFormData(prev => ({
          ...prev,
          endereco_id: '',
          endereco: '',
          regiao: ''
        }));
      }

      toast.success('Endereço excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      toast.error('Erro ao excluir endereço: ' + error.message);
    }
  };

  // Iniciar edição de endereço
  const handleEditarEndereco = (endereco) => {
    setEnderecoEditando({
      id: endereco.id,
      logradouro: endereco.logradouro || '',
      numero: endereco.numero || '',
      complemento: endereco.complemento || '',
      bairro: endereco.bairro || '',
      cidade: endereco.cidade || '',
      cep: endereco.cep || '',
      regiao: endereco.regiao || ''
    });
  };

  // Cancelar edição de endereço
  const handleCancelarEdicao = () => {
    setEnderecoEditando(null);
  };

  // Salvar edição de endereço
  const handleSalvarEdicaoEndereco = async () => {
    if (!enderecoEditando.logradouro || !enderecoEditando.numero || !enderecoEditando.bairro || !enderecoEditando.cidade) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const enderecoCompleto = `${enderecoEditando.logradouro}, ${enderecoEditando.numero}${enderecoEditando.complemento ? ' - ' + enderecoEditando.complemento : ''} - ${enderecoEditando.bairro}, ${enderecoEditando.cidade} - SC`;

      // Detectar região automaticamente
      const regiaoDetectada = detectarRegiao(enderecoEditando.cidade, enderecoEditando.bairro);

      const { error } = await supabase
        .from('enderecos')
        .update({
          logradouro: enderecoEditando.logradouro,
          numero: enderecoEditando.numero,
          complemento: enderecoEditando.complemento || null,
          bairro: enderecoEditando.bairro,
          cidade: enderecoEditando.cidade,
          cep: enderecoEditando.cep || null,
          regiao: regiaoDetectada || enderecoEditando.regiao,
          endereco_completo: enderecoCompleto
        })
        .eq('id', enderecoEditando.id);

      if (error) throw error;

      // Atualizar lista de endereços
      setClienteEnderecos(prev => prev.map(e =>
        e.id === enderecoEditando.id
          ? { ...e, ...enderecoEditando, endereco_completo: enderecoCompleto, regiao: regiaoDetectada || enderecoEditando.regiao }
          : e
      ));

      // Se o endereço editado está selecionado, atualizar formData
      if (formData.endereco_id === enderecoEditando.id) {
        setFormData(prev => ({
          ...prev,
          endereco: enderecoCompleto,
          regiao: regiaoDetectada || enderecoEditando.regiao
        }));
        if (regiaoDetectada) {
          handleRegiaoChange(regiaoDetectada);
        }
      }

      setEnderecoEditando(null);
      toast.success('Endereço atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      toast.error('Erro ao atualizar endereço: ' + error.message);
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

  // Salvar alterações do romaneio
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Salvando alterações...');

    try {
      // Verificar se número de requisição já existe (mas ignorar o próprio registro)
      const { data: existe } = await supabase
        .from('entregas')
        .select('id')
        .eq('requisicao', formData.numero_requisicao)
        .neq('id', entregaId)
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
        console.log('📍 Criando novo endereço:', novoEndereco);
        const enderecoCompleto = `${novoEndereco.logradouro}, ${novoEndereco.numero}${novoEndereco.complemento ? ' - ' + novoEndereco.complemento : ''} - ${novoEndereco.bairro}, ${novoEndereco.cidade} - SC`;

        const enderecoParaInserir = {
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
        };

        console.log('📍 Dados do endereço a inserir:', enderecoParaInserir);

        const { data: novoEnd, error: endError } = await supabase
          .from('enderecos')
          .insert([enderecoParaInserir])
          .select()
          .single();

        if (endError) {
          console.error('❌ Erro ao criar endereço:', endError);
          toast.error('Erro ao criar endereço: ' + endError.message, { id: toastId });
          setLoading(false);
          return;
        } else {
          console.log('✅ Endereço criado com sucesso:', novoEnd);
          enderecoIdFinal = novoEnd.id;
          enderecoTexto = enderecoCompleto;

          // Adicionar o novo endereço à lista local
          setClienteEnderecos(prev => {
            const novos = [...prev, novoEnd];
            console.log('📋 Lista de endereços atualizada:', novos);
            return novos;
          });
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

      // Atualizar entrega
      const { data, error } = await supabase
        .from('entregas')
        .update({
          cliente_id: formData.cliente_id,
          endereco_id: enderecoIdFinal || null,
          requisicao: formData.numero_requisicao,
          endereco_destino: enderecoTexto,
          regiao: formData.regiao,
          outra_cidade: formData.regiao === 'OUTRO' ? formData.outra_cidade : null,
          data_entrega: formData.data_entrega,
          periodo: formData.periodo,
          motoboy_id: motoboyId,
          forma_pagamento: formData.forma_pagamento,
          valor: formData.valor_entrega,
          item_geladeira: formData.item_geladeira,
          buscar_receita: formData.buscar_receita,
          observacoes: formData.observacoes
        })
        .eq('id', entregaId)
        .select()
        .single();

      if (error) throw error;

      toast.success('Romaneio atualizado com sucesso!', { id: toastId });

      // Aguardar um pouco antes de navegar para o usuário ver o toast
      setTimeout(() => navigate('/'), 800);
    } catch (error) {
      console.error('Erro ao criar romaneio:', error);
      toast.error('Erro ao criar romaneio: ' + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (loadingEntrega) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #457bba',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '2rem auto'
        }} />
        <p style={{ color: theme.colors.textLight }}>Carregando dados da entrega...</p>
      </div>
    );
  }

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
          Editar Romaneio
        </h1>
        <p style={{ color: theme.colors.textLight, fontSize: '0.875rem' }}>
          Edite as informações da ordem de entrega
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
                  {/* Lista de endereços com opções de editar/excluir */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    {clienteEnderecos.map(endereco => {
                      const selecionado = formData.endereco_id === endereco.id;
                      const estaEditando = enderecoEditando?.id === endereco.id;

                      return (
                        <div
                          key={endereco.id}
                          style={{
                            padding: '0.75rem',
                            border: `2px solid ${selecionado ? theme.colors.primary : theme.colors.border}`,
                            borderRadius: '0.375rem',
                            marginBottom: '0.5rem',
                            background: selecionado ? '#f0f9ff' : 'white'
                          }}
                        >
                          {estaEditando ? (
                            // Formulário de edição inline
                            <div style={{ padding: '0.5rem' }}>
                              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' }}>
                                Editando Endereço
                              </h4>

                              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input
                                  type="text"
                                  value={enderecoEditando.logradouro}
                                  onChange={(e) => setEnderecoEditando({...enderecoEditando, logradouro: e.target.value})}
                                  placeholder="Logradouro *"
                                  style={{
                                    padding: '0.5rem',
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem'
                                  }}
                                />
                                <input
                                  type="text"
                                  value={enderecoEditando.numero}
                                  onChange={(e) => setEnderecoEditando({...enderecoEditando, numero: e.target.value})}
                                  placeholder="Número *"
                                  style={{
                                    padding: '0.5rem',
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem'
                                  }}
                                />
                              </div>

                              <input
                                type="text"
                                value={enderecoEditando.complemento}
                                onChange={(e) => setEnderecoEditando({...enderecoEditando, complemento: e.target.value})}
                                placeholder="Complemento"
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  border: `1px solid ${theme.colors.border}`,
                                  borderRadius: '0.375rem',
                                  fontSize: '0.875rem',
                                  marginBottom: '0.5rem'
                                }}
                              />

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input
                                  type="text"
                                  value={enderecoEditando.bairro}
                                  onChange={(e) => setEnderecoEditando({...enderecoEditando, bairro: e.target.value})}
                                  placeholder="Bairro *"
                                  list="bairros-sugestoes-edit"
                                  style={{
                                    padding: '0.5rem',
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem'
                                  }}
                                />
                                <input
                                  type="text"
                                  value={enderecoEditando.cidade}
                                  onChange={(e) => {
                                    const cidadeNormalizada = normalizarCidade(e.target.value);
                                    setEnderecoEditando({...enderecoEditando, cidade: cidadeNormalizada});
                                  }}
                                  placeholder="Cidade *"
                                  list="cidades-sugestoes-edit"
                                  style={{
                                    padding: '0.5rem',
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem'
                                  }}
                                />
                              </div>

                              <input
                                type="text"
                                value={enderecoEditando.cep}
                                onChange={(e) => setEnderecoEditando({...enderecoEditando, cep: e.target.value})}
                                placeholder="CEP"
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  border: `1px solid ${theme.colors.border}`,
                                  borderRadius: '0.375rem',
                                  fontSize: '0.875rem',
                                  marginBottom: '0.75rem'
                                }}
                              />

                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  onClick={handleSalvarEdicaoEndereco}
                                  style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    background: theme.colors.primary,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Salvar
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelarEdicao}
                                  style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    background: 'white',
                                    color: theme.colors.text,
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Exibição normal do endereço
                            <div
                              style={{ cursor: 'pointer' }}
                              onClick={() => selecionarEndereco(endereco)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <input
                                      type="radio"
                                      name="endereco"
                                      checked={selecionado}
                                      onChange={() => selecionarEndereco(endereco)}
                                      style={{ cursor: 'pointer' }}
                                    />
                                    <p style={{
                                      margin: 0,
                                      fontWeight: '500',
                                      fontSize: '0.875rem'
                                    }}>
                                      {endereco.endereco_completo || `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro}, ${endereco.cidade}`}
                                      {endereco.is_principal && (
                                        <span style={{
                                          marginLeft: '0.5rem',
                                          padding: '0.125rem 0.5rem',
                                          background: theme.colors.primary,
                                          color: 'white',
                                          borderRadius: '0.25rem',
                                          fontSize: '0.65rem',
                                          fontWeight: '600'
                                        }}>
                                          PRINCIPAL
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  {endereco.regiao && (
                                    <p style={{
                                      margin: 0,
                                      fontSize: '0.75rem',
                                      color: theme.colors.textLight,
                                      marginLeft: '1.5rem'
                                    }}>
                                      Região: {endereco.regiao}
                                    </p>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditarEndereco(endereco);
                                    }}
                                    style={{
                                      padding: '0.25rem 0.5rem',
                                      background: 'white',
                                      color: theme.colors.primary,
                                      border: `1px solid ${theme.colors.primary}`,
                                      borderRadius: '0.25rem',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Editar
                                  </button>
                                  {clienteEnderecos.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleExcluirEndereco(endereco.id);
                                      }}
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        background: 'none',
                                        color: theme.colors.danger,
                                        border: `1px solid ${theme.colors.danger}`,
                                        borderRadius: '0.25rem',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Excluir
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
                          const novoEnderecoAtualizado = {...novoEndereco, bairro: novoBairro};
                          setNovoEndereco(novoEnderecoAtualizado);
                          // Detectar região automaticamente com os valores atualizados
                          const regiaoDetectada = detectarRegiao(novoEnderecoAtualizado.cidade, novoBairro);
                          if (regiaoDetectada) {
                            handleRegiaoChange(regiaoDetectada);
                          }
                        }}
                        placeholder="Ex: Centro"
                        list="bairros-sugestoes"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                      <datalist id="bairros-sugestoes">
                        <option value="Centro" />
                        <option value="Estados" />
                        <option value="Pioneiros" />
                        <option value="Nova Esperança" />
                        <option value="Nações" />
                        <option value="Barra" />
                        <option value="Barra Sul" />
                        <option value="Estaleiro" />
                        <option value="Estaleirinho" />
                        <option value="Taquaras" />
                        <option value="Laranjeiras" />
                        <option value="Praia dos Amores" />
                        <option value="Praia Brava" />
                        <option value="Tabuleiro" />
                        <option value="Monte Alegre" />
                        <option value="Vila Real" />
                        <option value="Espinheiros" />
                      </datalist>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                        Cidade *
                      </label>
                      <input
                        type="text"
                        value={novoEndereco.cidade}
                        onChange={(e) => {
                          let novaCidade = e.target.value;

                          // Normalizar BC para Balneário Camboriú
                          novaCidade = normalizarCidade(novaCidade);

                          const novoEnderecoAtualizado = {...novoEndereco, cidade: novaCidade};
                          setNovoEndereco(novoEnderecoAtualizado);
                          // Detectar região automaticamente com os valores atualizados
                          const regiaoDetectada = detectarRegiao(novaCidade, novoEnderecoAtualizado.bairro);
                          if (regiaoDetectada) {
                            handleRegiaoChange(regiaoDetectada);
                          }
                        }}
                        onBlur={(e) => {
                          // Ao sair do campo, normalizar novamente
                          const cidadeNormalizada = normalizarCidade(e.target.value);
                          setNovoEndereco({...novoEndereco, cidade: cidadeNormalizada});
                        }}
                        placeholder="Ex: Balneário Camboriú ou BC"
                        list="cidades-sugestoes"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                      <datalist id="cidades-sugestoes">
                        <option value="Balneário Camboriú" />
                        <option value="Camboriú" />
                        <option value="Itajaí" />
                        <option value="Itapema" />
                        <option value="Navegantes" />
                        <option value="Penha" />
                        <option value="Porto Belo" />
                        <option value="Tijucas" />
                        <option value="Piçarras" />
                        <option value="Bombinhas" />
                      </datalist>
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
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}