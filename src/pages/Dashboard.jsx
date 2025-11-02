import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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
  RotateCcw
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filtroAtendente, setFiltroAtendente] = useState("todos");
  const [filtroMotoboy, setFiltroMotoboy] = useState("todos");
  const [filtroLocal, setFiltroLocal] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [visualizacao, setVisualizacao] = useState("dia"); // "dia" ou "todos"

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: romaneios, isLoading } = useQuery({
    queryKey: ['romaneios', user?.email],
    queryFn: async () => {
      if (!user) return [];
      if (user.tipo_usuario === 'admin' || user.role === 'admin') {
        return base44.entities.Romaneio.list('-data_entrega_prevista');
      }
      return base44.entities.Romaneio.filter(
        { atendente_email: user.email },
        '-data_entrega_prevista'
      );
    },
    enabled: !!user,
    initialData: [],
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
  const motoboysUnicos = [...new Set(romaneios.map(r => r.motoboy))];
  const locaisUnicos = [...new Set(romaneios.map(r => r.cidade_regiao))].sort();

  // Datas com entregas (para destacar no calendário)
  const diasComEntregas = romaneios
    .filter(r => r.data_entrega_prevista)
    .map(r => parseISO(r.data_entrega_prevista));

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Painel de Controle
            </h1>
            <p className="text-slate-600">
              Olá, <span className="font-semibold text-[#457bba]">
                {user?.nome_atendente || user?.full_name}
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendário */}
          {visualizacao === "dia" && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Selecione a Data</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                  className="rounded-md border"
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
                <div className="mt-4 text-center">
                  <p className="text-sm font-semibold text-slate-900">
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {stats.total} entrega{stats.total !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats e Filtros */}
          <div className={`${visualizacao === "dia" ? "lg:col-span-3" : "lg:col-span-4"} space-y-6`}>
            {/* Stats Cards - Clicáveis */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setFiltroStatus(filtroStatus === "todos" ? "todos" : "todos")}
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
              </CardContent>
            </Card>

            {/* Lista de Romaneios */}
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex justify-between items-center">
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
                  <div className="divide-y divide-slate-100">
                    {romaneiosOrganizados.map((romaneio) => (
                      <Link
                        key={romaneio.id}
                        to={createPageUrl(`DetalhesRomaneio?id=${romaneio.id}`)}
                        className="block p-6 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-bold text-slate-900 text-lg">
                                #{romaneio.numero_requisicao}
                              </h3>
                              <StatusBadge status={romaneio.status} />
                              {romaneio.item_geladeira && (
                                <Badge className="bg-cyan-100 text-cyan-700 border-cyan-300 border">
                                  <Snowflake className="w-3 h-3 mr-1" />
                                  Geladeira
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {romaneio.periodo_entrega}
                              </Badge>
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
                              {romaneio.forma_pagamento}
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
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}