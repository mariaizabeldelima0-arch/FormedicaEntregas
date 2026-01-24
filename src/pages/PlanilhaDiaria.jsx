import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ExternalLink, ChevronLeft, ChevronRight, Download, Printer, FileDown } from "lucide-react";
import html2pdf from "html2pdf.js";
import { createPageUrl } from "@/utils";
import { CustomDropdown } from "@/components/CustomDropdown";
import { CustomDatePicker } from "@/components/CustomDatePicker";

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
        // Comparar apenas as strings de data (yyyy-MM-dd) para evitar problemas de timezone
        const dataEntregaStr = r.data_entrega.substring(0, 10);
        const dataSelecionadaStr = format(selectedDate, 'yyyy-MM-dd');
        if (dataEntregaStr !== dataSelecionadaStr) return false;
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

  const contentRef = React.useRef(null);

  // Função para salvar PDF automaticamente na pasta Downloads
  const handleSavePDF = () => {
    const element = contentRef.current;
    if (!element) return;

    const dataStr = !visualizarTodas ? format(selectedDate, 'dd-MM-yyyy') : 'Todas';
    const nomeArquivo = `Entregas ${dataStr}.pdf`;

    // Esconder elementos que não devem aparecer no PDF (resumo + coluna Ver)
    const hideElements = element.querySelectorAll('.print-hide');
    hideElements.forEach(el => el.style.display = 'none');

    // Mostrar título do PDF
    const pdfTitle = element.querySelector('.pdf-title');
    if (pdfTitle) pdfTitle.style.display = 'block';

    const opt = {
      margin: 5,
      filename: nomeArquivo,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      hideElements.forEach(el => el.style.display = '');
      if (pdfTitle) pdfTitle.style.display = 'none';
      toast.success(`PDF salvo: ${nomeArquivo}`);
    }).catch(() => {
      hideElements.forEach(el => el.style.display = '');
      if (pdfTitle) pdfTitle.style.display = 'none';
      toast.error('Erro ao salvar PDF');
    });
  };

  // Função para imprimir
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Estilos de impressão */}
      <style>{`
        @media print {
          /* Esconder sidebar, header e filtros */
          .no-print,
          nav,
          aside,
          [data-sidebar],
          .print-hide {
            display: none !important;
          }

          /* Reset layout para impressão */
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .min-h-screen {
            min-height: auto !important;
          }

          /* Tabelas: tamanho adequado */
          table {
            font-size: 9px !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }

          th, td {
            padding: 3px 4px !important;
            border: 1px solid #ccc !important;
          }

          /* Mostrar overflow */
          .overflow-x-auto {
            overflow: visible !important;
          }

          .max-w-7xl {
            max-width: 100% !important;
          }

          /* Remover sombras e bordas arredondadas */
          .shadow-sm, .shadow-lg {
            box-shadow: none !important;
          }

          .rounded-xl, .rounded-lg {
            border-radius: 0 !important;
          }

          /* Título para impressão */
          .print-title {
            display: block !important;
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
          }

          /* Página paisagem */
          @page {
            size: landscape;
            margin: 10mm;
          }
        }

        .print-title {
          display: none;
        }
      `}</style>

      {/* Título visível apenas na impressão */}
      <div className="print-title">
        Planilha Diária {!visualizarTodas ? `- ${format(selectedDate, 'dd/MM/yyyy')}` : '- Todas as Entregas'}
        {filtroMotoboy !== 'todos' ? ` (${filtroMotoboy})` : ''}
      </div>

      {/* Header */}
      <div className="py-8 shadow-sm print-hide" style={{
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
              <h1 className="text-4xl font-bold text-white">Planilha Diária</h1>
              <p className="text-base text-white opacity-90 mt-1">Visualize e edite todas as entregas do dia</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Linha de Filtros no Topo */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 print-hide">
            <div className="flex items-center gap-4">
              {/* Botões Todas / Por Dia */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVisualizarTodas(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: visualizarTodas ? '#376295' : 'white',
                    color: visualizarTodas ? 'white' : '#64748b',
                    border: visualizarTodas ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  Todas
                </button>

                <button
                  onClick={() => setVisualizarTodas(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: !visualizarTodas ? '#376295' : 'white',
                    color: !visualizarTodas ? 'white' : '#64748b',
                    border: !visualizarTodas ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  Por Dia
                </button>
              </div>

              {/* Campo de Busca por Data */}
              {!visualizarTodas && (
                <div className="flex items-center gap-2">
                  <CustomDatePicker
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={(dateStr) => {
                      if (dateStr) {
                        setSelectedDate(new Date(dateStr + 'T00:00:00'));
                      }
                    }}
                    placeholder="Selecione a data"
                  />
                </div>
              )}

              {/* Filtro por Motoboy */}
              <div className="flex-1 max-w-xs">
                <CustomDropdown
                  options={[
                    { value: 'todos', label: 'Todos os Motoboys' },
                    ...motoboysUnicos.map(m => ({ value: m, label: m }))
                  ]}
                  value={filtroMotoboy}
                  onChange={setFiltroMotoboy}
                  placeholder="Todos os Motoboys"
                />
              </div>

              {/* Botão Salvar PDF */}
              <button
                onClick={handleSavePDF}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap text-white"
                style={{ backgroundColor: '#376295' }}
              >
                <FileDown className="w-4 h-4" />
                Salvar PDF
              </button>

              {/* Botão Imprimir */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap text-white"
                style={{ backgroundColor: '#890d5d' }}
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </div>

          {/* Main Content - Tabelas */}
          <div className="space-y-6" ref={contentRef}>
            {/* Título do PDF (escondido na tela, visível apenas no PDF gerado) */}
            <div className="pdf-title" style={{ display: 'none', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', paddingTop: '5px' }}>
              Entregas {!visualizarTodas ? format(selectedDate, 'dd/MM/yyyy') : '- Todas'}
              {filtroMotoboy !== 'todos' ? ` (${filtroMotoboy})` : ''}
            </div>
            {/* Tabela Principal - Romaneios */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-3" style={{ backgroundColor: '#376295' }}>
                <h2 className="text-white font-bold text-lg">ENTREGAS MOTO</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Atendente</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Requisição</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Cliente</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Telefone</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Observação</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Local</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Forma de Pgto</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Valor a Cobrar</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Troco</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Período</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Status</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Receita</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Moto</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Taxa</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 print-hide">Ver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="15" className="p-8 text-center text-slate-500">
                          Carregando...
                        </td>
                      </tr>
                    ) : romaneiosOrdenados.length === 0 ? (
                      <tr>
                        <td colSpan="15" className="p-8 text-center text-slate-500">
                          Nenhuma entrega encontrada
                        </td>
                      </tr>
                    ) : (
                      romaneiosOrdenados.map((rom) => (
                        <tr
                          key={rom.id}
                          className={`border-b border-slate-200 hover:bg-slate-50 ${getRowColor(rom.status, rom.forma_pagamento)}`}
                        >
                          <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600">
                            {rom.atendente || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 font-mono text-slate-700">
                            {rom.requisicao || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 font-medium text-slate-800">
                            {rom.cliente?.nome || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600">
                            {rom.cliente?.telefone ? rom.cliente.telefone.replace(/\D/g, '') : '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600 max-w-[200px] truncate">
                            {rom.observacoes || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600">
                            {rom.endereco?.cidade || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              rom.forma_pagamento === 'Pago' ? 'text-green-700' :
                              rom.forma_pagamento === 'Dinheiro' ? 'text-blue-700' :
                              rom.forma_pagamento === 'Cartão' ? 'text-purple-700' :
                              'bg-slate-100 text-slate-700'
                            }`} style={{
                              backgroundColor: rom.forma_pagamento === 'Pago' ? '#E8F5E8' :
                                rom.forma_pagamento === 'Dinheiro' ? '#E8F0F8' :
                                rom.forma_pagamento === 'Cartão' ? '#F5E8F5' : undefined
                            }}>
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
                              rom.periodo === 'Manhã' ? 'text-yellow-800' : 'text-orange-800'
                            }`} style={{
                              backgroundColor: rom.periodo === 'Manhã' ? '#fef9c3' : '#ffedd5'
                            }}>
                              {rom.periodo || '-'}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 border-r border-slate-200">
                            <CustomDropdown
                              options={[
                                { value: 'Iniciar', label: 'Iniciar' },
                                { value: 'Pendente', label: 'Pendente' },
                                { value: 'Produzindo no Laboratório', label: 'Produção' },
                                { value: 'Preparando no Setor de Entregas', label: 'Preparando' },
                                { value: 'A Caminho', label: 'A Caminho' },
                                { value: 'Em Rota', label: 'Em Rota' },
                                { value: 'Entregue', label: 'Entregue' },
                                { value: 'Não Entregue', label: 'Não Entregue' },
                                { value: 'Voltou', label: 'Voltou' },
                                { value: 'Voltou p/ Farmácia', label: 'Voltou p/ Farmácia' },
                                { value: 'Cancelado', label: 'Cancelado' }
                              ]}
                              value={rom.status || 'Produzindo no Laboratório'}
                              onChange={(val) => handleQuickStatusUpdate(rom.id, val, 'romaneio')}
                              disabled={updateRomaneioMutation.isPending}
                            />
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
                          <td className="px-2 py-1.5 border-r border-slate-200 text-slate-700 font-semibold">
                            R$ {rom.taxa ? parseFloat(rom.taxa).toFixed(2) : '0.00'}
                          </td>
                          <td className="px-2 py-1.5 print-hide">
                            <Link
                              to={`/detalhes-romaneio?id=${rom.id}`}
                              className="hover:opacity-80 transition-opacity"
                              style={{ color: '#376295' }}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
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
              <div className="px-4 py-3" style={{ backgroundColor: '#890d5d' }}>
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
                            <CustomDropdown
                              options={[
                                { value: 'Pendente', label: 'Pendente' },
                                { value: 'Em Trânsito', label: 'Em Trânsito' },
                                { value: 'Entregue', label: 'Entregue' },
                                { value: 'Devolvido', label: 'Devolvido' }
                              ]}
                              value={entrega.status || 'Pendente'}
                              onChange={(val) => handleQuickStatusUpdate(entrega.id, val, 'sedex')}
                              disabled={updateSedexMutation.isPending}
                              className="text-[10px]"
                            />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print-hide">
              <div className="bg-white rounded-xl shadow-sm p-5 border-2 border-transparent">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F0F8' }}>
                    <svg className="w-6 h-6" style={{ color: '#376295' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-slate-700">Total Romaneios</span>
                </div>
                <div className="text-4xl font-bold text-center" style={{ color: '#376295' }}>{romaneiosOrdenados.length}</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 border-2 border-transparent">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F5E8' }}>
                    <svg className="w-6 h-6" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-slate-700">Entregues</span>
                </div>
                <div className="text-4xl font-bold text-center" style={{ color: '#22c55e' }}>
                  {romaneiosOrdenados.filter(r => r.status === 'Entregue').length}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 border-2 border-transparent">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#F5E8F5' }}>
                    <svg className="w-6 h-6" style={{ color: '#890d5d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-slate-700">Sedex/Disk</span>
                </div>
                <div className="text-4xl font-bold text-center" style={{ color: '#890d5d' }}>{sedexDisktenha.length}</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 border-2 border-transparent">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F0F8' }}>
                    <svg className="w-6 h-6" style={{ color: '#376295' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-slate-700">Valor Total</span>
                </div>
                <div className="text-4xl font-bold text-center" style={{ color: '#376295' }}>
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
