import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function PlanilhaDiaria() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(location.search);

  const [selectedDate, setSelectedDate] = useState(() => {
    const dataParam = urlParams.get('data');
    return dataParam ? new Date(dataParam) : new Date();
  });
  const [filtroMotoboy, setFiltroMotoboy] = useState(urlParams.get('motoboy') || "todos");
  const [visualizarTodas, setVisualizarTodas] = useState(urlParams.get('todas') === 'true');

  // Atualizar URL quando estado mudar
  useEffect(() => {
    const params = new URLSearchParams();
    if (!visualizarTodas) {
      params.set('data', format(selectedDate, 'yyyy-MM-dd'));
    }
    params.set('todas', visualizarTodas.toString());
    if (filtroMotoboy !== "todos") params.set('motoboy', filtroMotoboy);

    navigate(`?${params.toString()}`, { replace: true });
  }, [selectedDate, filtroMotoboy, visualizarTodas]);

  // Buscar entregas de motoboy
  const { data: romaneios = [], isLoading } = useQuery({
    queryKey: ['entregas-moto-planilha'],
    queryFn: async () => {
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
          .order('data_entrega', { ascending: false });

        if (error) throw error;

        console.log('Entregas carregadas:', data);
        return data || [];
      } catch (error) {
        console.error('Erro ao carregar entregas:', error);
        toast.error('Erro ao carregar entregas');
        return [];
      }
    },
    refetchOnMount: 'always',
    staleTime: 0,
    gcTime: 0,
  });

  // Buscar entregas Sedex/Disktenha
  const { data: sedexDisktenhaRaw = [], isLoading: isLoadingSedex } = useQuery({
    queryKey: ['sedex-disktenha-planilha', selectedDate, visualizarTodas],
    queryFn: async () => {
      let query = supabase
        .from('sedex_disktenha')
        .select('*');

      if (!visualizarTodas) {
        const dataStr = format(selectedDate, 'yyyy-MM-dd');
        query = query.eq('data_saida', dataStr);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erro ao carregar Sedex/Disktenha:', error);
        toast.error('Erro ao carregar Sedex/Disktenha');
        return [];
      }
      console.log('Sedex/Disktenha carregados:', data);
      return data || [];
    },
  });

  // Ordenar Sedex/Disktenha: DISKTENHA, SEDEX, PAC (ordem fixa)
  const sedexDisktenha = [...sedexDisktenhaRaw].sort((a, b) => {
    const ordem = { 'DISKTENHA': 1, 'SEDEX': 2, 'PAC': 3 };
    const ordemA = ordem[a.tipo] || 999;
    const ordemB = ordem[b.tipo] || 999;
    return ordemA - ordemB;
  });

  // Mutation para atualizar entrega
  const updateRomaneioMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase
        .from('entregas')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-moto-planilha'] });
      toast.success('Status atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar');
    }
  });

  // Mutation para atualizar Sedex/Disktenha
  const updateSedexMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('sedex_disktenha')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sedex-disktenha-planilha'] });
      toast.success('Status atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar');
    }
  });

  // Filtrar entregas
  const romaneiosFiltrados = romaneios.filter(r => {
    if (!visualizarTodas && r.data_entrega) {
      try {
        const dataEntrega = new Date(r.data_entrega);
        if (!isSameDay(dataEntrega, selectedDate)) return false;
      } catch (error) {
        console.error('Erro ao fazer parse da data:', r.data_entrega, error);
        return false;
      }
    }

    if (filtroMotoboy !== "todos" && r.motoboy?.nome !== filtroMotoboy) return false;

    return true;
  });

  console.log('Total entregas:', romaneios.length);
  console.log('Entregas filtradas:', romaneiosFiltrados.length);
  console.log('Data selecionada:', selectedDate);
  console.log('Visualizar todas:', visualizarTodas);
  console.log('Filtro motoboy:', filtroMotoboy);

  // Ordenar por cidade e período
  const romaneiosOrdenados = [...romaneiosFiltrados].sort((a, b) => {
    const cidadeA = a.endereco?.cidade || '';
    const cidadeB = b.endereco?.cidade || '';
    const cidadeCompare = cidadeA.localeCompare(cidadeB);
    if (cidadeCompare !== 0) return cidadeCompare;
    return a.periodo === "Manhã" ? -1 : 1;
  });

  // Motoboys únicos
  const motoboysUnicos = [...new Set(romaneios.map(r => r.motoboy?.nome).filter(Boolean))];

  // Função para obter cor da linha baseado no status
  const getRowColor = (status, formaPagamento) => {
    if (status === "Entregue") return "bg-green-50";
    if (status === "A Caminho") return "bg-yellow-50";
    if (formaPagamento === "Cartanhex pago") return "bg-orange-50";
    if (formaPagamento === "Maquina") return "bg-purple-50";
    return "bg-white";
  };

  // Função para atualizar status rapidamente
  const handleQuickStatusUpdate = (id, newStatus, type = 'romaneio') => {
    if (type === 'romaneio') {
      updateRomaneioMutation.mutate({
        id,
        data: { status: newStatus }
      });
    } else {
      updateSedexMutation.mutate({ id, status: newStatus });
    }
  };

  // Navegação de data
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-900">Planilha Diária</h1>
        <p className="text-sm text-slate-600 mt-1">Visualize e edite todas as entregas do dia</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar - Calendário e Filtros */}
          <div className="space-y-4">
            {/* Seletor de data */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Selecione um dado</h3>

              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="ver-todas"
                  checked={visualizarTodas}
                  onChange={(e) => setVisualizarTodas(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <label htmlFor="ver-todas" className="text-sm text-slate-700 cursor-pointer">
                  Ver todas
                </label>
              </div>

              {!visualizarTodas && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevDay}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="text-center">
                      <div className="font-semibold text-slate-900">
                        {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                      </div>
                      <div className="text-xs text-slate-500">
                        {romaneiosFiltrados.length} entrega{romaneiosFiltrados.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextDay}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                    className="rounded-md border border-slate-200"
                  />
                </>
              )}
            </div>

            {/* Filtro Motoboy */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Filtrar</h3>
              <select
                value={filtroMotoboy}
                onChange={(e) => setFiltroMotoboy(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="todos">Todos os Motoboys</option>
                {motoboysUnicos.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Main Content - Tabelas */}
          <div className="space-y-6">
            {/* Tabela Principal - Romaneios */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-[#4472C4] px-4 py-3">
                <h2 className="text-white font-bold text-lg">ATENDIMENTO</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Ver</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Atendente</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Cliente</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Observações</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Telefone</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Local</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Requisições</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Forma de Pgto</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Valor</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Troco</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Período</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Hora</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Status</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Receita</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Motoboy</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700">Taxa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="16" className="p-8 text-center text-slate-500">
                          Carregando...
                        </td>
                      </tr>
                    ) : romaneiosOrdenados.length === 0 ? (
                      <tr>
                        <td colSpan="16" className="p-8 text-center text-slate-500">
                          Nenhuma entrega encontrada
                        </td>
                      </tr>
                    ) : (
                      romaneiosOrdenados.map((rom) => (
                        <tr
                          key={rom.id}
                          className={`border-b border-slate-200 hover:bg-slate-50 ${getRowColor(rom.status, rom.forma_pagamento)}`}
                        >
                          <td className="px-2 py-1.5 border-r border-slate-200">
                            <Link
                              to={`/?id=${rom.id}`}
                              className="text-[#457bba] hover:text-[#3a6ba0]"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600">
                            {rom.motoboy?.nome || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 font-medium text-slate-800">
                            {rom.cliente?.nome || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600 max-w-[200px] truncate">
                            {rom.observacoes || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600">
                            {rom.cliente?.telefone || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600">
                            {rom.endereco?.cidade || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 font-mono text-slate-700">
                            {rom.requisicao || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              rom.forma_pagamento === 'Pago' ? 'bg-green-100 text-green-800' :
                              rom.forma_pagamento === 'Dinheiro' ? 'bg-blue-100 text-blue-800' :
                              rom.forma_pagamento === 'Cartão' ? 'bg-purple-100 text-purple-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {rom.forma_pagamento || '-'}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 text-slate-700 font-semibold">
                            R$ {rom.valor ? parseFloat(rom.valor).toFixed(2) : '0.00'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600">
                            {rom.troco || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              rom.periodo === 'Manhã' ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {rom.periodo || '-'}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600">
                            {rom.horario || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200">
                            <select
                              value={rom.status || 'Pendente'}
                              onChange={(e) => handleQuickStatusUpdate(rom.id, e.target.value, 'romaneio')}
                              className="w-full text-[10px] p-1 border border-slate-300 rounded bg-white"
                              disabled={updateRomaneioMutation.isPending}
                            >
                              <option value="Pendente">Pendente</option>
                              <option value="Produção">Produção</option>
                              <option value="Preparando">Preparando</option>
                              <option value="A Caminho">A Caminho</option>
                              <option value="Entregue">Entregue</option>
                              <option value="Não Entregue">Não Entregue</option>
                              <option value="Voltou">Voltou</option>
                              <option value="Cancelado">Cancelado</option>
                            </select>
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 text-center">
                            {rom.recibo_medico ? (
                              <span className="inline-block w-4 h-4 rounded-full bg-green-500"></span>
                            ) : (
                              <span className="inline-block w-4 h-4 rounded-full bg-slate-300"></span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 text-slate-700 font-medium">
                            {rom.motoboy?.nome || '-'}
                          </td>
                          <td className="px-2 py-1.5 text-slate-700 font-semibold">
                            R$ {rom.taxa ? parseFloat(rom.taxa).toFixed(2) : '0.00'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela Sedex/Disktenha */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-[#6BA3D8] px-4 py-3">
                <h2 className="text-white font-bold text-lg">SEDEX / DISKTENHA</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-blue-50 border-b border-blue-200">
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Tipo</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Cliente</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Remetente</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Código Rastreio</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Valor</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Forma de Pgto</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Data Saída</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Status</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-blue-50/30">
                    {isLoadingSedex ? (
                      <tr>
                        <td colSpan="9" className="p-8 text-center text-slate-500">
                          Carregando...
                        </td>
                      </tr>
                    ) : sedexDisktenha.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="p-8 text-center text-slate-500">
                          Nenhuma entrega Sedex/Disktenha encontrada
                        </td>
                      </tr>
                    ) : (
                      sedexDisktenha.map((entrega) => (
                        <tr
                          key={entrega.id}
                          className="border-b border-blue-200 hover:bg-blue-100/50"
                        >
                          <td className="px-2 py-1.5 border-r border-blue-200">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              entrega.tipo === 'SEDEX' ? 'bg-red-100 text-red-800' :
                              entrega.tipo === 'PAC' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {entrega.tipo}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 border-r border-blue-200 font-medium text-slate-800">
                            {entrega.cliente}
                          </td>
                          <td className="px-2 py-1.5 border-r border-blue-200 text-slate-600">
                            {entrega.remetente || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-blue-200 font-mono text-slate-700">
                            {entrega.codigo_rastreio}
                          </td>
                          <td className="px-2 py-1.5 border-r border-blue-200 text-slate-700 font-semibold">
                            R$ {entrega.valor ? parseFloat(entrega.valor).toFixed(2) : '0.00'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-blue-200">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                              {entrega.forma_pagamento}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 border-r border-blue-200 text-slate-600">
                            {entrega.data_saida ? format(parseISO(entrega.data_saida), 'dd/MM/yyyy') : '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-blue-200">
                            <select
                              value={entrega.status || 'Pendente'}
                              onChange={(e) => handleQuickStatusUpdate(entrega.id, e.target.value, 'sedex')}
                              className="w-full text-[10px] p-1 border border-blue-300 rounded bg-white"
                              disabled={updateSedexMutation.isPending}
                            >
                              <option value="Pendente">Pendente</option>
                              <option value="Em Trânsito">Em Trânsito</option>
                              <option value="Entregue">Entregue</option>
                              <option value="Devolvido">Devolvido</option>
                            </select>
                          </td>
                          <td className="px-2 py-1.5 text-slate-600 max-w-[200px] truncate">
                            {entrega.observacoes || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="text-xs text-slate-600 mb-1">Total Romaneios</div>
                <div className="text-2xl font-bold text-slate-900">{romaneiosOrdenados.length}</div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="text-xs text-slate-600 mb-1">Entregues</div>
                <div className="text-2xl font-bold text-green-600">
                  {romaneiosOrdenados.filter(r => r.status === 'Entregue').length}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="text-xs text-slate-600 mb-1">Total Sedex/Disk</div>
                <div className="text-2xl font-bold text-blue-600">{sedexDisktenha.length}</div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="text-xs text-slate-600 mb-1">Valor Total</div>
                <div className="text-2xl font-bold text-slate-900">
                  R$ {(
                    romaneiosOrdenados.reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0) +
                    sedexDisktenha.reduce((sum, s) => sum + (parseFloat(s.valor) || 0), 0)
                  ).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
