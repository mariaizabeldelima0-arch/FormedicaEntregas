import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  FileText,
  Package,
  Clock,
  CheckCircle,
  Plus,
  Search,
  CalendarIcon,
  MapPin,
  User,
  Truck,
  Snowflake,
  AlertCircle,
  RotateCcw,
  Pencil
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";


const StatusBadge = ({ status }) => {
  const config = {
    "Pendente": { color: "bg-slate-100 text-slate-700 border-slate-300", icon: Clock },
    "Produzindo no Laboratório": { color: "bg-blue-100 text-blue-700 border-blue-300", icon: Package },
    "Preparando no Setor de Entregas": { color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: Package },
    "A Caminho": { color: "bg-purple-100 text-purple-700 border-purple-300", icon: Truck },
    "Entregue": { color: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle },
    "Não Entregue": { color: "bg-red-100 text-red-700 border-red-300", icon: AlertCircle },
    "Voltou": { color: "bg-orange-100 text-orange-700 border-orange-300", icon: RotateCcw },
    "Cancelado": { color: "bg-gray-100 text-gray-700 border-gray-300", icon: AlertCircle },
  };

  const { color, icon: Icon } = config[status] || config["Pendente"];

  return (
    <Badge className={`${color} border font-medium`}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Parse URL params para restaurar estado
  const urlParams = new URLSearchParams(location.search);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const dataParam = urlParams.get('data');
    return dataParam ? new Date(dataParam) : new Date();
  });
  const [filtroAtendente, setFiltroAtendente] = useState(urlParams.get('atendente') || "todos");
  const [filtroMotoboy, setFiltroMotoboy] = useState(urlParams.get('motoboy') || "todos");
  const [filtroLocal, setFiltroLocal] = useState(urlParams.get('local') || "todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState(urlParams.get('periodo') || "todos");
  const [filtroStatus, setFiltroStatus] = useState(urlParams.get('status') || "todos");
  const [searchTerm, setSearchTerm] = useState(urlParams.get('busca') || "");
  const [visualizacao, setVisualizacao] = useState(urlParams.get('view') || "dia");
  const [selectedRomaneios, setSelectedRomaneios] = useState([]);
  const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [showBulkPagamentoDialog, setShowBulkPagamentoDialog] = useState(false);
  const [showBulkReceitaDialog, setShowBulkReceitaDialog] = useState(false);
  const [bulkPagamentoStatus, setBulkPagamentoStatus] = useState("");
  const [bulkReceitaStatus, setBulkReceitaStatus] = useState("");

  // Atualizar URL quando estado mudar
  useEffect(() => {
    const params = new URLSearchParams();
    if (visualizacao === "dia") {
      params.set('data', format(selectedDate, 'yyyy-MM-dd'));
    }
    params.set('view', visualizacao);
    if (filtroAtendente !== "todos") params.set('atendente', filtroAtendente);
    if (filtroMotoboy !== "todos") params.set('motoboy', filtroMotoboy);
    if (filtroLocal !== "todos") params.set('local', filtroLocal);
    if (filtroPeriodo !== "todos") params.set('periodo', filtroPeriodo);
    if (filtroStatus !== "todos") params.set('status', filtroStatus);
    if (searchTerm) params.set('busca', searchTerm);
    
    navigate(`?${params.toString()}`, { replace: true });
  }, [selectedDate, visualizacao, filtroAtendente, filtroMotoboy, filtroLocal, filtroPeriodo, filtroStatus, searchTerm]);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      // Buscar dados completos do usuário na tabela usuarios
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', authUser.email)
        .single();

      return data;
    },
  });

  const { data: romaneios, isLoading } = useQuery({
    queryKey: ['entregas', user?.email],
    queryFn: async () => {
      if (!user) return [];

      // Buscar entregas com JOIN de motoboy e cliente
      let query = supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(nome, telefone, cpf),
          motoboy:motoboys(nome),
          atendente:usuarios!entregas_atendente_id_fkey(nome, email)
        `)
        .order('data_entrega', { ascending: false });

      // Se não for admin, filtrar por atendente
      if (user.tipo !== 'Admin') {
        query = query.eq('atendente_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar entregas:', error);
        return [];
      }

      // Transformar dados para o formato esperado pelo Dashboard
      return (data || []).map(entrega => ({
        id: entrega.id,
        numero_requisicao: entrega.requisicao,
        cliente_nome: entrega.cliente?.nome || '',
        cliente_telefone: entrega.cliente?.telefone || '',
        data_entrega_prevista: entrega.data_entrega,
        periodo_entrega: entrega.periodo,
        cidade_regiao: entrega.regiao,
        status: entrega.status,
        motoboy: entrega.motoboy?.nome || null,
        atendente_nome: entrega.atendente?.nome || '',
        atendente_email: entrega.atendente?.email || '',
        valor_entrega: entrega.valor,
        forma_pagamento: entrega.forma_pagamento,
        item_geladeira: entrega.item_geladeira,
        buscar_receita: entrega.buscar_receita,
        observacoes: entrega.observacoes,
        endereco: entrega.endereco_destino,
        horario_entrega: entrega.observacoes?.match(/^\|\|H:(.*?)\|\|/)?.[1] || null
      }));
    },
    enabled: !!user,
    initialData: [],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    staleTime: 0,
    gcTime: 0,
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }) => {
      const { error } = await supabase
        .from('entregas')
        .update(data)
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['receitas'] });
      toast.success(`${selectedRomaneios.length} entrega${selectedRomaneios.length !== 1 ? 's' : ''} atualizada${selectedRomaneios.length !== 1 ? 's' : ''}!`);
      // Reset all bulk dialog states
      setShowBulkStatusDialog(false);
      setSelectedRomaneios([]);
      setBulkStatus("");
      setShowBulkPagamentoDialog(false);
      setBulkPagamentoStatus("");
      setShowBulkReceitaDialog(false);
      setBulkReceitaStatus("");
    },
    onError: () => {
      toast.error('Erro ao atualizar entregas');
    }
  });


  // Filtrar romaneios
  const romaneiosFiltrados = romaneios.filter(r => {
    // Filtro de data
    if (visualizacao === "dia") {
      if (!r.data_entrega_prevista) return false;
      const dataEntrega = parseISO(r.data_entrega_prevista);
      if (!isSameDay(dataEntrega, selectedDate)) return false;
    }

    // Filtro de atendente
    if (filtroAtendente !== "todos" && r.atendente_email !== filtroAtendente) return false;

    // Filtro de motoboy
    if (filtroMotoboy !== "todos" && r.motoboy !== filtroMotoboy) return false;

    // Filtro de local
    if (filtroLocal !== "todos" && r.cidade_regiao !== filtroLocal) return false;

    // Filtro de período
    if (filtroPeriodo !== "todos" && r.periodo_entrega !== filtroPeriodo) return false;

    // Filtro de status
    if (filtroStatus !== "todos" && r.status !== filtroStatus) return false;

    // Busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      const match =
        r.cliente_nome?.toLowerCase().includes(termo) ||
        r.numero_requisicao?.toLowerCase().includes(termo) ||
        r.atendente_nome?.toLowerCase().includes(termo) ||
        r.cliente_telefone?.includes(termo);
      if (!match) return false;
    }

    return true;
  });

  // Organizar por período e local
  const romaneiosOrganizados = [...romaneiosFiltrados].sort((a, b) => {
    // Primeiro por período (Manhã antes de Tarde)
    if (a.periodo_entrega !== b.periodo_entrega) {
      return a.periodo_entrega === "Manhã" ? -1 : 1;
    }
    // Depois por local
    return a.cidade_regiao.localeCompare(b.cidade_regiao);
  });

  // Estatísticas
  const stats = {
    total: romaneiosFiltrados.length,
    pendente: romaneiosFiltrados.filter(r => r.status === 'Pendente').length,
    produzindo: romaneiosFiltrados.filter(r => r.status === 'Produzindo no Laboratório').length,
    preparando: romaneiosFiltrados.filter(r => r.status === 'Preparando no Setor de Entregas').length,
    aCaminho: romaneiosFiltrados.filter(r => r.status === 'A Caminho').length,
    entregues: romaneiosFiltrados.filter(r => r.status === 'Entregue').length,
    naoEntregue: romaneiosFiltrados.filter(r => r.status === 'Não Entregue').length,
    voltou: romaneiosFiltrados.filter(r => r.status === 'Voltou').length,
  };

  // Dados únicos para filtros
  const atendentesUnicos = [...new Set(romaneios.map(r => ({ email: r.atendente_email, nome: r.atendente_nome })))];
  const motoboysUnicos = [...new Set(romaneios.map(r => r.motoboy))].filter(Boolean); // Filter out null/undefined
  const locaisUnicos = [...new Set(romaneios.map(r => r.cidade_regiao))].filter(Boolean).sort(); // Filter out null/undefined

  // Datas com entregas (para destacar no calendário)
  const diasComEntregas = romaneios
    .filter(r => r.data_entrega_prevista)
    .map(r => parseISO(r.data_entrega_prevista));

  const handleSelectAll = () => {
    if (selectedRomaneios.length === romaneiosOrganizados.length) {
      setSelectedRomaneios([]);
    } else {
      setSelectedRomaneios(romaneiosOrganizados.map(r => r.id));
    }
  };

  const handleSelectRomaneio = (id) => {
    setSelectedRomaneios(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = () => {
    if (!bulkStatus) {
      toast.error('Selecione um status');
      return;
    }
    bulkUpdateMutation.mutate({
      ids: selectedRomaneios,
      data: { status: bulkStatus }
    });
  };

  const handleBulkPagamento = () => {
    if (!bulkPagamentoStatus) {
      toast.error('Selecione uma opção');
      return;
    }
    bulkUpdateMutation.mutate({
      ids: selectedRomaneios,
      data: { pagamento_recebido: bulkPagamentoStatus === "sim" }
    });
  };

  const handleBulkReceita = () => {
    if (!bulkReceitaStatus) {
      toast.error('Selecione uma opção');
      return;
    }
    bulkUpdateMutation.mutate({
      ids: selectedRomaneios,
      data: { receita_recebida: bulkReceitaStatus === "sim" }
    });
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Entregas Moto
            </h1>
            <p className="text-slate-600">
              Olá, <span className="font-semibold text-[#457bba]">
                {user?.usuario}
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant={visualizacao === "dia" ? "default" : "outline"}
              onClick={() => setVisualizacao("dia")}
              className={visualizacao === "dia" ? "bg-[#457bba] hover:bg-[#3a6ba0]" : ""}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Por Dia
            </Button>
            <Button
              variant={visualizacao === "todos" ? "default" : "outline"}
              onClick={() => setVisualizacao("todos")}
              className={visualizacao === "todos" ? "bg-[#457bba] hover:bg-[#3a6ba0]" : ""}
            >
              <FileText className="w-4 h-4 mr-2" />
              Todos
            </Button>
            <Link to={createPageUrl(`NovoRomaneio${visualizacao === "dia" ? `?data=${format(selectedDate, "yyyy-MM-dd")}` : ""}`)}>
              <Button className="bg-[#890d5d] hover:bg-[#6e0a4a] text-white shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Novo Romaneio
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
            {/* Stats Cards - Clicáveis */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setFiltroStatus("todos")}
                className="text-left"
              >
                <Card className={`border-none shadow-md hover:shadow-xl transition-shadow bg-white ${filtroStatus === "todos" ? "ring-2 ring-[#457bba]" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Total</p>
                        <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                          {stats.total}
                        </CardTitle>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <FileText className="w-6 h-6 text-[#457bba]" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </button>

              <button
                onClick={() => setFiltroStatus(filtroStatus === "Produzindo no Laboratório" ? "todos" : "Produzindo no Laboratório")}
                className="text-left"
              >
                <Card className={`border-none shadow-md hover:shadow-xl transition-shadow bg-white ${filtroStatus === "Produzindo no Laboratório" ? "ring-2 ring-blue-500" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Produção</p>
                        <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                          {stats.produzindo}
                        </CardTitle>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <Package className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </button>

              <button
                onClick={() => setFiltroStatus(filtroStatus === "A Caminho" ? "todos" : "A Caminho")}
                className="text-left"
              >
                <Card className={`border-none shadow-md hover:shadow-xl transition-shadow bg-white ${filtroStatus === "A Caminho" ? "ring-2 ring-[#890d5d]" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-slate-500 font-medium">A Caminho</p>
                        <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                          {stats.aCaminho}
                        </CardTitle>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl">
                        <Truck className="w-6 h-6 text-[#890d5d]" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </button>

              <button
                onClick={() => setFiltroStatus(filtroStatus === "Entregue" ? "todos" : "Entregue")}
                className="text-left"
              >
                <Card className={`border-none shadow-md hover:shadow-xl transition-shadow bg-white ${filtroStatus === "Entregue" ? "ring-2 ring-green-600" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Entregues</p>
                        <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                          {stats.entregues}
                        </CardTitle>
                      </div>
                      <div className="p-3 bg-green-50 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </button>
            </div>

            {/* Busca e Filtros */}
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Buscar e Filtrar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Calendário e Busca */}
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Calendário - apenas quando visualização é "dia" */}
                  {visualizacao === "dia" && (
                    <div className="flex-shrink-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        locale={ptBR}
                        className="rounded-xl border"
                        modifiers={{
                          hasDelivery: diasComEntregas
                        }}
                        modifiersStyles={{
                          hasDelivery: {
                            fontWeight: 'bold',
                            textDecoration: 'underline',
                            color: '#457bba'
                          }
                        }}
                      />
                      <div className="mt-2 text-center">
                        <p className="text-sm font-semibold text-slate-900">
                          {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-slate-500">
                          {stats.total} entrega{stats.total !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Busca e Filtros */}
                  <div className="flex-1 space-y-4">
                    {/* Busca */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por cliente, requisição, atendente ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Filtros */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos Status</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Produzindo no Laboratório">Produção</SelectItem>
                      <SelectItem value="Preparando no Setor de Entregas">Preparando</SelectItem>
                      <SelectItem value="A Caminho">A Caminho</SelectItem>
                      <SelectItem value="Entregue">Entregue</SelectItem>
                      <SelectItem value="Não Entregue">Não Entregue</SelectItem>
                      <SelectItem value="Voltou">Voltou</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filtroAtendente} onValueChange={setFiltroAtendente}>
                    <SelectTrigger>
                      <SelectValue placeholder="Atendente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos Atendentes</SelectItem>
                      {atendentesUnicos.map(a => (
                        <SelectItem key={a.email} value={a.email}>
                          {a.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filtroMotoboy} onValueChange={setFiltroMotoboy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Motoboy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos Motoboys</SelectItem>
                      {motoboysUnicos.map(m => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filtroLocal} onValueChange={setFiltroLocal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Local" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Locais</SelectItem>
                      {locaisUnicos.map(l => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Períodos</SelectItem>
                      <SelectItem value="Manhã">Manhã</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                    </div>

                    {(filtroAtendente !== "todos" || filtroMotoboy !== "todos" || filtroLocal !== "todos" || filtroPeriodo !== "todos" || filtroStatus !== "todos" || searchTerm) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFiltroAtendente("todos");
                          setFiltroMotoboy("todos");
                          setFiltroLocal("todos");
                          setFiltroPeriodo("todos");
                          setFiltroStatus("todos");
                          setSearchTerm("");
                        }}
                      >
                        Limpar Filtros
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Romaneios */}
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-xl font-bold text-slate-900">
                      {visualizacao === "dia"
                        ? `Entregas de ${format(selectedDate, "dd/MM/yyyy")}`
                        : "Todos os Romaneios"}
                    </CardTitle>
                    {visualizacao === "dia" && (
                      <Link to={createPageUrl(`Relatorios?data=${format(selectedDate, "yyyy-MM-dd")}`)}>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Relatório do Dia
                        </Button>
                      </Link>
                    )}
                  </div>
                  {selectedRomaneios.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-sm">
                        {selectedRomaneios.length} selecionada{selectedRomaneios.length !== 1 ? 's' : ''}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => setShowBulkStatusDialog(true)}
                        className="bg-[#457bba] text-white hover:bg-[#3a6ba0]"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Alterar Status
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRomaneios([])}
                      >
                        Limpar Seleção
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : romaneiosOrganizados.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Nenhum romaneio encontrado</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {visualizacao === "dia"
                        ? "Não há entregas agendadas para este dia"
                        : "Comece criando seu primeiro romaneio"}
                    </p>
                  </div>
                ) : (
                  <>
                    {romaneiosOrganizados.length > 0 && (
                      <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedRomaneios.length === romaneiosOrganizados.length && romaneiosOrganizados.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                          <span className="text-sm font-medium text-slate-700">
                            Selecionar todas as entregas ({romaneiosOrganizados.length})
                          </span>
                        </label>
                      </div>
                    )}
                    <div className="divide-y divide-slate-100">
                      {romaneiosOrganizados.map((romaneio) => (
                        <div
                          key={romaneio.id}
                          className={`p-6 hover:bg-slate-50 transition-colors ${
                            selectedRomaneios.includes(romaneio.id) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={selectedRomaneios.includes(romaneio.id)}
                              onCheckedChange={() => handleSelectRomaneio(romaneio.id)}
                              className="mt-1"
                            />
                            <Link
                              to={`/DetalhesRomaneio?id=${romaneio.id}`}
                              className="flex-1"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="font-bold text-slate-900 text-lg">
                                      #{romaneio.numero_requisicao}
                                    </h3>
                                    <Badge className="text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">
                                      <CalendarIcon className="w-3 h-3 mr-1" />
                                      {romaneio.data_entrega_prevista
                                        ? format(parseISO(romaneio.data_entrega_prevista), "dd/MM/yyyy", { locale: ptBR })
                                        : "Sem data"}
                                    </Badge>
                                    <StatusBadge status={romaneio.status} />
                                    {romaneio.item_geladeira && (
                                      <Badge className="bg-cyan-100 text-cyan-700 border-cyan-300 border">
                                        <Snowflake className="w-3 h-3 mr-1" />
                                        Geladeira
                                      </Badge>
                                    )}
                                    {romaneio.buscar_receita && (
                                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 border">
                                        <FileText className="w-3 h-3 mr-1" />
                                        Reter Receita
                                      </Badge>
                                    )}
                                    {romaneio.coleta && (
                                      <Badge className="border" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', borderColor: '#4caf50' }}>
                                        <Package className="w-3 h-3 mr-1" />
                                        Coleta
                                      </Badge>
                                    )}
                                    {romaneio.status === 'Entregue' && romaneio.buscar_receita && !romaneio.receita_recebida && (
                                      <Badge className="bg-red-100 text-red-700 border-red-400 border-2 font-bold animate-pulse">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        RECEITA NÃO RETIRADA
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {romaneio.periodo_entrega}
                                    </Badge>
                                    {romaneio.horario_entrega && (
                                      <Badge style={{ backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: '700' }}>
                                        {romaneio.horario_entrega}
                                      </Badge>
                                    )}
                                    {romaneio.valor_entrega && (
                                      <Badge className="bg-purple-100 text-purple-700 border-purple-300 border">
                                        Taxa: R$ {romaneio.valor_entrega.toFixed(2)}
                                      </Badge>
                                    )}
                                    {romaneio.pagamento_recebido && (
                                      <Badge className="bg-green-100 text-green-700">
                                        ✓ Pago
                                      </Badge>
                                    )}
                                    {romaneio.receita_recebida && (
                                      <Badge className="bg-blue-100 text-blue-700">
                                        ✓ Receita
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      <span className="font-medium">Cliente:</span>{' '}
                                      {romaneio.cliente_nome}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      <span className="font-medium">Região:</span>{' '}
                                      {romaneio.cidade_regiao}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Truck className="w-3 h-3" />
                                      <span className="font-medium">Motoboy:</span>{' '}
                                      {romaneio.motoboy}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      <span className="font-medium">Atendente:</span>{' '}
                                      {romaneio.atendente_nome}
                                    </div>
                                  </div>
                                  <div className="text-sm text-slate-500">
                                    <span className="font-medium">Pagamento:</span>{' '}
                                    <span style={romaneio.forma_pagamento?.includes('Aguardando') ? { backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' } : undefined}>{romaneio.forma_pagamento}</span>
                                    {romaneio.valor_troco && ` - R$ ${romaneio.valor_troco.toFixed(2)}`}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-slate-900">
                                    {romaneio.data_entrega_prevista &&
                                      format(parseISO(romaneio.data_entrega_prevista), "dd/MM/yyyy", { locale: ptBR })}
                                  </div>
                                  <div className="text-xs text-slate-400 mt-1">
                                    {romaneio.periodo_entrega}
                                  </div>
                                  {romaneio.horario_entrega && (
                                    <div style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '1px 5px', borderRadius: '4px', fontWeight: '700', fontSize: '0.65rem', marginTop: '2px', display: 'inline-block' }}>
                                      {romaneio.horario_entrega}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Link>
                            <Link to={`/editar-romaneio?id=${romaneio.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Pencil className="w-3 h-3" />
                                Editar
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
        </div>

        {/* Dialog para Alterar Status em Lote */}
        <Dialog open={showBulkStatusDialog} onOpenChange={setShowBulkStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Status de {selectedRomaneios.length} Entrega{selectedRomaneios.length !== 1 ? 's' : ''}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Novo Status</Label>
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Produzindo no Laboratório">Produção</SelectItem>
                    <SelectItem value="Preparando no Setor de Entregas">Preparando</SelectItem>
                    <SelectItem value="A Caminho">A Caminho</SelectItem>
                    <SelectItem value="Entregue">Entregue</SelectItem>
                    <SelectItem value="Não Entregue">Não Entregue</SelectItem>
                    <SelectItem value="Voltou">Voltou</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBulkStatusDialog(false);
                    setBulkStatus("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBulkStatusChange}
                  disabled={bulkUpdateMutation.isPending || !bulkStatus}
                  className="bg-[#457bba] hover:bg-[#3a6ba0]"
                >
                  {bulkUpdateMutation.isPending ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialogs para Confirmações em Lote */}
        {selectedRomaneios.length > 0 && (
          <div className="flex gap-2 mt-4 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBulkPagamentoDialog(true)}
            >
              Marcar Pagamento
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBulkReceitaDialog(true)}
            >
              Marcar Receita
            </Button>
          </div>
        )}

        {/* Dialog Pagamento Recebido */}
        <Dialog open={showBulkPagamentoDialog} onOpenChange={setShowBulkPagamentoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pagamento Recebido</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-slate-600">
                Marcar {selectedRomaneios.length} entrega(s) como:
              </p>
              <div>
                <Label>Pagamento foi recebido? *</Label>
                <Select value={bulkPagamentoStatus} onValueChange={setBulkPagamentoStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim - Pagamento Recebido</SelectItem>
                    <SelectItem value="nao">Não - Pagamento Não Recebido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBulkPagamentoDialog(false);
                    setBulkPagamentoStatus("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBulkPagamento}
                  disabled={bulkUpdateMutation.isPending || !bulkPagamentoStatus}
                  className="bg-[#457bba] hover:bg-[#3a6ba0]"
                >
                  {bulkUpdateMutation.isPending ? 'Confirmando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Receita Recebida */}
        <Dialog open={showBulkReceitaDialog} onOpenChange={setShowBulkReceitaDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Receita Recebida</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-slate-600">
                Marcar {selectedRomaneios.length} entrega(s) como:
              </p>
              <div>
                <Label>Receita foi recebida? *</Label>
                <Select value={bulkReceitaStatus} onValueChange={setBulkReceitaStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim - Receita Recebida</SelectItem>
                    <SelectItem value="nao">Não - Receita Não Recebida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBulkReceitaDialog(false);
                    setBulkReceitaStatus("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBulkReceita}
                  disabled={bulkUpdateMutation.isPending || !bulkReceitaStatus}
                  className="bg-[#457bba] hover:bg-[#3a6ba0]"
                >
                  {bulkUpdateMutation.isPending ? 'Confirmando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}