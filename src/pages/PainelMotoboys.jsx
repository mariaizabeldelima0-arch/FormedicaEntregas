import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { theme } from '@/lib/theme';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CustomDropdown } from '@/components/CustomDropdown';
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
  ChevronUp,
  ChevronDown,
  Printer,
  Navigation,
  Wallet,
  AlertCircle,
  AlertTriangle,
  Check,
  X,
  Sun,
  Sunrise,
  Sunset,
  Search,
  Play,
  Truck,
  RotateCcw,
  Pause,
  Map,
  Snowflake,
  FileText,
  Banknote,
  ExternalLink
} from 'lucide-react';

// Função para criar ícone personalizado do marcador
const createCustomIcon = (numero, cor) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${cor};
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${numero}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

// Cache de geocoding para evitar requisições repetidas
const geocodeCache = {};

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
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [coordenadas, setCoordenadas] = useState({});
  const [carregandoMapa, setCarregandoMapa] = useState(false);
  const [statusPagamentoSemana, setStatusPagamentoSemana] = useState('Aguardando');

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

  const abrirRomaneio = (entrega) => {
    navigate(`/detalhes-romaneio?id=${entrega.id}`);
  };

  const motoboyAtual = motoboys.find(m => m.id === motoboyId);

  // Função para geocodificar um endereço
  const geocodificarEndereco = async (endereco) => {
    const query = `${endereco.logradouro}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade}, Brasil`;

    if (geocodeCache[query]) {
      return geocodeCache[query];
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        geocodeCache[query] = coords;
        return coords;
      }
    } catch (error) {
      console.error('Erro ao geocodificar:', error);
    }
    return null;
  };

  // Carregar coordenadas quando mostrar o mapa
  useEffect(() => {
    const carregarCoordenadas = async () => {
      if (!mostrarMapa || entregasFiltradas.length === 0) return;

      setCarregandoMapa(true);
      const novasCoordenadas = { ...coordenadas };

      for (const entrega of entregasFiltradas) {
        if (!entrega.endereco || novasCoordenadas[entrega.id]) continue;

        const coords = await geocodificarEndereco(entrega.endereco);
        if (coords) {
          novasCoordenadas[entrega.id] = coords;
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setCoordenadas(novasCoordenadas);
      setCarregandoMapa(false);
    };

    carregarCoordenadas();
  }, [mostrarMapa, entregasFiltradas.length]);

  // Calcular centro do mapa baseado nas coordenadas
  const centroMapa = useMemo(() => {
    const coords = Object.values(coordenadas);
    if (coords.length === 0) {
      return [-23.5505, -46.6333];
    }

    const latMedia = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
    const lngMedia = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;
    return [latMedia, lngMedia];
  }, [coordenadas]);

  // Entregas ordenadas para o mapa
  const entregasOrdenadas = useMemo(() => {
    return ordenarEntregas(entregasFiltradas);
  }, [entregasFiltradas, ordemEntregas]);

  // Coordenadas para a polyline (rota)
  const rotaCoordenadas = useMemo(() => {
    return entregasOrdenadas
      .filter(e => coordenadas[e.id])
      .map(e => [coordenadas[e.id].lat, coordenadas[e.id].lng]);
  }, [entregasOrdenadas, coordenadas]);

  // Primeiro dia do mês (para posicionar corretamente no calendário)
  const primeiroDiaDoMes = getDay(startOfMonth(mesAtual));

  // Carregar status de pagamento da semana atual (semana: terça a segunda)
  const inicioSemanaAtual = format(startOfWeek(dataSelecionada, { weekStartsOn: 2 }), 'yyyy-MM-dd');

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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-4">
            {/* Seletor de Motoboy */}
            {!isMotoboy && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#890d5d' }}>
                <label className="block text-sm font-semibold text-white mb-2">
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
              <h3 className="font-semibold text-slate-700 mb-3">Resumo do Dia - {format(dataSelecionada, "dd/MM/yyyy")}</h3>

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
                <h3 className="font-semibold text-slate-700">Semana</h3>
                <span className="text-xs text-slate-500">
                  {format(semanaTrabalho[0]?.data || new Date(), 'dd/MM')} - {format(semanaTrabalho[semanaTrabalho.length - 1]?.data || new Date(), 'dd/MM')}
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

              {/* Status de Pagamento da Semana */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Pagamento da Semana</span>
                </div>

                {isAdmin ? (
                  // Admin: mostra botões para alternar
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setStatusPagamentoSemana('Aguardando');
                        salvarPagamentoSemanaMutation.mutate('Aguardando');
                      }}
                      className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: statusPagamentoSemana === 'Aguardando' ? '#f59e0b' : '#fef3c7',
                        color: statusPagamentoSemana === 'Aguardando' ? 'white' : '#92400e',
                        border: statusPagamentoSemana === 'Aguardando' ? '2px solid #f59e0b' : '2px solid #fcd34d'
                      }}
                    >
                      Aguardando
                    </button>
                    <button
                      onClick={() => {
                        setStatusPagamentoSemana('Pago');
                        salvarPagamentoSemanaMutation.mutate('Pago');
                      }}
                      className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all"
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
                  // Motoboy: mostra apenas o status selecionado
                  <div
                    className="py-2 px-4 rounded-lg text-sm font-bold text-center"
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
                <CustomDropdown
                  label="Local"
                  options={[
                    { value: 'todos', label: 'Todos os Locais' },
                    ...cidadesDisponiveis.map(cidade => ({ value: cidade, label: cidade }))
                  ]}
                  value={filtroLocal}
                  onChange={setFiltroLocal}
                  placeholder="Selecione o local"
                />
                <CustomDropdown
                  label="Período"
                  options={[
                    { value: 'todos', label: 'Todos os Períodos' },
                    { value: 'Manhã', label: 'Manhã' },
                    { value: 'Tarde', label: 'Tarde' }
                  ]}
                  value={filtroPeriodo}
                  onChange={setFiltroPeriodo}
                  placeholder="Selecione o período"
                />
              </div>

              {/* Botão Ver Mapa */}
              <button
                onClick={() => setMostrarMapa(!mostrarMapa)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all"
                style={{
                  backgroundColor: mostrarMapa ? '#890d5d' : '#E8F0F8',
                  color: mostrarMapa ? 'white' : '#890d5d'
                }}
              >
                <Map className="w-5 h-5" />
                {mostrarMapa ? 'Ocultar Mapa da Rota' : 'Ver Mapa da Rota'}
              </button>
            </div>

            {/* Mapa da Rota */}
            {mostrarMapa && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Map className="w-5 h-5" style={{ color: '#890d5d' }} />
                  Mapa da Rota - {entregasFiltradas.length} entregas
                </h3>

                {carregandoMapa && (
                  <div className="flex items-center justify-center py-4 text-slate-500 text-sm">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-700 mr-2"></div>
                    Carregando localizações...
                  </div>
                )}

                <div className="rounded-lg overflow-hidden border border-slate-200" style={{ height: '400px' }}>
                  <MapContainer
                    center={centroMapa}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    key={centroMapa.join(',')}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {rotaCoordenadas.length > 1 && (
                      <Polyline
                        positions={rotaCoordenadas}
                        color="#890d5d"
                        weight={3}
                        opacity={0.7}
                        dashArray="10, 10"
                      />
                    )}

                    {entregasOrdenadas.map((entrega, index) => {
                      const coords = coordenadas[entrega.id];
                      if (!coords) return null;

                      const statusInfo = statusOptions.find(s => s.value === normalizarStatus(entrega.status));
                      const cor = statusInfo?.color || '#890d5d';

                      return (
                        <Marker
                          key={entrega.id}
                          position={[coords.lat, coords.lng]}
                          icon={createCustomIcon(index + 1, cor)}
                        >
                          <Popup>
                            <div className="text-sm">
                              <div className="font-bold text-slate-800 mb-1">
                                #{index + 1} - {entrega.cliente?.nome || 'Cliente'}
                              </div>
                              <div className="text-slate-600 text-xs mb-1">
                                REQ #{entrega.requisicao || '0000'}
                              </div>
                              <div className="text-slate-500 text-xs">
                                {entrega.endereco?.logradouro}, {entrega.endereco?.numero}
                              </div>
                              <div className="text-slate-500 text-xs">
                                {entrega.endereco?.bairro} - {entrega.endereco?.cidade}
                              </div>
                              <div className="mt-2 text-xs font-medium" style={{ color: cor }}>
                                {statusInfo?.label || 'Em Rota'}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>

                {/* Legenda */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {statusOptions.map(status => (
                    <div key={status.value} className="flex items-center gap-1 text-xs">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-slate-600">{status.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dica de setas */}
            <div className="flex items-center gap-2 text-sm text-slate-500 px-2">
              <ChevronUp className="w-4 h-4" />
              <ChevronDown className="w-4 h-4" />
              <span>Use as setas para reorganizar a ordem das entregas</span>
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
                    <div className="mb-6">
                      <div className="mb-4">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                          <Sunrise className="w-8 h-8" style={{ color: '#eab308' }} />
                          Entregas da Manhã
                          <span className="text-lg font-semibold px-4 py-1 rounded-full bg-slate-100 text-slate-700">
                            {entregasManha.length}
                          </span>
                        </h2>
                      </div>

                      <div className="space-y-3">
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
                    <div className="mb-6">
                      <div className="mb-4">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                          <Sun className="w-8 h-8" style={{ color: '#f97316' }} />
                          Entregas da Tarde
                          <span className="text-lg font-semibold px-4 py-1 rounded-full bg-slate-100 text-slate-700">
                            {entregasTarde.length}
                          </span>
                        </h2>
                      </div>

                      <div className="space-y-3">
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
                    <div className="mb-6">
                      <div className="mb-4">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                          <Clock className="w-8 h-8" style={{ color: '#64748b' }} />
                          Sem Período Definido
                          <span className="text-lg font-semibold px-4 py-1 rounded-full bg-slate-100 text-slate-700">
                            {entregasSemPeriodo.length}
                          </span>
                        </h2>
                      </div>

                      <div className="space-y-3">
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all hover:shadow-md">
      {/* Card Principal */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Setas de Ordenação */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <button
              onClick={() => onMoverEntrega(entrega.id, 'up')}
              disabled={index === 1}
              className={`p-1 rounded transition-colors ${index === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-slate-500">#{index}</span>
            <button
              onClick={() => onMoverEntrega(entrega.id, 'down')}
              disabled={index === totalEntregas}
              className={`p-1 rounded transition-colors ${index === totalEntregas ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1">
            {/* Linha 1: Requisição + Nome do Cliente + Status */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-base font-semibold" style={{ color: '#376295' }}>
                #{entrega.requisicao || '0000'}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-lg font-bold text-slate-900">
                {entrega.cliente?.nome || 'Cliente'}
              </span>
              <span
                className="px-3 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: statusBadge.color + '20',
                  color: statusBadge.color
                }}
              >
                {statusBadge.label}
              </span>
            </div>

            {/* Linha 2: Atendente */}
            {entrega.atendente && (
              <div className="text-sm text-slate-500 mb-2 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {entrega.atendente}
              </div>
            )}

            {/* Linha 3: Endereço */}
            <div className="mb-3 text-sm text-slate-600">
              <span>
                {entrega.endereco
                  ? `${entrega.endereco.logradouro}, ${entrega.endereco.numero} - ${entrega.endereco.bairro} - ${entrega.endereco.cidade}`
                  : 'Endereço não informado'}
              </span>
              {entrega.endereco?.complemento && (
                <span className="text-slate-500"> (A/C: {entrega.endereco.complemento})</span>
              )}
              {entrega.endereco?.referencia && (
                <p className="text-xs mt-1" style={{ color: '#890d5d' }}>Ref: {entrega.endereco.referencia}</p>
              )}
            </div>

            {/* Linha 4: Informações com ícones */}
            <div className="flex flex-wrap gap-3 text-sm text-slate-900 mb-2">
              {entrega.cliente?.telefone && (
                <a
                  href={`tel:${entrega.cliente.telefone}`}
                  className="flex items-center gap-1.5 hover:text-blue-600"
                >
                  <Phone className="w-4 h-4" style={{ color: '#1e293b' }} />
                  <span>{entrega.cliente.telefone}</span>
                </a>
              )}
              {entrega.forma_pagamento && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Banknote className="w-4 h-4" style={{ color: '#1e293b' }} />
                  <span>{entrega.forma_pagamento}</span>
                </div>
              )}
            </div>

            {/* Destaque para Cobrança (Receber Dinheiro / Receber Máquina) */}
            {temCobranca && valorCobrar > 0 && (
              <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#e8f5e9', border: '2px solid #4caf50' }}>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-5 h-5" style={{ color: '#1b5e20' }} />
                  <span className="font-bold text-sm" style={{ color: '#1b5e20' }}>COBRAR NA ENTREGA:</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: '#1b5e20' }}>
                  R$ {valorCobrar.toFixed(2)}
                </div>
                {temTroco && (
                  <div className="mt-2 flex items-center gap-2 p-2 rounded" style={{ backgroundColor: '#fff3e0', border: '1px solid #ff9800' }}>
                    <AlertTriangle className="w-4 h-4" style={{ color: '#e65100' }} />
                    <span className="font-bold text-sm" style={{ color: '#e65100' }}>
                      LEVAR TROCO: R$ {parseFloat(entrega.valor_troco).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Observações */}
            {(entrega.observacao || entrega.observacoes) && (
              <div className="mt-3 text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold not-italic">Obs:</span> {entrega.observacao || entrega.observacoes}
              </div>
            )}
          </div>

          {/* Lado Direito - Badges + Valor + Região */}
          <div className="flex flex-col items-end gap-3">
            {/* Badges Geladeira e Reter Receita */}
            {(entrega.item_geladeira || entrega.buscar_receita || entrega.reter_receita) && (
              <div className="flex flex-col gap-2">
                {entrega.item_geladeira && (
                  <span className="px-3 py-2 rounded text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: '#cffafe', color: '#0c4a6e', border: '2px solid #06b6d4' }}>
                    <Snowflake className="w-5 h-5" />
                    Geladeira
                  </span>
                )}
                {(entrega.buscar_receita || entrega.reter_receita) && (
                  <span className="px-3 py-2 rounded text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '2px solid #f59e0b' }}>
                    <FileText className="w-5 h-5" />
                    Reter Receita
                  </span>
                )}
              </div>
            )}

            {/* Valor e Região */}
            <div className="text-right">
              <div className="text-xl font-bold" style={{ color: '#376295' }}>
                R$ {(parseFloat(entrega.valor) || 0).toFixed(2)}
              </div>
              <div className="text-sm font-medium" style={{ color: '#376295' }}>
                {entrega.regiao || entrega.endereco?.cidade}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => onAbrirMapa(entrega.endereco)}
            className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Abrir no Mapa
          </button>
          <button
            onClick={() => onVerDetalhes(entrega)}
            className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver Romaneio
          </button>
        </div>

        {/* Botões de Status */}
        <div className="grid grid-cols-5 gap-2">
          {statusOptions?.map((status) => {
            const Icon = status.icon;
            const isCurrentStatus = statusNormalizado === status.value;
            return (
              <button
                key={status.value}
                onClick={() => !isCurrentStatus && onStatusChange(entrega.id, status.value)}
                disabled={isUpdating}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all text-xs font-semibold ${
                  isCurrentStatus
                    ? 'ring-4 ring-offset-2 shadow-lg scale-105'
                    : 'hover:scale-105 hover:shadow-md'
                }`}
                style={{
                  backgroundColor: status.color,
                  color: 'white',
                  '--tw-ring-color': status.color,
                  opacity: isUpdating ? 0.5 : isCurrentStatus ? 1 : 0.5,
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
