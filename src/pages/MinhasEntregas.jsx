
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label"; // Added import
import { Input } from "@/components/ui/input"; // Added import
import {
  Package,
  MapPin,
  Phone,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Snowflake,
  Navigation,
  AlertCircle,
  DollarSign,
  FileText,
  Printer,
  GripVertical,
  Upload, // Added import
  X, // Added import
  Image as ImageIcon // Added import
} from "lucide-react";
import { format, parseISO, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function MinhasEntregas() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRomaneio, setSelectedRomaneio] = useState(null);
  const [showConcluirDialog, setShowConcluirDialog] = useState(false);
  const [showProblemaDialog, setShowProblemaDialog] = useState(false);
  const [motivoProblema, setMotivoProblema] = useState("");
  const [filtroLocal, setFiltroLocal] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [ordenacaoCustomizada, setOrdenacaoCustomizada] = useState({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [showImageDialog, setShowImageDialog] = useState(false); // New state
  const [selectedFiles, setSelectedFiles] = useState([]); // New state
  const [imagemTipo, setImagemTipo] = useState(""); // New state
  const [romaneioParaImagem, setRomaneioParaImagem] = useState(null); // New state

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.tipo_usuario === 'admin' || user?.role === 'admin';
  // const isMotoboy = user?.tipo_usuario === 'entregador'; // Not directly used in the query filter, but useful for context

  const { data: romaneios, isLoading } = useQuery({
    queryKey: ['minhas-entregas', user?.full_name],
    queryFn: async () => {
      if (!user) return [];
      const todos = await base44.entities.Romaneio.list('-created_date');

      // Se for admin ou o usuário específico, mostrar entregas de todos os motoboys
      if (isAdmin || user.email === 'mariaizabeldelima0@gmail.com') { // Specific user override
        return todos.filter(r =>
          r.status !== 'Entregue' &&
          r.status !== 'Cancelado'
        );
      }

      // Se for motoboy, filtrar apenas suas entregas
      return todos.filter(r =>
        r.motoboy === user.full_name &&
        r.status !== 'Entregue' &&
        r.status !== 'Cancelado'
      );
    },
    enabled: !!user,
    initialData: [],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, motivo }) => {
      const data = {
        status,
        ...(status === 'Entregue' && { data_entrega_realizada: new Date().toISOString() }),
        ...(motivo && { motivo_nao_entrega: motivo })
      };
      return base44.entities.Romaneio.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-entregas'] });
      toast.success('Status atualizado!');
      setShowConcluirDialog(false);
      setShowProblemaDialog(false);
      setSelectedRomaneio(null);
      setMotivoProblema("");
    },
  });

  // New mutation for image uploads
  const uploadImagesMutation = useMutation({
    mutationFn: async ({ romaneioId, files, tipo }) => {
      const uploadPromises = files.map(async (file) => {
        // Ensure the file object passed to UploadFile is correct
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return { url: file_url, tipo };
      });

      const novasImagens = await Promise.all(uploadPromises);
      const romaneio = romaneios.find(r => r.id === romaneioId);
      const imagensAtuais = romaneio.imagens || [];

      return base44.entities.Romaneio.update(romaneioId, {
        imagens: [...imagensAtuais, ...novasImagens]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-entregas'] });
      toast.success('Imagens anexadas com sucesso!');
      setShowImageDialog(false);
      setSelectedFiles([]);
      setImagemTipo("");
      setRomaneioParaImagem(null);
    },
    onError: (error) => {
      console.error("Erro ao anexar imagens:", error);
      toast.error('Erro ao anexar imagens');
    }
  });


  // Salvar ordenação customizada
  const saveOrdenacaoMutation = useMutation({
    mutationFn: async (ordenacao) => {
      // Salvar no localStorage por enquanto
      const key = `ordenacao_${user?.email}_${format(selectedDate, 'yyyy-MM-dd')}`;
      localStorage.setItem(key, JSON.stringify(ordenacao));
      return ordenacao;
    },
    onSuccess: () => {
      // toast.success('Ordem das entregas salva!'); // Keep this silent, avoid too many toasts on drag
    },
  });

  // Carregar ordenação salva
  useEffect(() => {
    if (user && selectedDate) {
      const key = `ordenacao_${user.email}_${format(selectedDate, 'yyyy-MM-dd')}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setOrdenacaoCustomizada(JSON.parse(saved));
        } catch (e) {
          console.error("Erro ao carregar ordenação:", e);
        }
      } else {
        setOrdenacaoCustomizada({});
      }
    }
  }, [user, selectedDate]);

  // Filtrar entregas do dia selecionado
  const romaneiosDoDia = romaneios.filter(r => {
    if (!r.data_entrega_prevista) return false;
    const dataEntrega = parseISO(r.data_entrega_prevista);
    if (!isSameDay(dataEntrega, selectedDate)) return false;

    // Aplicar filtros
    if (filtroLocal !== "todos" && r.cidade_regiao !== filtroLocal) return false;
    if (filtroPeriodo !== "todos" && r.periodo_entrega !== filtroPeriodo) return false;

    return true;
  });

  // Calcular estatísticas do dia
  const statsDoDia = romaneiosDoDia.reduce((acc, r) => {
    const local = r.cidade_regiao;
    if (!acc[local]) {
      acc[local] = {
        quantidade: 0,
        valor: 0
      };
    }
    acc[local].quantidade += 1;
    acc[local].valor += r.valor_entrega || 0;
    return acc;
  }, {});

  const totalDoDia = Object.values(statsDoDia).reduce((sum, stat) => sum + stat.valor, 0);

  // Calcular estatísticas da semana (Terça a Segunda)
  const getTuesdayStartOfWeek = (date) => {
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // weekStartsOn: 2 makes Tuesday the start of the week for `startOfWeek`
    const start = startOfWeek(date, { weekStartsOn: 2 });
    return start;
  };

  const currentWeekStart = addWeeks(getTuesdayStartOfWeek(selectedDate), weekOffset);
  const weekStart = currentWeekStart;
  const weekEnd = addDays(currentWeekStart, 6); // 6 days from Tuesday = Monday

  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekStats = daysOfWeek.map(day => {
    const romaneiosDoDiaParaEstatistica = romaneios.filter(r => {
      if (!r.data_entrega_prevista) return false;
      const dataEntrega = parseISO(r.data_entrega_prevista);
      return isSameDay(dataEntrega, day) && r.status !== 'Cancelado';
    });

    const total = romaneiosDoDiaParaEstatistica.reduce((sum, r) => sum + (r.valor_entrega || 0), 0);

    return {
      dia: format(day, 'EEE', { locale: ptBR }),
      data: format(day, 'dd/MM'),
      valor: total,
      quantidade: romaneiosDoDiaParaEstatistica.length
    };
  });

  const totalDaSemana = weekStats.reduce((sum, stat) => sum + stat.valor, 0);

  // Status de pagamento da semana (apenas o primeiro dia com romaneios, ou padrão)
  const primeiroRomaneioDaSemana = romaneios.find(r => {
    if (!r.data_entrega_prevista) return false;
    const dataEntrega = parseISO(r.data_entrega_prevista);
    return dataEntrega >= weekStart && dataEntrega <= weekEnd;
  });
  const statusPagamentoSemana = primeiroRomaneioDaSemana?.status_pagamento_motoboy || "Aguardando";


  // Locais únicos para o filtro
  const locaisUnicos = [...new Set(romaneios
    .filter(r => r.data_entrega_prevista && isSameDay(parseISO(r.data_entrega_prevista), selectedDate))
    .map(r => r.cidade_regiao))].sort();

  // Aplicar ordenação customizada
  const aplicarOrdenacao = (romaneiosList) => {
    const dataKey = format(selectedDate, 'yyyy-MM-dd');
    const ordemSalva = ordenacaoCustomizada[dataKey];

    if (!ordemSalva || ordemSalva.length === 0) {
      // Ordenação padrão: por local e depois por período
      return [...romaneiosList].sort((a, b) => {
        const localCompare = a.cidade_regiao.localeCompare(b.cidade_regiao);
        if (localCompare !== 0) return localCompare;
        if (a.periodo_entrega !== b.periodo_entrega) {
          return a.periodo_entrega === "Manhã" ? -1 : 1;
        }
        return 0;
      });
    }

    // Ordenação customizada
    // Filter out items not present in the current romaneiosList before sorting
    const filteredOrdemSalva = ordemSalva.filter(id => romaneiosList.some(r => r.id === id));

    // Sort romaneiosList based on filteredOrdemSalva
    const sortedRomaneios = [...romaneiosList].sort((a, b) => {
      const indexA = filteredOrdemSalva.indexOf(a.id);
      const indexB = filteredOrdemSalva.indexOf(b.id);

      // Items not in filteredOrdemSalva go to the end, maintaining their relative order
      if (indexA === -1 && indexB === -1) {
        // Fallback to default sort for items not in custom order
        const localCompare = a.cidade_regiao.localeCompare(b.cidade_regiao);
        if (localCompare !== 0) return localCompare;
        if (a.periodo_entrega !== b.periodo_entrega) {
          return a.periodo_entrega === "Manhã" ? -1 : 1;
        }
        return 0;
      }
      if (indexA === -1) return 1; // a is not in custom order, b is, so b comes first
      if (indexB === -1) return -1; // b is not in custom order, a is, so a comes first

      return indexA - indexB;
    });

    return sortedRomaneios;
  };

  const romaneiosOrdenados = aplicarOrdenacao(romaneiosDoDia);

  // Agrupar por local (using the custom-ordered list)
  const romaneiosPorLocal = romaneiosOrdenados.reduce((acc, r) => {
    if (!acc[r.cidade_regiao]) {
      acc[r.cidade_regiao] = [];
    }
    acc[r.cidade_regiao].push(r);
    return acc;
  }, {});

  const handleIniciarEntrega = (romaneio) => {
    updateStatusMutation.mutate({ id: romaneio.id, status: 'A Caminho' });
  };

  const handleConcluir = () => {
    if (selectedRomaneio) {
      updateStatusMutation.mutate({ id: selectedRomaneio.id, status: 'Entregue' });
    }
  };

  const handleProblema = () => {
    if (!motivoProblema.trim()) {
      toast.error('Descreva o motivo do problema');
      return;
    }
    if (selectedRomaneio) {
      updateStatusMutation.mutate({
        id: selectedRomaneio.id,
        status: 'Não Entregue',
        motivo: motivoProblema
      });
    }
  };

  const abrirNavegacao = (romaneio) => {
    const end = romaneio.endereco;
    const endereco = `${end.rua}, ${end.numero}, ${end.bairro}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    // We operate on the flat romaneiosOrdenados list for reordering
    const items = Array.from(romaneiosOrdenados);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const dataKey = format(selectedDate, 'yyyy-MM-dd');
    const novaOrdem = items.map(item => item.id);

    // Update local state first for immediate UI feedback
    setOrdenacaoCustomizada(prev => ({
      ...prev,
      [dataKey]: novaOrdem
    }));

    // Then save to persistent storage
    saveOrdenacaoMutation.mutate({
      ...ordenacaoCustomizada,
      [dataKey]: novaOrdem
    });
  };

  // Verificar se precisa cobrar valor
  const precisaCobrar = (romaneio) => {
    return romaneio.valor_pagamento &&
      ["Dinheiro", "Maquina", "Troco P/"].includes(romaneio.forma_pagamento);
  };

  // New handlers for image upload dialog
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUploadImages = () => {
    if (!imagemTipo) {
      toast.error('Selecione o tipo da imagem');
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error('Selecione pelo menos uma imagem');
      return;
    }
    if (romaneioParaImagem) {
      uploadImagesMutation.mutate({
        romaneioId: romaneioParaImagem.id,
        files: selectedFiles,
        tipo: imagemTipo
      });
    }
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      "Pendente": { color: "bg-slate-100 text-slate-700", icon: Clock },
      "A Caminho": { color: "bg-purple-100 text-purple-700", icon: Package },
      "Entregue": { color: "bg-green-100 text-green-700", icon: CheckCircle },
      "Não Entregue": { color: "bg-red-100 text-red-700", icon: XCircle },
    };
    const { color, icon: Icon } = configs[status] || configs["Pendente"];
    return (
      <Badge className={`${color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const EntregaCard = ({ romaneio, index, isDragging }) => {
    const deveSerCobrado = precisaCobrar(romaneio);

    return (
      <Card className={`border-slate-200 hover:shadow-lg transition-shadow ${deveSerCobrado ? 'ring-2 ring-orange-400' : ''} ${isDragging ? 'shadow-2xl' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <Badge variant="outline" className="font-mono">#{index + 1}</Badge>
                  <CardTitle className="text-lg">REQ #{romaneio.numero_requisicao}</CardTitle>
                  <StatusBadge status={romaneio.status} />
                  {romaneio.item_geladeira && (
                    <Badge className="bg-cyan-100 text-cyan-700 border-cyan-300">
                      <Snowflake className="w-3 h-3 mr-1" />
                      GELADEIRA
                    </Badge>
                  )}
                  {deveSerCobrado && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-400 border-2 font-bold">
                      <DollarSign className="w-4 h-4 mr-1" />
                      COBRAR
                    </Badge>
                  )}
                  {romaneio.valor_entrega && (
                    <Badge className="bg-green-100 text-green-700 border-green-300 font-bold">
                      💰 R$ {romaneio.valor_entrega.toFixed(2)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 font-medium">{romaneio.cliente_nome}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {romaneio.periodo_entrega}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Valor a Cobrar em Destaque */}
          {deveSerCobrado && (
            <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4">
              <p className="text-xs font-bold text-orange-700 mb-1">💰 COBRAR NA ENTREGA:</p>
              <p className="text-2xl font-bold text-orange-900">
                R$ {romaneio.valor_pagamento.toFixed(2)}
              </p>
              {romaneio.valor_troco && (
                <p className="text-sm text-orange-700 mt-1">
                  Troco para: R$ {romaneio.valor_troco.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Endereço */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#457bba] mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-slate-900">
                  {romaneio.endereco.rua}, {romaneio.endereco.numero}
                </p>
                <p className="text-slate-600">{romaneio.endereco.bairro} - {romaneio.cidade_regiao}</p>
                {romaneio.endereco.complemento && (
                  <p className="text-slate-500">{romaneio.endereco.complemento}</p>
                )}
                {romaneio.endereco.ponto_referencia && (
                  <p className="text-slate-500 italic">Ref: {romaneio.endereco.ponto_referencia}</p>
                )}
                {romaneio.endereco.aos_cuidados_de && (
                  <p className="text-slate-600 font-medium">A/C: {romaneio.endereco.aos_cuidados_de}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full no-print"
              onClick={() => abrirNavegacao(romaneio)}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Abrir no Mapa
            </Button>
          </div>

          {/* Informações de Pagamento */}
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <span className="font-medium">{romaneio.forma_pagamento}</span>
          </div>

          {/* Telefone */}
          {romaneio.cliente_telefone && (
            <a
              href={`tel:${romaneio.cliente_telefone}`}
              className="flex items-center gap-2 text-sm text-[#457bba] hover:underline no-print"
            >
              <Phone className="w-4 h-4" />
              {romaneio.cliente_telefone}
            </a>
          )}

          {/* Observações */}
          {romaneio.observacoes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-yellow-800 mb-1">OBSERVAÇÕES:</p>
              <p className="text-sm text-yellow-900">{romaneio.observacoes}</p>
            </div>
          )}

          {romaneio.endereco.observacoes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-800 mb-1">OBS. DO ENDEREÇO:</p>
              <p className="text-sm text-blue-900">{romaneio.endereco.observacoes}</p>
            </div>
          )}

          {/* Seção de Imagens */}
          {romaneio.imagens && romaneio.imagens.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-700 mb-2">Imagens Anexadas:</p>
              <div className="grid grid-cols-3 gap-2">
                {romaneio.imagens.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img.url}
                      alt={`Imagem ${idx + 1}`}
                      className="w-full h-16 object-cover rounded border border-slate-200"
                      onClick={() => window.open(img.url, '_blank')} // Open image in new tab
                      style={{ cursor: 'pointer' }}
                    />
                    <Badge
                      className={`absolute top-1 left-1 text-xs ${
                        img.tipo === 'pagamento'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {img.tipo === 'pagamento' ? 'Pag' : 'Rec'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-2 no-print">
            {romaneio.status === 'Pendente' && (
              <Button
                className="flex-1 bg-[#457bba] hover:bg-[#3a6ba0]"
                onClick={() => handleIniciarEntrega(romaneio)}
              >
                Iniciar Entrega
              </Button>
            )}
            {romaneio.status === 'A Caminho' && (
              <>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setSelectedRomaneio(romaneio);
                    setShowConcluirDialog(true);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Concluir
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setSelectedRomaneio(romaneio);
                    setShowProblemaDialog(true);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Problema
                </Button>
              </>
            )}
            {/* New Upload Button */}
            {(romaneio.status === 'A Caminho' || romaneio.status === 'Pendente') && (
              <Button
                variant="outline"
                size="icon" // changed to icon size for a smaller button
                onClick={() => {
                  setRomaneioParaImagem(romaneio);
                  setShowImageDialog(true);
                }}
                className="no-print"
              >
                <Upload className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center no-print">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                Minhas Entregas
              </h1>
              <p className="text-slate-600">
                Olá, <span className="font-semibold text-[#457bba]">{user?.full_name}</span>
              </p>
            </div>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Relatório
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendário e Resumos */}
            <div className="space-y-6">
              <Card className="border-none shadow-lg no-print">
                <CardHeader>
                  <CardTitle className="text-lg">Selecione o Dia</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                    className="rounded-md border"
                  />
                  <div className="mt-4 text-center">
                    <p className="text-sm font-semibold text-slate-900">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {romaneiosDoDia.length} entrega{romaneiosDoDia.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo do Dia */}
              {Object.keys(statsDoDia).length > 0 && (
                <Card className="border-none shadow-lg bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-green-900">Resumo do Dia</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(statsDoDia).sort((a, b) => a[0].localeCompare(b[0])).map(([local, stats]) => (
                      <div key={local} className="flex justify-between items-center text-sm">
                        <span className="text-slate-700">{local}</span>
                        <div className="text-right">
                          <span className="font-medium text-slate-900">{stats.quantidade}x</span>
                          <span className="text-green-700 font-bold ml-2">R$ {stats.valor.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t-2 border-green-300 flex justify-between items-center font-bold">
                      <span className="text-green-900">TOTAL DO DIA</span>
                      <span className="text-green-900 text-lg">R$ {totalDoDia.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Resumo da Semana (Terça a Segunda) */}
              <Card className={`border-none shadow-lg ${statusPagamentoSemana === "Pago" ? "bg-green-50" : "bg-blue-50"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`text-sm ${statusPagamentoSemana === "Pago" ? "text-green-900" : "text-blue-900"}`}>
                        Semana • {statusPagamentoSemana}
                      </CardTitle>
                      <p className={`text-xs ${statusPagamentoSemana === "Pago" ? "text-green-700" : "text-blue-700"}`}>
                        {format(weekStart, 'dd/MM', { locale: ptBR })} - {format(weekEnd, 'dd/MM', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setWeekOffset(prev => prev - 1)}
                      >
                        ←
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setWeekOffset(prev => prev + 1)}
                      >
                        →
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {weekStats.map((stat, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className={`w-12 ${statusPagamentoSemana === "Pago" ? "text-green-700" : "text-slate-700"}`}>{stat.dia}</span>
                      <span className={`text-xs ${statusPagamentoSemana === "Pago" ? "text-green-600" : "text-slate-500"}`}>{stat.data}</span>
                      <span className={statusPagamentoSemana === "Pago" ? "text-green-700" : "text-slate-600"}>{stat.quantidade}x</span>
                      <span className={`font-bold ${statusPagamentoSemana === "Pago" ? "text-green-800" : "text-blue-700"}`}>R$ {stat.valor.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className={`pt-2 border-t-2 ${statusPagamentoSemana === "Pago" ? "border-green-400" : "border-blue-300"} flex justify-between items-center font-bold text-sm`}>
                    <span className={statusPagamentoSemana === "Pago" ? "text-green-900" : "text-blue-900"}>TOTAL</span>
                    <span className={statusPagamentoSemana === "Pago" ? "text-green-900" : "text-blue-900"}>R$ {totalDaSemana.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Entregas */}
            <div className="lg:col-span-3 space-y-6">
              {/* Filtros - no-print */}
              <Card className="border-none shadow-lg no-print">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Local</label>
                      <Select value={filtroLocal} onValueChange={setFiltroLocal}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os locais" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os Locais</SelectItem>
                          {locaisUnicos.map(local => (
                            <SelectItem key={local} value={local}>{local}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Período</label>
                      <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os períodos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os Períodos</SelectItem>
                          <SelectItem value="Manhã">Manhã</SelectItem>
                          <SelectItem value="Tarde">Tarde</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {(filtroLocal !== "todos" || filtroPeriodo !== "todos") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setFiltroLocal("todos");
                        setFiltroPeriodo("todos");
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Cabeçalho para impressão */}
              <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-bold text-center mb-2">
                  Relatório de Entregas - {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                </h1>
                <p className="text-center text-sm text-slate-600">
                  Total: {romaneiosDoDia.length} entregas
                </p>
                {filtroLocal !== "todos" && <p className="text-center text-sm text-slate-600">Local: {filtroLocal}</p>}
                {filtroPeriodo !== "todos" && <p className="text-center text-sm text-slate-600">Período: {filtroPeriodo}</p>}
              </div>

              {/* Instrução de arrastar */}
              {!isLoading && romaneiosDoDia.length > 0 && (
                <Card className="border-none shadow-lg bg-blue-50 border-blue-200 no-print">
                  <CardContent className="p-4">
                    <p className="text-sm text-blue-900 flex items-center gap-2">
                      <GripVertical className="w-4 h-4" />
                      Arraste as entregas para reorganizar sua rota
                    </p>
                  </CardContent>
                </Card>
              )}

              {isLoading ? (
                <Card className="border-none shadow-lg">
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Carregando...</p>
                  </CardContent>
                </Card>
              ) : romaneiosDoDia.length === 0 ? (
                <Card className="border-none shadow-lg no-print">
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Nenhuma entrega para este dia</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Selecione outro dia no calendário
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="all-deliveries">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {romaneiosOrdenados.map((romaneio, index) => {
                          let header = null;
                          if (index === 0 || romaneio.cidade_regiao !== romaneiosOrdenados[index - 1]?.cidade_regiao) {
                            header = (
                              <h2 className="text-xl font-bold text-slate-900 mt-6 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-[#457bba]" />
                                {romaneio.cidade_regiao} ({romaneiosOrdenados.filter(r => r.cidade_regiao === romaneio.cidade_regiao).length})
                              </h2>
                            );
                          }
                          return (
                            <React.Fragment key={romaneio.id}>
                              {header}
                              <Draggable
                                key={romaneio.id}
                                draggableId={romaneio.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <EntregaCard
                                      romaneio={romaneio}
                                      index={index}
                                      isDragging={snapshot.isDragging}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            </React.Fragment>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>

          {/* Dialog para Upload de Imagens */}
          <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Anexar Imagens</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="image-type">Tipo de Imagem *</Label>
                  <Select value={imagemTipo} onValueChange={setImagemTipo}>
                    <SelectTrigger id="image-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagamento">Comprovante de Pagamento</SelectItem>
                      <SelectItem value="receita">Receita Médica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="image-files">Selecione as Imagens *</Label>
                  <Input
                    id="image-files"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  {selectedFiles.length > 0 && (
                    <p className="text-sm text-slate-600 mt-2">
                      {selectedFiles.length} arquivo(s) selecionado(s)
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowImageDialog(false);
                      setSelectedFiles([]);
                      setImagemTipo("");
                      setRomaneioParaImagem(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUploadImages}
                    disabled={uploadImagesMutation.isPending || !imagemTipo || selectedFiles.length === 0}
                    className="bg-[#457bba] hover:bg-[#3a6ba0]"
                  >
                    {uploadImagesMutation.isPending ? 'Enviando...' : 'Anexar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Concluir */}
          <Dialog open={showConcluirDialog} onOpenChange={setShowConcluirDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Entrega</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Confirma que a entrega foi realizada com sucesso?</p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowConcluirDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleConcluir}
                    disabled={updateStatusMutation.isPending}
                  >
                    Confirmar Entrega
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Problema */}
          <Dialog open={showProblemaDialog} onOpenChange={setShowProblemaDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reportar Problema</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Descreva o motivo da não entrega *
                  </label>
                  <Textarea
                    value={motivoProblema}
                    onChange={(e) => setMotivoProblema(e.target.value)}
                    placeholder="Ex: Cliente ausente, endereço não localizado..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowProblemaDialog(false);
                      setMotivoProblema("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleProblema}
                    disabled={updateStatusMutation.isPending}
                  >
                    Confirmar Problema
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
