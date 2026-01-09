import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay, startOfWeek, endOfWeek, addDays, subDays, addWeeks, subWeeks, eachDayOfInterval, getDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
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
  ChevronRight
} from 'lucide-react';

export default function PainelMotoboys() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [motoboyId, setMotoboyId] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [modoVisualizacao, setModoVisualizacao] = useState('dia'); // 'dia' ou 'semana'
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'entregues', 'a_caminho', 'pendentes'

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

  // Selecionar primeiro motoboy automaticamente
  useEffect(() => {
    if (motoboys.length > 0 && !motoboyId) {
      setMotoboyId(motoboys[0].id);
    }
  }, [motoboys, motoboyId]);

  // Calcular período de busca
  const getPeriodoDeBusca = () => {
    if (modoVisualizacao === 'dia') {
      return {
        inicio: format(dataSelecionada, 'yyyy-MM-dd'),
        fim: format(dataSelecionada, 'yyyy-MM-dd')
      };
    } else {
      // Semana: domingo a sábado
      const inicioSemana = startOfWeek(dataSelecionada, { weekStartsOn: 0 });
      const fimSemana = endOfWeek(dataSelecionada, { weekStartsOn: 0 });
      return {
        inicio: format(inicioSemana, 'yyyy-MM-dd'),
        fim: format(fimSemana, 'yyyy-MM-dd')
      };
    }
  };

  // Buscar entregas do motoboy
  const { data: todasEntregas = [], isLoading } = useQuery({
    queryKey: ['entregas-motoboy', motoboyId],
    queryFn: async () => {
      if (!motoboyId) {
        console.log('Nenhum motoboy selecionado');
        return [];
      }

      try {
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

        if (error) {
          console.error('Erro Supabase:', error);
          throw error;
        }

        // Filtrar por motoboy no cliente
        const entregasDoMotoboy = data?.filter(e => e.motoboy_id === motoboyId) || [];
        return entregasDoMotoboy;
      } catch (error) {
        console.error('Erro ao carregar entregas:', error);
        toast.error('Erro ao carregar entregas');
        return [];
      }
    },
    enabled: !!motoboyId,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  // Filtrar entregas por data no cliente
  const entregasFiltradas = todasEntregas.filter(entrega => {
    if (!entrega.data_entrega) return false;

    const entregaDate = new Date(entrega.data_entrega + 'T00:00:00');

    if (modoVisualizacao === 'dia') {
      // Comparar apenas a data usando isSameDay
      return isSameDay(entregaDate, dataSelecionada);
    } else {
      // Semana: verificar se está entre início e fim da semana
      const inicioSemana = startOfWeek(dataSelecionada, { weekStartsOn: 0 });
      const fimSemana = endOfWeek(dataSelecionada, { weekStartsOn: 0 });
      return entregaDate >= inicioSemana && entregaDate <= fimSemana;
    }
  });

  // Aplicar filtro de status
  const entregas = entregasFiltradas.filter(entrega => {
    if (filtroStatus === 'todos') return true;
    if (filtroStatus === 'entregues') return entrega.status === 'Entregue';
    if (filtroStatus === 'a_caminho') return entrega.status === 'A Caminho';
    if (filtroStatus === 'pendentes') return entrega.status === 'Pendente' || entrega.status === 'Preparando' || entrega.status === 'Produzindo no Laboratório';
    return true;
  });

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

  // Calcular estatísticas (usar entregasFiltradas para os números, mas entregas para exibir)
  const statsTotal = {
    total: entregasFiltradas.length,
    entregues: entregasFiltradas.filter(e => e.status === 'Entregue').length,
    aCaminho: entregasFiltradas.filter(e => e.status === 'A Caminho').length,
    pendentes: entregasFiltradas.filter(e => e.status === 'Pendente' || e.status === 'Preparando' || e.status === 'Produzindo no Laboratório').length,
  };

  const stats = {
    total: entregas.length,
    entregues: entregas.filter(e => e.status === 'Entregue').length,
    aCaminho: entregas.filter(e => e.status === 'A Caminho').length,
    pendentes: entregas.filter(e => e.status === 'Pendente' || e.status === 'Preparando' || e.status === 'Produzindo no Laboratório').length,
    valorTotal: entregas.reduce((sum, e) => sum + (parseFloat(e.valor) || 0), 0),
    taxaTotal: entregas.reduce((sum, e) => sum + (parseFloat(e.taxa) || 0), 0),
  };

  // Agrupar entregas por período
  const entregasPorPeriodo = {
    manha: entregas.filter(e => e.periodo === 'Manhã'),
    tarde: entregas.filter(e => e.periodo === 'Tarde'),
  };

  // Calcular semana de trabalho (Terça a Segunda, sem Domingo)
  const calcularSemanaTrabalho = () => {
    const dataReferencia = dataSelecionada; // Usar data selecionada ao invés de hoje
    const diaDaSemana = getDay(dataReferencia); // 0=Domingo, 1=Segunda, 2=Terça...

    // Encontrar a terça-feira da semana de trabalho
    let inicioSemanaTrabalho;
    if (diaDaSemana === 0) { // Domingo - pega terça anterior
      inicioSemanaTrabalho = subDays(dataReferencia, 5);
    } else if (diaDaSemana === 1) { // Segunda - pega terça anterior
      inicioSemanaTrabalho = subDays(dataReferencia, 6);
    } else { // Terça a Sábado - pega a terça desta semana
      inicioSemanaTrabalho = subDays(dataReferencia, diaDaSemana - 2);
    }

    // Dias da semana: Terça, Quarta, Quinta, Sexta, Sábado, Segunda (sem Domingo)
    const diasDaSemana = [
      { nome: 'Terça-feira', offset: 0 },
      { nome: 'Quarta-feira', offset: 1 },
      { nome: 'Quinta-feira', offset: 2 },
      { nome: 'Sexta-feira', offset: 3 },
      { nome: 'Sábado', offset: 4 },
      { nome: 'Segunda-feira', offset: 6 }, // Pula domingo
    ];

    return diasDaSemana.map(dia => {
      const data = addDays(inicioSemanaTrabalho, dia.offset);
      const dataStr = format(data, 'yyyy-MM-dd');
      const hoje = new Date(); // Data real de hoje

      // Filtrar entregas deste dia para o motoboy atual
      const entregasDoDia = todasEntregas.filter(e => {
        if (e.motoboy_id !== motoboyId) return false;
        if (!e.data_entrega) return false;
        return e.data_entrega === dataStr;
      });

      const taxaDia = entregasDoDia.reduce((sum, e) => sum + (parseFloat(e.taxa) || 0), 0);
      const entreguesDia = entregasDoDia.filter(e => e.status === 'Entregue').length;

      return {
        nome: dia.nome,
        data,
        dataStr,
        entregas: entregasDoDia.length,
        entregues: entreguesDia,
        taxa: taxaDia,
        isHoje: isSameDay(data, hoje), // Comparar com hoje real
      };
    });
  };

  const semanaTrabalho = calcularSemanaTrabalho();
  const totalSemanal = semanaTrabalho.reduce((sum, dia) => sum + dia.taxa, 0);

  // Calcular intervalo de datas da semana de trabalho
  const intervaloSemanaTrabalho = semanaTrabalho.length > 0
    ? `${format(semanaTrabalho[0].data, 'dd/MM')} a ${format(semanaTrabalho[semanaTrabalho.length - 1].data, 'dd/MM/yyyy')}`
    : '';

  const handleStatusChange = (id, newStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleCardClick = (entrega) => {
    // Navegar para página de detalhes passando o ID da entrega
    navigate(`/detalhes-romaneio?id=${entrega.id}`);
  };

  const motoboyAtual = motoboys.find(m => m.id === motoboyId);

  // Navegação de datas
  const handleDiaAnterior = () => {
    setDataSelecionada(prev => subDays(prev, 1));
  };

  const handleProximoDia = () => {
    setDataSelecionada(prev => addDays(prev, 1));
  };

  const handleSemanaAnterior = () => {
    setDataSelecionada(prev => subWeeks(prev, 1));
  };

  const handleProximaSemana = () => {
    setDataSelecionada(prev => addWeeks(prev, 1));
  };

  const handleHoje = () => {
    setDataSelecionada(new Date());
  };

  // Formatar período de exibição
  const getPeriodoTexto = () => {
    if (modoVisualizacao === 'dia') {
      return format(dataSelecionada, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } else {
      const inicioSemana = startOfWeek(dataSelecionada, { weekStartsOn: 0 });
      const fimSemana = endOfWeek(dataSelecionada, { weekStartsOn: 0 });
      return `${format(inicioSemana, 'dd/MM', { locale: ptBR })} a ${format(fimSemana, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
  };

  // Agrupar entregas por data (para visualização semanal)
  const entregasPorData = entregas.reduce((acc, entrega) => {
    const data = entrega.data_entrega;
    if (!acc[data]) {
      acc[data] = [];
    }
    acc[data].push(entrega);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="py-8 shadow-sm" style={{
        background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">Painel do Motoboy</h1>
              <p className="text-base text-white opacity-90">Gerencie suas entregas</p>
            </div>
          </div>

          {/* Seletor de Motoboy */}
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-white opacity-90" />
            <select
              value={motoboyId || ''}
              onChange={(e) => setMotoboyId(e.target.value)}
              className="flex-1 max-w-xs bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg px-4 py-2 text-white font-medium focus:outline-none focus:border-white/50"
            >
              {motoboys.map(m => (
                <option key={m.id} value={m.id} className="text-slate-900">
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Controles de Data */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Modo de Visualização */}
              <div className="flex gap-2">
                <button
                  onClick={() => setModoVisualizacao('dia')}
                  className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: modoVisualizacao === 'dia' ? 'white' : 'rgba(255, 255, 255, 0.2)',
                    color: modoVisualizacao === 'dia' ? '#376295' : 'white'
                  }}
                >
                  Dia
                </button>
                <button
                  onClick={() => setModoVisualizacao('semana')}
                  className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: modoVisualizacao === 'semana' ? 'white' : 'rgba(255, 255, 255, 0.2)',
                    color: modoVisualizacao === 'semana' ? '#376295' : 'white'
                  }}
                >
                  Semana
                </button>
              </div>

              {/* Navegação de Data */}
              <div className="flex items-center gap-3">
                <button
                  onClick={modoVisualizacao === 'dia' ? handleDiaAnterior : handleSemanaAnterior}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg min-w-[200px] justify-center">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="font-semibold text-sm">
                    {getPeriodoTexto()}
                  </span>
                </div>

                <button
                  onClick={modoVisualizacao === 'dia' ? handleProximoDia : handleProximaSemana}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button
                  onClick={handleHoje}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                >
                  Hoje
                </button>
              </div>

              {/* Seletor de Data */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={format(dataSelecionada, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    // Corrigir problema de timezone
                    const [year, month, day] = e.target.value.split('-');
                    const novaData = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    setDataSelecionada(novaData);
                  }}
                  className="bg-white/20 border-2 border-white/30 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-white/50 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setFiltroStatus('todos');
            }}
            className="rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md bg-white"
            style={{
              border: filtroStatus === 'todos' ? '2px solid #376295' : '2px solid transparent'
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F0F8' }}>
                <Package className="w-6 h-6" style={{ color: '#376295' }} />
              </div>
              <span className="text-sm font-bold text-slate-700">Total</span>
            </div>
            <div className="text-4xl font-bold text-center" style={{ color: '#376295' }}>{statsTotal.total}</div>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              setFiltroStatus('entregues');
            }}
            className="rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md bg-white"
            style={{
              border: filtroStatus === 'entregues' ? '2px solid #22c55e' : '2px solid transparent'
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F5E8' }}>
                <CheckCircle className="w-6 h-6" style={{ color: '#22c55e' }} />
              </div>
              <span className="text-sm font-bold text-slate-700">Entregues</span>
            </div>
            <div className="text-4xl font-bold text-center" style={{ color: '#22c55e' }}>{statsTotal.entregues}</div>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              setFiltroStatus('a_caminho');
            }}
            className="rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md bg-white"
            style={{
              border: filtroStatus === 'a_caminho' ? '2px solid #f97316' : '2px solid transparent'
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#FEF3E8' }}>
                <Clock className="w-6 h-6" style={{ color: '#f97316' }} />
              </div>
              <span className="text-sm font-bold text-slate-700">A Caminho</span>
            </div>
            <div className="text-4xl font-bold text-center" style={{ color: '#f97316' }}>{statsTotal.aCaminho}</div>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              setFiltroStatus('pendentes');
            }}
            className="rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md bg-white"
            style={{
              border: filtroStatus === 'pendentes' ? '2px solid #890d5d' : '2px solid transparent'
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#F5E8F5' }}>
                <Package className="w-6 h-6" style={{ color: '#890d5d' }} />
              </div>
              <span className="text-sm font-bold text-slate-700">Pendentes</span>
            </div>
            <div className="text-4xl font-bold text-center" style={{ color: '#890d5d' }}>{statsTotal.pendentes}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border-2 border-transparent">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F0F8' }}>
                <DollarSign className="w-6 h-6" style={{ color: '#376295' }} />
              </div>
              <span className="text-sm font-bold text-slate-700">Valor Total</span>
            </div>
            <div className="text-4xl font-bold text-center" style={{ color: '#376295' }}>
              R$ {stats.valorTotal.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border-2 border-transparent">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F5E8' }}>
                <TrendingUp className="w-6 h-6" style={{ color: '#22c55e' }} />
              </div>
              <span className="text-sm font-bold text-slate-700">Ganhos</span>
            </div>
            <div className="text-4xl font-bold text-center" style={{ color: '#22c55e' }}>
              R$ {stats.taxaTotal.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-slate-700">Progresso do Dia</div>
            <div className="text-sm font-bold" style={{ color: '#376295' }}>
              {stats.total > 0 ? Math.round((stats.entregues / stats.total) * 100) : 0}%
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)',
                width: `${stats.total > 0 ? (stats.entregues / stats.total) * 100 : 0}%`
              }}
            />
          </div>
        </div>

        {/* Tabela de Ganhos Semanais */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: '#22c55e' }}>
            <h2 className="text-sm font-bold text-white">Ganhos da Semana</h2>
            <div className="text-right">
              <span className="text-base font-bold text-white">R$ {totalSemanal.toFixed(2)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Dia</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Data</th>
                  <th className="px-2 py-1.5 text-center font-semibold text-slate-600">Entregues</th>
                  <th className="px-2 py-1.5 text-right font-semibold text-slate-600">Ganhos</th>
                </tr>
              </thead>
              <tbody>
                {semanaTrabalho.map((dia, index) => (
                  <tr
                    key={dia.dataStr}
                    className="border-b border-slate-100 hover:bg-slate-50"
                    style={{
                      backgroundColor: dia.isHoje ? '#E8F0F8' : 'white'
                    }}
                  >
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-900" style={{ color: dia.isHoje ? '#376295' : undefined }}>
                          {dia.nome}
                        </span>
                        {dia.isHoje && (
                          <span className="text-white text-[10px] px-1 py-0.5 rounded font-semibold" style={{ backgroundColor: '#376295' }}>
                            HOJE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-slate-600">
                      {format(dia.data, "dd/MM/yy", { locale: ptBR })}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={`font-semibold ${dia.entregues > 0 ? '' : 'text-slate-400'}`} style={{ color: dia.entregues > 0 ? '#22c55e' : undefined }}>
                        {dia.entregues}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <span className={`font-bold ${dia.taxa > 0 ? '' : 'text-slate-400'}`} style={{ color: dia.taxa > 0 ? '#22c55e' : undefined }}>
                        R$ {dia.taxa.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lista de Entregas */}
        <div className="space-y-6">
          {/* Visualização por Semana */}
          {modoVisualizacao === 'semana' && Object.keys(entregasPorData).length > 0 && (
            Object.entries(entregasPorData)
              .sort(([dataA], [dataB]) => dataA.localeCompare(dataB))
              .map(([data, entregasDoDia]) => {
                const dataObj = new Date(data + 'T00:00:00');
                const entregasManha = entregasDoDia.filter(e => e.periodo === 'Manhã');
                const entregasTarde = entregasDoDia.filter(e => e.periodo === 'Tarde');

                return (
                  <div key={data} className="space-y-4">
                    {/* Cabeçalho do Dia */}
                    <div className="text-white px-4 py-3 rounded-lg shadow-sm" style={{
                      background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
                    }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="w-5 h-5" />
                          <div>
                            <div className="font-bold text-lg">
                              {format(dataObj, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                            </div>
                            <div className="text-xs opacity-90">
                              {entregasDoDia.length} entrega{entregasDoDia.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs opacity-90">Entregues</div>
                          <div className="text-lg font-bold">
                            {entregasDoDia.filter(e => e.status === 'Entregue').length}/{entregasDoDia.length}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Entregas da Manhã */}
                    {entregasManha.length > 0 && (
                      <div>
                        <div className="text-white px-4 py-2 rounded-lg font-semibold text-sm mb-3" style={{ backgroundColor: '#f97316' }}>
                          ☀️ MANHÃ ({entregasManha.length})
                        </div>
                        <div className="space-y-3">
                          {Object.entries(
                            entregasManha.reduce((acc, e) => {
                              const cidade = e.endereco?.cidade || 'Sem cidade';
                              if (!acc[cidade]) acc[cidade] = [];
                              acc[cidade].push(e);
                              return acc;
                            }, {})
                          ).map(([cidade, entregas]) => (
                            <div key={cidade}>
                              <div className="text-xs font-semibold text-slate-600 mb-2 ml-1">
                                📍 {cidade} - {entregas.length} entrega{entregas.length !== 1 ? 's' : ''}
                              </div>
                              <div className="space-y-2">
                                {entregas.map((entrega) => (
                                  <EntregaCard
                                    key={entrega.id}
                                    entrega={entrega}
                                    onStatusChange={handleStatusChange}
                                    isUpdating={updateStatusMutation.isPending}
                                    onCardClick={handleCardClick}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Entregas da Tarde */}
                    {entregasTarde.length > 0 && (
                      <div>
                        <div className="text-white px-4 py-2 rounded-lg font-semibold text-sm mb-3" style={{ backgroundColor: '#f97316' }}>
                          🌅 TARDE ({entregasTarde.length})
                        </div>
                        <div className="space-y-3">
                          {Object.entries(
                            entregasTarde.reduce((acc, e) => {
                              const cidade = e.endereco?.cidade || 'Sem cidade';
                              if (!acc[cidade]) acc[cidade] = [];
                              acc[cidade].push(e);
                              return acc;
                            }, {})
                          ).map(([cidade, entregas]) => (
                            <div key={cidade}>
                              <div className="text-xs font-semibold text-slate-600 mb-2 ml-1">
                                📍 {cidade} - {entregas.length} entrega{entregas.length !== 1 ? 's' : ''}
                              </div>
                              <div className="space-y-2">
                                {entregas.map((entrega) => (
                                  <EntregaCard
                                    key={entrega.id}
                                    entrega={entrega}
                                    onStatusChange={handleStatusChange}
                                    isUpdating={updateStatusMutation.isPending}
                                    onCardClick={handleCardClick}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          )}

          {/* Visualização por Dia */}
          {modoVisualizacao === 'dia' && (
            <>
              {/* Entregas Manhã */}
              {entregasPorPeriodo.manha.length > 0 && (
                <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-white px-4 py-2 rounded-lg font-semibold text-sm" style={{ backgroundColor: '#f97316' }}>
                  ☀️ MANHÃ ({entregasPorPeriodo.manha.length})
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(
                  entregasPorPeriodo.manha.reduce((acc, e) => {
                    const cidade = e.endereco?.cidade || 'Sem cidade';
                    if (!acc[cidade]) acc[cidade] = [];
                    acc[cidade].push(e);
                    return acc;
                  }, {})
                ).map(([cidade, entregas]) => (
                  <div key={cidade}>
                    <div className="text-xs font-semibold text-slate-600 mb-2 ml-1">
                      📍 {cidade} - {entregas.length} entrega{entregas.length !== 1 ? 's' : ''}
                    </div>
                    <div className="space-y-2">
                      {entregas.map((entrega) => (
                        <EntregaCard
                          key={entrega.id}
                          entrega={entrega}
                          onStatusChange={handleStatusChange}
                          isUpdating={updateStatusMutation.isPending}
                          onCardClick={handleCardClick}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
                </div>
              )}

              {/* Entregas Tarde */}
              {entregasPorPeriodo.tarde.length > 0 && (
                <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-white px-4 py-2 rounded-lg font-semibold text-sm" style={{ backgroundColor: '#f97316' }}>
                  🌅 TARDE ({entregasPorPeriodo.tarde.length})
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(
                  entregasPorPeriodo.tarde.reduce((acc, e) => {
                    const cidade = e.endereco?.cidade || 'Sem cidade';
                    if (!acc[cidade]) acc[cidade] = [];
                    acc[cidade].push(e);
                    return acc;
                  }, {})
                ).map(([cidade, entregas]) => (
                  <div key={cidade}>
                    <div className="text-xs font-semibold text-slate-600 mb-2 ml-1">
                      📍 {cidade} - {entregas.length} entrega{entregas.length !== 1 ? 's' : ''}
                    </div>
                    <div className="space-y-2">
                      {entregas.map((entrega) => (
                        <EntregaCard
                          key={entrega.id}
                          entrega={entrega}
                          onStatusChange={handleStatusChange}
                          isUpdating={updateStatusMutation.isPending}
                          onCardClick={handleCardClick}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
                </div>
              )}
            </>
          )}

          {/* Mensagem quando não há entregas */}
          {entregas.length === 0 && !isLoading && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <div className="text-xl font-semibold text-slate-600 mb-2">
                Nenhuma entrega para {modoVisualizacao === 'dia' ? format(dataSelecionada, "dd/MM/yyyy") : 'esta semana'}
              </div>
              <div className="text-sm text-slate-500 mb-4">
                {motoboyAtual?.nome} não tem entregas agendadas para este período.
              </div>
              {todasEntregas.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <div className="text-sm font-semibold text-blue-900 mb-2">
                    💡 Dias com entregas:
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[...new Set(todasEntregas.map(e => e.data_entrega))].sort().map(data => (
                      <button
                        key={data}
                        onClick={() => {
                          const [year, month, day] = data.split('-');
                          const novaData = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                          setDataSelecionada(novaData);
                          setModoVisualizacao('dia');
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                      >
                        {format(new Date(data + 'T00:00:00'), "dd/MM")}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de Card de Entrega
function EntregaCard({ entrega, onStatusChange, isUpdating, onCardClick }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Entregue':
        return 'bg-green-50 border-green-200';
      case 'A Caminho':
        return 'bg-yellow-50 border-yellow-200';
      case 'Não Entregue':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-white border-slate-200';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Entregue':
        return { backgroundColor: '#22c55e', color: 'white' };
      case 'A Caminho':
        return { backgroundColor: '#f97316', color: 'white' };
      case 'Não Entregue':
        return { backgroundColor: '#ef4444', color: 'white' };
      case 'Pendente':
        return { backgroundColor: '#890d5d', color: 'white' };
      default:
        return { backgroundColor: '#376295', color: 'white' };
    }
  };

  return (
    <div
      className={`rounded-xl shadow-md border-2 overflow-hidden transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02] ${getStatusColor(entrega.status)}`}
      onClick={(e) => {
        if (onCardClick) {
          onCardClick(entrega);
        }
      }}
    >
      <div className="p-4" style={{ pointerEvents: 'none' }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900 text-lg">
                {entrega.cliente?.nome || 'Cliente'}
              </h3>
              {entrega.recibo_medico && (
                <span className="text-white text-xs px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: '#376295' }}>
                  RECEITA
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600 mb-2">
              Requisição: <span className="font-mono font-semibold">{entrega.requisicao || '-'}</span>
            </div>
          </div>
          <div className="px-3 py-1 rounded-lg text-xs font-bold" style={getStatusBadgeColor(entrega.status)}>
            {entrega.status || 'Pendente'}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="text-slate-700">
              <div className="font-medium">
                {entrega.endereco?.logradouro}, {entrega.endereco?.numero}
              </div>
              <div className="text-xs text-slate-600">
                {entrega.endereco?.bairro} - {entrega.endereco?.cidade}
                {entrega.endereco?.complemento && ` • ${entrega.endereco.complemento}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-slate-700 font-medium">
              {entrega.cliente?.telefone || 'Sem telefone'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-slate-700">
              <span className="font-semibold">{entrega.horario || 'Sem horário'}</span>
              {entrega.observacoes && ` • ${entrega.observacoes}`}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span className="text-slate-700">
                Pagamento: <span className="font-semibold">{entrega.forma_pagamento || '-'}</span>
              </span>
            </div>
            {entrega.valor && (
              <div className="text-slate-700">
                Valor: <span className="font-bold" style={{ color: '#376295' }}>R$ {parseFloat(entrega.valor).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2" style={{ pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
          {entrega.status !== 'Entregue' && (
            <>
              {entrega.status !== 'A Caminho' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(entrega.id, 'A Caminho');
                  }}
                  disabled={isUpdating}
                  className="flex-1 text-white font-semibold py-2 px-4 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 text-sm"
                  style={{ backgroundColor: '#f97316' }}
                >
                  🚀 A Caminho
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(entrega.id, 'Entregue');
                }}
                disabled={isUpdating}
                className="flex-1 text-white font-semibold py-2 px-4 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 text-sm"
                style={{ backgroundColor: '#22c55e' }}
              >
                ✓ Entregar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(entrega.id, 'Não Entregue');
                }}
                disabled={isUpdating}
                className="flex-1 text-white font-semibold py-2 px-4 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 text-sm"
                style={{ backgroundColor: '#ef4444' }}
              >
                ✗ Não Entregue
              </button>
            </>
          )}
          {entrega.status === 'Entregue' && (
            <div className="flex-1 font-semibold py-2 px-4 rounded-lg text-center text-sm" style={{ backgroundColor: '#E8F5E8', color: '#22c55e' }}>
              ✓ Entrega Concluída
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
