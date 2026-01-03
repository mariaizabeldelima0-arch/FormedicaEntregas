import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { theme } from '@/lib/theme';
import { supabase } from '@/api/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

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
  'Aguardando',
  'Boleto',
  'Link Aguardando',
  'Pagar MP',
  'Pago Dinheiro',
  'Pago Link',
  'Pago Máquina',
  'Pago Pix',
  'Pix Aguardando',
  'Receber Dinheiro',
  'Receber Máquina',
  'Só Entregar',
  'Via na Pasta'
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

export default function NovoRomaneio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [buscarCliente, setBuscarCliente] = useState('');
  const [clientesSugestoes, setClientesSugestoes] = useState([]);
  const [showCadastroCliente, setShowCadastroCliente] = useState(false);

  // Lista de clientes selecionados
  const [clientesSelecionados, setClientesSelecionados] = useState([]);

  // Todos os endereços de todos os clientes (para seleção única)
  const [todosEnderecos, setTodosEnderecos] = useState([]);

  // Endereço único selecionado para o romaneio
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(null);

  // Controle de navegação por teclado na busca
  const [indiceSelecionado, setIndiceSelecionado] = useState(-1);

  // Controle de busca e navegação para forma de pagamento
  const [buscaFormaPagamento, setBuscaFormaPagamento] = useState('');
  const [formasPagamentoFiltradas, setFormasPagamentoFiltradas] = useState([]);
  const [indicePagamentoSelecionado, setIndicePagamentoSelecionado] = useState(-1);
  const [mostrarSugestoesPagamento, setMostrarSugestoesPagamento] = useState(false);

  // Controle do formulário de novo endereço
  const [mostrarNovoEndereco, setMostrarNovoEndereco] = useState(null); // clienteId para quem mostrar
  const [novoEndereco, setNovoEndereco] = useState({
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    cep: '',
    regiao: ''
  });

  // Controle do formulário de edição de endereço
  const [enderecoEmEdicao, setEnderecoEmEdicao] = useState(null); // enderecoId sendo editado
  const [dadosEdicao, setDadosEdicao] = useState({
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    cep: '',
    regiao: ''
  });

  const [formData, setFormData] = useState({
    numero_requisicao: '',
    regiao: '',
    outra_cidade: '',
    data_entrega: new Date().toISOString().split('T')[0],
    periodo: 'Tarde',
    forma_pagamento: '',
    motoboy: '',
    valor_entrega: 0,
    item_geladeira: false,
    buscar_receita: false,
    observacoes: '',
    precisa_troco: false,
    valor_troco: 0
  });

  const [errors, setErrors] = useState({});

  // Buscar clientes
  const handleBuscarCliente = async (termo) => {
    setBuscarCliente(termo);
    setIndiceSelecionado(-1);

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

  // Navegação por teclado na busca
  const handleKeyDown = (e) => {
    if (clientesSugestoes.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceSelecionado(prev =>
        prev < clientesSugestoes.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceSelecionado(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && indiceSelecionado >= 0) {
      e.preventDefault();
      adicionarCliente(clientesSugestoes[indiceSelecionado]);
    }
  };

  // Buscar forma de pagamento
  const handleBuscarFormaPagamento = (termo) => {
    setBuscaFormaPagamento(termo);
    setIndicePagamentoSelecionado(-1);
    setMostrarSugestoesPagamento(true);

    if (termo.length === 0) {
      setFormasPagamentoFiltradas(FORMAS_PAGAMENTO);
    } else {
      const filtradas = FORMAS_PAGAMENTO.filter(forma =>
        forma.toLowerCase().includes(termo.toLowerCase())
      );
      setFormasPagamentoFiltradas(filtradas);
    }
  };

  // Navegação por teclado na busca de forma de pagamento
  const handleKeyDownPagamento = (e) => {
    if (formasPagamentoFiltradas.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndicePagamentoSelecionado(prev =>
        prev < formasPagamentoFiltradas.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndicePagamentoSelecionado(prev =>
        prev > 0 ? prev - 1 : formasPagamentoFiltradas.length - 1
      );
    } else if (e.key === 'Enter' && indicePagamentoSelecionado >= 0) {
      e.preventDefault();
      selecionarFormaPagamento(formasPagamentoFiltradas[indicePagamentoSelecionado]);
    } else if (e.key === 'Escape') {
      setMostrarSugestoesPagamento(false);
    }
  };

  // Selecionar forma de pagamento
  const selecionarFormaPagamento = (forma) => {
    setFormData({...formData, forma_pagamento: forma});
    setBuscaFormaPagamento(forma);
    setMostrarSugestoesPagamento(false);
    setFormasPagamentoFiltradas([]);
    setIndicePagamentoSelecionado(-1);
  };

  // Adicionar cliente à lista
  const adicionarCliente = async (cliente) => {
    // Verificar se já foi adicionado
    if (clientesSelecionados.find(c => c.id === cliente.id)) {
      toast.error('Cliente já adicionado!');
      return;
    }

    // Buscar endereços do cliente
    try {
      const { data, error } = await supabase
        .from('enderecos')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('is_principal', { ascending: false });

      if (error) throw error;

      // Adicionar cliente à lista
      setClientesSelecionados([...clientesSelecionados, cliente]);

      // Adicionar endereços do cliente à lista global (com referência ao cliente)
      if (data && data.length > 0) {
        const enderecosComCliente = data.map(end => ({
          ...end,
          cliente_nome: cliente.nome
        }));

        setTodosEnderecos(prev => {
          const novosEnderecos = [...prev, ...enderecosComCliente];

          // Se é o primeiro endereço adicionado, seleciona automaticamente
          if (prev.length === 0 && enderecosComCliente.length > 0) {
            setEnderecoSelecionado(enderecosComCliente[0]);
            if (enderecosComCliente[0].regiao) {
              handleRegiaoChange(enderecosComCliente[0].regiao);
            }
          }

          return novosEnderecos;
        });
      }

      setBuscarCliente('');
      setClientesSugestoes([]);
      setIndiceSelecionado(-1);
      toast.success(`Cliente ${cliente.nome} adicionado!`);
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      toast.error('Erro ao carregar endereços do cliente');
    }
  };

  // Remover cliente da lista
  const removerCliente = (clienteId) => {
    // Verificar se algum endereço em edição pertence a este cliente
    const enderecoEditadoDoCliente = todosEnderecos.find(
      e => e.id === enderecoEmEdicao && e.cliente_id === clienteId
    );
    if (enderecoEditadoDoCliente) {
      cancelarEdicaoEndereco();
    }

    // Remover cliente
    setClientesSelecionados(clientesSelecionados.filter(c => c.id !== clienteId));

    // Remover endereços do cliente
    const novosEnderecos = todosEnderecos.filter(e => e.cliente_id !== clienteId);
    setTodosEnderecos(novosEnderecos);

    // Se o endereço selecionado era desse cliente, limpar seleção
    if (enderecoSelecionado && enderecoSelecionado.cliente_id === clienteId) {
      setEnderecoSelecionado(null);
    }

    // Fechar formulário de novo endereço se estava aberto para este cliente
    if (mostrarNovoEndereco === clienteId) {
      setMostrarNovoEndereco(null);
    }
  };

  // Selecionar endereço único para o romaneio
  const selecionarEndereco = (endereco) => {
    setEnderecoSelecionado(endereco);
    if (endereco.regiao) {
      handleRegiaoChange(endereco.regiao);
    }
  };

  // Salvar novo endereço
  const salvarNovoEndereco = async (clienteId) => {
    try {
      // Validação básica
      if (!novoEndereco.logradouro || !novoEndereco.numero || !novoEndereco.bairro || !novoEndereco.cidade) {
        toast.error('Preencha todos os campos obrigatórios do endereço');
        return;
      }

      // Detectar região automaticamente
      const regiaoDetectada = detectarRegiao(novoEndereco.cidade, novoEndereco.bairro);
      const regiaoFinal = regiaoDetectada || novoEndereco.regiao || '';

      const enderecoParaInserir = {
        cliente_id: clienteId,
        logradouro: novoEndereco.logradouro,
        numero: novoEndereco.numero,
        complemento: novoEndereco.complemento,
        bairro: novoEndereco.bairro,
        cidade: novoEndereco.cidade,
        cep: novoEndereco.cep,
        regiao: regiaoFinal,
        is_principal: false
      };

      const { data, error } = await supabase
        .from('enderecos')
        .insert([enderecoParaInserir])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const novoEnderecoSalvo = data[0];
        const cliente = clientesSelecionados.find(c => c.id === clienteId);

        // Adicionar à lista de endereços com nome do cliente
        const enderecoComCliente = {
          ...novoEnderecoSalvo,
          cliente_nome: cliente?.nome
        };

        setTodosEnderecos([...todosEnderecos, enderecoComCliente]);

        // Selecionar automaticamente o novo endereço
        setEnderecoSelecionado(enderecoComCliente);
        if (regiaoFinal) {
          handleRegiaoChange(regiaoFinal);
        }

        // Limpar formulário e fechar
        setNovoEndereco({
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          cep: '',
          regiao: ''
        });
        setMostrarNovoEndereco(null);

        toast.success('Endereço cadastrado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      toast.error('Erro ao salvar endereço');
    }
  };

  // Iniciar edição de endereço
  const iniciarEdicaoEndereco = (endereco) => {
    setEnderecoEmEdicao(endereco.id);
    setDadosEdicao({
      logradouro: endereco.logradouro || '',
      numero: endereco.numero || '',
      complemento: endereco.complemento || '',
      bairro: endereco.bairro || '',
      cidade: endereco.cidade || '',
      cep: endereco.cep || '',
      regiao: endereco.regiao || ''
    });
    // Fechar formulário de novo endereço se estiver aberto
    setMostrarNovoEndereco(null);
  };

  // Cancelar edição de endereço
  const cancelarEdicaoEndereco = () => {
    setEnderecoEmEdicao(null);
    setDadosEdicao({
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      cep: '',
      regiao: ''
    });
  };

  // Salvar edição de endereço
  const salvarEdicaoEndereco = async () => {
    try {
      // Validação básica
      if (!dadosEdicao.logradouro || !dadosEdicao.numero || !dadosEdicao.bairro || !dadosEdicao.cidade) {
        toast.error('Preencha todos os campos obrigatórios do endereço');
        return;
      }

      // Detectar região automaticamente
      const regiaoDetectada = detectarRegiao(dadosEdicao.cidade, dadosEdicao.bairro);
      const regiaoFinal = regiaoDetectada || dadosEdicao.regiao || '';

      const enderecoAtualizado = {
        logradouro: dadosEdicao.logradouro,
        numero: dadosEdicao.numero,
        complemento: dadosEdicao.complemento,
        bairro: dadosEdicao.bairro,
        cidade: dadosEdicao.cidade,
        cep: dadosEdicao.cep,
        regiao: regiaoFinal
      };

      console.log('🔄 Atualizando endereço:', enderecoEmEdicao, enderecoAtualizado);

      const { data, error } = await supabase
        .from('enderecos')
        .update(enderecoAtualizado)
        .eq('id', enderecoEmEdicao)
        .select();

      if (error) throw error;

      console.log('✅ Endereço atualizado no banco:', data);

      // Pegar o endereço antigo para manter o cliente_nome e outras propriedades
      const enderecoAntigo = todosEnderecos.find(e => e.id === enderecoEmEdicao);
      console.log('📦 Endereço antigo encontrado:', enderecoAntigo);

      // Criar novo objeto completo com todas as propriedades
      const enderecoCompleto = {
        id: enderecoEmEdicao,
        cliente_id: enderecoAntigo?.cliente_id,
        cliente_nome: enderecoAntigo?.cliente_nome,
        logradouro: dadosEdicao.logradouro,
        numero: dadosEdicao.numero,
        complemento: dadosEdicao.complemento,
        bairro: dadosEdicao.bairro,
        cidade: dadosEdicao.cidade,
        cep: dadosEdicao.cep,
        regiao: regiaoFinal,
        is_principal: enderecoAntigo?.is_principal || false
      };

      console.log('📝 Endereço completo para atualizar:', enderecoCompleto);

      // Atualizar a lista local de endereços
      const novosEnderecos = todosEnderecos.map(end => {
        if (end.id === enderecoEmEdicao) {
          return enderecoCompleto;
        }
        return end;
      });

      console.log('📋 Novos endereços:', novosEnderecos);
      setTodosEnderecos(novosEnderecos);

      // Se o endereço editado estava selecionado, atualizar completamente
      if (enderecoSelecionado?.id === enderecoEmEdicao) {
        console.log('🎯 Atualizando endereço selecionado');
        setEnderecoSelecionado(enderecoCompleto);
        if (regiaoFinal) {
          handleRegiaoChange(regiaoFinal);
        }
      }

      // Limpar estado de edição
      cancelarEdicaoEndereco();
      toast.success('Endereço atualizado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao atualizar endereço:', error);
      toast.error('Erro ao atualizar endereço');
    }
  };

  // Atualizar região do novo endereço quando cidade ou bairro mudam
  useEffect(() => {
    if (novoEndereco.cidade || novoEndereco.bairro) {
      const regiaoDetectada = detectarRegiao(novoEndereco.cidade, novoEndereco.bairro);
      if (regiaoDetectada) {
        setNovoEndereco(prev => ({ ...prev, regiao: regiaoDetectada }));
      }
    }
  }, [novoEndereco.cidade, novoEndereco.bairro]);

  // Limpar formulário quando fechar o formulário de novo endereço
  useEffect(() => {
    if (mostrarNovoEndereco === null) {
      setNovoEndereco({
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        cep: '',
        regiao: ''
      });
    }
  }, [mostrarNovoEndereco]);

  // Atualizar região do endereço em edição quando cidade ou bairro mudam
  useEffect(() => {
    if (enderecoEmEdicao && (dadosEdicao.cidade || dadosEdicao.bairro)) {
      const regiaoDetectada = detectarRegiao(dadosEdicao.cidade, dadosEdicao.bairro);
      if (regiaoDetectada) {
        setDadosEdicao(prev => ({ ...prev, regiao: regiaoDetectada }));
      }
    }
  }, [dadosEdicao.cidade, dadosEdicao.bairro, enderecoEmEdicao]);

  // Sincronizar campo de busca de forma de pagamento com formData
  useEffect(() => {
    if (formData.forma_pagamento && formData.forma_pagamento !== buscaFormaPagamento) {
      setBuscaFormaPagamento(formData.forma_pagamento);
    }
  }, [formData.forma_pagamento]);

  // Resetar campos de troco quando forma de pagamento mudar
  useEffect(() => {
    if (formData.forma_pagamento !== 'Receber Dinheiro') {
      setFormData(prev => ({
        ...prev,
        precisa_troco: false,
        valor_troco: 0
      }));
    }
  }, [formData.forma_pagamento]);

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

    if (clientesSelecionados.length === 0) {
      novosErros.cliente = 'Adicione pelo menos um cliente';
    }

    if (!enderecoSelecionado) {
      novosErros.endereco = 'Selecione um endereço para a entrega';
    }

    if (!formData.numero_requisicao) novosErros.requisicao = 'Número de requisição obrigatório';
    if (!formData.regiao) novosErros.regiao = 'Selecione a região';
    if (formData.regiao === 'OUTRO' && !formData.outra_cidade) novosErros.outra_cidade = 'Informe a cidade';
    if (!formData.data_entrega) novosErros.data = 'Data obrigatória';
    if (!formData.forma_pagamento) novosErros.pagamento = 'Forma de pagamento obrigatória';
    if (!formData.motoboy) novosErros.motoboy = 'Selecione o motoboy';

    // Validar troco quando forma de pagamento é "Receber Dinheiro"
    if (formData.forma_pagamento === 'Receber Dinheiro' && formData.precisa_troco) {
      if (!formData.valor_troco || formData.valor_troco <= 0) {
        novosErros.valor_troco = 'Informe o valor do troco';
      }
    }

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

      const enderecoTexto = enderecoSelecionado.endereco_completo ||
        `${enderecoSelecionado.logradouro}, ${enderecoSelecionado.numero} - ${enderecoSelecionado.bairro}, ${enderecoSelecionado.cidade}`;

      // Corrigir timezone: adicionar hora ao meio-dia para evitar mudança de dia
      const dataEntregaCorrigida = formData.data_entrega + 'T12:00:00';

      // Preparar array com IDs dos clientes adicionais (todos exceto o primeiro)
      const clientesAdicionais = clientesSelecionados.slice(1).map(c => c.id);

      // Criar apenas UMA entrega (usando o primeiro cliente como principal)
      const entregaParaInserir = {
        cliente_id: clientesSelecionados[0].id,
        endereco_id: enderecoSelecionado.id,
        requisicao: formData.numero_requisicao,
        endereco_destino: enderecoTexto,
        regiao: formData.regiao,
        outra_cidade: formData.regiao === 'OUTRO' ? formData.outra_cidade : null,
        tipo: 'moto',
        data_criacao: new Date().toISOString(),
        data_entrega: dataEntregaCorrigida,
        periodo: formData.periodo,
        status: 'Produzindo no Laboratório',
        motoboy_id: motoboyId,
        forma_pagamento: formData.forma_pagamento,
        valor: formData.valor_entrega,
        item_geladeira: formData.item_geladeira,
        buscar_receita: formData.buscar_receita,
        observacoes: formData.observacoes,
        clientes_adicionais: clientesAdicionais,
        precisa_troco: formData.forma_pagamento === 'Receber Dinheiro' ? formData.precisa_troco : false,
        valor_troco: formData.forma_pagamento === 'Receber Dinheiro' && formData.precisa_troco ? formData.valor_troco : 0,
        // Snapshot dos dados do endereço no momento da criação
        endereco_logradouro: enderecoSelecionado.logradouro,
        endereco_numero: enderecoSelecionado.numero,
        endereco_complemento: enderecoSelecionado.complemento,
        endereco_bairro: enderecoSelecionado.bairro,
        endereco_cidade: enderecoSelecionado.cidade,
        endereco_cep: enderecoSelecionado.cep
      };

      const { data: entregasCriadas, error } = await supabase
        .from('entregas')
        .insert([entregaParaInserir])
        .select();

      if (error) throw error;

      console.log('Entregas criadas:', entregasCriadas);

      // Invalidar queries relevantes
      await queryClient.invalidateQueries({ queryKey: ['entregas'] });
      await queryClient.invalidateQueries({ queryKey: ['receitas'] });
      await queryClient.refetchQueries({ queryKey: ['entregas'] });

      toast.success('Romaneio criado com sucesso!', { id: toastId });

      // Aguardar um pouco antes de navegar para o usuário ver o toast
      setTimeout(() => navigate('/'), 1000);
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
              onKeyDown={handleKeyDown}
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
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                width: '100%'
              }}>
                {clientesSugestoes.map((cliente, index) => (
                  <div
                    key={cliente.id}
                    onClick={() => adicionarCliente(cliente)}
                    onMouseEnter={() => setIndiceSelecionado(index)}
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${theme.colors.border}`,
                      background: index === indiceSelecionado ? '#e3f2fd' : 'white',
                      transition: 'background 0.15s'
                    }}
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

          {/* Clientes Selecionados */}
          {clientesSelecionados.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Clientes Selecionados ({clientesSelecionados.length})
              </label>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {clientesSelecionados.map((cliente) => (
                  <div
                    key={cliente.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: '#e3f2fd',
                      borderRadius: '1rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <span>{cliente.nome}</span>
                    <button
                      type="button"
                      onClick={() => removerCliente(cliente.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.colors.danger,
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '1rem'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seleção de Endereço - Agrupado por Cliente */}
          {clientesSelecionados.length > 0 && (
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

              {clientesSelecionados.map((cliente) => {
                const enderecosDoCliente = todosEnderecos.filter(e => e.cliente_id === cliente.id);

                return (
                  <div key={cliente.id} style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: '0.5rem',
                    background: '#f8fafc'
                  }}>
                    {/* Nome do Cliente */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: theme.colors.primary
                      }}>
                        {cliente.nome}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          if (mostrarNovoEndereco === cliente.id) {
                            setMostrarNovoEndereco(null);
                          } else {
                            setMostrarNovoEndereco(cliente.id);
                            // Fechar edição se estiver aberta
                            if (enderecoEmEdicao) {
                              cancelarEdicaoEndereco();
                            }
                          }
                        }}
                        style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: theme.colors.primary,
                          background: 'white',
                          border: `1px solid ${theme.colors.primary}`,
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        {mostrarNovoEndereco === cliente.id ? 'Cancelar' : '+ Novo Endereço'}
                      </button>
                    </div>

                    {/* Formulário de Novo Endereço */}
                    {mostrarNovoEndereco === cliente.id && (
                      <div style={{
                        padding: '1rem',
                        background: 'white',
                        borderRadius: '0.375rem',
                        marginBottom: '0.75rem',
                        border: `1px solid ${theme.colors.border}`
                      }}>
                        <h5 style={{
                          margin: '0 0 0.75rem 0',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: theme.colors.text
                        }}>
                          Cadastrar Novo Endereço
                        </h5>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <input
                              type="text"
                              placeholder="Rua *"
                              value={novoEndereco.logradouro}
                              onChange={(e) => setNovoEndereco({ ...novoEndereco, logradouro: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem'
                              }}
                            />
                          </div>

                          <div>
                            <input
                              type="text"
                              placeholder="Número *"
                              value={novoEndereco.numero}
                              onChange={(e) => setNovoEndereco({ ...novoEndereco, numero: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem'
                              }}
                            />
                          </div>

                          <div>
                            <input
                              type="text"
                              placeholder="Complemento"
                              value={novoEndereco.complemento}
                              onChange={(e) => setNovoEndereco({ ...novoEndereco, complemento: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem'
                              }}
                            />
                          </div>

                          <div>
                            <input
                              type="text"
                              placeholder="Bairro *"
                              value={novoEndereco.bairro}
                              onChange={(e) => setNovoEndereco({ ...novoEndereco, bairro: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem'
                              }}
                            />
                          </div>

                          <div>
                            <input
                              type="text"
                              placeholder="Cidade *"
                              value={novoEndereco.cidade}
                              onChange={(e) => setNovoEndereco({ ...novoEndereco, cidade: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem'
                              }}
                            />
                          </div>

                          <div>
                            <input
                              type="text"
                              placeholder="CEP"
                              value={novoEndereco.cep}
                              onChange={(e) => setNovoEndereco({ ...novoEndereco, cep: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem'
                              }}
                            />
                          </div>

                          <div>
                            <input
                              type="text"
                              placeholder="Região (auto-detectada)"
                              value={novoEndereco.regiao}
                              readOnly
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                background: '#f1f5f9'
                              }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => salvarNovoEndereco(cliente.id)}
                          style={{
                            marginTop: '0.75rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: 'white',
                            background: theme.colors.primary,
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            width: '100%'
                          }}
                        >
                          Salvar Endereço
                        </button>
                      </div>
                    )}

                    {/* Lista de Endereços do Cliente */}
                    {enderecosDoCliente.length > 0 ? (
                      enderecosDoCliente.map((endereco) => {
                        // Se este endereço está sendo editado, mostrar formulário de edição
                        if (enderecoEmEdicao === endereco.id) {
                          return (
                            <div
                              key={endereco.id}
                              style={{
                                padding: '1rem',
                                background: 'white',
                                borderRadius: '0.375rem',
                                marginBottom: '0.75rem',
                                border: `2px solid ${theme.colors.primary}`
                              }}
                            >
                              <h5 style={{
                                margin: '0 0 0.75rem 0',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                color: theme.colors.text
                              }}>
                                Editando Endereço
                              </h5>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <input
                                    type="text"
                                    placeholder="Rua *"
                                    value={dadosEdicao.logradouro}
                                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, logradouro: e.target.value })}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: `1px solid ${theme.colors.border}`,
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                </div>

                                <div>
                                  <input
                                    type="text"
                                    placeholder="Número *"
                                    value={dadosEdicao.numero}
                                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, numero: e.target.value })}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: `1px solid ${theme.colors.border}`,
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                </div>

                                <div>
                                  <input
                                    type="text"
                                    placeholder="Complemento"
                                    value={dadosEdicao.complemento}
                                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, complemento: e.target.value })}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: `1px solid ${theme.colors.border}`,
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                </div>

                                <div>
                                  <input
                                    type="text"
                                    placeholder="Bairro *"
                                    value={dadosEdicao.bairro}
                                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, bairro: e.target.value })}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: `1px solid ${theme.colors.border}`,
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                </div>

                                <div>
                                  <input
                                    type="text"
                                    placeholder="Cidade *"
                                    value={dadosEdicao.cidade}
                                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, cidade: e.target.value })}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: `1px solid ${theme.colors.border}`,
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                </div>

                                <div>
                                  <input
                                    type="text"
                                    placeholder="CEP"
                                    value={dadosEdicao.cep}
                                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, cep: e.target.value })}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: `1px solid ${theme.colors.border}`,
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                </div>

                                <div>
                                  <input
                                    type="text"
                                    placeholder="Região (auto-detectada)"
                                    value={dadosEdicao.regiao}
                                    readOnly
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: `1px solid ${theme.colors.border}`,
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem',
                                      background: '#f1f5f9'
                                    }}
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                <button
                                  type="button"
                                  onClick={salvarEdicaoEndereco}
                                  style={{
                                    flex: 1,
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    color: 'white',
                                    background: theme.colors.primary,
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Salvar
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelarEdicaoEndereco}
                                  style={{
                                    flex: 1,
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    color: theme.colors.text,
                                    background: 'white',
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          );
                        }

                        // Caso contrário, mostrar endereço normal
                        return (
                          <div
                            key={endereco.id}
                            style={{
                              padding: '0.75rem',
                              border: `2px solid ${enderecoSelecionado?.id === endereco.id ? theme.colors.primary : theme.colors.border}`,
                              borderRadius: '0.375rem',
                              marginBottom: '0.5rem',
                              background: enderecoSelecionado?.id === endereco.id ? '#f0f9ff' : 'white',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem'
                            }}
                          >
                            <input
                              type="radio"
                              name="endereco"
                              checked={enderecoSelecionado?.id === endereco.id}
                              onChange={() => selecionarEndereco(endereco)}
                              style={{ cursor: 'pointer' }}
                            />
                            <div
                              onClick={() => selecionarEndereco(endereco)}
                              style={{ flex: 1, cursor: 'pointer' }}
                            >
                              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500' }}>
                                {endereco.endereco_completo || `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro}, ${endereco.cidade}`}
                              </p>
                              {endereco.regiao && (
                                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textLight, marginTop: '0.25rem' }}>
                                  Região: {endereco.regiao}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                iniciarEdicaoEndereco(endereco);
                              }}
                              style={{
                                padding: '0.375rem 0.75rem',
                                fontSize: '0.7rem',
                                fontWeight: '500',
                                color: theme.colors.primary,
                                background: 'white',
                                border: `1px solid ${theme.colors.primary}`,
                                borderRadius: '0.375rem',
                                cursor: 'pointer'
                              }}
                            >
                              Editar
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: theme.colors.textLight,
                        fontStyle: 'italic'
                      }}>
                        Nenhum endereço cadastrado. Clique em "+ Novo Endereço" para adicionar.
                      </p>
                    )}
                  </div>
                );
              })}

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

            <div style={{ position: 'relative' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Forma de Pagamento *
              </label>
              <input
                type="text"
                value={buscaFormaPagamento}
                onChange={(e) => handleBuscarFormaPagamento(e.target.value)}
                onKeyDown={handleKeyDownPagamento}
                onFocus={() => {
                  setMostrarSugestoesPagamento(true);
                  if (formasPagamentoFiltradas.length === 0) {
                    setFormasPagamentoFiltradas(FORMAS_PAGAMENTO);
                  }
                }}
                onBlur={() => {
                  // Delay para permitir clique na sugestão
                  setTimeout(() => setMostrarSugestoesPagamento(false), 200);
                }}
                placeholder="Digite ou selecione a forma de pagamento..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.pagamento ? theme.colors.danger : theme.colors.border}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
              {mostrarSugestoesPagamento && formasPagamentoFiltradas.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '0.375rem',
                  marginTop: '0.25rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  zIndex: 1000
                }}>
                  {formasPagamentoFiltradas.map((forma, index) => (
                    <div
                      key={forma}
                      onClick={() => selecionarFormaPagamento(forma)}
                      onMouseEnter={() => setIndicePagamentoSelecionado(index)}
                      style={{
                        padding: '0.75rem',
                        cursor: 'pointer',
                        borderBottom: index < formasPagamentoFiltradas.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
                        background: index === indicePagamentoSelecionado ? '#e3f2fd' : 'white',
                        transition: 'background 0.15s'
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>{forma}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pergunta de Troco - aparece apenas quando forma de pagamento é "Receber Dinheiro" */}
          {formData.forma_pagamento === 'Receber Dinheiro' && (
            <div style={{
              marginBottom: '1rem',
              padding: '1rem',
              background: '#fff9e6',
              border: '2px solid #ffc107',
              borderRadius: '0.5rem'
            }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#f57c00',
                  marginBottom: '0.5rem'
                }}>
                  Precisa de troco?
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}>
                    <input
                      type="radio"
                      name="precisa_troco"
                      checked={formData.precisa_troco === true}
                      onChange={() => setFormData({...formData, precisa_troco: true})}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Sim
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}>
                    <input
                      type="radio"
                      name="precisa_troco"
                      checked={formData.precisa_troco === false}
                      onChange={() => setFormData({...formData, precisa_troco: false, valor_troco: 0})}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Não
                  </label>
                </div>
              </div>

              {formData.precisa_troco && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#f57c00',
                    marginBottom: '0.5rem'
                  }}>
                    Valor do Troco (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_troco}
                    onChange={(e) => setFormData({...formData, valor_troco: parseFloat(e.target.value) || 0})}
                    placeholder="Ex: 50.00"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.valor_troco ? theme.colors.danger : '#ffc107'}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      background: 'white'
                    }}
                  />
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#f57c00',
                    marginTop: '0.25rem',
                    fontWeight: '500'
                  }}>
                    Cliente pagará com quanto? Informe o valor para calcular o troco.
                  </p>
                </div>
              )}
            </div>
          )}

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