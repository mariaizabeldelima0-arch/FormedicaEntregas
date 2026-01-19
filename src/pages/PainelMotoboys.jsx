import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { theme } from '@/lib/theme';
import {
  Package,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  DollarSign,
  TrendingUp,
  User,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Printer,
  Navigation,
  Wallet,
  AlertCircle,
  Check,
  X,
  GripVertical,
  Sun,
  Sunset,
  Search,
  Play,
  Truck,
  RotateCcw,
  Pause
} from 'lucide-react';

export default function PainelMotoboys() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, userType } = useAuth();
  const [motoboyId, setMotoboyId] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [mesAtual, setMesAtual] = useState(new Date());
  const [filtroLocal, setFiltroLocal] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [ordemEntregas, setOrdemEntregas] = useState({});

  // Definição dos status disponíveis (Em Rota é o padrão)
  const statusOptions = [
    { value: 'Em Rota', label: 'Em Rota', icon: Truck, bg: 'bg-blue-100', text: 'text-blue-700', color: '#2563eb' },
    { value: 'Iniciar', label: 'Iniciar', icon: Play, bg: 'bg-purple-100', text: 'text-purple-700', color: '#9333ea' },
    { value: 'Entregue', label: 'Entregue', icon: Check, bg: 'bg-green-100', text: 'text-green-700', color: '#16a34a' },
    { value: 'Pendente', label: 'Pendente', icon: Pause, bg: 'bg-yellow-100', text: 'text-yellow-700', color: '#f59e0b' },
    { value: 'Voltou p/ Farmácia', label: 'Voltou', icon: RotateCcw, bg: 'bg-red-100', text: 'text-red-700', color: '#dc2626' },
  ];
  const STATUS_PADRAO = 'Em Rota';

  // Função para normalizar status antigos para os novos
  const normalizarStatus = (status) => {
    if (!status) return STATUS_PADRAO;
    // Mapear status antigos
    const mapeamento = {
      'A Caminho': 'Em Rota',
      'Não Entregue': 'Voltou p/ Farmácia',
    };
    return mapeamento[status] || status;
  };

  const [draggedItem, setDraggedItem] = useState(null);

  const isMotoboy = userType === 'motoboy';
  const nomeMotoboyUsuario = user?.nome_motoboy;

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
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(id, nome, telefone),
          endereco:enderecos(id, logradouro, numero, bairro, cidade, complemento),
          motoboy:motoboys(id, nome)
        `)
        .eq('tipo', 'moto')
        .order('data_entrega', { ascending: true });

      if (error) throw error;
      return data || [];
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

  // Aplicar filtros
  const entregasFiltradas = entregasDoDia.filter(entrega => {
    if (filtroLocal !== 'todos' && entrega.endereco?.cidade !== filtroLocal) return false;
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

  // Agrupar por cidade
  const entregasPorCidade = entregasFiltradas.reduce((acc, entrega) => {
    const cidade = entrega.endereco?.cidade || 'Sem cidade';
    if (!acc[cidade]) acc[cidade] = [];
    acc[cidade].push(entrega);
    return acc;
  }, {});

  // Lista de cidades disponíveis
  const cidadesDisponiveis = [...new Set(entregasDoDia.map(e => e.endereco?.cidade).filter(Boolean))];

  // Contagem de entregas por status
  const contagemPorStatus = statusOptions.map(status => ({
    ...status,
    quantidade: entregasDoDia.filter(e => normalizarStatus(e.status) === status.value).length
  }));

  // Resumo do dia por cidade
  const resumoDia = cidadesDisponiveis.map(cidade => {
    const entregasCidade = entregasDoDia.filter(e => e.endereco?.cidade === cidade);
    return {
      cidade,
      quantidade: entregasCidade.length,
      valor: entregasCidade.reduce((sum, e) => sum + (parseFloat(e.valor) || 0), 0),
      taxa: entregasCidade.reduce((sum, e) => sum + (parseFloat(e.taxa) || 0), 0)
    };
  });

  const totalValorDia = resumoDia.reduce((sum, r) => sum + r.valor, 0);
  const totalTaxaDia = resumoDia.reduce((sum, r) => sum + r.taxa, 0);

  // Calcular semana de trabalho
  const calcularSemanaTrabalho = () => {
    const inicioSemana = startOfWeek(dataSelecionada, { weekStartsOn: 0 });
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const data = addDays(inicioSemana, i);
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
      queryClient.invalidateQueries({ queryKey: ['entregas-motoboy'] });
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
      queryClient.invalidateQueries({ queryKey: ['entregas-motoboy'] });
      toast.success('Ordem salva!');
    },
    onError: (error) => {
      console.error('Erro ao salvar ordem:', error);
      toast.error('Erro ao salvar ordem. O campo pode não existir no banco.');
    }
  });

  // Funções de Drag and Drop
  const handleDragStart = (e, entrega, cidade) => {
    setDraggedItem({ entrega, cidade });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetEntrega, targetCidade) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.entrega.id === targetEntrega.id) return;

    // Só permite reorganizar dentro da mesma cidade
    if (draggedItem.cidade !== targetCidade) {
      toast.error('Só é possível reorganizar entregas da mesma cidade');
      return;
    }

    const cidade = targetCidade;
    const entregasDaCidade = entregasFiltradas
      .filter(e => (e.endereco?.cidade || 'Sem cidade') === cidade)
      .sort((a, b) => (ordemEntregas[a.id] ?? a.ordem_entrega ?? 999) - (ordemEntregas[b.id] ?? b.ordem_entrega ?? 999));

    const dragIndex = entregasDaCidade.findIndex(e => e.id === draggedItem.entrega.id);
    const dropIndex = entregasDaCidade.findIndex(e => e.id === targetEntrega.id);

    if (dragIndex === -1 || dropIndex === -1) return;

    // Reordenar
    const novaOrdem = [...entregasDaCidade];
    const [removed] = novaOrdem.splice(dragIndex, 1);
    novaOrdem.splice(dropIndex, 0, removed);

    // Atualizar estado de ordem
    const novaOrdemObj = { ...ordemEntregas };
    novaOrdem.forEach((entrega, index) => {
      novaOrdemObj[entrega.id] = index;
    });

    setOrdemEntregas(novaOrdemObj);
    setDraggedItem(null);

    // Salvar automaticamente
    salvarOrdemMutation.mutate(novaOrdemObj);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
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

  const motoboyAtual = motoboys.find(m => m.id === motoboyId);

  // Primeiro dia do mês (para posicionar corretamente no calendário)
  const primeiroDiaDoMes = getDay(startOfMonth(mesAtual));

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <div className="py-8 shadow-sm" style={{
        background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isMotoboy && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
              )}
              <div>
                <h1 className="text-4xl font-bold text-white">
                  {isMotoboy ? 'Minhas Entregas' : 'Painel do Motoboy'}
                </h1>
                <p className="text-base text-white opacity-90 mt-1">
                  Olá, {nomeMotoboyUsuario || user?.nome || 'Motoboy'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isMotoboy && (
                <select
                  value={motoboyId || ''}
                  onChange={(e) => setMotoboyId(e.target.value)}
                  className="border border-white/30 bg-white/20 text-white rounded-lg px-3 py-2 text-sm"
                >
                  {motoboys.map(m => (
                    <option key={m.id} value={m.id} className="text-slate-800">{m.nome}</option>
                  ))}
                </select>
              )}
              <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium text-white transition-colors">
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-4">
            {/* Calendário */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              {/* Navegação do mês */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setMesAtual(subMonths(mesAtual, 1))}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <span className="text-sm font-medium text-slate-700">
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
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map(dia => (
                  <div key={dia} className="text-center text-xs font-medium text-slate-500 py-1">
                    {dia}
                  </div>
                ))}
              </div>

              {/* Dias do mês */}
              <div className="grid grid-cols-7 gap-1">
                {/* Espaços vazios antes do primeiro dia */}
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
                      className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all relative
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
              <div className="mt-4 pt-4 border-t border-slate-200 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {format(dataSelecionada, "d 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-xs text-slate-500">
                  {entregasDoDia.length} entrega{entregasDoDia.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Resumo do Dia */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-3">Resumo do Dia</h3>

              {/* Cabeçalho */}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2 pb-2 border-b border-slate-100">
                <span>Local</span>
                <div className="flex items-center gap-4">
                  <span className="w-8 text-center">Qtd</span>
                  <span className="w-20 text-right">Valor</span>
                </div>
              </div>

              <div className="space-y-2">
                {resumoDia.map(item => (
                  <div key={item.cidade} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.cidade}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500 w-8 text-center">{item.quantidade}x</span>
                      <span className="font-medium w-20 text-right" style={{ color: theme.colors.primary }}>R$ {item.valor.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">TOTAL ENTREGAS</span>
                  <span className="font-bold text-lg" style={{ color: theme.colors.primary }}>R$ {totalValorDia.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Semana */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700">Semana - Aguardando</h3>
                <span className="text-xs text-slate-500">
                  {format(semanaTrabalho[0]?.data || new Date(), 'dd/MM')} - {format(semanaTrabalho[6]?.data || new Date(), 'dd/MM')}
                </span>
              </div>

              <div className="space-y-1">
                {semanaTrabalho.map(dia => (
                  <div
                    key={dia.dataStr}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded"
                    style={{
                      backgroundColor: isSameDay(dia.data, dataSelecionada) ? '#e8f0f8' : 'transparent'
                    }}
                  >
                    <span className="text-slate-600 capitalize w-20">{dia.nome.slice(0, 3)}</span>
                    <span className="text-slate-500">{format(dia.data, 'dd/MM')}</span>
                    <span className="text-slate-500">{dia.quantidade}x</span>
                    <span className={`font-semibold ${dia.valor > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                      R$ {dia.valor.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">TOTAL</span>
                <span className="font-bold text-green-600">R$ {totalSemana.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Entregas */}
          <div className="lg:col-span-2 space-y-4">
            {/* Cards de Filtro por Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {/* Card Todas */}
              <div
                onClick={() => setFiltroStatus('todos')}
                className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
                style={{
                  border: filtroStatus === 'todos' ? `2px solid ${theme.colors.primary}` : '2px solid transparent'
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#E8F0F8' }}>
                    <Package className="w-6 h-6" style={{ color: theme.colors.primary }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Todas</span>
                </div>
                <div className="text-4xl font-bold text-center" style={{ color: theme.colors.primary }}>
                  {entregasDoDia.length}
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
                    className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
                    style={{
                      border: isActive ? `2px solid ${status.color}` : '2px solid transparent'
                    }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: bgColor }}>
                        <Icon className="w-6 h-6" style={{ color: status.color }} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{status.label}</span>
                    </div>
                    <div className="text-4xl font-bold text-center" style={{ color: status.color }}>
                      {status.quantidade}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-3">Filtros</h3>

              {/* Campo de Busca */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-500 mb-1">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nome, endereço, requisição..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {termoBusca && (
                    <button
                      onClick={() => setTermoBusca('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Local</label>
                  <select
                    value={filtroLocal}
                    onChange={(e) => setFiltroLocal(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="todos">Todos os Locais</option>
                    {cidadesDisponiveis.map(cidade => (
                      <option key={cidade} value={cidade}>{cidade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Período</label>
                  <select
                    value={filtroPeriodo}
                    onChange={(e) => setFiltroPeriodo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="todos">Todos os Períodos</option>
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dica de arrastar */}
            <div className="flex items-center gap-2 text-sm text-slate-500 px-2">
              <GripVertical className="w-4 h-4" />
              <span>Arraste as entregas para reorganizar sua rota</span>
            </div>

            {/* Lista de Entregas */}
            {entregasFiltradas.length > 0 ? (
              <>
                {/* Entregas da Manhã */}
                {(() => {
                  const entregasManha = entregasFiltradas.filter(e => e.periodo === 'Manhã');
                  if (entregasManha.length === 0) return null;

                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-2 text-slate-800 px-4 py-2 rounded-lg font-semibold text-sm" style={{ backgroundColor: '#facc15' }}>
                          <Sun className="w-4 h-4" />
                          MANHÃ ({entregasManha.length})
                        </div>
                      </div>

                      <div className="space-y-3">
                        {ordenarEntregas(entregasManha).map((entrega, index) => (
                          <EntregaCard
                            key={entrega.id}
                            entrega={entrega}
                            index={index + 1}
                            cidade={entrega.endereco?.cidade || 'Sem cidade'}
                            onStatusChange={handleStatusChange}
                            isUpdating={updateStatusMutation.isPending}
                            onAbrirMapa={abrirMapa}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            isDragging={draggedItem?.entrega.id === entrega.id}
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

                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-2 text-white px-4 py-2 rounded-lg font-semibold text-sm" style={{ backgroundColor: '#f97316' }}>
                          <Sunset className="w-4 h-4" />
                          TARDE ({entregasTarde.length})
                        </div>
                      </div>

                      <div className="space-y-3">
                        {ordenarEntregas(entregasTarde).map((entrega, index) => (
                          <EntregaCard
                            key={entrega.id}
                            entrega={entrega}
                            index={index + 1}
                            cidade={entrega.endereco?.cidade || 'Sem cidade'}
                            onStatusChange={handleStatusChange}
                            isUpdating={updateStatusMutation.isPending}
                            onAbrirMapa={abrirMapa}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            isDragging={draggedItem?.entrega.id === entrega.id}
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

                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-2 text-white px-4 py-2 rounded-lg font-semibold text-sm bg-slate-500">
                          SEM PERÍODO ({entregasSemPeriodo.length})
                        </div>
                      </div>

                      <div className="space-y-3">
                        {ordenarEntregas(entregasSemPeriodo).map((entrega, index) => (
                          <EntregaCard
                            key={entrega.id}
                            entrega={entrega}
                            index={index + 1}
                            cidade={entrega.endereco?.cidade || 'Sem cidade'}
                            onStatusChange={handleStatusChange}
                            isUpdating={updateStatusMutation.isPending}
                            onAbrirMapa={abrirMapa}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            isDragging={draggedItem?.entrega.id === entrega.id}
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
    </div>
  );
}

// Componente de Card de Entrega
function EntregaCard({
  entrega,
  index,
  cidade,
  onStatusChange,
  isUpdating,
  onAbrirMapa,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  statusOptions,
  normalizarStatus
}) {
  const getStatusBadge = (status) => {
    const option = statusOptions?.find(s => s.value === status);
    if (option) {
      return { bg: option.bg, text: option.text, label: option.label, color: option.color };
    }
    // Fallback para status antigos ou não definidos
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
  const temCobranca = entrega.forma_pagamento === 'Dinheiro' || entrega.forma_pagamento === 'Cartão' || entrega.forma_pagamento === 'Pix';
  const valorCobrar = parseFloat(entrega.valor) || 0;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden transition-all ${isDragging ? 'opacity-50 scale-95' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, entrega, cidade)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, entrega, cidade)}
      onDragEnd={onDragEnd}
    >
      {/* Header do Card */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-slate-400 cursor-grab active:cursor-grabbing" />
          <span className="text-sm font-medium text-slate-500">#{index}</span>
          <span className="font-bold text-slate-800">REQ #{entrega.requisicao || '0000'}</span>

          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
            {statusBadge.label}
          </span>

          {temCobranca && valorCobrar > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> COBRAR
            </span>
          )}

          {entrega.taxa && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> R$ {parseFloat(entrega.taxa).toFixed(2)}
            </span>
          )}
        </div>

        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
          {entrega.periodo || 'Sem período'}
        </span>
      </div>

      {/* Nome do Cliente */}
      <div className="px-4 py-2 border-b border-slate-100">
        <span className="text-sm font-medium" style={{ color: theme.colors.primary }}>
          {entrega.cliente?.nome || 'Cliente'}
        </span>
      </div>

      {/* Valor a Cobrar */}
      {temCobranca && valorCobrar > 0 && (
        <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
          <div className="flex items-center gap-2 text-yellow-700 text-xs font-semibold mb-1">
            <Wallet className="w-3 h-3" /> COBRAR NA ENTREGA:
          </div>
          <div className="text-2xl font-bold text-yellow-700">
            R$ {valorCobrar.toFixed(2)}
          </div>
        </div>
      )}

      {/* Endereço */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-slate-800 font-medium">
              {entrega.endereco?.logradouro}, {entrega.endereco?.numero}
            </p>
            <p className="text-slate-600">
              {entrega.endereco?.bairro} - {entrega.endereco?.cidade}
            </p>
            {entrega.endereco?.referencia && (
              <p className="text-xs" style={{ color: theme.colors.secondary }}>Ref: {entrega.endereco.referencia}</p>
            )}
            {entrega.endereco?.complemento && (
              <p className="text-slate-500 text-xs">A/C: {entrega.endereco.complemento}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => onAbrirMapa(entrega.endereco)}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Navigation className="w-4 h-4" />
          Abrir no Mapa
        </button>
      </div>

      {/* Forma de Pagamento e Telefone */}
      <div className="px-4 py-3 border-b border-slate-100 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Wallet className="w-4 h-4 text-slate-400" />
          <span className="text-slate-700">{entrega.forma_pagamento || 'Não informado'}</span>
        </div>

        {entrega.cliente?.telefone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-slate-400" />
            <a
              href={`tel:${entrega.cliente.telefone}`}
              className="text-slate-700 hover:text-blue-600"
            >
              {entrega.cliente.telefone}
            </a>
          </div>
        )}
      </div>

      {/* Botões de Ação - Todos os Status */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-5 gap-1.5">
          {statusOptions?.map((status) => {
            const Icon = status.icon;
            const isCurrentStatus = statusNormalizado === status.value;
            return (
              <button
                key={status.value}
                onClick={() => !isCurrentStatus && onStatusChange(entrega.id, status.value)}
                disabled={isUpdating || isCurrentStatus}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all text-xs font-semibold ${
                  isCurrentStatus
                    ? 'ring-2 ring-offset-1'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: status.color,
                  color: 'white',
                  ringColor: isCurrentStatus ? status.color : undefined,
                  opacity: isUpdating ? 0.5 : isCurrentStatus ? 1 : 0.7,
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate w-full text-center">{status.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
