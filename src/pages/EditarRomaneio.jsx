import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { theme } from '@/lib/theme';
import { supabase } from '@/api/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { CustomDropdown } from '@/components/CustomDropdown';
import { CustomDatePicker } from '@/components/CustomDatePicker';
import { buscarCep, formatarCep } from '@/utils/buscarCep';
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

// Valores para entrega única do Bruno (quando tem entregas únicas em AMBOS períodos)
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
  'NAVEGANTES': 'Marcio',
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
  'Coleta',
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
    'monte alegre': 'MONTE ALEGRE',
    'tabuleiro': 'TABULEIRO',
    'default': 'CAMBORIÚ'
  },
  'camboriu': {
    'monte alegre': 'MONTE ALEGRE',
    'tabuleiro': 'TABULEIRO',
    'default': 'CAMBORIÚ'
  },
  'itajaí': {
    'centro': 'ITAJAI',
    'vila real': 'ITAJAI',
    'espinheiros': 'ESPINHEIROS',
    'praia brava': 'PRAIA BRAVA',
    'default': 'ITAJAI'
  },
  'itajai': {
    'centro': 'ITAJAI',
    'vila real': 'ITAJAI',
    'espinheiros': 'ESPINHEIROS',
    'praia brava': 'PRAIA BRAVA',
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
  const cidadeLower = cidade?.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
  const bairroLower = bairro?.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

  // Tentar encontrar a cidade no mapeamento (com e sem acento)
  const mapa = MAPEAMENTO_REGIOES[cidadeLower] ||
    MAPEAMENTO_REGIOES[cidade?.toLowerCase().trim() || ''];

  if (mapa) {
    // Se o bairro estiver mapeado, usar a região do bairro
    if (bairroLower && mapa[bairroLower]) {
      return mapa[bairroLower];
    }
    // Tentar também com acento original
    const bairroOriginal = bairro?.toLowerCase().trim() || '';
    if (bairroOriginal && mapa[bairroOriginal]) {
      return mapa[bairroOriginal];
    }
    // Busca parcial: "praia brava de itajaí" contém "praia brava"
    for (const [chave, regiao] of Object.entries(mapa)) {
      if (chave !== 'default' && bairroLower.includes(chave)) {
        return regiao;
      }
    }
    // Usar região padrão da cidade
    return mapa.default;
  }

  return '';
};

export default function EditarRomaneio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const entregaId = searchParams.get('id');
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [loadingEntrega, setLoadingEntrega] = useState(true);
  const carregamentoInicialRef = useRef(true);
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
      regiao: '',
      ponto_referencia: '',
      observacoes: '',
      is_principal: true
    }]
  });
  const [clientesSelecionados, setClientesSelecionados] = useState([]);

  const [clienteEnderecos, setClienteEnderecos] = useState([]);
  // Todos os endereços de todos os clientes (para seleção quando há múltiplos clientes)
  const [todosEnderecos, setTodosEnderecos] = useState([]);
  // Endereço único selecionado para o romaneio
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(null);
  const [showNovoEndereco, setShowNovoEndereco] = useState(false);
  const [enderecoEditando, setEnderecoEditando] = useState(null);
  const [novoEndereco, setNovoEndereco] = useState({
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    cep: '',
    observacoes: ''
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
    coleta: false,
    observacoes: '',
    valor_venda: 0,
    precisa_troco: false,
    valor_troco: 0,
    tipo_horario: '',
    hora1: '',
    hora2: ''
  });

  // Formas de pagamento que precisam informar valor da venda
  const formasPagamentoComValorVenda = ['Receber Dinheiro', 'Receber Máquina', 'Pagar MP'];

  const [errors, setErrors] = useState({});
  const [isEntregaUnica, setIsEntregaUnica] = useState(false);
  const [verificandoEntregaUnica, setVerificandoEntregaUnica] = useState(false);

  // Controle de busca e navegação para forma de pagamento
  const [buscaFormaPagamento, setBuscaFormaPagamento] = useState('');
  const [formasPagamentoFiltradas, setFormasPagamentoFiltradas] = useState([]);
  const [indicePagamentoSelecionado, setIndicePagamentoSelecionado] = useState(-1);
  const [mostrarSugestoesPagamento, setMostrarSugestoesPagamento] = useState(false);

  // Verificar se Bruno terá entrega única no período (Manhã ou Tarde)
  const verificarEntregaUnicaBruno = async (data, periodo, motoboy, entregaIdAtual) => {
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

      // Contar entregas do Bruno no mesmo período (excluindo a entrega atual)
      let query = supabase
        .from('entregas')
        .select('*', { count: 'exact', head: true })
        .eq('motoboy_id', motoboyData.id)
        .eq('data_entrega', data)
        .eq('periodo', periodo);

      if (entregaIdAtual) {
        query = query.neq('id', entregaIdAtual);
      }

      const { count: countPeriodo } = await query;

      // Só é entrega única se não existe nenhuma outra entrega no período
      const isUnica = (countPeriodo || 0) === 0;
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

  // Funções para gerenciar endereços do novo cliente
  const addEnderecoNovoCliente = () => {
    setNovoCliente({
      ...novoCliente,
      enderecos: [...novoCliente.enderecos, {
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        cep: '',
        regiao: '',
        ponto_referencia: '',
        observacoes: '',
        is_principal: false
      }]
    });
  };

  const removeEnderecoNovoCliente = (index) => {
    if (novoCliente.enderecos.length === 1) {
      toast.error('É necessário pelo menos um endereço');
      return;
    }
    const novosEnderecos = novoCliente.enderecos.filter((_, i) => i !== index);
    setNovoCliente({ ...novoCliente, enderecos: novosEnderecos });
  };

  const updateEnderecoNovoCliente = (index, field, value) => {
    const novosEnderecos = [...novoCliente.enderecos];
    novosEnderecos[index] = { ...novosEnderecos[index], [field]: value };
    setNovoCliente({ ...novoCliente, enderecos: novosEnderecos });
  };

  const handleCepNovoCliente = async (index, value) => {
    const cepFormatado = formatarCep(value);
    updateEnderecoNovoCliente(index, 'cep', cepFormatado);
    const cepLimpo = value.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      const enderecoCep = await buscarCep(cepLimpo);
      if (enderecoCep) {
        setNovoCliente(prev => {
          const novosEnderecos = [...prev.enderecos];
          novosEnderecos[index] = {
            ...novosEnderecos[index],
            cep: cepFormatado,
            logradouro: enderecoCep.logradouro || novosEnderecos[index].logradouro,
            bairro: enderecoCep.bairro || novosEnderecos[index].bairro,
            cidade: enderecoCep.cidade || novosEnderecos[index].cidade,

          };
          const regiaoDetectada = detectarRegiao(novosEnderecos[index].cidade, novosEnderecos[index].bairro);
          if (regiaoDetectada) novosEnderecos[index].regiao = regiaoDetectada;
          return { ...prev, enderecos: novosEnderecos };
        });
        toast.success('Endereço preenchido pelo CEP');
      }
    }
  };

  // Detectar região automaticamente quando cidade ou bairro do novo endereço mudam
  useEffect(() => {
    if (carregamentoInicialRef.current) return; // Não alterar região durante carregamento inicial
    if (novoEndereco.cidade && novoEndereco.bairro && showNovoEndereco) {
      const regiaoDetectada = detectarRegiao(novoEndereco.cidade, novoEndereco.bairro);
      if (regiaoDetectada && regiaoDetectada !== formData.regiao) {
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

        // Priorizar dados do snapshot de endereço
        const enderecoDisplay = entrega.endereco_logradouro
          ? {
              // Usar snapshot se existir
              id: entrega.endereco_id,
              logradouro: entrega.endereco_logradouro,
              numero: entrega.endereco_numero,
              complemento: entrega.endereco_complemento,
              bairro: entrega.endereco_bairro,
              cidade: entrega.endereco_cidade,
              cep: entrega.endereco_cep,
              regiao: entrega.regiao,
              endereco_completo: `${entrega.endereco_logradouro}, ${entrega.endereco_numero}${entrega.endereco_complemento ? ' - ' + entrega.endereco_complemento : ''} - ${entrega.endereco_bairro}, ${entrega.endereco_cidade}`
            }
          : entrega.endereco; // Usar dados da relação se snapshot não existir

        // Preencher formulário com dados da entrega
        setFormData({
          cliente_id: entrega.cliente_id,
          cliente_nome: entrega.cliente?.nome || '',
          numero_requisicao: entrega.requisicao,
          endereco_id: entrega.endereco_id || '',
          endereco: enderecoDisplay?.endereco_completo || entrega.endereco_destino || '',
          regiao: entrega.regiao || '',
          outra_cidade: entrega.outra_cidade || '',
          data_entrega: entrega.data_entrega || '',
          periodo: entrega.periodo || 'Tarde',
          forma_pagamento: entrega.forma_pagamento || '',
          motoboy: entrega.motoboy?.nome || '',
          valor_entrega: entrega.valor || 0,
          item_geladeira: entrega.item_geladeira || false,
          buscar_receita: entrega.buscar_receita || false,
          coleta: entrega.coleta || false,
          observacoes: (entrega.observacoes || '').replace(/^\|\|H:.*?\|\|\s*/, ''),
          valor_venda: entrega.valor_venda || 0,
          precisa_troco: entrega.precisa_troco || false,
          valor_troco: entrega.valor_troco || 0,
          ...(() => {
            const h = entrega.horario_entrega || entrega.observacoes?.match(/^\|\|H:(.*?)\|\|/)?.[1] || '';
            if (h.startsWith('de ')) {
              const match = h.match(/^de (.+?) até (.+)$/);
              return match ? { tipo_horario: 'de_ate', hora1: match[1], hora2: match[2] } : { tipo_horario: '', hora1: '', hora2: '' };
            } else if (h.startsWith('até ')) {
              const match = h.match(/^até (.+)$/);
              return match ? { tipo_horario: 'ate', hora1: match[1], hora2: '' } : { tipo_horario: '', hora1: '', hora2: '' };
            } else if (h.startsWith('antes')) {
              const match = h.match(/^antes das (.+)$/);
              return match ? { tipo_horario: 'antes', hora1: match[1], hora2: '' } : { tipo_horario: '', hora1: '', hora2: '' };
            } else if (h.startsWith('depois')) {
              const match = h.match(/^depois das (.+)$/);
              return match ? { tipo_horario: 'depois', hora1: match[1], hora2: '' } : { tipo_horario: '', hora1: '', hora2: '' };
            }
            return { tipo_horario: '', hora1: '', hora2: '' };
          })()
        });

        // Inicializar campo de busca de forma de pagamento
        setBuscaFormaPagamento(entrega.forma_pagamento || '');

        // Carregar cliente principal
        const clientesSelecionadosTemp = [];
        if (entrega.cliente) {
          clientesSelecionadosTemp.push(entrega.cliente);
        }

        // Carregar clientes adicionais
        if (entrega.clientes_adicionais && entrega.clientes_adicionais.length > 0) {
          const { data: clientesAdicionais, error: errorAdicionais } = await supabase
            .from('clientes')
            .select('id, nome, telefone')
            .in('id', entrega.clientes_adicionais);

          if (!errorAdicionais && clientesAdicionais) {
            clientesSelecionadosTemp.push(...clientesAdicionais);
          }
        }

        setClientesSelecionados(clientesSelecionadosTemp);
        setBuscarCliente('');

        // Carregar endereços de todos os clientes
        const todosEnderecosTemp = [];
        for (const cliente of clientesSelecionadosTemp) {
          const { data: enderecosCliente, error: errorEnderecos } = await supabase
            .from('enderecos')
            .select('*')
            .eq('cliente_id', cliente.id)
            .order('is_principal', { ascending: false });

          if (!errorEnderecos && enderecosCliente) {
            const enderecosComCliente = enderecosCliente.map(end => ({
              ...end,
              cliente_nome: cliente.nome
            }));
            todosEnderecosTemp.push(...enderecosComCliente);
          }
        }
        setTodosEnderecos(todosEnderecosTemp);

        // Carregar endereços do cliente principal (para compatibilidade) - sem auto-selecionar para não sobrescrever a região salva
        if (entrega.cliente_id) {
          await carregarEnderecosCliente(entrega.cliente_id, false);
        }

        // Definir endereço selecionado baseado no endereco_id da entrega
        if (entrega.endereco_id) {
          const enderecoAtual = todosEnderecosTemp.find(e => e.id === entrega.endereco_id);
          if (enderecoAtual) {
            setEnderecoSelecionado(enderecoAtual);
          } else if (enderecoDisplay) {
            // Se não encontrar nas listas, usar o snapshot
            setEnderecoSelecionado({
              ...enderecoDisplay,
              cliente_id: entrega.cliente_id,
              cliente_nome: entrega.cliente?.nome || ''
            });
          }
        }

        setLoadingEntrega(false);
        // Marcar que o carregamento inicial terminou (com delay para evitar que useEffects sobrescrevam a região)
        setTimeout(() => { carregamentoInicialRef.current = false; }, 100);
      } catch (error) {
        console.error('Erro ao carregar entrega:', error);
        toast.error('Erro ao carregar dados da entrega');
        setLoadingEntrega(false);
        carregamentoInicialRef.current = false;
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

  // Adicionar cliente à lista
  const adicionarCliente = async (cliente) => {
    // Verificar se já foi adicionado
    if (clientesSelecionados.find(c => c.id === cliente.id)) {
      toast.error('Cliente já adicionado!');
      return;
    }

    // Adicionar cliente à lista
    setClientesSelecionados([...clientesSelecionados, cliente]);

    // Se é o primeiro cliente, definir como cliente principal
    if (clientesSelecionados.length === 0) {
      setFormData({
        ...formData,
        cliente_id: cliente.id,
        cliente_nome: cliente.nome,
        endereco_id: '',
        endereco: ''
      });

      // Carregar endereços do primeiro cliente
      await carregarEnderecosCliente(cliente.id);
    }

    // Buscar e adicionar endereços do cliente à lista global
    try {
      const { data, error } = await supabase
        .from('enderecos')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('is_principal', { ascending: false });

      if (!error && data) {
        const enderecosComCliente = data.map(end => ({
          ...end,
          cliente_nome: cliente.nome
        }));
        setTodosEnderecos(prev => {
          const novosEnderecos = [...prev, ...enderecosComCliente];
          // Se é o primeiro endereço adicionado, seleciona automaticamente
          if (prev.length === 0 && enderecosComCliente.length > 0) {
            setEnderecoSelecionado(enderecosComCliente[0]);
          }
          return novosEnderecos;
        });
      }
    } catch (error) {
      console.error('Erro ao buscar endereços do cliente:', error);
    }

    setBuscarCliente('');
    setClientesSugestoes([]);
    toast.success(`Cliente ${cliente.nome} adicionado!`);
  };

  // Remover cliente da lista
  const removerCliente = (clienteId) => {
    // Não permitir remover se for o único cliente
    if (clientesSelecionados.length === 1) {
      toast.error('Deve haver pelo menos um cliente!');
      return;
    }

    // Cancelar edição se o endereço sendo editado pertence a este cliente
    const enderecoEditadoDoCliente = todosEnderecos.find(
      e => e.id === enderecoEditando?.id && e.cliente_id === clienteId
    );
    if (enderecoEditadoDoCliente) {
      setEnderecoEditando(null);
    }

    // Remover cliente
    setClientesSelecionados(clientesSelecionados.filter(c => c.id !== clienteId));

    // Remover endereços do cliente da lista global
    const novosEnderecos = todosEnderecos.filter(e => e.cliente_id !== clienteId);
    setTodosEnderecos(novosEnderecos);

    // Se o endereço selecionado era desse cliente, limpar seleção
    if (enderecoSelecionado && enderecoSelecionado.cliente_id === clienteId) {
      setEnderecoSelecionado(null);
    }

    // Se removeu o cliente principal, atualizar para o próximo
    if (formData.cliente_id === clienteId) {
      const novoClientePrincipal = clientesSelecionados.find(c => c.id !== clienteId);
      if (novoClientePrincipal) {
        setFormData({
          ...formData,
          cliente_id: novoClientePrincipal.id,
          cliente_nome: novoClientePrincipal.nome
        });
        carregarEnderecosCliente(novoClientePrincipal.id);
      }
    }
  };

  // Carregar endereços do cliente
  const carregarEnderecosCliente = async (clienteId, autoSelecionar = true) => {
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

      // Se só tem um endereço, seleciona automaticamente (apenas quando não é carregamento inicial)
      if (autoSelecionar && data && data.length === 1) {
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

    setEnderecoSelecionado(endereco);

    // Só atualizar a região se NÃO for carregamento inicial
    if (carregamentoInicialRef.current) {
      setFormData(prevFormData => ({
        ...prevFormData,
        endereco_id: endereco.id,
        endereco: endereco.endereco_completo || `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro}`
      }));
    } else {
      const regiaoEndereco = endereco.regiao || detectarRegiao(endereco.cidade, endereco.bairro) || '';
      setFormData(prevFormData => ({
        ...prevFormData,
        endereco_id: endereco.id,
        endereco: endereco.endereco_completo || `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro}`,
        regiao: regiaoEndereco
      }));

      setShowNovoEndereco(false);

      // Atualizar região e calcular valor
      if (regiaoEndereco) {
        handleRegiaoChange(regiaoEndereco);
      }
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

  // Calcular valor automaticamente (considera entrega única para Bruno)
  const calcularValor = (regiao, motoboy, entregaUnica = isEntregaUnica) => {
    if (regiao === 'OUTRO' || !regiao || !motoboy) return 0;

    // Se for Bruno e entrega única, usar tabela especial
    if (motoboy === 'Bruno' && entregaUnica) {
      return VALORES_ENTREGA_UNICA_BRUNO[regiao] || 0;
    }

    return VALORES_ENTREGA[motoboy]?.[regiao] || 0;
  };

  // Verificar entrega única quando motoboy, data ou período mudar
  useEffect(() => {
    if (formData.motoboy === 'Bruno' && formData.data_entrega && formData.periodo) {
      verificarEntregaUnicaBruno(formData.data_entrega, formData.periodo, formData.motoboy, entregaId);
    } else {
      setIsEntregaUnica(false);
    }
  }, [formData.motoboy, formData.data_entrega, formData.periodo]);

  // Recalcular valor quando isEntregaUnica mudar (apenas se não for carregamento inicial)
  useEffect(() => {
    if (carregamentoInicialRef.current) return;
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

    if (clientesSelecionados.length === 0) novosErros.cliente = 'Adicione pelo menos um cliente';
    if (!formData.numero_requisicao) novosErros.requisicao = 'Número de requisição obrigatório';

    // Validar endereço - usar enderecoSelecionado
    if (!enderecoSelecionado) {
      novosErros.endereco = 'Selecione um endereço para a entrega';
    }

    if (!formData.regiao) novosErros.regiao = 'Selecione a região';
    if (formData.regiao === 'OUTRO' && !formData.outra_cidade) novosErros.outra_cidade = 'Informe a cidade';
    if (!formData.data_entrega) novosErros.data = 'Data obrigatória';
    if (!formData.forma_pagamento) novosErros.pagamento = 'Forma de pagamento obrigatória';
    if (!formData.motoboy) novosErros.motoboy = 'Selecione o motoboy';

    // Validar valor da venda quando forma de pagamento exige
    if (formasPagamentoComValorVenda.includes(formData.forma_pagamento)) {
      if (!formData.valor_venda || formData.valor_venda <= 0) {
        novosErros.valor_venda = 'Informe o valor a cobrar';
      }
    }

    // Validar troco quando forma de pagamento é "Receber Dinheiro"
    if (formData.forma_pagamento === 'Receber Dinheiro' && formData.precisa_troco) {
      if (!formData.valor_troco || formData.valor_troco <= 0) {
        novosErros.valor_troco = 'Informe o valor do troco';
      }
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Busca de forma de pagamento
  const handleBuscarFormaPagamento = (termo) => {
    setBuscaFormaPagamento(termo);
    setFormData(prev => ({...prev, forma_pagamento: termo}));
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
    setFormData(prev => ({...prev, forma_pagamento: forma}));
    setBuscaFormaPagamento(forma);
    setMostrarSugestoesPagamento(false);
    setFormasPagamentoFiltradas([]);
    setIndicePagamentoSelecionado(-1);
  };

  // Cadastrar novo cliente
  const handleCadastrarCliente = async () => {
    if (!novoCliente.nome || !novoCliente.telefone) {
      toast.error('Preencha pelo menos nome e telefone');
      return;
    }

    // Validar que pelo menos um endereço está completo
    const enderecoValido = novoCliente.enderecos.some(end =>
      end.logradouro && end.numero && end.cidade
    );

    if (!enderecoValido) {
      toast.error('Preencha pelo menos um endereço completo (Rua, Número e Cidade)');
      return;
    }

    try {
      // Verificar se já existe cliente com o mesmo nome
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id, nome')
        .ilike('nome', novoCliente.nome.trim())
        .limit(1);

      if (clienteExistente && clienteExistente.length > 0) {
        toast.error(`Já existe um cliente cadastrado com o nome "${clienteExistente[0].nome}"`);
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
        .map((end, index) => {
          const enderecoCompleto = `${end.logradouro}, ${end.numero}${end.complemento ? ' - ' + end.complemento : ''} - ${end.bairro}, ${end.cidade} - SC`;

          // Detectar região automaticamente
          const regiaoDetectada = detectarRegiao(end.cidade, end.bairro);

          return {
            cliente_id: clienteData.id,
            logradouro: end.logradouro,
            numero: end.numero,
            complemento: end.complemento || null,
            bairro: end.bairro || null,
            cidade: end.cidade,
            estado: 'SC',
            cep: end.cep || null,
            regiao: regiaoDetectada || end.regiao || null,
            ponto_referencia: end.ponto_referencia || null,
            observacoes: end.observacoes || null,
            is_principal: index === 0,
            endereco_completo: enderecoCompleto
          };
        });

      const { error: enderecosError } = await supabase
        .from('enderecos')
        .insert(enderecosParaInserir);

      if (enderecosError) throw enderecosError;

      toast.success('Cliente cadastrado com sucesso!');

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
          regiao: '',
          ponto_referencia: '',
          observacoes: '',
          is_principal: true
        }]
      });
      setShowCadastroCliente(false);
      setBuscarCliente('');
      setClientesSugestoes([]);
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      toast.error('Erro ao cadastrar cliente: ' + error.message);
    }
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

      // Usar enderecoSelecionado diretamente
      const enderecoTexto = enderecoSelecionado.endereco_completo ||
        `${enderecoSelecionado.logradouro}, ${enderecoSelecionado.numero} - ${enderecoSelecionado.bairro}, ${enderecoSelecionado.cidade}`;

      // Snapshot dos dados do endereço no momento da atualização
      const enderecoSnapshot = {
        endereco_logradouro: enderecoSelecionado.logradouro,
        endereco_numero: enderecoSelecionado.numero,
        endereco_complemento: enderecoSelecionado.complemento,
        endereco_bairro: enderecoSelecionado.bairro,
        endereco_cidade: enderecoSelecionado.cidade,
        endereco_cep: enderecoSelecionado.cep
      };

      // Buscar ID do motoboy pelo nome
      let motoboyId = null;
      if (formData.motoboy) {
        const { data: motoboyData, error: motoboyError } = await supabase
          .from('motoboys')
          .select('id')
          .eq('nome', formData.motoboy)
          .limit(1);

        if (motoboyError) {
          console.error('Erro ao buscar motoboy:', motoboyError);
        }
        motoboyId = motoboyData?.[0]?.id || null;
        console.log('Motoboy selecionado:', formData.motoboy, 'ID encontrado:', motoboyId);
      }

      // Preparar array com IDs dos clientes adicionais (todos exceto o primeiro)
      const clientesAdicionais = clientesSelecionados.slice(1).map(c => c.id);

      console.log('Salvando entrega com:', {
        motoboy_id: motoboyId,
        valor: formData.valor_entrega,
        regiao: formData.regiao
      });

      // Atualizar entrega com snapshot do endereço
      const { data, error } = await supabase
        .from('entregas')
        .update({
          cliente_id: formData.cliente_id,
          endereco_id: enderecoSelecionado.id,
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
          coleta: formData.coleta,
          horario_entrega: formData.tipo_horario ? (
            formData.tipo_horario === 'de_ate' ? `de ${formData.hora1} até ${formData.hora2}` :
            formData.tipo_horario === 'ate' ? `até ${formData.hora1}` :
            formData.tipo_horario === 'antes' ? `antes das ${formData.hora1}` :
            formData.tipo_horario === 'depois' ? `depois das ${formData.hora1}` : null
          ) : null,
          observacoes: formData.observacoes,
          clientes_adicionais: clientesAdicionais,
          valor_venda: formasPagamentoComValorVenda.includes(formData.forma_pagamento) ? formData.valor_venda : 0,
          precisa_troco: formData.forma_pagamento === 'Receber Dinheiro' ? formData.precisa_troco : false,
          valor_troco: formData.forma_pagamento === 'Receber Dinheiro' && formData.precisa_troco ? formData.valor_troco : 0,
          // Atualizar snapshot com dados atuais do endereço
          ...enderecoSnapshot
        })
        .eq('id', entregaId)
        .select()
        .single();

      if (error) throw error;

      // Atualizar valores de entregas do Bruno (promover ou rebaixar entrega única por período)
      if (formData.motoboy === 'Bruno' && motoboyId) {
        try {
          // Buscar entregas do Bruno no mesmo período
          const { data: entregasDoPeriodo } = await supabase
            .from('entregas')
            .select('id, regiao, valor')
            .eq('motoboy_id', motoboyId)
            .eq('data_entrega', formData.data_entrega)
            .eq('periodo', formData.periodo);

          if (entregasDoPeriodo && entregasDoPeriodo.length > 0) {
            // Entrega única = apenas 1 entrega no período
            const ehUnica = entregasDoPeriodo.length === 1;

            for (const entrega of entregasDoPeriodo) {
              const valorUnico = VALORES_ENTREGA_UNICA_BRUNO[entrega.regiao];
              const valorNormal = VALORES_ENTREGA['Bruno']?.[entrega.regiao];
              if (!valorUnico || !valorNormal) continue;

              if (ehUnica && entrega.valor === valorNormal) {
                // Promover para entrega única
                await supabase
                  .from('entregas')
                  .update({ valor: valorUnico })
                  .eq('id', entrega.id);
                console.log(`Entrega ${entrega.id} promovida: R$${valorNormal} → R$${valorUnico}`);
              } else if (!ehUnica && entrega.valor === valorUnico) {
                // Rebaixar para valor normal
                await supabase
                  .from('entregas')
                  .update({ valor: valorNormal })
                  .eq('id', entrega.id);
                console.log(`Entrega ${entrega.id} rebaixada: R$${valorUnico} → R$${valorNormal}`);
              }
            }
          }
        } catch (err) {
          console.error('Erro ao atualizar entregas únicas do Bruno:', err);
        }
      }

      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['receitas'] });

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="py-8 shadow-sm mb-6" style={{
          background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
        }}>
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-4xl font-bold text-white">Editar Romaneio</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-xl text-slate-600">Carregando dados da entrega...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-8">
      {/* Header Customizado */}
      <div className="py-8 shadow-sm mb-6" style={{
        background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
      }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white">Editar Romaneio</h1>
              <p className="text-base text-white opacity-90 mt-1">Edite as informações da ordem de entrega</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">

      <form onSubmit={handleSubmit}>
        {/* Informações do Romaneio */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6" style={{ color: '#376295' }}>
            Informações do Romaneio
          </h3>

          {/* Cliente */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Cliente(s) *
            </label>
            <input
              type="text"
              value={buscarCliente}
              onChange={(e) => handleBuscarCliente(e.target.value)}
              placeholder="Buscar cliente por nome, CPF ou telefone..."
              className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              style={{
                borderColor: errors.cliente ? '#ef4444' : '#cbd5e1'
              }}
            />
            {clientesSugestoes.length > 0 && (
              <div
                className="absolute z-50 bg-white mt-1 max-h-[200px] overflow-y-auto shadow-lg"
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem'
                }}
              >
                {clientesSugestoes.map((cliente, index) => (
                  <div
                    key={cliente.id}
                    onClick={() => adicionarCliente(cliente)}
                    className="p-3 cursor-pointer transition-colors"
                    style={{
                      borderBottom: index < clientesSugestoes.length - 1 ? '1px solid #e2e8f0' : 'none'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e3f2fd'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    <p className="font-semibold text-slate-900 m-0">{cliente.nome}</p>
                    <p className="text-xs text-slate-600 m-0">{cliente.telefone}</p>
                  </div>
                ))}
              </div>
            )}
            {buscarCliente.length >= 2 && clientesSugestoes.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  setNovoCliente(prev => ({ ...prev, nome: buscarCliente }));
                  setShowCadastroCliente(true);
                }}
                className="mt-2 px-4 py-2 rounded-lg font-semibold text-sm"
                style={{ backgroundColor: '#376295', color: 'white' }}
              >
                + Cadastrar Novo Cliente
              </button>
            )}
            {errors.cliente && (
              <p className="text-red-600 text-xs mt-1">
                {errors.cliente}
              </p>
            )}
          </div>

          {/* Clientes Selecionados */}
          {clientesSelecionados.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Clientes Selecionados ({clientesSelecionados.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {clientesSelecionados.map((cliente, index) => (
                  <div
                    key={cliente.id}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-full text-sm"
                  >
                    <span className="font-medium text-slate-900">
                      {cliente.nome}
                      {index === 0 && <span className="ml-1 text-xs text-slate-500">(Principal)</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => removerCliente(cliente.id)}
                      className="text-red-600 hover:text-red-800 font-bold text-lg leading-none"
                      title="Remover cliente"
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
                fontWeight: '600',
                color: theme.colors.text,
                marginBottom: '0.75rem'
              }}>
                Endereço de Entrega *
              </label>
              {clientesSelecionados.map(cliente => {
                const enderecosDoCliente = todosEnderecos.filter(e => e.cliente_id === cliente.id);

                return (
                  <div
                    key={cliente.id}
                    style={{
                      marginBottom: '1rem',
                      padding: '1rem',
                      background: theme.colors.background,
                      borderRadius: '0.5rem',
                      border: `1px solid ${theme.colors.border}`
                    }}
                  >
                    {/* Cabeçalho do cliente */}
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
                        onClick={() => setShowNovoEndereco(showNovoEndereco === cliente.id ? null : cliente.id)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          background: 'white',
                          color: theme.colors.primary,
                          border: `1px solid ${theme.colors.primary}`,
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {showNovoEndereco === cliente.id ? 'Cancelar' : '+ Novo Endereço'}
                      </button>
                    </div>

                    {/* Formulário de Novo Endereço */}
                    {showNovoEndereco === cliente.id && (
                      <div style={{
                        padding: '1rem',
                        background: 'white',
                        borderRadius: '0.5rem',
                        border: `1px solid ${theme.colors.border}`,
                        marginBottom: '0.75rem'
                      }}>
                        <h5 style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                          Cadastrar Novo Endereço
                        </h5>
                        <input
                          type="text"
                          value={novoEndereco.cep}
                          maxLength={9}
                          onChange={async (e) => {
                            const cepFormatado = formatarCep(e.target.value);
                            setNovoEndereco(prev => ({ ...prev, cep: cepFormatado }));
                            const cepLimpo = e.target.value.replace(/\D/g, '');
                            if (cepLimpo.length === 8) {
                              const enderecoCep = await buscarCep(cepLimpo);
                              if (enderecoCep) {
                                setNovoEndereco(prev => ({
                                  ...prev,
                                  cep: cepFormatado,
                                  logradouro: enderecoCep.logradouro || prev.logradouro,
                                  bairro: enderecoCep.bairro || prev.bairro,
                                  cidade: enderecoCep.cidade || prev.cidade,

                                }));
                                toast.success('Endereço preenchido pelo CEP');
                              }
                            }
                          }}
                          placeholder="CEP"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            marginBottom: '0.5rem'
                          }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="text"
                            value={novoEndereco.logradouro}
                            onChange={(e) => setNovoEndereco({ ...novoEndereco, logradouro: e.target.value })}
                            placeholder="Rua *"
                            style={{
                              padding: '0.5rem',
                              border: `1px solid ${theme.colors.border}`,
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem'
                            }}
                          />
                          <input
                            type="text"
                            value={novoEndereco.numero}
                            onChange={(e) => setNovoEndereco({ ...novoEndereco, numero: e.target.value })}
                            placeholder="Número *"
                            style={{
                              padding: '0.5rem',
                              border: `1px solid ${theme.colors.border}`,
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>
                        <input
                          type="text"
                          value={novoEndereco.complemento}
                          onChange={(e) => setNovoEndereco({ ...novoEndereco, complemento: e.target.value })}
                          placeholder="Complemento"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            marginBottom: '0.5rem'
                          }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="text"
                            value={novoEndereco.bairro}
                            onChange={(e) => setNovoEndereco({ ...novoEndereco, bairro: e.target.value })}
                            placeholder="Bairro *"
                            list="bairros-sugestoes"
                            style={{
                              padding: '0.5rem',
                              border: `1px solid ${theme.colors.border}`,
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem'
                            }}
                          />
                          <input
                            type="text"
                            value={novoEndereco.cidade}
                            onChange={(e) => {
                              const cidadeNormalizada = normalizarCidade(e.target.value);
                              setNovoEndereco({ ...novoEndereco, cidade: cidadeNormalizada });
                            }}
                            placeholder="Cidade *"
                            list="cidades-sugestoes"
                            style={{
                              padding: '0.5rem',
                              border: `1px solid ${theme.colors.border}`,
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>
                        <textarea
                          value={novoEndereco.observacoes}
                          onChange={(e) => setNovoEndereco({ ...novoEndereco, observacoes: e.target.value })}
                          placeholder="Observações (opcional)"
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            marginBottom: '0.75rem',
                            resize: 'vertical'
                          }}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!novoEndereco.logradouro || !novoEndereco.numero || !novoEndereco.bairro || !novoEndereco.cidade) {
                              toast.error('Preencha todos os campos obrigatórios');
                              return;
                            }
                            try {
                              const enderecoCompleto = `${novoEndereco.logradouro}, ${novoEndereco.numero}${novoEndereco.complemento ? ' - ' + novoEndereco.complemento : ''} - ${novoEndereco.bairro}, ${novoEndereco.cidade} - SC`;
                              const regiaoDetectada = detectarRegiao(novoEndereco.cidade, novoEndereco.bairro);

                              const { data, error } = await supabase
                                .from('enderecos')
                                .insert([{
                                  cliente_id: cliente.id,
                                  logradouro: novoEndereco.logradouro,
                                  numero: novoEndereco.numero,
                                  complemento: novoEndereco.complemento || null,
                                  bairro: novoEndereco.bairro,
                                  cidade: novoEndereco.cidade,
                                  estado: 'SC',
                                  cep: novoEndereco.cep || null,
                                  regiao: regiaoDetectada || '',
                                  is_principal: false,
                                  endereco_completo: enderecoCompleto,
                                  observacoes: novoEndereco.observacoes || null
                                }])
                                .select()
                                .single();

                              if (error) throw error;

                              const novoEnderecoSalvo = {
                                ...data,
                                cliente_nome: cliente.nome
                              };
                              setTodosEnderecos([...todosEnderecos, novoEnderecoSalvo]);
                              setEnderecoSelecionado(novoEnderecoSalvo);
                              if (regiaoDetectada) {
                                handleRegiaoChange(regiaoDetectada);
                              }
                              setNovoEndereco({ logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', cep: '', observacoes: '' });
                              setShowNovoEndereco(null);
                              toast.success('Endereço cadastrado com sucesso!');
                            } catch (error) {
                              console.error('Erro ao salvar endereço:', error);
                              toast.error('Erro ao salvar endereço');
                            }
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: theme.colors.primary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
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
                        if (enderecoEditando?.id === endereco.id) {
                          return (
                            <div
                              key={endereco.id}
                              style={{
                                padding: '0.75rem',
                                border: `2px solid ${theme.colors.primary}`,
                                borderRadius: '0.5rem',
                                marginBottom: '0.5rem',
                                background: 'white'
                              }}
                            >
                              <h5 style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                                Editando Endereço
                              </h5>
                              <input
                                type="text"
                                value={enderecoEditando.cep}
                                maxLength={9}
                                onChange={async (e) => {
                                  const cepFormatado = formatarCep(e.target.value);
                                  setEnderecoEditando(prev => ({ ...prev, cep: cepFormatado }));
                                  const cepLimpo = e.target.value.replace(/\D/g, '');
                                  if (cepLimpo.length === 8) {
                                    const enderecoCep = await buscarCep(cepLimpo);
                                    if (enderecoCep) {
                                      setEnderecoEditando(prev => ({
                                        ...prev,
                                        cep: cepFormatado,
                                        logradouro: enderecoCep.logradouro || prev.logradouro,
                                        bairro: enderecoCep.bairro || prev.bairro,
                                        cidade: enderecoCep.cidade || prev.cidade,
      
                                      }));
                                      toast.success('Endereço preenchido pelo CEP');
                                    }
                                  }
                                }}
                                placeholder="CEP"
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  border: `1px solid ${theme.colors.border}`,
                                  borderRadius: '0.5rem',
                                  fontSize: '0.875rem',
                                  marginBottom: '0.5rem'
                                }}
                              />
                              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input
                                  type="text"
                                  value={enderecoEditando.logradouro}
                                  onChange={(e) => setEnderecoEditando({...enderecoEditando, logradouro: e.target.value})}
                                  placeholder="Rua *"
                                  style={{
                                    padding: '0.5rem',
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: '0.5rem',
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
                                    borderRadius: '0.5rem',
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
                                  borderRadius: '0.5rem',
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
                                    borderRadius: '0.5rem',
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
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem'
                                  }}
                                />
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!enderecoEditando.logradouro || !enderecoEditando.numero || !enderecoEditando.bairro || !enderecoEditando.cidade) {
                                      toast.error('Preencha todos os campos obrigatórios');
                                      return;
                                    }
                                    try {
                                      const enderecoCompleto = `${enderecoEditando.logradouro}, ${enderecoEditando.numero}${enderecoEditando.complemento ? ' - ' + enderecoEditando.complemento : ''} - ${enderecoEditando.bairro}, ${enderecoEditando.cidade} - SC`;
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

                                      // Atualizar a lista local de endereços
                                      const enderecoAtualizado = {
                                        ...endereco,
                                        ...enderecoEditando,
                                        endereco_completo: enderecoCompleto,
                                        regiao: regiaoDetectada || enderecoEditando.regiao
                                      };
                                      setTodosEnderecos(todosEnderecos.map(e =>
                                        e.id === enderecoEditando.id ? enderecoAtualizado : e
                                      ));

                                      // Se o endereço editado estava selecionado, atualizar
                                      if (enderecoSelecionado?.id === enderecoEditando.id) {
                                        setEnderecoSelecionado(enderecoAtualizado);
                                        if (regiaoDetectada) {
                                          handleRegiaoChange(regiaoDetectada);
                                        }
                                      }

                                      setEnderecoEditando(null);
                                      toast.success('Endereço atualizado com sucesso!');
                                    } catch (error) {
                                      console.error('Erro ao atualizar endereço:', error);
                                      toast.error('Erro ao atualizar endereço');
                                    }
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    background: theme.colors.primary,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Salvar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEnderecoEditando(null)}
                                  style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    background: 'white',
                                    color: theme.colors.text,
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
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
                              cursor: 'pointer'
                            }}
                            onClick={() => selecionarEndereco(endereco)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                  type="radio"
                                  name="endereco"
                                  checked={enderecoSelecionado?.id === endereco.id}
                                  onChange={() => selecionarEndereco(endereco)}
                                  style={{ cursor: 'pointer' }}
                                />
                                <div>
                                  <p style={{ margin: 0, fontWeight: '500', fontSize: '0.875rem' }}>
                                    {endereco.endereco_completo || `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro}, ${endereco.cidade}`}
                                  </p>
                                  {endereco.regiao && (
                                    <p style={{
                                      margin: 0,
                                      fontSize: '0.75rem',
                                      color: theme.colors.textLight
                                    }}>
                                      Região: {endereco.regiao}
                                    </p>
                                  )}
                                </div>
                              </div>
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
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{
                        color: theme.colors.textLight,
                        fontSize: '0.875rem',
                        fontStyle: 'italic',
                        margin: 0
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

              {/* Datalists para sugestões */}
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
              <datalist id="bairros-sugestoes-edit">
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
              <datalist id="cidades-sugestoes-edit">
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
              options={[
                { value: '', label: 'Selecione a região' },
                ...REGIOES.map(regiao => ({ value: regiao, label: regiao }))
              ]}
              value={formData.regiao}
              onChange={handleRegiaoChange}
              placeholder="Selecione a região"
            />

            <div>
              <CustomDatePicker
                label="Data de Entrega *"
                value={formData.data_entrega}
                onChange={(value) => setFormData({...formData, data_entrega: value})}
                placeholder="Selecione a data"
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

          {/* Precisa de troco? - apenas para Receber Dinheiro */}
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
                  {errors.valor_troco && (
                    <p style={{ color: theme.colors.danger, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {errors.valor_troco}
                    </p>
                  )}
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
                  { value: '', label: 'Selecione o motoboy' },
                  { value: 'Marcio', label: 'Marcio' },
                  { value: 'Bruno', label: 'Bruno' }
                ]}
                value={formData.motoboy}
                onChange={handleMotoboyChange}
                placeholder="Selecione o motoboy"
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
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: theme.colors.primary
                }}
              />
            </div>
          </div>

          {/* Horário de Entrega */}
          <div className="mb-3 sm:mb-4" style={{ padding: '0.75rem', border: formData.tipo_horario ? '2px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '0.5rem', backgroundColor: formData.tipo_horario ? '#eff6ff' : 'white' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
              Horário de Entrega (opcional)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: formData.tipo_horario ? '0.75rem' : 0 }}>
              {[
                { value: 'de_ate', label: 'de H até H' },
                { value: 'ate', label: 'até H' },
                { value: 'antes', label: 'antes das H' },
                { value: 'depois', label: 'depois das H' }
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    tipo_horario: prev.tipo_horario === opt.value ? '' : opt.value,
                    hora1: prev.tipo_horario === opt.value ? '' : prev.hora1,
                    hora2: prev.tipo_horario === opt.value ? '' : prev.hora2
                  }))}
                  style={{
                    padding: '0.4rem 0.75rem',
                    border: formData.tipo_horario === opt.value ? '2px solid #2563eb' : '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    background: formData.tipo_horario === opt.value ? '#dbeafe' : 'white',
                    color: formData.tipo_horario === opt.value ? '#1e40af' : '#64748b',
                    fontWeight: formData.tipo_horario === opt.value ? '600' : '400',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {opt.label}
                </button>
              ))}
              {formData.tipo_horario && (
                <button type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tipo_horario: '', hora1: '', hora2: '' }))}
                  style={{ padding: '0.4rem 0.75rem', border: '2px solid #fca5a5', borderRadius: '0.5rem', background: '#fef2f2', color: '#dc2626', fontWeight: '500', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Limpar
                </button>
              )}
            </div>
            {formData.tipo_horario && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {formData.tipo_horario === 'de_ate' && <span style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '500' }}>de</span>}
                {formData.tipo_horario === 'ate' && <span style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '500' }}>até</span>}
                {formData.tipo_horario === 'antes' && <span style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '500' }}>antes das</span>}
                {formData.tipo_horario === 'depois' && <span style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '500' }}>depois das</span>}
                <input
                  type="text"
                  value={formData.hora1}
                  onChange={e => setFormData(prev => ({ ...prev, hora1: e.target.value }))}
                  placeholder="ex: 8H"
                  style={{ padding: '0.4rem 0.5rem', border: '2px solid #2563eb', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '600', color: '#1e40af', background: 'white', width: '70px' }}
                />
                {formData.tipo_horario === 'de_ate' && (
                  <>
                    <span style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '500' }}>até</span>
                    <input
                      type="text"
                      value={formData.hora2}
                      onChange={e => setFormData(prev => ({ ...prev, hora2: e.target.value }))}
                      placeholder="ex: 12H"
                      style={{ padding: '0.4rem 0.5rem', border: '2px solid #2563eb', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '600', color: '#1e40af', background: 'white', width: '70px' }}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Grid: Item de Geladeira, Buscar Receita e Coleta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Item de Geladeira */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Item de Geladeira? *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, item_geladeira: true}))}
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
                  onClick={() => setFormData(prev => ({...prev, item_geladeira: false}))}
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
                fontWeight: '600',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Reter Receita? *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, buscar_receita: true}))}
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
                  onClick={() => setFormData(prev => ({...prev, buscar_receita: false}))}
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

            {/* Coleta */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Coleta? *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, coleta: true}))}
                  style={{
                    padding: '0.5rem 1.5rem',
                    border: formData.coleta ? '2px solid #4caf50' : '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    background: formData.coleta ? '#e8f5e9' : 'white',
                    color: formData.coleta ? '#2e7d32' : '#64748b',
                    fontWeight: formData.coleta ? '600' : '400',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, coleta: false}))}
                  style={{
                    padding: '0.5rem 1.5rem',
                    border: !formData.coleta ? '2px solid #64748b' : '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    background: !formData.coleta ? '#f1f5f9' : 'white',
                    color: !formData.coleta ? '#1e293b' : '#64748b',
                    fontWeight: !formData.coleta ? '600' : '400',
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
        <div className="flex gap-4 justify-end mt-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white border border-slate-300 rounded-lg font-semibold text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg font-semibold text-sm text-white transition-colors"
            style={{
              backgroundColor: loading ? '#94a3b8' : '#376295',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
      </div>

      {/* Modal de Cadastro de Cliente */}
      <Dialog open={showCadastroCliente} onOpenChange={setShowCadastroCliente}>
        <DialogContent style={{ maxWidth: '900px' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#376295' }}>Cadastrar Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            {/* Dados do Cliente */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Dados do Cliente</h3>

              <div className="mb-3">
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

              <div className="grid grid-cols-2 gap-4 mb-3">
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
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Endereços */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">Endereços *</h3>
                <button
                  type="button"
                  onClick={addEnderecoNovoCliente}
                  className="px-3 py-1 text-xs font-medium rounded-lg transition-colors"
                  style={{ backgroundColor: '#376295', color: 'white' }}
                >
                  + Adicionar Endereço
                </button>
              </div>

              {novoCliente.enderecos.map((endereco, index) => (
                <div key={index} className="bg-white p-4 rounded-lg mb-3 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-slate-600">
                      Endereço {index + 1} {index === 0 && '(Principal)'}
                    </h4>
                    {novoCliente.enderecos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEnderecoNovoCliente(index)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={endereco.cep}
                        onChange={(e) => handleCepNovoCliente(index, e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <CustomDropdown
                      label="Região"
                      options={[
                        { value: '', label: 'Selecione' },
                        ...REGIOES.map(regiao => ({ value: regiao, label: regiao }))
                      ]}
                      value={endereco.regiao}
                      onChange={(value) => updateEnderecoNovoCliente(index, 'regiao', value)}
                      placeholder="Selecione"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Rua/Logradouro *
                      </label>
                      <input
                        type="text"
                        value={endereco.logradouro}
                        onChange={(e) => updateEnderecoNovoCliente(index, 'logradouro', e.target.value)}
                        placeholder="Nome da rua"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Número *
                      </label>
                      <input
                        type="text"
                        value={endereco.numero}
                        onChange={(e) => updateEnderecoNovoCliente(index, 'numero', e.target.value)}
                        placeholder="123"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={endereco.bairro}
                        onChange={(e) => updateEnderecoNovoCliente(index, 'bairro', e.target.value)}
                        placeholder="Nome do bairro"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        value={endereco.cidade}
                        onChange={(e) => updateEnderecoNovoCliente(index, 'cidade', e.target.value)}
                        placeholder="Nome da cidade"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={endereco.complemento}
                      onChange={(e) => updateEnderecoNovoCliente(index, 'complemento', e.target.value)}
                      placeholder="Apto, Bloco, etc."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Ponto de Referência
                    </label>
                    <input
                      type="text"
                      value={endereco.ponto_referencia}
                      onChange={(e) => updateEnderecoNovoCliente(index, 'ponto_referencia', e.target.value)}
                      placeholder="Próximo a..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Observações
                    </label>
                    <textarea
                      value={endereco.observacoes}
                      onChange={(e) => updateEnderecoNovoCliente(index, 'observacoes', e.target.value)}
                      placeholder="Informações adicionais"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              ))}
            </div>

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
                      regiao: '',
                      ponto_referencia: '',
                      observacoes: '',
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
                Cadastrar Cliente
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}