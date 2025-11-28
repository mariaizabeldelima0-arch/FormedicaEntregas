import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft,
  FileText,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  RotateCcw,
  Printer,
  Search
} from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Relatorios() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get('data');
  
  const [dataSelecionada, setDataSelecionada] = useState(dataParam || format(new Date(), "yyyy-MM-dd"));
  const [filtroStatus, setFiltroStatus] = useState(urlParams.get('status') || "todos");
  const [filtroLocal, setFiltroLocal] = useState(urlParams.get('local') || "todos");
  const [filtroMotoboy, setFiltroMotoboy] = useState(urlParams.get('motoboy') || "todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState(urlParams.get('periodo') || "todos");
  const [searchTerm, setSearchTerm] = useState(urlParams.get('busca') || "");

  // Atualizar URL quando estado mudar
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('data', dataSelecionada);
    if (filtroStatus !== "todos") params.set('status', filtroStatus);
    if (filtroLocal !== "todos") params.set('local', filtroLocal);
    if (filtroMotoboy !== "todos") params.set('motoboy', filtroMotoboy);
    if (filtroPeriodo !== "todos") params.set('periodo', filtroPeriodo);
    if (searchTerm) params.set('busca', searchTerm);
    
    navigate(`?${params.toString()}`, { replace: true });
  }, [dataSelecionada, filtroStatus, filtroLocal, filtroMotoboy, filtroPeriodo, searchTerm]);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: romaneios, isLoading } = useQuery({
    queryKey: ['romaneios-relatorio', user?.email],
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
    refetchOnMount: true,
    staleTime: 0,
  });

  // Filtrar romaneios por data e filtros
  const romaneiosDoDia = romaneios.filter(r => {
    if (!r.data_entrega_prevista) return false;
    const dataEntrega = parseISO(r.data_entrega_prevista);
    if (!isSameDay(dataEntrega, parseISO(dataSelecionada))) return false;

    // Filtro de status
    if (filtroStatus !== "todos" && r.status !== filtroStatus) return false;

    // Filtro de local
    if (filtroLocal !== "todos" && r.cidade_regiao !== filtroLocal) return false;

    // Filtro de motoboy
    if (filtroMotoboy !== "todos" && r.motoboy !== filtroMotoboy) return false;

    // Filtro de período
    if (filtroPeriodo !== "todos" && r.periodo_entrega !== filtroPeriodo) return false;

    // Busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      const match =
        r.cliente_nome?.toLowerCase().includes(termo) ||
        r.numero_requisicao?.toLowerCase().includes(termo) ||
        r.motoboy?.toLowerCase().includes(termo);
      if (!match) return false;
    }

    return true;
  });

  // Dados únicos para filtros
  const locaisUnicos = [...new Set(romaneios
    .filter(r => r.data_entrega_prevista && isSameDay(parseISO(r.data_entrega_prevista), parseISO(dataSelecionada)))
    .map(r => r.cidade_regiao))].filter(Boolean).sort();
  const motoboysUnicos = [...new Set(romaneios
    .filter(r => r.data_entrega_prevista && isSameDay(parseISO(r.data_entrega_prevista), parseISO(dataSelecionada)))
    .map(r => r.motoboy))].filter(Boolean);

  // Agrupar por local e ordenar
  const porLocal = romaneiosDoDia.reduce((acc, r) => {
    if (!acc[r.cidade_regiao]) acc[r.cidade_regiao] = [];
    acc[r.cidade_regiao].push(r);
    return acc;
  }, {});

  // Ordenar cada local por período
  Object.keys(porLocal).forEach(local => {
    porLocal[local].sort((a, b) => {
      if (a.periodo_entrega !== b.periodo_entrega) {
        return a.periodo_entrega === "Manhã" ? -1 : 1;
      }
      return 0;
    });
  });

  // Agrupar por status
  const porStatus = {
    pendente: romaneiosDoDia.filter(r => r.status === 'Pendente'),
    produzindo: romaneiosDoDia.filter(r => r.status === 'Produzindo no Laboratório'),
    preparando: romaneiosDoDia.filter(r => r.status === 'Preparando no Setor de Entregas'),
    aCaminho: romaneiosDoDia.filter(r => r.status === 'A Caminho'),
    entregues: romaneiosDoDia.filter(r => r.status === 'Entregue'),
    naoEntregue: romaneiosDoDia.filter(r => r.status === 'Não Entregue'),
    voltou: romaneiosDoDia.filter(r => r.status === 'Voltou'),
    cancelado: romaneiosDoDia.filter(r => r.status === 'Cancelado'),
  };

  // Agrupar por período
  const porPeriodo = {
    manha: romaneiosDoDia.filter(r => r.periodo_entrega === 'Manhã'),
    tarde: romaneiosDoDia.filter(r => r.periodo_entrega === 'Tarde'),
  };

  // Agrupar por motoboy
  const porMotoboy = romaneiosDoDia.reduce((acc, r) => {
    if (!acc[r.motoboy]) acc[r.motoboy] = [];
    acc[r.motoboy].push(r);
    return acc;
  }, {});

  const handlePrint = () => {
    window.print();
  };

  const StatusBadge = ({ status }) => {
    const config = {
      "Pendente": { color: "bg-slate-100 text-slate-700", icon: Clock },
      "Produzindo no Laboratório": { color: "bg-blue-100 text-blue-700", icon: Package },
      "Preparando no Setor de Entregas": { color: "bg-yellow-100 text-yellow-700", icon: Package },
      "A Caminho": { color: "bg-purple-100 text-purple-700", icon: Truck },
      "Entregue": { color: "bg-green-100 text-green-700", icon: CheckCircle },
      "Não Entregue": { color: "bg-red-100 text-red-700", icon: AlertCircle },
      "Voltou": { color: "bg-orange-100 text-orange-700", icon: RotateCcw },
      "Cancelado": { color: "bg-gray-100 text-gray-700", icon: AlertCircle },
    };
    const { color, icon: Icon } = config[status] || config["Pendente"];
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>

      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header - Não imprime */}
          <div className="flex items-center gap-4 no-print">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">Relatório de Entregas</h1>
              <p className="text-slate-600 mt-1">Visualização completa das entregas do dia</p>
            </div>
            <Button
              className="bg-[#457bba] hover:bg-[#3a6ba0]"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>

          {/* Seletor de Data e Filtros - Não imprime */}
          <Card className="border-none shadow-lg no-print">
            <CardHeader>
              <CardTitle>Filtros e Busca</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Data</label>
                <Input
                  type="date"
                  value={dataSelecionada}
                  onChange={(e) => setDataSelecionada(e.target.value)}
                  className="max-w-xs"
                />
              </div>

              {/* Busca */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por cliente, requisição ou motoboy..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
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

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Local</label>
                  <Select value={filtroLocal} onValueChange={setFiltroLocal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Local" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {locaisUnicos.map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Motoboy</label>
                  <Select value={filtroMotoboy} onValueChange={setFiltroMotoboy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Motoboy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {motoboysUnicos.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Período</label>
                  <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Manhã">Manhã</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(filtroStatus !== "todos" || filtroLocal !== "todos" || filtroMotoboy !== "todos" || filtroPeriodo !== "todos" || searchTerm) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiltroStatus("todos");
                    setFiltroLocal("todos");
                    setFiltroMotoboy("todos");
                    setFiltroPeriodo("todos");
                    setSearchTerm("");
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Relatório - Imprimível */}
          <div className="space-y-6">
            {/* Cabeçalho do Relatório */}
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#457bba] to-[#890d5d] text-white">
                <CardTitle className="text-2xl">
                  Relatório do Dia {format(parseISO(dataSelecionada), "dd/MM/yyyy", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Resumo Geral - Clicáveis */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setFiltroStatus("todos")}
                className="text-left"
              >
                <Card className={`border-none shadow-md hover:shadow-xl transition-shadow cursor-pointer ${filtroStatus === "todos" ? "ring-2 ring-[#457bba]" : ""}`}>
                  <CardHeader className="pb-3">
                    <p className="text-sm text-slate-500 font-medium">Total</p>
                    <p className="text-3xl font-bold text-slate-900">{romaneiosDoDia.length}</p>
                  </CardHeader>
                </Card>
              </button>

              <button
                onClick={() => setFiltroStatus(filtroStatus === "Entregue" ? "todos" : "Entregue")}
                className="text-left"
              >
                <Card className={`border-none shadow-md hover:shadow-xl transition-shadow cursor-pointer ${filtroStatus === "Entregue" ? "ring-2 ring-green-600" : ""}`}>
                  <CardHeader className="pb-3">
                    <p className="text-sm text-slate-500 font-medium">Entregues</p>
                    <p className="text-3xl font-bold text-green-600">{porStatus.entregues.length}</p>
                  </CardHeader>
                </Card>
              </button>

              <button
                onClick={() => setFiltroStatus(filtroStatus === "A Caminho" ? "todos" : "A Caminho")}
                className="text-left"
              >
                <Card className={`border-none shadow-md hover:shadow-xl transition-shadow cursor-pointer ${filtroStatus === "A Caminho" ? "ring-2 ring-purple-600" : ""}`}>
                  <CardHeader className="pb-3">
                    <p className="text-sm text-slate-500 font-medium">A Caminho</p>
                    <p className="text-3xl font-bold text-purple-600">{porStatus.aCaminho.length}</p>
                  </CardHeader>
                </Card>
              </button>

              <button
                onClick={() => setFiltroStatus(filtroStatus === "Pendente" ? "todos" : "Pendente")}
                className="text-left"
              >
                <Card className={`border-none shadow-md hover:shadow-xl transition-shadow cursor-pointer ${filtroStatus === "Pendente" ? "ring-2 ring-slate-600" : ""}`}>
                  <CardHeader className="pb-3">
                    <p className="text-sm text-slate-500 font-medium">Pendente</p>
                    <p className="text-3xl font-bold text-slate-600">{porStatus.pendente.length}</p>
                  </CardHeader>
                </Card>
              </button>
            </div>

            {/* Por Local - NOVO */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Entregas por Local</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(porLocal).sort((a, b) => a[0].localeCompare(b[0])).map(([local, entregas]) => (
                    <div key={local} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3 border-b pb-2">
                        <h3 className="font-bold text-slate-900 text-lg">{local}</h3>
                        <Badge variant="outline" className="text-base">{entregas.length}</Badge>
                      </div>
                      
                      {/* Manhã */}
                      {entregas.filter(e => e.periodo_entrega === 'Manhã').length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-slate-700 mb-2">☀️ Manhã</p>
                          <div className="space-y-1 pl-4">
                            {entregas.filter(e => e.periodo_entrega === 'Manhã').map(r => (
                              <Link key={r.id} to={createPageUrl(`DetalhesRomaneio?id=${r.id}`)} className="flex justify-between items-center text-sm py-1 hover:bg-slate-50 rounded px-2 transition-colors">
                                <span className="text-slate-600 hover:text-[#457bba]">
                                  #{r.numero_requisicao} - {r.cliente_nome}
                                </span>
                                <div className="flex items-center gap-2">
                                  {r.valor_pagamento && ["Dinheiro", "Maquina", "Troco P/"].includes(r.forma_pagamento) && (
                                    <Badge className="bg-orange-100 text-orange-700 text-xs">
                                      R$ {r.valor_pagamento.toFixed(2)}
                                    </Badge>
                                  )}
                                  <StatusBadge status={r.status} />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Tarde */}
                      {entregas.filter(e => e.periodo_entrega === 'Tarde').length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-2">🌙 Tarde</p>
                          <div className="space-y-1 pl-4">
                            {entregas.filter(e => e.periodo_entrega === 'Tarde').map(r => (
                              <Link key={r.id} to={createPageUrl(`DetalhesRomaneio?id=${r.id}`)} className="flex justify-between items-center text-sm py-1 hover:bg-slate-50 rounded px-2 transition-colors">
                                <span className="text-slate-600 hover:text-[#457bba]">
                                  #{r.numero_requisicao} - {r.cliente_nome}
                                </span>
                                <div className="flex items-center gap-2">
                                  {r.valor_pagamento && ["Dinheiro", "Maquina", "Troco P/"].includes(r.forma_pagamento) && (
                                    <Badge className="bg-orange-100 text-orange-700 text-xs">
                                      R$ {r.valor_pagamento.toFixed(2)}
                                    </Badge>
                                  )}
                                  <StatusBadge status={r.status} />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Por Status */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Entregas por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(porStatus).map(([key, entregas]) => (
                    entregas.length > 0 && (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-slate-900">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </h3>
                          <Badge variant="outline">{entregas.length}</Badge>
                        </div>
                        <div className="space-y-2">
                          {entregas.map(r => (
                            <Link key={r.id} to={createPageUrl(`DetalhesRomaneio?id=${r.id}`)} className="block text-sm text-slate-600 hover:text-[#457bba] hover:bg-slate-50 rounded px-2 py-1 transition-colors">
                              #{r.numero_requisicao} - {r.cliente_nome}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Por Motoboy */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Entregas por Motoboy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(porMotoboy).map(([motoboy, entregas]) => (
                    <div key={motoboy} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-900">{motoboy}</h3>
                        <Badge variant="outline">{entregas.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {entregas.map(r => (
                          <Link key={r.id} to={createPageUrl(`DetalhesRomaneio?id=${r.id}`)} className="flex justify-between text-sm hover:bg-slate-50 rounded px-2 py-1 transition-colors">
                            <span className="text-slate-600 hover:text-[#457bba]">
                              #{r.numero_requisicao} - {r.cliente_nome}
                            </span>
                            <StatusBadge status={r.status} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Por Período */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Entregas por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">Manhã</h3>
                      <Badge variant="outline">{porPeriodo.manha.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {porPeriodo.manha.map(r => (
                        <Link key={r.id} to={createPageUrl(`DetalhesRomaneio?id=${r.id}`)} className="flex justify-between text-sm hover:bg-slate-50 rounded px-2 py-1 transition-colors">
                          <span className="text-slate-600 hover:text-[#457bba]">
                            #{r.numero_requisicao} - {r.cliente_nome}
                          </span>
                          <StatusBadge status={r.status} />
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">Tarde</h3>
                      <Badge variant="outline">{porPeriodo.tarde.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {porPeriodo.tarde.map(r => (
                        <Link key={r.id} to={createPageUrl(`DetalhesRomaneio?id=${r.id}`)} className="flex justify-between text-sm hover:bg-slate-50 rounded px-2 py-1 transition-colors">
                          <span className="text-slate-600 hover:text-[#457bba]">
                            #{r.numero_requisicao} - {r.cliente_nome}
                          </span>
                          <StatusBadge status={r.status} />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}