import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllRows } from '@/utils/fetchAllRows';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { theme } from '@/lib/theme';
import { CustomDropdown } from '@/components/CustomDropdown';
import {
  Package,
  Clock,
  Phone,
  DollarSign,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Navigation,
  AlertTriangle,
  Check,
  X,
  Sun,
  Sunrise,
  Search,
  Play,
  Truck,
  RotateCcw,
  Pause,
  Snowflake,
  FileText,
  Banknote,
  ExternalLink,
  Plus,
  ShoppingBag,
  Pencil,
  Trash2,
  Receipt,
  CalendarDays,
  ChevronsUpDown
} from 'lucide-react';


export default function PainelMotoboys() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, userType } = useAuth();
  const [motoboyId, setMotoboyId] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const saved = sessionStorage.getItem('painel_motoboy_data');
    return saved ? new Date(saved + 'T00:00:00') : new Date();
  });
  const [mesAtual, setMesAtual] = useState(() => {
    const saved = sessionStorage.getItem('painel_motoboy_data');
    return saved ? new Date(saved + 'T00:00:00') : new Date();
  });
  const [filtroLocal, setFiltroLocal] = useState(() => sessionStorage.getItem('painel_motoboy_local') || 'todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState(() => sessionStorage.getItem('painel_motoboy_periodo') || 'todos');
  const [filtroStatus, setFiltroStatus] = useState(() => sessionStorage.getItem('painel_motoboy_status') || 'todos');
  const [termoBusca, setTermoBusca] = useState(() => sessionStorage.getItem('painel_motoboy_busca') || '');

  useEffect(() => {
    sessionStorage.setItem('painel_motoboy_data', format(dataSelecionada, 'yyyy-MM-dd'));
    sessionStorage.setItem('painel_motoboy_local', filtroLocal);
    sessionStorage.setItem('painel_motoboy_periodo', filtroPeriodo);
    sessionStorage.setItem('painel_motoboy_status', filtroStatus);
    sessionStorage.setItem('painel_motoboy_busca', termoBusca);
  }, [dataSelecionada, filtroLocal, filtroPeriodo, filtroStatus, termoBusca]);
  const [ordemEntregas, setOrdemEntregas] = useState({});
  const [statusPagamentoSemana, setStatusPagamentoSemana] = useState('Aguardando');
  const [showModalPedido, setShowModalPedido] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [showPedidos, setShowPedidos] = useState(true);
  const [formPedido, setFormPedido] = useState({
    nome_formula: '',
    numero_requisicao: '',
    data_pedido: format(new Date(), 'yyyy-MM-dd'),
    valor_total: '',
    num_parcelas: 1,
    semana_inicio: '',
    observacoes: ''
  });

  // Definição dos status disponíveis (Em Rota é o padrão)
  const statusOptions = [
    { value: 'Em Rota', label: 'A Caminho', icon: Truck, bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', color: '#890d5d' },
    { value: 'Iniciar', label: 'Iniciar', icon: Play, bg: 'bg-yellow-100', text: 'text-yellow-800', color: '#ca8a04' },
    { value: 'Entregue', label: 'Entregue', icon: Check, bg: 'bg-green-100', text: 'text-green-800', color: '#15803d' },
    { value: 'Pendente', label: 'Pendente', icon: Pause, bg: 'bg-orange-100', text: 'text-orange-800', color: '#c2410c' },
    { value: 'Voltou p/ Farmácia', label: 'Voltou', icon: RotateCcw, bg: 'bg-red-100', text: 'text-red-800', color: '#b91c1c' },
  ];
  const STATUS_PADRAO = 'Em Rota';

  // Função para normalizar status antigos para os novos
  const normalizarStatus = (status) => {
    if (!status) return STATUS_PADRAO;
    const mapeamento = {
      'A Caminho': 'Em Rota',
      'Não Entregue': 'Voltou p/ Farmácia',
    };
    return mapeamento[status] || status;
  };

  const isMotoboy = userType === 'motoboy';
  const isAdmin = userType === 'admin';
  const nomeMotoboyUsuario = user?.usuario;

  // Buscar lista de motoboys
  const { data: motoboys = [] } = useQuery({
    queryKey: ['motoboys-lista'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motoboys')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data || [];
    },
  });

  // Selecionar motoboy automaticamente
  useEffect(() => {
    if (motoboys.length > 0 && !motoboyId) {
      if (isMotoboy && nomeMotoboyUsuario) {
        const motoboyDoUsuario = motoboys.find(m =>
          m.nome.toLowerCase() === nomeMotoboyUsuario.toLowerCase()
        );
        if (motoboyDoUsuario) {
          setMotoboyId(motoboyDoUsuario.id);
          return;
        }
      }
      setMotoboyId(motoboys[0].id);
    }
  }, [motoboys, motoboyId, isMotoboy, nomeMotoboyUsuario]);

  // Buscar entregas do motoboy
  const { data: todasEntregasRaw = [], isLoading } = useQuery({
    queryKey: ['entregas-motoboy-all'],
    queryFn: async () => {
      const data = await fetchAllRows((from, to) =>
        supabase
          .from('entregas')
          .select(`
            *,
            cliente:clientes(id, nome, telefone),
            endereco:enderecos(id, logradouro, numero, bairro, cidade, complemento),
            motoboy:motoboys(id, nome)
          `)
          .eq('tipo', 'moto')
          .order('data_entrega', { ascending: true })
          .range(from, to)
      );
      return data;
    },
    refetchOnMount: 'always',
    staleTime: 0,
  });

  // Filtrar entregas pelo motoboy selecionado
  const todasEntregas = todasEntregasRaw.filter(e => e.motoboy?.id === motoboyId);

  // Filtrar entregas do dia selecionado
  const entregasDoDia = todasEntregas.filter(entrega => {
    if (!entrega.data_entrega) return false;
    const entregaDate = new Date(entrega.data_entrega + 'T00:00:00');
    return isSameDay(entregaDate, dataSelecionada);
  });

  // Função para normalizar nome da região/cidade (remover acentos, lowercase)
  const normalizarCidade = (texto) => {
    if (!texto) return '';
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  // Função para capitalizar nome corretamente
  const capitalizarCidade = (texto) => {
    if (!texto) return '';
    return texto
      .toLowerCase()
      .split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  };

  // Obter o local de agrupamento: região (prioridade) ou cidade
  const obterLocal = (entrega) => entrega.regiao || entrega.endereco?.cidade || '';

  // Aplicar filtros
  const entregasFiltradas = entregasDoDia.filter(entrega => {
    if (filtroLocal !== 'todos' && normalizarCidade(obterLocal(entrega)) !== filtroLocal) return false;
    if (filtroPeriodo !== 'todos' && entrega.periodo !== filtroPeriodo) return false;
    if (filtroStatus !== 'todos') {
      const statusEntrega = normalizarStatus(entrega.status);
      if (statusEntrega !== filtroStatus) return false;
    }

    // Filtro de busca
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase().trim();
      const nomeCliente = entrega.cliente?.nome?.toLowerCase() || '';
      const telefone = entrega.cliente?.telefone?.toLowerCase() || '';
      const logradouro = entrega.endereco?.logradouro?.toLowerCase() || '';
      const bairro = entrega.endereco?.bairro?.toLowerCase() || '';
      const cidade = entrega.endereco?.cidade?.toLowerCase() || '';
      const numero = entrega.endereco?.numero?.toLowerCase() || '';
      const complemento = entrega.endereco?.complemento?.toLowerCase() || '';
      const requisicao = String(entrega.requisicao || '').toLowerCase();
      const observacao = entrega.observacao?.toLowerCase() || '';
      const formaPagamento = entrega.forma_pagamento?.toLowerCase() || '';

      const match = nomeCliente.includes(termo) ||
                    telefone.includes(termo) ||
                    logradouro.includes(termo) ||
                    bairro.includes(termo) ||
                    cidade.includes(termo) ||
                    numero.includes(termo) ||
                    complemento.includes(termo) ||
                    requisicao.includes(termo) ||
                    observacao.includes(termo) ||
                    formaPagamento.includes(termo);

      if (!match) return false;
    }

    return true;
  });

  // Lista de locais disponíveis (região ou cidade, normalizados para evitar duplicatas)
  const cidadesMap = new Map();
  entregasDoDia.forEach(e => {
    const local = obterLocal(e);
    if (local) {
      const localNormalizado = normalizarCidade(local);
      if (!cidadesMap.has(localNormalizado)) {
        cidadesMap.set(localNormalizado, capitalizarCidade(local));
      }
    }
  });
  const cidadesDisponiveis = [...cidadesMap.keys()];

  // Contagem de entregas por status
  const contagemPorStatus = statusOptions.map(status => ({
    ...status,
    quantidade: entregasDoDia.filter(e => normalizarStatus(e.status) === status.value).length
  }));

  // Resumo do dia por local (agrupado por região ou cidade)
  const resumoDia = cidadesDisponiveis.map(cidadeNormalizada => {
    const entregasCidade = entregasDoDia.filter(e => normalizarCidade(obterLocal(e)) === cidadeNormalizada);
    return {
      cidade: cidadesMap.get(cidadeNormalizada),
      quantidade: entregasCidade.length,
      valor: entregasCidade.reduce((sum, e) => sum + (parseFloat(e.valor) || 0), 0),
      taxa: entregasCidade.reduce((sum, e) => sum + (parseFloat(e.taxa) || 0), 0)
    };
  });

  const totalValorDia = resumoDia.reduce((sum, r) => sum + r.valor, 0);
  const totalTaxaDia = resumoDia.reduce((sum, r) => sum + r.taxa, 0);

  // Calcular semana de trabalho (começa na terça-feira, sem domingo)
  const calcularSemanaTrabalho = () => {
    const inicioSemana = startOfWeek(dataSelecionada, { weekStartsOn: 2 });
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const data = addDays(inicioSemana, i);
      // Pular domingo (dia 0)
      if (data.getDay() === 0) continue;
      const dataStr = format(data, 'yyyy-MM-dd');
      const entregasDia = todasEntregas.filter(e => e.data_entrega === dataStr);
      dias.push({
        nome: format(data, 'EEEE', { locale: ptBR }),
        data,
        dataStr,
        quantidade: entregasDia.length,
        valor: entregasDia.reduce((sum, e) => sum + (parseFloat(e.valor) || 0), 0)
      });
    }
    return dias;
  };

  const semanaTrabalho = calcularSemanaTrabalho();
  const totalSemana = semanaTrabalho.reduce((sum, d) => sum + d.valor, 0);

  // Buscar pedidos do motoboy
  const { data: pedidosMotoboy = [] } = useQuery({
    queryKey: ['pedidos-motoboy', motoboyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_motoboy')
        .select(`
          *,
          registrado:usuarios!registrado_por(id, usuario),
          parcelas:parcelas_pedido_motoboy(*)
        `)
        .eq('motoboy_id', motoboyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!motoboyId,
  });

  // Gerar opções das próximas 8 semanas para o select (começa na terça)
  const gerarOpcoesSemanas = () => {
    const opcoes = [];
    const inicioSemanaBase = startOfWeek(new Date(), { weekStartsOn: 2 });
    for (let i = 0; i < 8; i++) {
      const inicio = addDays(inicioSemanaBase, i * 7);
      const fim = addDays(inicio, 6);
      opcoes.push({
        value: format(inicio, 'yyyy-MM-dd'),
        label: `${format(inicio, 'dd/MM')} - ${format(fim, 'dd/MM/yyyy')}`
      });
    }
    return opcoes;
  };

  // Fechar modal e resetar form
  const fecharModalPedido = () => {
    setShowModalPedido(false);
    setPedidoEditando(null);
    setFormPedido({
      nome_formula: '',
      numero_requisicao: '',
      data_pedido: format(new Date(), 'yyyy-MM-dd'),
      valor_total: '',
      num_parcelas: 1,
      semana_inicio: '',
      observacoes: ''
    });
  };

  const abrirModalNovoPedido = () => {
    setPedidoEditando(null);
    setFormPedido({
      nome_formula: '',
      numero_requisicao: '',
      data_pedido: format(new Date(), 'yyyy-MM-dd'),
      valor_total: '',
      num_parcelas: 1,
      semana_inicio: '',
      observacoes: ''
    });
    setShowModalPedido(true);
  };

  const abrirModalEditarPedido = (pedido) => {
    const primeiraParcelaSorted = [...(pedido.parcelas || [])]
      .sort((a, b) => a.numero_parcela - b.numero_parcela)[0];
    setPedidoEditando(pedido);
    setFormPedido({
      nome_formula: pedido.nome_formula || '',
      numero_requisicao: pedido.numero_requisicao || '',
      data_pedido: pedido.data_pedido || format(new Date(), 'yyyy-MM-dd'),
      valor_total: String(pedido.valor_total || ''),
      num_parcelas: pedido.num_parcelas || 1,
      semana_inicio: primeiraParcelaSorted?.semana_inicio || '',
      observacoes: pedido.observacoes || ''
    });
    setShowModalPedido(true);
  };

  // Mutation salvar pedido (criar ou editar)
  const salvarPedidoMutation = useMutation({
    mutationFn: async () => {
      const valorTotal = parseFloat(formPedido.valor_total);
      const numParcelas = parseInt(formPedido.num_parcelas);
      const valorBase = Math.floor((valorTotal / numParcelas) * 100) / 100;
      const ultimaParcela = Math.round((valorTotal - valorBase * (numParcelas - 1)) * 100) / 100;

      let pedidoId;
      if (pedidoEditando) {
        const { error } = await supabase
          .from('pedidos_motoboy')
          .update({
            nome_formula: formPedido.nome_formula.trim(),
            numero_requisicao: formPedido.numero_requisicao.trim(),
            data_pedido: formPedido.data_pedido,
            valor_total: valorTotal,
            num_parcelas: numParcelas,
            observacoes: formPedido.observacoes.trim() || null,
          })
          .eq('id', pedidoEditando.id);
        if (error) throw error;
        pedidoId = pedidoEditando.id;
        const { error: delError } = await supabase
          .from('parcelas_pedido_motoboy')
          .delete()
          .eq('pedido_id', pedidoId);
        if (delError) throw delError;
      } else {
        const { data: novoPedido, error } = await supabase
          .from('pedidos_motoboy')
          .insert({
            motoboy_id: motoboyId,
            registrado_por: user?.id,
            nome_formula: formPedido.nome_formula.trim(),
            numero_requisicao: formPedido.numero_requisicao.trim(),
            data_pedido: formPedido.data_pedido,
            valor_total: valorTotal,
            num_parcelas: numParcelas,
            observacoes: formPedido.observacoes.trim() || null,
          })
          .select()
          .single();
        if (error) throw error;
        pedidoId = novoPedido.id;
      }

      const parcelas = Array.from({ length: numParcelas }, (_, i) => ({
        pedido_id: pedidoId,
        numero_parcela: i + 1,
        valor_parcela: i === numParcelas - 1 ? ultimaParcela : valorBase,
        semana_inicio: format(addDays(new Date(formPedido.semana_inicio + 'T00:00:00'), i * 7), 'yyyy-MM-dd'),
        status: 'pendente',
      }));

      const { error: parcelasError } = await supabase
        .from('parcelas_pedido_motoboy')
        .insert(parcelas);
      if (parcelasError) throw parcelasError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-motoboy', motoboyId] });
      toast.success(pedidoEditando ? 'Pedido atualizado!' : 'Pedido cadastrado!');
      fecharModalPedido();
    },
    onError: (err) => {
      toast.error('Erro ao salvar pedido: ' + err.message);
    }
  });

  // Mutation excluir pedido (CASCADE deleta as parcelas)
  const excluirPedidoMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('pedidos_motoboy')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-motoboy', motoboyId] });
      toast.success('Pedido excluído!');
    },
    onError: (err) => {
      toast.error('Erro ao excluir: ' + err.message);
    }
  });

  const handleSalvarPedido = () => {
    if (!formPedido.nome_formula.trim()) { toast.error('Informe o nome da fórmula'); return; }
    if (!formPedido.numero_requisicao.trim()) { toast.error('Informe o nº de requisição'); return; }
    if (!formPedido.data_pedido) { toast.error('Informe a data do pedido'); return; }
    if (!formPedido.valor_total || parseFloat(formPedido.valor_total) <= 0) { toast.error('Informe um valor válido'); return; }
    if (!formPedido.semana_inicio) { toast.error('Selecione a semana de início'); return; }
    salvarPedidoMutation.mutate();
  };

  // Dias do mês para o calendário
  const diasDoMes = eachDayOfInterval({
    start: startOfMonth(mesAtual),
    end: endOfMonth(mesAtual)
  });

  // Dias com entregas
  const diasComEntregas = new Set(todasEntregas.map(e => e.data_entrega));

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('entregas')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-motoboy-all'] });
      toast.success('Status atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    }
  });

  const handleStatusChange = (id, newStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  // Mutation para salvar ordem das entregas
  const salvarOrdemMutation = useMutation({
    mutationFn: async (ordens) => {
      const promises = Object.entries(ordens).map(async ([id, ordem]) => {
        const { error } = await supabase
          .from('entregas')
          .update({ ordem_entrega: ordem })
          .eq('id', id);
        if (error) throw error;
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-motoboy-all'] });
      toast.success('Ordem salva!');
    },
    onError: (error) => {
      console.error('Erro ao salvar ordem:', error);
      toast.error('Erro ao salvar ordem.');
    }
  });

  // Função para mover entrega com setas (cima/baixo)
  const handleMoverEntrega = (entregaId, direcao, periodo) => {
    // Pegar entregas do mesmo período ordenadas
    const entregasDoPeriodo = entregasFiltradas
      .filter(e => {
        if (periodo === 'Manhã') return e.periodo === 'Manhã';
        if (periodo === 'Tarde') return e.periodo === 'Tarde';
        return !e.periodo || (e.periodo !== 'Manhã' && e.periodo !== 'Tarde');
      });

    const entregasOrdenadas = [...entregasDoPeriodo].sort((a, b) => {
      const ordemA = ordemEntregas[a.id] ?? a.ordem_entrega ?? 999;
      const ordemB = ordemEntregas[b.id] ?? b.ordem_entrega ?? 999;
      return ordemA - ordemB;
    });

    const currentIndex = entregasOrdenadas.findIndex(e => e.id === entregaId);
    if (currentIndex === -1) return;

    const targetIndex = direcao === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= entregasOrdenadas.length) return;

    // Trocar posições
    const novaOrdem = [...entregasOrdenadas];
    const temp = novaOrdem[currentIndex];
    novaOrdem[currentIndex] = novaOrdem[targetIndex];
    novaOrdem[targetIndex] = temp;

    // Atualizar estado de ordem
    const novaOrdemObj = { ...ordemEntregas };
    novaOrdem.forEach((entrega, index) => {
      novaOrdemObj[entrega.id] = index;
    });

    setOrdemEntregas(novaOrdemObj);
    salvarOrdemMutation.mutate(novaOrdemObj);
  };

  // Ordenar entregas por ordem personalizada
  const ordenarEntregas = (entregas) => {
    return [...entregas].sort((a, b) => {
      const ordemA = ordemEntregas[a.id] ?? a.ordem_entrega ?? 999;
      const ordemB = ordemEntregas[b.id] ?? b.ordem_entrega ?? 999;
      return ordemA - ordemB;
    });
  };

  const abrirMapa = (endereco) => {
    const query = `${endereco.logradouro}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  // Função para abrir rota completa no Google Maps
  const abrirRotaGoogleMaps = () => {
    const entregasOrdenadas = ordenarEntregas(entregasFiltradas);

    if (entregasOrdenadas.length === 0) {
      toast.error('Nenhuma entrega para criar rota');
      return;
    }

    // Google Maps suporta até 10 waypoints na URL
    const entregas = entregasOrdenadas.slice(0, 10);

    // Criar waypoints (endereços)
    const waypoints = entregas.map(e => {
      if (!e.endereco) return '';
      return `${e.endereco.logradouro}, ${e.endereco.numero}, ${e.endereco.bairro}, ${e.endereco.cidade}`;
    }).filter(Boolean);

    if (waypoints.length === 0) {
      toast.error('Nenhum endereço válido encontrado');
      return;
    }

    // Construir URL do Google Maps
    // Formato: /dir/origem/destino1/destino2/.../destinoFinal
    const baseUrl = 'https://www.google.com/maps/dir/';
    const waypointsEncoded = waypoints.map(w => encodeURIComponent(w)).join('/');
    const url = baseUrl + waypointsEncoded;

    window.open(url, '_blank');

    if (entregasOrdenadas.length > 10) {
      toast.info(`Rota criada com as primeiras 10 entregas. Total: ${entregasOrdenadas.length}`);
    }
  };

  const abrirRomaneio = (entrega) => {
    navigate(`/detalhes-romaneio?id=${entrega.id}`);
  };

  const motoboyAtual = motoboys.find(m => m.id === motoboyId);

  // Primeiro dia do mês (para posicionar corretamente no calendário)
  const primeiroDiaDoMes = getDay(startOfMonth(mesAtual));

  // Carregar status de pagamento da semana atual (semana: terça a segunda)
  const inicioSemanaAtual = format(startOfWeek(dataSelecionada, { weekStartsOn: 2 }), 'yyyy-MM-dd');

  // Cálculo dos descontos da semana atual
  const descontosSemana = pedidosMotoboy.reduce((total, pedido) => {
    const parcelasDaSemana = (pedido.parcelas || []).filter(
      p => p.semana_inicio === inicioSemanaAtual
    );
    return total + parcelasDaSemana.reduce((sum, p) => sum + (parseFloat(p.valor_parcela) || 0), 0);
  }, 0);
  const totalLiquidoSemana = totalSemana - descontosSemana;

  useEffect(() => {
    const carregarPagamentoSemana = async () => {
      if (!motoboyId) return;
      const { data } = await supabase
        .from('motoboys')
        .select('pagamentos_semanais')
        .eq('id', motoboyId)
        .single();

      if (data?.pagamentos_semanais?.[inicioSemanaAtual]) {
        setStatusPagamentoSemana(data.pagamentos_semanais[inicioSemanaAtual]);
      } else {
        setStatusPagamentoSemana('Aguardando');
      }
    };
    carregarPagamentoSemana();
  }, [motoboyId, inicioSemanaAtual]);

  // Mutation para salvar status de pagamento da semana
  const salvarPagamentoSemanaMutation = useMutation({
    mutationFn: async (status) => {
      // Buscar pagamentos atuais do motoboy
      const { data: motoboy } = await supabase
        .from('motoboys')
        .select('pagamentos_semanais')
        .eq('id', motoboyId)
        .single();

      const pagamentosAtuais = motoboy?.pagamentos_semanais || {};
      pagamentosAtuais[inicioSemanaAtual] = status;

      const { error } = await supabase
        .from('motoboys')
        .update({ pagamentos_semanais: pagamentosAtuais })
        .eq('id', motoboyId);

      if (error) throw error;
    },
    onSuccess: (_, status) => {
      setStatusPagamentoSemana(status);
      toast.success(`Status de pagamento: ${status}`);
    },
    onError: () => {
      toast.error('Erro ao atualizar status de pagamento');
    }
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      {/* Header - Compacto para mobile */}
      <div className="py-4 sm:py-6 shadow-sm" style={{
        background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              {!isMotoboy && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-1.5 sm:p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              )}
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-white">
                  {isMotoboy ? 'Minhas Entregas' : 'Painel do Motoboy'}
                </h1>
                <p className="text-xs sm:text-sm text-white opacity-90">
                  Olá, {nomeMotoboyUsuario || user?.nome || 'Motoboy'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-3 sm:space-y-4">
            {/* Seletor de Motoboy */}
            {!isMotoboy && (
              <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: '#890d5d' }}>
                <label className="block text-xs sm:text-sm font-semibold text-white mb-1.5 sm:mb-2">
                  Selecione o Motoboy
                </label>
                <CustomDropdown
                  options={motoboys.map(m => ({ value: m.id, label: m.nome }))}
                  value={motoboyId || ''}
                  onChange={setMotoboyId}
                  placeholder="Selecione o motoboy"
                />
              </div>
            )}

            {/* Calendário - Compacto */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
              {/* Navegação do mês */}
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <button
                  onClick={() => setMesAtual(subMonths(mesAtual, 1))}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <span className="text-xs sm:text-sm font-medium text-slate-700 capitalize">
                  {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <button
                  onClick={() => setMesAtual(addMonths(mesAtual, 1))}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Dias da semana */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, i) => (
                  <div key={i} className="text-center text-[10px] sm:text-xs font-medium text-slate-500 py-0.5 sm:py-1">
                    {dia}
                  </div>
                ))}
              </div>

              {/* Dias do mês */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {Array.from({ length: primeiroDiaDoMes }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {diasDoMes.map(dia => {
                  const dataStr = format(dia, 'yyyy-MM-dd');
                  const temEntrega = diasComEntregas.has(dataStr);
                  const isSelected = isSameDay(dia, dataSelecionada);
                  const isHoje = isSameDay(dia, new Date());

                  return (
                    <button
                      key={dataStr}
                      onClick={() => setDataSelecionada(dia)}
                      className={`aspect-square flex items-center justify-center text-xs sm:text-sm rounded-md sm:rounded-lg transition-all relative
                        ${isSelected
                          ? 'text-white font-bold'
                          : isHoje
                            ? 'font-semibold'
                            : temEntrega
                              ? 'font-medium hover:opacity-80'
                              : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      style={{
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : isHoje
                            ? '#f3e8ff'
                            : temEntrega
                              ? '#fef3c7'
                              : 'transparent',
                        color: isSelected
                          ? 'white'
                          : isHoje
                            ? theme.colors.secondary
                            : temEntrega
                              ? '#92400e'
                              : undefined
                      }}
                    >
                      {format(dia, 'd')}
                    </button>
                  );
                })}
              </div>

              {/* Data selecionada */}
              <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-slate-200 text-center">
                <p className="text-xs sm:text-sm font-semibold text-slate-700">
                  {format(dataSelecionada, "d 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  {entregasDoDia.length} entrega{entregasDoDia.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Resumo do Dia - Compacto */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
              <h3 className="font-semibold text-slate-700 text-xs sm:text-sm mb-2 sm:mb-3">Resumo - {format(dataSelecionada, "dd/MM")}</h3>

              <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 mb-1.5 sm:mb-2 pb-1.5 sm:pb-2 border-b border-slate-100">
                <span>Local</span>
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="w-6 sm:w-8 text-center">Qtd</span>
                  <span className="w-14 sm:w-20 text-right">Valor</span>
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2">
                {resumoDia.map(item => (
                  <div key={item.cidade} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-600 truncate max-w-[100px] sm:max-w-none">{item.cidade}</span>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <span className="text-slate-500 w-6 sm:w-8 text-center">{item.quantidade}x</span>
                      <span className="font-medium w-14 sm:w-20 text-right text-xs sm:text-sm" style={{ color: theme.colors.primary }}>R$ {item.valor.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs sm:text-sm">TOTAL</span>
                  <span className="font-bold text-sm sm:text-lg" style={{ color: theme.colors.primary }}>R$ {totalValorDia.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Semana - Compacto */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="font-semibold text-slate-700 text-xs sm:text-sm">Semana</h3>
                <span className="text-[10px] sm:text-xs text-slate-500">
                  {format(semanaTrabalho[0]?.data || new Date(), 'dd/MM')} - {format(semanaTrabalho[semanaTrabalho.length - 1]?.data || new Date(), 'dd/MM')}
                </span>
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                {semanaTrabalho.map(dia => (
                  <div
                    key={dia.dataStr}
                    onClick={() => setDataSelecionada(dia.data)}
                    className="flex items-center justify-between text-[10px] sm:text-xs py-1 px-1.5 sm:px-2 rounded cursor-pointer hover:bg-slate-50"
                    style={{
                      backgroundColor: isSameDay(dia.data, dataSelecionada) ? '#e8f0f8' : 'transparent'
                    }}
                  >
                    <span className="text-slate-600 capitalize w-8 sm:w-12">{dia.nome.slice(0, 3)}</span>
                    <span className="text-slate-500 w-10 sm:w-auto">{format(dia.data, 'dd/MM')}</span>
                    <span className="text-slate-500 w-5 sm:w-auto">{dia.quantidade}x</span>
                    <span className={`font-semibold w-14 sm:w-auto text-right ${dia.valor > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                      R$ {dia.valor.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs sm:text-sm">ENTREGAS</span>
                  <span className="font-bold text-green-600 text-sm sm:text-base">R$ {totalSemana.toFixed(2)}</span>
                </div>
                {descontosSemana > 0 && (
                  <>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-semibold text-red-600 text-xs sm:text-sm">DESCONTOS</span>
                      <span className="font-semibold text-red-600 text-xs sm:text-sm">- R$ {descontosSemana.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-dashed border-slate-300 mt-1.5 pt-1.5 flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-xs sm:text-sm">TOTAL LÍQUIDO</span>
                      <span className={`font-bold text-sm sm:text-base ${totalLiquidoSemana >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {totalLiquidoSemana.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Status de Pagamento da Semana */}
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">Pagamento</span>
                </div>

                {isAdmin ? (
                  <div className="flex gap-1.5 sm:gap-2">
                    <button
                      onClick={() => {
                        setStatusPagamentoSemana('Aguardando');
                        salvarPagamentoSemanaMutation.mutate('Aguardando');
                      }}
                      className="flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: statusPagamentoSemana === 'Aguardando' ? '#f59e0b' : '#fef3c7',
                        color: statusPagamentoSemana === 'Aguardando' ? 'white' : '#92400e',
                        border: statusPagamentoSemana === 'Aguardando' ? '2px solid #f59e0b' : '2px solid #fcd34d'
                      }}
                    >
                      Aguard.
                    </button>
                    <button
                      onClick={() => {
                        setStatusPagamentoSemana('Pago');
                        salvarPagamentoSemanaMutation.mutate('Pago');
                      }}
                      className="flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: statusPagamentoSemana === 'Pago' ? '#15803d' : '#dcfce7',
                        color: statusPagamentoSemana === 'Pago' ? 'white' : '#166534',
                        border: statusPagamentoSemana === 'Pago' ? '2px solid #15803d' : '2px solid #86efac'
                      }}
                    >
                      Pago
                    </button>
                  </div>
                ) : (
                  <div
                    className="py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-bold text-center"
                    style={{
                      backgroundColor: statusPagamentoSemana === 'Pago' ? '#dcfce7' : '#fef3c7',
                      color: statusPagamentoSemana === 'Pago' ? '#166534' : '#92400e',
                      border: statusPagamentoSemana === 'Pago' ? '2px solid #86efac' : '2px solid #fcd34d'
                    }}
                  >
                    {statusPagamentoSemana === 'Pago' ? '✓ Pago' : '⏳ Aguardando'}
                  </div>
                )}
              </div>
            </div>

            {/* Pedidos / Descontos */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <button
                  onClick={() => setShowPedidos(!showPedidos)}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  <ShoppingBag className="w-4 h-4" style={{ color: '#890d5d' }} />
                  Pedidos / Descontos
                  {pedidosMotoboy.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: '#890d5d' }}>
                      {pedidosMotoboy.length}
                    </span>
                  )}
                  <ChevronsUpDown className="w-3 h-3 text-slate-400 ml-1" />
                </button>
                {isAdmin && (
                  <button
                    onClick={abrirModalNovoPedido}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                    style={{ backgroundColor: '#890d5d' }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Novo
                  </button>
                )}
              </div>

              {showPedidos && (
                <div className="space-y-2 sm:space-y-3">
                  {pedidosMotoboy.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">Nenhum pedido registrado</p>
                  ) : (
                    pedidosMotoboy.map(pedido => (
                      <div key={pedido.id} className="rounded-lg border border-slate-100 p-2.5 sm:p-3 bg-slate-50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                              {pedido.nome_formula}
                            </p>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                              Req. #{pedido.numero_requisicao} · {format(new Date(pedido.data_pedido + 'T00:00:00'), 'dd/MM/yyyy')}
                            </p>
                            <p className="text-xs font-bold mt-0.5" style={{ color: '#890d5d' }}>
                              R$ {parseFloat(pedido.valor_total).toFixed(2)}
                              {pedido.num_parcelas > 1 && (
                                <span className="font-normal text-slate-500 ml-1">em {pedido.num_parcelas}x</span>
                              )}
                            </p>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => abrirModalEditarPedido(pedido)}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Excluir pedido "${pedido.nome_formula}"?`)) {
                                    excluirPedidoMutation.mutate(pedido.id);
                                  }
                                }}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Parcelas detalhadas */}
                        {pedido.num_parcelas > 1 && pedido.parcelas && pedido.parcelas.length > 0 && (
                          <div className="mt-2 space-y-0.5 border-t border-slate-200 pt-2">
                            {[...pedido.parcelas]
                              .sort((a, b) => a.numero_parcela - b.numero_parcela)
                              .map(parcela => (
                                <div key={parcela.id} className="flex items-center justify-between text-[10px] sm:text-xs">
                                  <span className={parcela.status === 'descontado' ? 'line-through text-green-600' : 'text-slate-500'}>
                                    {parcela.numero_parcela}/{pedido.num_parcelas} · {parcela.semana_inicio}
                                  </span>
                                  <span className={parcela.status === 'descontado' ? 'line-through text-green-600 font-medium' : 'text-slate-600 font-medium'}>
                                    R$ {parseFloat(parcela.valor_parcela).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Observações */}
                        {pedido.observacoes && (
                          <p className="mt-1.5 text-[10px] sm:text-xs text-slate-500 italic bg-white rounded px-2 py-1 border border-slate-100">
                            {pedido.observacoes}
                          </p>
                        )}

                        {/* Registrado por */}
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          Por: {pedido.registrado?.usuario || 'Sistema'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita - Entregas */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Cards de Filtro por Status - Compactos para mobile */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
              {/* Card Todas */}
              <div
                onClick={() => setFiltroStatus('todos')}
                className="bg-white rounded-lg sm:rounded-xl shadow-sm p-2 sm:p-4 cursor-pointer transition-all hover:shadow-md"
                style={{
                  border: filtroStatus === 'todos' ? `2px solid ${theme.colors.primary}` : '2px solid transparent'
                }}
              >
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: '#E8F0F8' }}>
                    <Package className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: theme.colors.primary }} />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700">Todas</span>
                  <span className="text-xl sm:text-2xl font-bold" style={{ color: theme.colors.primary }}>
                    {entregasDoDia.length}
                  </span>
                </div>
              </div>

              {contagemPorStatus.map((status) => {
                const Icon = status.icon;
                const isActive = filtroStatus === status.value;
                const bgColor = status.color + '15';
                return (
                  <div
                    key={status.value}
                    onClick={() => setFiltroStatus(isActive ? 'todos' : status.value)}
                    className="bg-white rounded-lg sm:rounded-xl shadow-sm p-2 sm:p-4 cursor-pointer transition-all hover:shadow-md"
                    style={{
                      border: isActive ? `2px solid ${status.color}` : '2px solid transparent'
                    }}
                  >
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <div className="p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: bgColor }}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: status.color }} />
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-700 truncate w-full text-center">{status.label}</span>
                      <span className="text-xl sm:text-2xl font-bold" style={{ color: status.color }}>
                        {status.quantidade}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filtros - Compacto */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
              {/* Campo de Busca */}
              <div className="mb-3 sm:mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente, endereço..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg pl-8 sm:pl-10 pr-8 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {termoBusca && (
                    <button
                      onClick={() => setTermoBusca('')}
                      className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <CustomDropdown
                  label="Local"
                  options={[
                    { value: 'todos', label: 'Todos' },
                    ...cidadesDisponiveis.map(cidadeNorm => ({ value: cidadeNorm, label: cidadesMap.get(cidadeNorm) }))
                  ]}
                  value={filtroLocal}
                  onChange={setFiltroLocal}
                  placeholder="Local"
                />
                <CustomDropdown
                  label="Período"
                  options={[
                    { value: 'todos', label: 'Todos' },
                    { value: 'Manhã', label: 'Manhã' },
                    { value: 'Tarde', label: 'Tarde' }
                  ]}
                  value={filtroPeriodo}
                  onChange={setFiltroPeriodo}
                  placeholder="Período"
                />
              </div>

              {/* Botão Abrir Rota no Google Maps */}
              <button
                onClick={abrirRotaGoogleMaps}
                disabled={entregasFiltradas.length === 0}
                className="mt-3 sm:mt-4 w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#890d5d',
                  color: 'white'
                }}
              >
                <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
                Abrir Rota no Maps ({entregasFiltradas.length})
              </button>
            </div>

            {/* Dica de setas - Oculta no mobile */}
            <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-slate-500 px-2">
              <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Use as setas para reorganizar</span>
            </div>

            {/* Lista de Entregas */}
            {entregasFiltradas.length > 0 ? (
              <>
                {/* Entregas da Manhã */}
                {(() => {
                  const entregasManha = entregasFiltradas.filter(e => e.periodo === 'Manhã');
                  if (entregasManha.length === 0) return null;
                  const entregasOrdenadas = ordenarEntregas(entregasManha);

                  return (
                    <div className="mb-4 sm:mb-6">
                      <div className="mb-2 sm:mb-4">
                        <h2 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                          <Sunrise className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#eab308' }} />
                          Manhã
                          <span className="text-sm font-semibold px-2 sm:px-3 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {entregasManha.length}
                          </span>
                        </h2>
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        {entregasOrdenadas.map((entrega, index) => (
                          <EntregaCard
                            key={entrega.id}
                            entrega={entrega}
                            index={index + 1}
                            totalEntregas={entregasManha.length}
                            onStatusChange={handleStatusChange}
                            isUpdating={updateStatusMutation.isPending}
                            onAbrirMapa={abrirMapa}
                            onMoverEntrega={(id, dir) => handleMoverEntrega(id, dir, 'Manhã')}
                            onVerDetalhes={abrirRomaneio}
                            statusOptions={statusOptions}
                            normalizarStatus={normalizarStatus}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Entregas da Tarde */}
                {(() => {
                  const entregasTarde = entregasFiltradas.filter(e => e.periodo === 'Tarde');
                  if (entregasTarde.length === 0) return null;
                  const entregasOrdenadas = ordenarEntregas(entregasTarde);

                  return (
                    <div className="mb-4 sm:mb-6">
                      <div className="mb-2 sm:mb-4">
                        <h2 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                          <Sun className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#f97316' }} />
                          Tarde
                          <span className="text-sm font-semibold px-2 sm:px-3 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {entregasTarde.length}
                          </span>
                        </h2>
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        {entregasOrdenadas.map((entrega, index) => (
                          <EntregaCard
                            key={entrega.id}
                            entrega={entrega}
                            index={index + 1}
                            totalEntregas={entregasTarde.length}
                            onStatusChange={handleStatusChange}
                            isUpdating={updateStatusMutation.isPending}
                            onAbrirMapa={abrirMapa}
                            onMoverEntrega={(id, dir) => handleMoverEntrega(id, dir, 'Tarde')}
                            onVerDetalhes={abrirRomaneio}
                            statusOptions={statusOptions}
                            normalizarStatus={normalizarStatus}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Entregas sem período definido */}
                {(() => {
                  const entregasSemPeriodo = entregasFiltradas.filter(e => !e.periodo || (e.periodo !== 'Manhã' && e.periodo !== 'Tarde'));
                  if (entregasSemPeriodo.length === 0) return null;
                  const entregasOrdenadas = ordenarEntregas(entregasSemPeriodo);

                  return (
                    <div className="mb-4 sm:mb-6">
                      <div className="mb-2 sm:mb-4">
                        <h2 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                          <Clock className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#64748b' }} />
                          Outros
                          <span className="text-sm font-semibold px-2 sm:px-3 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {entregasSemPeriodo.length}
                          </span>
                        </h2>
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        {entregasOrdenadas.map((entrega, index) => (
                          <EntregaCard
                            key={entrega.id}
                            entrega={entrega}
                            index={index + 1}
                            totalEntregas={entregasSemPeriodo.length}
                            onStatusChange={handleStatusChange}
                            isUpdating={updateStatusMutation.isPending}
                            onAbrirMapa={abrirMapa}
                            onMoverEntrega={(id, dir) => handleMoverEntrega(id, dir, 'sem_periodo')}
                            onVerDetalhes={abrirRomaneio}
                            statusOptions={statusOptions}
                            normalizarStatus={normalizarStatus}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhuma entrega para este dia</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Pedido */}
      {showModalPedido && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 9990,
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          <div style={{
            width: '100%',
            maxWidth: '520px',
            marginTop: '16px',
            marginBottom: '16px',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            backgroundColor: 'white',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)',
              padding: '20px 24px',
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-medium opacity-80 mb-0.5">
                    {motoboyAtual?.nome}
                  </p>
                  <h2 className="text-white text-lg font-bold">
                    {pedidoEditando ? 'Editar Pedido' : 'Novo Pedido'}
                  </h2>
                </div>
                <button
                  onClick={fecharModalPedido}
                  className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Corpo */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Nome da Fórmula */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nome da Fórmula *
                </label>
                <input
                  type="text"
                  value={formPedido.nome_formula}
                  onChange={e => setFormPedido(f => ({ ...f, nome_formula: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Vitamina C 500mg"
                />
              </div>

              {/* Nº Requisição + Data */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nº Requisição *
                  </label>
                  <input
                    type="text"
                    value={formPedido.numero_requisicao}
                    onChange={e => setFormPedido(f => ({ ...f, numero_requisicao: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 1234"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Data do Pedido *
                  </label>
                  <input
                    type="date"
                    value={formPedido.data_pedido}
                    onChange={e => setFormPedido(f => ({ ...f, data_pedido: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Valor Total + Parcelas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Valor Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPedido.valor_total}
                    onChange={e => setFormPedido(f => ({ ...f, valor_total: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Parcelas
                  </label>
                  <select
                    value={formPedido.num_parcelas}
                    onChange={e => setFormPedido(f => ({ ...f, num_parcelas: parseInt(e.target.value) }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => {
                      const val = parseFloat(formPedido.valor_total) || 0;
                      const parcela = val > 0 ? ` (R$ ${(val / n).toFixed(2)}/sem)` : '';
                      return <option key={n} value={n}>{n}x{parcela}</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* Semana de início */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Semana de início do desconto *
                </label>
                <select
                  value={formPedido.semana_inicio}
                  onChange={e => setFormPedido(f => ({ ...f, semana_inicio: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma semana</option>
                  {gerarOpcoesSemanas().map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
              </div>

              {/* Preview das parcelas */}
              {parseFloat(formPedido.valor_total) > 0 && formPedido.num_parcelas > 1 && formPedido.semana_inicio && (
                <div className="rounded-lg p-3 border border-blue-100" style={{ backgroundColor: '#eff6ff' }}>
                  <p className="text-xs font-semibold text-blue-700 mb-2">Preview das parcelas:</p>
                  <div className="space-y-1">
                    {Array.from({ length: formPedido.num_parcelas }, (_, i) => {
                      const valorTotal = parseFloat(formPedido.valor_total);
                      const numP = formPedido.num_parcelas;
                      const valorBase = Math.floor((valorTotal / numP) * 100) / 100;
                      const valorParcela = i === numP - 1
                        ? Math.round((valorTotal - valorBase * (numP - 1)) * 100) / 100
                        : valorBase;
                      const semana = format(addDays(new Date(formPedido.semana_inicio + 'T00:00:00'), i * 7), 'dd/MM/yyyy');
                      return (
                        <div key={i} className="flex justify-between text-xs text-blue-600">
                          <span>Parcela {i + 1}/{numP} · Semana {semana}</span>
                          <span className="font-medium">R$ {valorParcela.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Observações
                </label>
                <textarea
                  value={formPedido.observacoes}
                  onChange={e => setFormPedido(f => ({ ...f, observacoes: e.target.value }))}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Anotações sobre o pedido..."
                />
              </div>

              {/* Registrado por */}
              <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: '#dbeafe' }}>
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Registrado por:</span>{' '}
                  {user?.usuario || user?.nome || 'Usuário atual'}
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={fecharModalPedido}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarPedido}
                  disabled={salvarPedidoMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
                  style={{ backgroundColor: '#890d5d' }}
                >
                  {salvarPedidoMutation.isPending ? 'Salvando...' : pedidoEditando ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de Card de Entrega
function EntregaCard({
  entrega,
  index,
  totalEntregas,
  onStatusChange,
  isUpdating,
  onAbrirMapa,
  onMoverEntrega,
  onVerDetalhes,
  statusOptions,
  normalizarStatus
}) {
  const getStatusBadge = (status) => {
    const option = statusOptions?.find(s => s.value === status);
    if (option) {
      return { bg: option.bg, text: option.text, label: option.label, color: option.color };
    }
    switch (status) {
      case 'A Caminho':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Em Rota', color: '#3b82f6' };
      case 'Não Entregue':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Voltou', color: '#ef4444' };
      default:
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Em Rota', color: '#3b82f6' };
    }
  };

  const statusNormalizado = normalizarStatus ? normalizarStatus(entrega.status) : entrega.status;
  const statusBadge = getStatusBadge(statusNormalizado);

  // Verifica se precisa cobrar (Receber Dinheiro ou Receber Máquina)
  const temCobranca = ['Receber Dinheiro', 'Receber Máquina', 'Pagar MP'].includes(entrega.forma_pagamento);
  const valorCobrar = parseFloat(entrega.valor_venda) || parseFloat(entrega.valor) || 0;
  const temTroco = entrega.precisa_troco && entrega.valor_troco > 0;

  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 overflow-hidden transition-all hover:shadow-md">
      {/* Card Principal - Compacto */}
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Número da ordem - Compacto */}
          <div className="flex flex-col items-center gap-0.5 pt-0.5">
            <button
              onClick={() => onMoverEntrega(entrega.id, 'up')}
              disabled={index === 1}
              className={`p-0.5 rounded ${index === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-500">#{index}</span>
            <button
              onClick={() => onMoverEntrega(entrega.id, 'down')}
              disabled={index === totalEntregas}
              className={`p-0.5 rounded ${index === totalEntregas ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1 min-w-0">
            {/* Linha 1: Nome + Status */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold" style={{ color: '#376295' }}>
                #{entrega.requisicao || '0000'}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {entrega.cliente?.nome || 'Cliente'}
              </span>
              <span
                className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap"
                style={{
                  backgroundColor: statusBadge.color + '20',
                  color: statusBadge.color
                }}
              >
                {statusBadge.label}
              </span>
            </div>

            {/* Endereço - Compacto */}
            <div className="text-xs sm:text-sm text-slate-600 mb-1.5">
              <span className="line-clamp-2">
                {entrega.endereco
                  ? `${entrega.endereco.logradouro}, ${entrega.endereco.numero} - ${entrega.endereco.bairro}`
                  : 'Endereço não informado'}
              </span>
              {entrega.endereco?.complemento && (
                <span className="text-slate-500 text-xs"> ({entrega.endereco.complemento})</span>
              )}
            </div>

            {/* Telefone - Destaque para ligar */}
            {entrega.cliente?.telefone && (
              <a
                href={`tel:${entrega.cliente.telefone}`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-2"
                style={{ backgroundColor: '#E8F0F8', color: '#376295' }}
              >
                <Phone className="w-3 h-3" />
                {entrega.cliente.telefone}
              </a>
            )}

            {/* Horário de entrega - Destaque */}
            {(entrega.horario_entrega || entrega.observacoes?.match(/^\|\|H:(.*?)\|\|/)?.[1]) && (
              <div className="mb-2">
                <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}>
                  ⏰ {entrega.horario_entrega || entrega.observacoes.match(/^\|\|H:(.*?)\|\|/)[1]}
                </span>
              </div>
            )}

            {/* Badges inline - Compactos */}
            {(entrega.item_geladeira || entrega.buscar_receita || entrega.reter_receita || entrega.coleta) && (
              <div className="flex flex-wrap gap-1 mb-2">
                {entrega.item_geladeira && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5" style={{ backgroundColor: '#cffafe', color: '#0c4a6e' }}>
                    <Snowflake className="w-3 h-3" />
                    Gelad.
                  </span>
                )}
                {(entrega.buscar_receita || entrega.reter_receita) && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                    <FileText className="w-3 h-3" />
                    Receita
                  </span>
                )}
                {entrega.coleta && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
                    <Package className="w-3 h-3" />
                    Coleta
                  </span>
                )}
              </div>
            )}

            {/* Cobrança - Compacta mas destacada */}
            {temCobranca && valorCobrar > 0 && (
              <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: '#e8f5e9', border: '2px solid #4caf50' }}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs" style={{ color: '#1b5e20' }}>COBRAR:</span>
                  <span className="text-lg font-bold" style={{ color: '#1b5e20' }}>
                    R$ {valorCobrar.toFixed(2)}
                  </span>
                </div>
                {temTroco && (
                  <div className="mt-1 flex items-center gap-1 text-xs font-bold" style={{ color: '#e65100' }}>
                    <AlertTriangle className="w-3 h-3" />
                    Troco: R$ {parseFloat(entrega.valor_troco).toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* Observações - Compacta */}
            {((entrega.observacao || entrega.observacoes)?.replace(/^\|\|H:.*?\|\|\s*/, '')) && (
              <div className="text-[10px] sm:text-xs text-slate-600 italic bg-slate-50 p-1.5 sm:p-2 rounded border border-slate-200 line-clamp-2">
                <span className="font-semibold not-italic">Obs:</span> {(entrega.observacao || entrega.observacoes)?.replace(/^\|\|H:.*?\|\|\s*/, '')}
              </div>
            )}
          </div>

          {/* Valor - Lado direito */}
          <div className="text-right flex-shrink-0">
            <div className="text-sm sm:text-lg font-bold" style={{ color: '#376295' }}>
              R$ {(parseFloat(entrega.valor) || 0).toFixed(2)}
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-slate-500">
              {entrega.regiao || entrega.endereco?.cidade}
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Ação - Compactos */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 border-t border-slate-200">
        {/* Ações principais */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => onAbrirMapa(entrega.endereco)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-white transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Abrir no </span>Mapa
          </button>
          <button
            onClick={() => onVerDetalhes(entrega)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Detalhes
          </button>
        </div>

        {/* Botões de Status - Compactos */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {statusOptions?.map((status) => {
            const Icon = status.icon;
            const isCurrentStatus = statusNormalizado === status.value;
            return (
              <button
                key={status.value}
                onClick={() => !isCurrentStatus && onStatusChange(entrega.id, status.value)}
                disabled={isUpdating}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 sm:py-2 px-0.5 rounded-md sm:rounded-lg transition-all text-[9px] sm:text-xs font-semibold ${
                  isCurrentStatus
                    ? 'ring-2 sm:ring-4 ring-offset-1 sm:ring-offset-2 shadow-md scale-105'
                    : 'hover:scale-105 hover:shadow-md'
                }`}
                style={{
                  backgroundColor: status.color,
                  color: 'white',
                  '--tw-ring-color': status.color,
                  opacity: isUpdating ? 0.5 : isCurrentStatus ? 1 : 0.5,
                }}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate w-full text-center leading-tight">{status.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
