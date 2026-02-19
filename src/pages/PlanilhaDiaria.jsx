import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ExternalLink, ChevronLeft, ChevronRight, Download, Printer, FileDown, MousePointerClick } from "lucide-react";
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
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSedexIds, setSelectedSedexIds] = useState(new Set());
  const [selectionModeSedex, setSelectionModeSedex] = useState(false);

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

        // Buscar clientes adicionais para cada entrega
        const entregasComClientesAdicionais = await Promise.all(
          (data || []).map(async (entrega) => {
            let clientesAdicionais = [];
            if (entrega.clientes_adicionais && entrega.clientes_adicionais.length > 0) {
              const { data: clientesData } = await supabase
                .from('clientes')
                .select('id, nome, telefone')
                .in('id', entrega.clientes_adicionais);
              clientesAdicionais = clientesData || [];
            }
            return {
              ...entrega,
              clientesAdicionais
            };
          })
        );

        console.log('Entregas carregadas:', entregasComClientesAdicionais);
        return entregasComClientesAdicionais || [];
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

  // Ordenar por motoboy, período, cidade e status
  const statusOrder = {
    'Produzindo no Laboratório': 1,
    'Em Rota': 2,
    'A Caminho': 2,
    'Voltou p/ Farmácia': 3,
    'Entregue': 4,
    'Cancelado': 5,
  };

  const periodoOrder = {
    'Manhã': 1,
    'Tarde': 2,
  };

  const romaneiosOrdenados = [...romaneiosFiltrados].sort((a, b) => {
    // 1. Ordenar por período
    const periodoA = periodoOrder[a.periodo] || 99;
    const periodoB = periodoOrder[b.periodo] || 99;
    if (periodoA !== periodoB) return periodoA - periodoB;

    // 2. Ordenar por motoboy
    const motoboyA = a.motoboy?.nome || 'zzz';
    const motoboyB = b.motoboy?.nome || 'zzz';
    const motoboyCompare = motoboyA.localeCompare(motoboyB);
    if (motoboyCompare !== 0) return motoboyCompare;

    // 3. Ordenar por região/cidade
    const cidadeA = a.regiao || a.endereco?.cidade || '';
    const cidadeB = b.regiao || b.endereco?.cidade || '';
    const cidadeCompare = cidadeA.localeCompare(cidadeB);
    if (cidadeCompare !== 0) return cidadeCompare;

    // 4. Ordenar por status
    const statusA = statusOrder[a.status] || 99;
    const statusB = statusOrder[b.status] || 99;
    return statusA - statusB;
  });

  // Motoboys únicos
  const motoboysUnicos = [...new Set(romaneios.map(r => r.motoboy?.nome).filter(Boolean))];

  // Função para obter cor da linha baseado no status
  const getRowColor = (status) => {
    switch (status) {
      case 'Em Rota':
      case 'A Caminho':
        return { backgroundColor: '#dbeafe' }; // azul claro
      case 'Entregue':
        return { backgroundColor: '#F5E8F5' }; // roxo claro
      case 'Voltou p/ Farmácia':
        return { backgroundColor: '#fef9c3' }; // amarelo
      case 'Cancelado':
        return { backgroundColor: '#fee2e2' }; // vermelho
      default:
        return {};
    }
  };

  // Função para obter cor da linha baseado no status - Sedex/Disktenha
  const getSedexRowColor = (status) => {
    switch (status) {
      case 'Em Trânsito':
        return { backgroundColor: '#dbeafe' }; // azul claro
      case 'Entregue':
        return { backgroundColor: '#F5E8F5' }; // roxo claro
      case 'Devolvido':
        return { backgroundColor: '#fee2e2' }; // vermelho
      case 'Pendente':
      default:
        return {};
    }
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

  // Mutation para atualizar receita
  const updateReceitaMutation = useMutation({
    mutationFn: async ({ id, recebida }) => {
      const { error } = await supabase
        .from('entregas')
        .update({ receita_recebida: recebida })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { recebida }) => {
      queryClient.invalidateQueries({ queryKey: ['entregas-moto-planilha'] });
      toast.success(recebida ? 'Receita marcada como recebida!' : 'Receita desmarcada');
    },
    onError: () => {
      toast.error('Erro ao atualizar receita');
    }
  });

  // Mutation para atualizar status de pagamento recebido
  const updatePagamentoRecebidoMutation = useMutation({
    mutationFn: async ({ id, pagamentoRecebido }) => {
      const { error } = await supabase
        .from('entregas')
        .update({ pagamento_recebido: pagamentoRecebido })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { pagamentoRecebido }) => {
      queryClient.invalidateQueries({ queryKey: ['entregas-moto-planilha'] });
      toast.success(pagamentoRecebido ? 'Pagamento marcado como Recebido' : 'Pagamento marcado como Pendente');
    },
    onError: () => {
      toast.error('Erro ao atualizar status do pagamento');
    }
  });

  // Toggle seleção individual
  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Alterar status em lote
  const handleBulkStatusChange = async (novoStatus) => {
    if (selectedIds.size === 0) return;
    const toastId = toast.loading(`Alterando ${selectedIds.size} entregas...`);
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase
        .from('entregas')
        .update({ status: novoStatus })
        .in('id', ids);
      if (error) throw error;
      toast.success(`${ids.length} entregas alteradas para "${novoStatus}"!`, { id: toastId });
      setSelectedIds(new Set());
      setSelectionMode(false);
      queryClient.invalidateQueries({ queryKey: ['entregas-moto-planilha'] });
    } catch (error) {
      console.error('Erro ao alterar status em lote:', error);
      toast.error('Erro ao alterar status em lote', { id: toastId });
    }
  };

  // Alterar pagamento recebido em lote (apenas entregas com valor a cobrar)
  const handleBulkPagamentoChange = async (recebido) => {
    if (selectedIds.size === 0) return;

    // Filtrar apenas entregas que têm valor_venda > 0
    const idsComValor = Array.from(selectedIds).filter(id => {
      const entrega = romaneios.find(r => r.id === id);
      return entrega && entrega.valor_venda > 0;
    });

    if (idsComValor.length === 0) {
      toast.error('Nenhuma entrega selecionada possui valor a cobrar');
      return;
    }

    const label = recebido === true ? 'Pago' : recebido === false ? 'Não Recebido' : 'Cobrar';
    const toastId = toast.loading(`Alterando pagamento de ${idsComValor.length} entregas...`);
    try {
      const { error } = await supabase
        .from('entregas')
        .update({ pagamento_recebido: recebido })
        .in('id', idsComValor);
      if (error) throw error;
      toast.success(`${idsComValor.length} entregas marcadas como "${label}"!`, { id: toastId });
      setSelectedIds(new Set());
      setSelectionMode(false);
      queryClient.invalidateQueries({ queryKey: ['entregas-moto-planilha'] });
    } catch (error) {
      console.error('Erro ao alterar pagamento em lote:', error);
      toast.error('Erro ao alterar pagamento em lote', { id: toastId });
    }
  };

  // Toggle seleção individual Sedex
  const toggleSedexSelection = (id) => {
    setSelectedSedexIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Alterar status em lote para Sedex/Disktenha
  const handleBulkSedexStatusChange = async (novoStatus) => {
    if (selectedSedexIds.size === 0) return;
    const toastId = toast.loading(`Alterando ${selectedSedexIds.size} entregas...`);
    try {
      const ids = Array.from(selectedSedexIds);
      const { error } = await supabase
        .from('sedex_disktenha')
        .update({ status: novoStatus })
        .in('id', ids);
      if (error) throw error;
      toast.success(`${ids.length} entregas alteradas para "${novoStatus}"!`, { id: toastId });
      setSelectedSedexIds(new Set());
      setSelectionModeSedex(false);
      queryClient.invalidateQueries({ queryKey: ['sedex-disktenha-planilha'] });
    } catch (error) {
      console.error('Erro ao alterar status em lote:', error);
      toast.error('Erro ao alterar status em lote', { id: toastId });
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

    // Esconder elementos que não devem aparecer no PDF (resumo + coluna Ver + barra seleção)
    const hideElements = element.querySelectorAll('.print-hide');
    hideElements.forEach(el => el.style.display = 'none');

    // Mostrar título do PDF
    const pdfTitle = element.querySelector('.pdf-title');
    if (pdfTitle) pdfTitle.style.display = 'block';

    // Remover overflow hidden/auto para mostrar tudo
    const overflowEls = element.querySelectorAll('.overflow-x-auto, .overflow-hidden');
    overflowEls.forEach(el => el.style.overflow = 'visible');

    // Remover truncate e max-width para mostrar texto completo
    const truncatedEls = element.querySelectorAll('.truncate');
    truncatedEls.forEach(el => {
      el.style.overflow = 'visible';
      el.style.textOverflow = 'clip';
      el.style.whiteSpace = 'normal';
      el.style.maxWidth = 'none';
      el.style.wordBreak = 'break-word';
    });

    // Substituir dropdowns de status por texto simples no PDF
    const dropdownContainers = element.querySelectorAll('[data-custom-dropdown]');
    const dropdownBackups = [];
    dropdownContainers.forEach(container => {
      const selectedText = container.querySelector('[data-selected-text]');
      const text = selectedText ? selectedText.textContent : container.textContent.trim();
      dropdownBackups.push({ el: container, original: container.innerHTML });
      container.innerHTML = `<span style="font-size:10px;font-weight:600;">${text}</span>`;
    });

    // Reduzir tamanho da fonte da tabela para caber tudo
    const tables = element.querySelectorAll('table');
    tables.forEach(t => {
      t.style.fontSize = '7px';
      t.style.tableLayout = 'auto';
    });

    // Garantir que as células não tenham largura fixa
    const cells = element.querySelectorAll('th, td');
    cells.forEach(c => {
      c.style.whiteSpace = 'nowrap';
      c.style.padding = '2px 3px';
    });

    // Permitir wrap na coluna de observação
    const obsCells = element.querySelectorAll('.obs-cell-pdf');
    obsCells.forEach(c => {
      c.style.whiteSpace = 'normal';
      c.style.minWidth = '80px';
    });

    const opt = {
      margin: [3, 3, 3, 3],
      filename: nomeArquivo,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth + 100,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      // Restaurar tudo
      hideElements.forEach(el => el.style.display = '');
      if (pdfTitle) pdfTitle.style.display = 'none';
      overflowEls.forEach(el => el.style.overflow = '');
      truncatedEls.forEach(el => {
        el.style.overflow = '';
        el.style.textOverflow = '';
        el.style.whiteSpace = '';
        el.style.maxWidth = '';
        el.style.wordBreak = '';
      });
      dropdownBackups.forEach(b => b.el.innerHTML = b.original);
      tables.forEach(t => { t.style.fontSize = ''; t.style.tableLayout = ''; });
      cells.forEach(c => { c.style.whiteSpace = ''; c.style.padding = ''; });
      toast.success(`PDF salvo: ${nomeArquivo}`);
    }).catch(() => {
      hideElements.forEach(el => el.style.display = '');
      if (pdfTitle) pdfTitle.style.display = 'none';
      overflowEls.forEach(el => el.style.overflow = '');
      truncatedEls.forEach(el => {
        el.style.overflow = '';
        el.style.textOverflow = '';
        el.style.whiteSpace = '';
        el.style.maxWidth = '';
        el.style.wordBreak = '';
      });
      dropdownBackups.forEach(b => b.el.innerHTML = b.original);
      tables.forEach(t => { t.style.fontSize = ''; t.style.tableLayout = ''; });
      cells.forEach(c => { c.style.whiteSpace = ''; c.style.padding = ''; });
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
            font-size: 7px !important;
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: auto !important;
          }

          th, td {
            padding: 2px 3px !important;
            border: 1px solid #ccc !important;
            white-space: nowrap !important;
          }

          /* Observações podem quebrar linha */
          .obs-cell-pdf {
            white-space: normal !important;
            max-width: none !important;
            overflow: visible !important;
            text-overflow: clip !important;
            word-break: break-word !important;
          }

          /* Remover truncate */
          .truncate {
            overflow: visible !important;
            text-overflow: clip !important;
            white-space: normal !important;
            max-width: none !important;
          }

          /* Mostrar overflow */
          .overflow-x-auto,
          .overflow-hidden {
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
      <div className="py-4 md:py-8 shadow-sm print-hide" style={{
        background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 md:p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
            <div>
              <h1 className="text-xl md:text-4xl font-bold text-white">Planilha Diária</h1>
              <p className="text-xs md:text-base text-white opacity-90 mt-0.5 md:mt-1">Visualize e edite todas as entregas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Linha de Filtros no Topo */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 md:p-6 mb-4 md:mb-6 print-hide">
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              {/* Botões Todas / Por Dia + Data */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 md:gap-2">
                  <button
                    onClick={() => setVisualizarTodas(true)}
                    className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-lg font-semibold text-xs md:text-sm transition-all whitespace-nowrap"
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
                    className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-lg font-semibold text-xs md:text-sm transition-all whitespace-nowrap"
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
                  <CustomDatePicker
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={(dateStr) => {
                      if (dateStr) {
                        setSelectedDate(new Date(dateStr + 'T00:00:00'));
                      }
                    }}
                    placeholder="Selecione a data"
                  />
                )}
              </div>

              {/* Filtro por Motoboy */}
              <div className="w-full sm:w-auto sm:flex-1 sm:max-w-[200px]">
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

              {/* Botões de ação */}
              <div className="flex items-center gap-2 ml-auto">
                {/* Botão Selecionar */}
                <button
                  onClick={() => {
                    setSelectionMode(prev => !prev);
                    if (selectionMode) setSelectedIds(new Set());
                  }}
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-lg font-semibold text-xs md:text-sm transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: selectionMode ? '#dc2626' : '#376295',
                    color: 'white'
                  }}
                >
                  <MousePointerClick className="w-4 h-4" />
                  <span className="hidden md:inline">{selectionMode ? 'Cancelar' : 'Selecionar'}</span>
                </button>

                {/* Botão Salvar PDF */}
                <button
                  onClick={handleSavePDF}
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-lg font-semibold text-xs md:text-sm transition-all whitespace-nowrap text-white"
                  style={{ backgroundColor: '#376295' }}
                >
                  <FileDown className="w-4 h-4" />
                  <span className="hidden md:inline">PDF</span>
                </button>

                {/* Botão Imprimir */}
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-lg font-semibold text-xs md:text-sm transition-all whitespace-nowrap text-white"
                  style={{ backgroundColor: '#890d5d' }}
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden md:inline">Imprimir</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Tabelas */}
          <div className="space-y-4 md:space-y-6" ref={contentRef}>
            {/* Título do PDF (escondido na tela, visível apenas no PDF gerado) */}
            <div className="pdf-title" style={{ display: 'none', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', paddingTop: '5px' }}>
              Entregas {!visualizarTodas ? format(selectedDate, 'dd/MM/yyyy') : '- Todas'}
              {filtroMotoboy !== 'todos' ? ` (${filtroMotoboy})` : ''}
            </div>
            {/* Barra de Seleção em Lote */}
            {selectionMode && (
              <div className="rounded-lg border-2 p-3 md:p-4 flex flex-wrap items-center justify-between gap-3 print-hide" style={{ borderColor: '#376295', backgroundColor: '#f0f5ff' }}>
                <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                  <span className="text-xs md:text-sm font-bold" style={{ color: '#376295' }}>
                    {selectedIds.size > 0
                      ? `${selectedIds.size} selecionada${selectedIds.size > 1 ? 's' : ''}`
                      : 'Clique para selecionar'}
                  </span>
                  <button
                    onClick={() => {
                      const allSelected = romaneiosOrdenados.length > 0 && romaneiosOrdenados.every(r => selectedIds.has(r.id));
                      if (allSelected) {
                        setSelectedIds(new Set());
                      } else {
                        setSelectedIds(new Set(romaneiosOrdenados.map(r => r.id)));
                      }
                    }}
                    className="text-xs md:text-sm font-semibold underline"
                    style={{ color: '#376295' }}
                  >
                    {romaneiosOrdenados.length > 0 && romaneiosOrdenados.every(r => selectedIds.has(r.id))
                      ? 'Desmarcar'
                      : 'Todas'}
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="text-xs md:text-sm text-slate-500 hover:text-slate-700 underline"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                    <span className="text-xs md:text-sm text-slate-600 font-medium">Status:</span>
                    {[
                      { status: 'Produzindo no Laboratório', label: 'Iniciar', bg: '#dbeafe', color: '#2563eb' },
                      { status: 'Em Rota', label: 'Rota', bg: '#dcfce7', color: '#166534' },
                      { status: 'Entregue', bg: '#F5E8F5', color: '#890d5d' },
                      { status: 'Voltou p/ Farmácia', label: 'Voltou', bg: '#fef9c3', color: '#92400e' },
                      { status: 'Cancelado', label: 'Canc.', bg: '#fee2e2', color: '#dc2626' },
                    ].map(item => (
                      <button
                        key={item.status}
                        onClick={() => handleBulkStatusChange(item.status)}
                        className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all hover:opacity-80"
                        style={{ backgroundColor: item.bg, color: item.color }}
                      >
                        {item.label || item.status}
                      </button>
                    ))}
                  </div>
                  <span className="hidden md:inline text-slate-300 mx-1">|</span>
                  <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                    <span className="text-xs md:text-sm text-slate-600 font-medium">Pgto:</span>
                    <button
                      onClick={() => handleBulkPagamentoChange(true)}
                      className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all hover:opacity-80 bg-green-500 text-white"
                    >
                      Pago
                    </button>
                    <button
                      onClick={() => handleBulkPagamentoChange(false)}
                      className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all hover:opacity-80 bg-red-500 text-white"
                    >
                      N/Receb
                    </button>
                    <button
                      onClick={() => handleBulkPagamentoChange(null)}
                      className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all hover:opacity-80 bg-slate-400 text-white"
                    >
                      Cobrar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabela Principal - Romaneios */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-3 md:px-4 py-2 md:py-3" style={{ backgroundColor: '#376295' }}>
                <h2 className="text-white font-bold text-sm md:text-lg">ENTREGAS MOTO</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      {visualizarTodas && (
                        <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Data</th>
                      )}
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Atendente</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Requisição</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Cliente</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Telefone</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Observação</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Forma de Pgto</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Valor a Cobrar</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Troco</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Horário</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Status</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Receita</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-200">Taxa</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 print-hide">Ver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={visualizarTodas ? 14 : 13} className="p-8 text-center text-slate-500">
                          Carregando...
                        </td>
                      </tr>
                    ) : romaneiosOrdenados.length === 0 ? (
                      <tr>
                        <td colSpan={visualizarTodas ? 14 : 13} className="p-8 text-center text-slate-500">
                          Nenhuma entrega encontrada
                        </td>
                      </tr>
                    ) : (
                      romaneiosOrdenados.reduce((rows, rom, idx) => {
                        const prev = romaneiosOrdenados[idx - 1];
                        const currentPeriodo = rom.periodo || 'Sem Período';
                        const currentMotoboy = rom.motoboy?.nome || 'Sem Motoboy';
                        const currentLocal = rom.regiao || rom.endereco?.cidade || 'Sem Local';
                        const prevPeriodo = prev ? (prev.periodo || 'Sem Período') : null;
                        const prevMotoboy = prev ? (prev.motoboy?.nome || 'Sem Motoboy') : null;
                        const prevLocal = prev ? (prev.regiao || prev.endereco?.cidade || 'Sem Local') : null;
                        const colCount = visualizarTodas ? 14 : 13;

                        if (currentPeriodo !== prevPeriodo) {
                          rows.push(
                            <tr key={`periodo-${currentPeriodo}-${idx}`}>
                              <td colSpan={colCount} style={{
                                backgroundColor: currentPeriodo === 'Manhã' ? '#fef3c7' : '#fed7aa',
                                color: currentPeriodo === 'Manhã' ? '#78350f' : '#7c2d12',
                                padding: '8px 14px',
                                fontWeight: '800',
                                fontSize: '13px',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                borderTop: '2px solid #cbd5e1',
                              }}>
                                ◆ {currentPeriodo}
                              </td>
                            </tr>
                          );
                        }

                        if (currentMotoboy !== prevMotoboy || currentPeriodo !== prevPeriodo) {
                          rows.push(
                            <tr key={`motoboy-${currentMotoboy}-${currentPeriodo}-${idx}`}>
                              <td colSpan={colCount} style={{
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1',
                                padding: '5px 24px',
                                fontWeight: '700',
                                fontSize: '12px',
                                borderBottom: '1px solid #bae6fd',
                                borderLeft: '4px solid #0ea5e9',
                              }}>
                                &#9658; {currentMotoboy}
                              </td>
                            </tr>
                          );
                        }

                        if (currentLocal !== prevLocal || currentMotoboy !== prevMotoboy || currentPeriodo !== prevPeriodo) {
                          rows.push(
                            <tr key={`local-${currentLocal}-${currentMotoboy}-${currentPeriodo}-${idx}`}>
                              <td colSpan={colCount} style={{
                                backgroundColor: '#f8fafc',
                                color: '#475569',
                                padding: '4px 38px',
                                fontWeight: '600',
                                fontSize: '11px',
                                borderBottom: '1px solid #e2e8f0',
                                borderLeft: '3px solid #94a3b8',
                              }}>
                                &#8250; {currentLocal}
                              </td>
                            </tr>
                          );
                        }

                        rows.push(
                          <tr
                            key={rom.id}
                            className={`border-b border-slate-200 ${selectionMode ? 'cursor-pointer hover:opacity-80' : ''}`}
                            style={{
                              ...getRowColor(rom.status),
                              ...(selectionMode && selectedIds.has(rom.id)
                                ? { outline: '2px solid #376295', outlineOffset: '-2px', backgroundColor: '#dbeafe' }
                                : {})
                            }}
                            onClick={(e) => {
                              if (!selectionMode) return;
                              const tag = e.target.tagName.toLowerCase();
                              if (tag === 'a' || tag === 'button' || tag === 'select' || tag === 'input' || e.target.closest('a, button, select, [role="combobox"], [role="listbox"]')) return;
                              toggleSelection(rom.id);
                            }}
                          >
                            {visualizarTodas && (
                              <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600 whitespace-nowrap">
                                {rom.data_entrega ? format(parseISO(rom.data_entrega), 'dd/MM/yyyy') : '-'}
                              </td>
                            )}
                            <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600">
                              {rom.atendente || '-'}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 font-mono text-slate-700">
                              {rom.requisicao || '-'}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 font-medium text-slate-800">
                              {rom.cliente?.nome || '-'}{rom.clientesAdicionais?.length > 0 && `, ${rom.clientesAdicionais.map(c => c.nome).join(', ')}`}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600">
                              {rom.cliente?.telefone ? rom.cliente.telefone.replace(/\D/g, '') : '-'}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600 max-w-[200px] truncate obs-cell-pdf">
                              {(rom.observacoes?.replace(/^\|\|H:.*?\|\|\s*/, '') || '-')}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                rom.forma_pagamento?.includes('Aguardando') ? 'font-bold' :
                                rom.forma_pagamento === 'Pago' ? 'text-green-700' :
                                rom.forma_pagamento === 'Dinheiro' ? 'text-blue-700' :
                                rom.forma_pagamento === 'Cartão' ? 'text-purple-700' :
                                'bg-slate-100 text-slate-700'
                              }`} style={{
                                backgroundColor: rom.forma_pagamento?.includes('Aguardando') ? '#fef3c7' :
                                  rom.forma_pagamento === 'Pago' ? '#E8F5E8' :
                                  rom.forma_pagamento === 'Dinheiro' ? '#E8F0F8' :
                                  rom.forma_pagamento === 'Cartão' ? '#F5E8F5' : undefined,
                                color: rom.forma_pagamento?.includes('Aguardando') ? '#92400e' : undefined
                              }}>
                                {rom.forma_pagamento || '-'}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200">
                              {rom.valor_venda > 0 ? (
                                <span
                                  className={`px-2 py-1 rounded font-semibold text-[11px] ${
                                    rom.pagamento_recebido === true
                                      ? 'bg-green-500 text-white'
                                      : rom.pagamento_recebido === false
                                      ? 'bg-red-500 text-white'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                  title={rom.pagamento_recebido === true ? 'Pago' : rom.pagamento_recebido === false ? 'Não Recebido' : 'Cobrar'}
                                >
                                  R$ {parseFloat(rom.valor_venda).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-slate-600">
                              {rom.precisa_troco && rom.valor_troco > 0 ? `R$ ${parseFloat(rom.valor_troco).toFixed(2)}` : '-'}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200">
                              {(rom.horario_entrega || rom.observacoes?.match(/^\|\|H:(.*?)\|\|/)?.[1]) ? (
                                <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 5px', borderRadius: '4px', fontWeight: '700', fontSize: '10px', whiteSpace: 'nowrap' }}>
                                  {rom.horario_entrega || rom.observacoes.match(/^\|\|H:(.*?)\|\|/)[1]}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200">
                              <CustomDropdown
                                options={[
                                  { value: 'Iniciar', label: 'Iniciar' },
                                  { value: 'Pendente', label: 'Pendente' },
                                  { value: 'Produzindo no Laboratório', label: 'Produção' },
                                  { value: 'Preparando no Setor de Entregas', label: 'Preparando' },
                                  { value: 'Em Rota', label: 'Em Rota' },
                                  { value: 'Entregue', label: 'Entregue' },
                                  { value: 'Voltou p/ Farmácia', label: 'Voltou p/ Farmácia' },
                                  { value: 'Cancelado', label: 'Cancelado' }
                                ]}
                                value={rom.status || 'Produzindo no Laboratório'}
                                onChange={(val) => handleQuickStatusUpdate(rom.id, val, 'romaneio')}
                                disabled={updateRomaneioMutation.isPending}
                              />
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-center">
                              {rom.buscar_receita ? (
                                <button
                                  onClick={() => updateReceitaMutation.mutate({ id: rom.id, recebida: !rom.receita_recebida })}
                                  disabled={updateReceitaMutation.isPending}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-all hover:opacity-80"
                                  style={{
                                    backgroundColor: rom.receita_recebida ? '#dcfce7' : '#fef3c7',
                                    color: rom.receita_recebida ? '#166534' : '#92400e',
                                    border: rom.receita_recebida ? '1px solid #22c55e' : '1px solid #f59e0b',
                                  }}
                                >
                                  {rom.receita_recebida ? 'Recebida' : 'Pendente'}
                                </button>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 border-r border-slate-200 text-slate-700 font-semibold">
                              R$ {rom.valor ? parseFloat(rom.valor).toFixed(2) : '0.00'}
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
                        );
                        return rows;
                      }, [])
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Barra de Seleção em Lote - Sedex/Disktenha */}
            {selectionModeSedex && (
              <div className="rounded-lg border-2 p-3 md:p-4 flex flex-wrap items-center justify-between gap-3 print-hide" style={{ borderColor: '#890d5d', backgroundColor: '#fdf4ff' }}>
                <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                  <span className="text-xs md:text-sm font-bold" style={{ color: '#890d5d' }}>
                    {selectedSedexIds.size > 0
                      ? `${selectedSedexIds.size} selecionada${selectedSedexIds.size > 1 ? 's' : ''}`
                      : 'Clique para selecionar'}
                  </span>
                  <button
                    onClick={() => {
                      const allSelected = sedexDisktenha.length > 0 && sedexDisktenha.every(e => selectedSedexIds.has(e.id));
                      if (allSelected) {
                        setSelectedSedexIds(new Set());
                      } else {
                        setSelectedSedexIds(new Set(sedexDisktenha.map(e => e.id)));
                      }
                    }}
                    className="text-xs md:text-sm font-semibold underline"
                    style={{ color: '#890d5d' }}
                  >
                    {sedexDisktenha.length > 0 && sedexDisktenha.every(e => selectedSedexIds.has(e.id))
                      ? 'Desmarcar'
                      : 'Todas'}
                  </button>
                  {selectedSedexIds.size > 0 && (
                    <button
                      onClick={() => setSelectedSedexIds(new Set())}
                      className="text-xs md:text-sm text-slate-500 hover:text-slate-700 underline"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                    <span className="text-xs md:text-sm text-slate-600 font-medium">Status:</span>
                    {[
                      { status: 'Pendente', bg: '#fef3c7', color: '#92400e' },
                      { status: 'Em Trânsito', label: 'Trânsito', bg: '#dbeafe', color: '#1e40af' },
                      { status: 'Entregue', bg: '#dcfce7', color: '#166534' },
                      { status: 'Devolvido', bg: '#fee2e2', color: '#dc2626' },
                    ].map(item => (
                      <button
                        key={item.status}
                        onClick={() => handleBulkSedexStatusChange(item.status)}
                        className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all hover:opacity-80"
                        style={{ backgroundColor: item.bg, color: item.color }}
                      >
                        {item.label || item.status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tabela Sedex/Disktenha */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-3 md:px-4 py-2 md:py-3 flex items-center justify-between" style={{ backgroundColor: '#890d5d' }}>
                <h2 className="text-white font-bold text-sm md:text-lg">SEDEX / DISKTENHA</h2>
                <button
                  onClick={() => {
                    setSelectionModeSedex(!selectionModeSedex);
                    if (selectionModeSedex) setSelectedSedexIds(new Set());
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all print-hide ${
                    selectionModeSedex
                      ? 'bg-white text-[#890d5d]'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <MousePointerClick className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{selectionModeSedex ? 'Cancelar' : 'Selecionar'}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-blue-50 border-b border-blue-200">
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Tipo</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Atendente</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Requisição</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Cliente</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Remetente</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Código Rastreio</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Valor</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Forma de Pgto</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Data Saída</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Status</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-blue-200">Observações</th>
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 print-hide">Ver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingSedex ? (
                      <tr>
                        <td colSpan="12" className="p-8 text-center text-slate-500">
                          Carregando...
                        </td>
                      </tr>
                    ) : sedexDisktenha.length === 0 ? (
                      <tr>
                        <td colSpan="12" className="p-8 text-center text-slate-500">
                          Nenhuma entrega Sedex/Disktenha encontrada
                        </td>
                      </tr>
                    ) : (
                      sedexDisktenha.map((entrega) => (
                        <tr
                          key={entrega.id}
                          onClick={() => selectionModeSedex && toggleSedexSelection(entrega.id)}
                          className={`border-b border-blue-200 ${selectionModeSedex ? 'cursor-pointer hover:opacity-80' : ''}`}
                          style={{
                            ...getSedexRowColor(entrega.status),
                            ...(selectionModeSedex && selectedSedexIds.has(entrega.id)
                              ? { outline: '2px solid #890d5d', outlineOffset: '-2px', backgroundColor: '#f5d0fe' }
                              : {})
                          }}
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
                          <td className="px-2 py-1.5 border-r border-blue-200 text-slate-600">
                            {entrega.atendente || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-blue-200 text-slate-700">
                            {entrega.numero_requisicao || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-blue-200 font-medium text-slate-800">
                            {entrega.cliente}
                          </td>
                          <td className="px-2 py-1.5 border-r border-blue-200 text-slate-600">
                            {entrega.remetente || '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-blue-200 font-mono text-slate-700">
                            {entrega.codigo_rastreio && !entrega.codigo_rastreio.startsWith('PENDING-') ? entrega.codigo_rastreio : '-'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-blue-200 text-slate-700 font-semibold">
                            R$ {entrega.valor ? parseFloat(entrega.valor).toFixed(2) : '0.00'}
                          </td>
                          <td className="px-2 py-1.5 border-r border-blue-200">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{
                              backgroundColor: entrega.forma_pagamento?.includes('Aguardando') ? '#fef3c7' : '#dcfce7',
                              color: entrega.forma_pagamento?.includes('Aguardando') ? '#92400e' : '#166534',
                              fontWeight: entrega.forma_pagamento?.includes('Aguardando') ? '700' : '500'
                            }}>
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
                              disabled={updateSedexMutation.isPending || selectionModeSedex}
                              className="text-[10px]"
                            />
                          </td>
                          <td className="px-2 py-1.5 border-r border-blue-200 text-slate-600 max-w-[200px] truncate">
                            {entrega.observacoes || '-'}
                          </td>
                          <td className="px-2 py-1.5 print-hide">
                            <Link
                              to={`/sedex-detalhes?id=${entrega.id}`}
                              className="hover:opacity-80 transition-opacity"
                              style={{ color: '#890d5d' }}
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
