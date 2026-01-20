import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { theme } from '@/lib/theme';
import { supabase } from '@/api/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronLeft } from 'lucide-react';
import { CustomDropdown, CustomDatePicker } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

// Valores para entrega única do Bruno (quando só tem 1 entrega no período)
const VALORES_ENTREGA_UNICA_BRUNO = {
  'BC': 12,
  'NOVA ESPERANÇA': 15,
  'CAMBORIÚ': 20,
  'TABULEIRO': 15,
  'MONTE ALEGRE': 15,
  'BARRA': 15,
  'ESTALEIRO': 25,
  'TAQUARAS': 25,
  'LARANJEIRAS': 25,
  'ITAJAI': 25,
  'ESPINHEIROS': 35,
  'PRAIA DOS AMORES': 15,
  'PRAIA BRAVA': 15,
  'ITAPEMA': 35,
  'NAVEGANTES': 50,
  'PENHA': 75,
  'PORTO BELO': 60,
  'TIJUCAS': 87,
  'PIÇARRAS': 80,
  'BOMBINHAS': 90,
  'CLINICA': 12
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
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    enderecos: [{
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      cep: '',
      is_principal: true
    }]
  });

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

  // Controle de entrega única para Bruno
  const [isEntregaUnica, setIsEntregaUnica] = useState(false);
  const [verificandoEntregaUnica, setVerificandoEntregaUnica] = useState(false);

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
    valor_troco: 0,
    valor_venda: 0
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

    // Detectar região automaticamente baseada no bairro ou cidade
    const regiaoDetectada = detectarRegiao(endereco.cidade, endereco.bairro);

    if (regiaoDetectada) {
      handleRegiaoChange(regiaoDetectada);
    } else if (endereco.regiao) {
      // Fallback: usar região salva no endereço (caso exista)
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

  // Formas de pagamento que precisam informar valor da venda
  const formasPagamentoComValorVenda = ['Receber Dinheiro', 'Receber Máquina', 'Pagar MP'];

  // Resetar valor_venda quando forma de pagamento mudar para uma que não precisa
  useEffect(() => {
    if (!formasPagamentoComValorVenda.includes(formData.forma_pagamento)) {
      setFormData(prev => ({
        ...prev,
        valor_venda: 0
      }));
    }
  }, [formData.forma_pagamento]);

  // Verificar se Bruno tem entrega única em AMBOS os períodos (manhã E tarde)
  const verificarEntregaUnicaBruno = async (data, periodo, motoboy) => {
    if (motoboy !== 'Bruno') {
      setIsEntregaUnica(false);
      return false;
    }

    setVerificandoEntregaUnica(true);
    try {
      // Buscar o ID do Bruno
      const { data: motoboyData } = await supabase
        .from('motoboys')
        .select('id')
        .eq('nome', 'Bruno')
        .single();

      if (!motoboyData) {
        setIsEntregaUnica(false);
        return false;
      }

      // Contar entregas do Bruno na data para MANHÃ
      const { count: countManha } = await supabase
        .from('entregas')
        .select('*', { count: 'exact', head: true })
        .eq('motoboy_id', motoboyData.id)
        .eq('data_entrega', data)
        .eq('periodo', 'Manhã');

      // Contar entregas do Bruno na data para TARDE
      const { count: countTarde } = await supabase
        .from('entregas')
        .select('*', { count: 'exact', head: true })
        .eq('motoboy_id', motoboyData.id)
        .eq('data_entrega', data)
        .eq('periodo', 'Tarde');

      // Determinar se o período atual será entrega única
      const seriaUnicaNoPeriodoAtual = periodo === 'Manhã' ? countManha === 0 : countTarde === 0;

      // Verificar se o outro período tem no máximo 1 entrega (ou seja, é única também)
      const outroPeriodoTemUnica = periodo === 'Manhã'
        ? (countTarde === 0 || countTarde === 1)
        : (countManha === 0 || countManha === 1);

      // Só é entrega única se AMBOS os períodos têm entregas únicas
      const isUnica = seriaUnicaNoPeriodoAtual && outroPeriodoTemUnica;
      setIsEntregaUnica(isUnica);
      return isUnica;
    } catch (error) {
      console.error('Erro ao verificar entrega única:', error);
      setIsEntregaUnica(false);
      return false;
    } finally {
      setVerificandoEntregaUnica(false);
    }
  };

  // Verificar entrega única quando motoboy, data ou período mudar
  useEffect(() => {
    if (formData.motoboy === 'Bruno' && formData.data_entrega && formData.periodo) {
      verificarEntregaUnicaBruno(formData.data_entrega, formData.periodo, formData.motoboy);
    } else {
      setIsEntregaUnica(false);
    }
  }, [formData.motoboy, formData.data_entrega, formData.periodo]);

  // Calcular valor automaticamente (considera entrega única para Bruno)
  const calcularValor = (regiao, motoboy, entregaUnica = isEntregaUnica) => {
    if (regiao === 'OUTRO' || !regiao || !motoboy) return 0;

    // Se for Bruno e entrega única, usar tabela especial
    if (motoboy === 'Bruno' && entregaUnica) {
      return VALORES_ENTREGA_UNICA_BRUNO[regiao] || 0;
    }

    return VALORES_ENTREGA[motoboy]?.[regiao] || 0;
  };

  // Recalcular valor quando isEntregaUnica mudar
  useEffect(() => {
    if (formData.motoboy === 'Bruno' && formData.regiao && formData.regiao !== 'OUTRO') {
      const novoValor = calcularValor(formData.regiao, formData.motoboy, isEntregaUnica);
      setFormData(prev => ({
        ...prev,
        valor_entrega: novoValor
      }));
    }
  }, [isEntregaUnica]);

  // Atualizar região
  const handleRegiaoChange = (regiao) => {
    console.log('Mudando região para:', regiao);

    setFormData(prevFormData => {
      const motoboy = regiao === 'OUTRO' ? prevFormData.motoboy : (MOTOBOY_POR_REGIAO[regiao] || 'Marcio');
      const valor = calcularValor(regiao, motoboy, motoboy === 'Bruno' ? isEntregaUnica : false);

      console.log('Novo motoboy:', motoboy, 'Novo valor:', valor, 'Entrega única:', isEntregaUnica);

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
    const valor = calcularValor(formData.regiao, motoboy, motoboy === 'Bruno' ? isEntregaUnica : false);
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

    // Validar valor da venda quando forma de pagamento exige
    if (formasPagamentoComValorVenda.includes(formData.forma_pagamento)) {
      if (!formData.valor_venda || formData.valor_venda <= 0) {
        novosErros.valor_venda = 'Informe o valor a cobrar';
      }
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Funções para gerenciar endereços do novo cliente
  const addEnderecoNovoCliente = () => {
    setNovoCliente({
      ...novoCliente,
      enderecos: [
        ...novoCliente.enderecos,
        {
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          cep: '',
          is_principal: false
        }
      ]
    });
  };

  const removeEnderecoNovoCliente = (index) => {
    if (novoCliente.enderecos.length === 1) {
      toast.error('É necessário pelo menos um endereço');
      return;
    }
    setNovoCliente({
      ...novoCliente,
      enderecos: novoCliente.enderecos.filter((_, i) => i !== index)
    });
  };

  const updateEnderecoNovoCliente = (index, field, value) => {
    const newEnderecos = [...novoCliente.enderecos];
    newEnderecos[index] = { ...newEnderecos[index], [field]: value };
    setNovoCliente({ ...novoCliente, enderecos: newEnderecos });
  };

  // Cadastrar novo cliente
  const handleCadastrarCliente = async () => {
    if (!novoCliente.nome || !novoCliente.telefone) {
      toast.error('Preencha nome e telefone');
      return;
    }

    if (!novoCliente.enderecos.some(end => end.logradouro && end.numero && end.cidade)) {
      toast.error('Preencha pelo menos um endereço completo (Rua, Número e Cidade)');
      return;
    }

    const toastId = toast.loading('Cadastrando cliente...');

    try {
      // Verificar se já existe cliente com o mesmo nome
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id, nome')
        .ilike('nome', novoCliente.nome.trim())
        .limit(1);

      if (clienteExistente && clienteExistente.length > 0) {
        toast.error(`Já existe um cliente cadastrado com o nome "${clienteExistente[0].nome}"`, { id: toastId });
        return;
      }

      // 1. Criar cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .insert([{
          nome: novoCliente.nome,
          cpf: novoCliente.cpf || null,
          telefone: novoCliente.telefone,
          email: novoCliente.email || null
        }])
        .select()
        .single();

      if (clienteError) throw clienteError;

      // 2. Criar endereços
      const enderecosParaInserir = novoCliente.enderecos
        .filter(end => end.logradouro && end.numero && end.cidade)
        .map((end, index) => ({
          cliente_id: clienteData.id,
          logradouro: end.logradouro,
          numero: end.numero,
          complemento: end.complemento || null,
          bairro: end.bairro || null,
          cidade: end.cidade,
          cep: end.cep || null,
          regiao: end.regiao || null,
          is_principal: index === 0
        }));

      if (enderecosParaInserir.length > 0) {
        const { error: enderecoError } = await supabase
          .from('enderecos')
          .insert(enderecosParaInserir);

        if (enderecoError) throw enderecoError;
      }

      toast.success('Cliente cadastrado com sucesso!', { id: toastId });

      // Adicionar cliente à lista de selecionados
      adicionarCliente(clienteData);

      // Limpar e fechar modal
      setNovoCliente({
        nome: '',
        cpf: '',
        telefone: '',
        email: '',
        enderecos: [{
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          cep: '',
          is_principal: true
        }]
      });
      setShowCadastroCliente(false);
      setBuscarCliente('');
      setClientesSugestoes([]);
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      toast.error('Erro ao cadastrar cliente: ' + error.message, { id: toastId });
    }
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
        const { data: motoboyData } = await supabase
          .from('motoboys')
          .select('id')
          .eq('nome', formData.motoboy)
          .limit(1);

        motoboyId = motoboyData?.[0]?.id || null;
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
        valor_venda: formasPagamentoComValorVenda.includes(formData.forma_pagamento) ? formData.valor_venda : 0,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Customizado */}
      <div className="py-8 shadow-sm" style={{
        background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white">Novo Romaneio</h1>
              <p className="text-base text-white opacity-90 mt-1">Crie uma nova ordem de entrega</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <form onSubmit={handleSubmit}>
        {/* Informações do Romaneio */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">
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
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            />
            {clientesSugestoes.length > 0 && (
              <div style={{
                position: 'absolute',
                zIndex: 10,
                background: 'white',
                border: '2px solid #93c5fd',
                borderRadius: '0.625rem',
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
                  borderRadius: '0.5rem',
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
                          borderRadius: '0.5rem',
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
                        borderRadius: '0.5rem',
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
                                borderRadius: '0.5rem',
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
                                borderRadius: '0.5rem',
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
                                borderRadius: '0.5rem',
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
                                borderRadius: '0.5rem',
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
                                borderRadius: '0.5rem',
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
                                borderRadius: '0.5rem',
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
                                borderRadius: '0.5rem',
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
                            borderRadius: '0.5rem',
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
                                borderRadius: '0.5rem',
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
                                      borderRadius: '0.5rem',
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
                                      borderRadius: '0.5rem',
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
                                      borderRadius: '0.5rem',
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
                                      borderRadius: '0.5rem',
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
                                      borderRadius: '0.5rem',
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
                                      borderRadius: '0.5rem',
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
                                      borderRadius: '0.5rem',
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
                                    borderRadius: '0.5rem',
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
                                    borderRadius: '0.5rem',
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
                              borderRadius: '0.5rem',
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
                                borderRadius: '0.5rem',
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
                borderRadius: '0.5rem',
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
            <CustomDropdown
              label="Cidade/Região *"
              options={REGIOES.map(regiao => ({ value: regiao, label: regiao }))}
              value={formData.regiao}
              onChange={handleRegiaoChange}
              placeholder="Selecione a cidade"
              error={errors.regiao}
            />

            <CustomDatePicker
              label="Data de Entrega *"
              value={formData.data_entrega}
              onChange={(date) => setFormData({...formData, data_entrega: date})}
              placeholder="Selecione a data"
            />
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
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          )}

          {/* Grid: Período e Forma de Pagamento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <CustomDropdown
              label="Período de Entrega *"
              options={[
                { value: 'Manhã', label: 'Manhã' },
                { value: 'Tarde', label: 'Tarde' }
              ]}
              value={formData.periodo}
              onChange={(value) => setFormData({...formData, periodo: value})}
              placeholder="Selecione o período"
            />

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
                  borderRadius: '0.5rem',
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
                  borderRadius: '0.5rem',
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

          {/* Valor a Cobrar - aparece para Receber Dinheiro, Receber Máquina e Pagar MP */}
          {formasPagamentoComValorVenda.includes(formData.forma_pagamento) && (
            <div style={{
              marginBottom: '1rem',
              padding: '1rem',
              background: '#e8f5e9',
              border: '2px solid #4caf50',
              borderRadius: '0.5rem'
            }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#2e7d32',
                marginBottom: '0.5rem'
              }}>
                Valor a Cobrar (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_venda || ''}
                onChange={(e) => setFormData({...formData, valor_venda: parseFloat(e.target.value) || 0})}
                placeholder="Ex: 150.00"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `2px solid ${errors.valor_venda ? theme.colors.danger : '#4caf50'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              />
              {errors.valor_venda && (
                <p style={{ color: theme.colors.danger, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.valor_venda}
                </p>
              )}
              {!errors.valor_venda && formData.valor_venda > 0 && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: '#1b5e20',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: 0, color: 'white', fontSize: '0.875rem', fontWeight: '500' }}>
                    {formData.forma_pagamento === 'Receber Máquina' ? 'Receber na Máquina:' :
                     formData.forma_pagamento === 'Pagar MP' ? 'Cobrar via MP:' : 'Valor a Receber:'}
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'white', fontSize: '1.5rem', fontWeight: '700' }}>
                    R$ {formData.valor_venda.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              )}
              {!formData.valor_venda && (
                <p style={{
                  fontSize: '0.75rem',
                  color: '#2e7d32',
                  marginTop: '0.25rem',
                  fontWeight: '500'
                }}>
                  Informe o valor a ser cobrado nesta entrega.
                </p>
              )}
            </div>
          )}

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
                    value={formData.valor_troco || ''}
                    onChange={(e) => setFormData({...formData, valor_troco: parseFloat(e.target.value) || 0})}
                    placeholder="Ex: 50.00"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `2px solid ${errors.valor_troco ? theme.colors.danger : '#ffc107'}`,
                      borderRadius: '0.5rem',
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
              <CustomDropdown
                label="Motoboy *"
                options={[
                  { value: 'Marcio', label: 'Marcio' },
                  { value: 'Bruno', label: 'Bruno' }
                ]}
                value={formData.motoboy}
                onChange={handleMotoboyChange}
                placeholder="Selecione o motoboy"
                error={errors.motoboy}
              />
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
                {formData.motoboy === 'Bruno' && isEntregaUnica && (
                  <span style={{
                    marginLeft: '0.5rem',
                    padding: '2px 8px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    border: '1px solid #fbbf24'
                  }}>
                    ENTREGA ÚNICA
                  </span>
                )}
                {verificandoEntregaUnica && (
                  <span style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.7rem',
                    color: theme.colors.muted
                  }}>
                    verificando...
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valor_entrega}
                onChange={(e) => setFormData({...formData, valor_entrega: parseFloat(e.target.value) || 0})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${isEntregaUnica && formData.motoboy === 'Bruno' ? '#fbbf24' : theme.colors.border}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: theme.colors.primary,
                  backgroundColor: isEntregaUnica && formData.motoboy === 'Bruno' ? '#fffbeb' : 'white'
                }}
              />
            </div>
          </div>

          {/* Grid: Item de Geladeira e Buscar Receita */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Item de Geladeira */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Item de Geladeira? *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, item_geladeira: true})}
                  style={{
                    padding: '0.5rem 1.5rem',
                    border: formData.item_geladeira ? '2px solid #0891b2' : '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    background: formData.item_geladeira ? '#cffafe' : 'white',
                    color: formData.item_geladeira ? '#0891b2' : '#64748b',
                    fontWeight: formData.item_geladeira ? '600' : '400',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, item_geladeira: false})}
                  style={{
                    padding: '0.5rem 1.5rem',
                    border: !formData.item_geladeira ? '2px solid #64748b' : '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    background: !formData.item_geladeira ? '#f1f5f9' : 'white',
                    color: !formData.item_geladeira ? '#1e293b' : '#64748b',
                    fontWeight: !formData.item_geladeira ? '600' : '400',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  Não
                </button>
              </div>
            </div>

            {/* Buscar Receita */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Reter Receita? *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, buscar_receita: true})}
                  style={{
                    padding: '0.5rem 1.5rem',
                    border: formData.buscar_receita ? '2px solid #f97316' : '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    background: formData.buscar_receita ? '#ffedd5' : 'white',
                    color: formData.buscar_receita ? '#c2410c' : '#64748b',
                    fontWeight: formData.buscar_receita ? '600' : '400',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, buscar_receita: false})}
                  style={{
                    padding: '0.5rem 1.5rem',
                    border: !formData.buscar_receita ? '2px solid #64748b' : '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    background: !formData.buscar_receita ? '#f1f5f9' : 'white',
                    color: !formData.buscar_receita ? '#1e293b' : '#64748b',
                    fontWeight: !formData.buscar_receita ? '600' : '400',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  Não
                </button>
              </div>
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
                borderRadius: '0.5rem',
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
              borderRadius: '0.5rem',
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
              borderRadius: '0.5rem',
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

      {/* Modal de Cadastro de Cliente */}
      <Dialog open={showCadastroCliente} onOpenChange={setShowCadastroCliente}>
        <DialogContent style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#376295' }}>Cadastrar Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={novoCliente.nome}
                  onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                  placeholder="Digite o nome completo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={novoCliente.cpf}
                    onChange={(e) => setNovoCliente({ ...novoCliente, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    value={novoCliente.telefone}
                    onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={novoCliente.email}
                  onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                  placeholder="cliente@email.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Seção de Endereços */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center pt-2">
                <h3 className="text-sm font-semibold text-slate-700">Endereços</h3>
                <button
                  type="button"
                  onClick={addEnderecoNovoCliente}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Endereço
                </button>
              </div>

              {novoCliente.enderecos.map((endereco, index) => (
                <div key={`endereco-${index}`} className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-slate-700">
                      Endereço {index + 1} {index === 0 && "(Principal)"}
                    </h4>
                    {novoCliente.enderecos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEnderecoNovoCliente(index)}
                        className="p-1.5 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={endereco.cep || ""}
                        onChange={(e) => updateEnderecoNovoCliente(index, 'cep', e.target.value)}
                        placeholder="00000-000"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div className="grid grid-cols-[2fr_1fr] gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Rua/Logradouro *
                        </label>
                        <input
                          type="text"
                          value={endereco.logradouro}
                          onChange={(e) => updateEnderecoNovoCliente(index, 'logradouro', e.target.value)}
                          placeholder="Nome da rua"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Número *
                        </label>
                        <input
                          type="text"
                          value={endereco.numero}
                          onChange={(e) => updateEnderecoNovoCliente(index, 'numero', e.target.value)}
                          placeholder="123"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Bairro
                        </label>
                        <input
                          type="text"
                          value={endereco.bairro}
                          onChange={(e) => updateEnderecoNovoCliente(index, 'bairro', e.target.value)}
                          placeholder="Nome do bairro"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Cidade *
                        </label>
                        <input
                          type="text"
                          value={endereco.cidade}
                          onChange={(e) => updateEnderecoNovoCliente(index, 'cidade', e.target.value)}
                          placeholder="Ex: Balneário Camboriú"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={endereco.complemento}
                        onChange={(e) => updateEnderecoNovoCliente(index, 'complemento', e.target.value)}
                        placeholder="Apto, Bloco, etc."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCadastroCliente(false);
                  setNovoCliente({
                    nome: '',
                    cpf: '',
                    telefone: '',
                    email: '',
                    enderecos: [{
                      logradouro: '',
                      numero: '',
                      complemento: '',
                      bairro: '',
                      cidade: '',
                      cep: '',
                      is_principal: true
                    }]
                  });
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCadastrarCliente}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors"
                style={{ backgroundColor: '#376295' }}
              >
                Cadastrar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}