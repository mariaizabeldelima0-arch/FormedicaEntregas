
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Package, 
  MapPin, 
  Phone, 
  CreditCard, 
  Clock,
  Snowflake,
  Navigation,
  DollarSign,
  FileText,
  Printer,
  User
} from "lucide-react";
import { format, parseISO, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function PainelMotoboys() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filtroMotoboy, setFiltroMotoboy] = useState("todos");
  const [filtroLocal, setFiltroLocal] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: romaneios, isLoading } = useQuery({
    queryKey: ['painel-motoboys'],
    queryFn: async () => {
      const todos = await base44.entities.Romaneio.list('-created_date');
      return todos.filter(r => 
        r.status !== 'Entregue' && 
        r.status !== 'Cancelado'
      );
    },
    initialData: [],
  });

  const updateStatusPagamentoMutation = useMutation({
    mutationFn: async ({ romaneioId, status }) => {
      return base44.entities.Romaneio.update(romaneioId, {
        status_pagamento_motoboy: status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['painel-motoboys'] });
      toast.success('Status de pagamento atualizado!');
    },
  });

  // Filtrar entregas do dia selecionado
  const romaneiosDoDia = romaneios.filter(r => {
    if (!r.data_entrega_prevista) return false;
    const dataEntrega = parseISO(r.data_entrega_prevista);
    if (!isSameDay(dataEntrega, selectedDate)) return false;
    
    // Aplicar filtros
    if (filtroMotoboy !== "todos" && r.motoboy !== filtroMotoboy) return false;
    if (filtroLocal !== "todos" && r.cidade_regiao !== filtroLocal) return false;
    if (filtroPeriodo !== "todos" && r.periodo_entrega !== filtroPeriodo) return false;
    
    return true;
  });

  // Separar por motoboy
  const romaneiosMarcio = romaneiosDoDia.filter(r => r.motoboy === "Marcio");
  const romaneiosBruno = romaneiosDoDia.filter(r => r.motoboy === "Bruno");

  // Locais únicos para o filtro
  const locaisUnicos = [...new Set(romaneios
    .filter(r => r.data_entrega_prevista && isSameDay(parseISO(r.data_entrega_prevista), selectedDate))
    .map(r => r.cidade_regiao))].sort();

  // Ordenar por local e período
  const ordenarEntregas = (entregas) => {
    return [...entregas].sort((a, b) => {
      const localCompare = a.cidade_regiao.localeCompare(b.cidade_regiao);
      if (localCompare !== 0) return localCompare;
      if (a.periodo_entrega !== b.periodo_entrega) {
        return a.periodo_entrega === "Manhã" ? -1 : 1;
      }
      return 0;
    });
  };

  const romaneiosMarcioOrdenados = ordenarEntregas(romaneiosMarcio);
  const romaneiosBrunoOrdenados = ordenarEntregas(romaneiosBruno);

  // Calcular estatísticas do dia para cada motoboy
  const calcularStatsDoDia = (entregas) => {
    return entregas.reduce((acc, r) => {
      const local = r.cidade_regiao;
      if (!acc[local]) {
        acc[local] = { quantidade: 0, valor: 0 };
      }
      acc[local].quantidade += 1;
      acc[local].valor += r.valor_entrega || 0;
      return acc;
    }, {});
  };

  const statsMarcio = calcularStatsDoDia(romaneiosMarcio);
  const statsBruno = calcularStatsDoDia(romaneiosBruno);
  const totalMarcio = Object.values(statsMarcio).reduce((sum, stat) => sum + stat.valor, 0);
  const totalBruno = Object.values(statsBruno).reduce((sum, stat) => sum + stat.valor, 0);

  // Calcular estatísticas da semana (Terça a Segunda)
  const getTuesdayStartOfWeek = (date) => {
    return startOfWeek(date, { weekStartsOn: 2 });
  };

  const currentWeekStart = addWeeks(getTuesdayStartOfWeek(selectedDate), weekOffset);
  const weekStart = currentWeekStart;
  const weekEnd = addDays(currentWeekStart, 6);
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const calcularWeekStats = (motoboy) => {
    return daysOfWeek.map(day => {
      const romaneiosDoDia = romaneios.filter(r => {
        if (!r.data_entrega_prevista || r.motoboy !== motoboy) return false;
        const dataEntrega = parseISO(r.data_entrega_prevista);
        return isSameDay(dataEntrega, day) && r.status !== 'Cancelado';
      });
      
      const total = romaneiosDoDia.reduce((sum, r) => sum + (r.valor_entrega || 0), 0);
      
      return {
        dia: format(day, 'EEE', { locale: ptBR }),
        data: format(day, 'dd/MM'),
        valor: total,
        quantidade: romaneiosDoDia.length
      };
    });
  };

  const weekStatsMarcio = calcularWeekStats("Marcio");
  const weekStatsBruno = calcularWeekStats("Bruno");
  const totalSemanaMarcio = weekStatsMarcio.reduce((sum, stat) => sum + stat.valor, 0);
  const totalSemanaBruno = weekStatsBruno.reduce((sum, stat) => sum + stat.valor, 0);

  // Status de pagamento da semana
  const getStatusPagamentoSemana = (motoboy) => {
    // Find *any* romaneio for the motoboy in the current week to get the payment status.
    // Assuming status_pagamento_motoboy is consistent for all romaneios of a motoboy in a given week.
    const romaneioNaSemana = romaneios.find(r => {
      if (!r.data_entrega_prevista || r.motoboy !== motoboy) return false;
      const dataEntrega = parseISO(r.data_entrega_prevista);
      return dataEntrega >= weekStart && dataEntrega <= weekEnd;
    });
    return romaneioNaSemana?.status_pagamento_motoboy || "Aguardando";
  };

  const statusPagamentoSemanaMarcio = getStatusPagamentoSemana("Marcio");
  const statusPagamentoSemanaBruno = getStatusPagamentoSemana("Bruno");

  const handlePrint = () => {
    window.print();
  };

  const abrirNavegacao = (romaneio) => {
    const end = romaneio.endereco;
    const endereco = `${end.rua}, ${end.numero}, ${end.bairro}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
    window.open(url, '_blank');
  };

  const precisaCobrar = (romaneio) => {
    return romaneio.valor_pagamento && 
           ["Dinheiro", "Maquina", "Troco P/"].includes(romaneio.forma_pagamento);
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      "Pendente": { color: "bg-slate-100 text-slate-700", icon: Clock },
      "A Caminho": { color: "bg-purple-100 text-purple-700", icon: Package },
      // Add other statuses if needed
    };
    const { color, icon: Icon } = configs[status] || configs["Pendente"];
    return (
      <Badge className={`${color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const EntregaCard = ({ romaneio, index, motoboy }) => {
    const deveSerCobrado = precisaCobrar(romaneio);
    const corMotoboy = motoboy === "Marcio" ? "ring-blue-400" : "ring-green-400";
    
    return (
      <Card className={`border-slate-200 hover:shadow-lg transition-shadow ${deveSerCobrado ? 'ring-2 ring-orange-400' : ''} ring-2 ${corMotoboy}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <Badge variant="outline" className="font-mono">#{index + 1}</Badge>
                <CardTitle className="text-lg">REQ #{romaneio.numero_requisicao}</CardTitle>
                <StatusBadge status={romaneio.status} />
                <Badge className={motoboy === "Marcio" ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-green-100 text-green-700 border-green-300"}>
                  <User className="w-3 h-3 mr-1" />
                  {motoboy}
                </Badge>
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
              className="w-full"
              onClick={() => abrirNavegacao(romaneio)}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Abrir no Mapa
            </Button>
          </div>

          {/* Informações */}
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <span className="font-medium">{romaneio.forma_pagamento}</span>
          </div>

          {romaneio.cliente_telefone && (
            <a
              href={`tel:${romaneio.cliente_telefone}`}
              className="flex items-center gap-2 text-sm text-[#457bba] hover:underline"
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

          {/* Ação Admin - Link para detalhes */}
          <Link to={`/DetalhesRomaneio?id=${romaneio.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
          </Link>
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
                Painel dos Motoboys
              </h1>
              <p className="text-slate-600">
                Visualização e gerenciamento das entregas dos motoboys
              </p>
            </div>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Relatório
            </Button>
          </div>

          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="no-print">
              <TabsTrigger value="geral">Visão Geral</TabsTrigger>
              <TabsTrigger value="marcio">Marcio</TabsTrigger>
              <TabsTrigger value="bruno">Bruno</TabsTrigger>
            </TabsList>

            {/* Visão Geral */}
            <TabsContent value="geral">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendário */}
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

                {/* Lista de Entregas */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Filtros */}
                  <Card className="border-none shadow-lg no-print">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Filtros</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Motoboy</label>
                          <Select value={filtroMotoboy} onValueChange={setFiltroMotoboy}>
                            <SelectTrigger>
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">Todos</SelectItem>
                              <SelectItem value="Marcio">Marcio</SelectItem>
                              <SelectItem value="Bruno">Bruno</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
                    </CardContent>
                  </Card>

                  {/* Resumos Lado a Lado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Resumo Marcio */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Marcio
                      </h2>
                      
                      {/* Resumo do Dia Marcio */}
                      {Object.keys(statsMarcio).length > 0 && (
                        <Card className="border-none shadow-lg bg-blue-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm text-blue-900">Resumo do Dia</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {Object.entries(statsMarcio).sort((a, b) => a[0].localeCompare(b[0])).map(([local, stats]) => (
                              <div key={local} className="flex justify-between items-center text-sm">
                                <span className="text-slate-700">{local}</span>
                                <div className="text-right">
                                  <span className="font-medium text-slate-900">{stats.quantidade}x</span>
                                  <span className="text-blue-700 font-bold ml-2">R$ {stats.valor.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                            <div className="pt-2 border-t-2 border-blue-300 flex justify-between items-center font-bold">
                              <span className="text-blue-900">TOTAL DO DIA</span>
                              <span className="text-blue-900 text-lg">R$ {totalMarcio.toFixed(2)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Resumo da Semana Marcio */}
                      <Card className={`border-none shadow-lg ${statusPagamentoSemanaMarcio === "Pago" ? "bg-green-50" : "bg-blue-50"}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className={`text-sm ${statusPagamentoSemanaMarcio === "Pago" ? "text-green-900" : "text-blue-900"}`}>
                                Semana • {statusPagamentoSemanaMarcio}
                              </CardTitle>
                              <p className={`text-xs ${statusPagamentoSemanaMarcio === "Pago" ? "text-green-700" : "text-blue-700"}`}>
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
                          <div className="mt-2">
                            <Select
                              value={statusPagamentoSemanaMarcio}
                              onValueChange={(value) => {
                                // Atualizar todos os romaneios de Marcio da semana
                                const romaneiosSemana = romaneios.filter(r => {
                                  if (!r.data_entrega_prevista || r.motoboy !== "Marcio") return false;
                                  const dataEntrega = parseISO(r.data_entrega_prevista);
                                  return dataEntrega >= weekStart && dataEntrega <= weekEnd;
                                });
                                romaneiosSemana.forEach(r => {
                                  updateStatusPagamentoMutation.mutate({ romaneioId: r.id, status: value });
                                });
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Aguardando">Aguardando</SelectItem>
                                <SelectItem value="Pago">Pago</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-1">
                          {weekStatsMarcio.map((stat, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className={`w-12 ${statusPagamentoSemanaMarcio === "Pago" ? "text-green-700" : "text-slate-700"}`}>{stat.dia}</span>
                              <span className={`text-xs ${statusPagamentoSemanaMarcio === "Pago" ? "text-green-600" : "text-slate-500"}`}>{stat.data}</span>
                              <span className={statusPagamentoSemanaMarcio === "Pago" ? "text-green-700" : "text-slate-600"}>{stat.quantidade}x</span>
                              <span className={`font-bold ${statusPagamentoSemanaMarcio === "Pago" ? "text-green-800" : "text-blue-700"}`}>R$ {stat.valor.toFixed(2)}</span>
                            </div>
                          ))}
                          <div className={`pt-2 border-t-2 ${statusPagamentoSemanaMarcio === "Pago" ? "border-green-400" : "border-blue-300"} flex justify-between items-center font-bold text-sm`}>
                            <span className={statusPagamentoSemanaMarcio === "Pago" ? "text-green-900" : "text-blue-900"}>TOTAL</span>
                            <span className={statusPagamentoSemanaMarcio === "Pago" ? "text-green-900" : "text-blue-900"}>R$ {totalSemanaMarcio.toFixed(2)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Resumo Bruno */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Bruno
                      </h2>
                      
                      {/* Resumo do Dia Bruno */}
                      {Object.keys(statsBruno).length > 0 && (
                        <Card className="border-none shadow-lg bg-green-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm text-green-900">Resumo do Dia</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {Object.entries(statsBruno).sort((a, b) => a[0].localeCompare(b[0])).map(([local, stats]) => (
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
                              <span className="text-green-900 text-lg">R$ {totalBruno.toFixed(2)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Resumo da Semana Bruno */}
                      <Card className={`border-none shadow-lg ${statusPagamentoSemanaBruno === "Pago" ? "bg-green-50" : "bg-blue-50"}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className={`text-sm ${statusPagamentoSemanaBruno === "Pago" ? "text-green-900" : "text-blue-900"}`}>
                                Semana • {statusPagamentoSemanaBruno}
                              </CardTitle>
                              <p className={`text-xs ${statusPagamentoSemanaBruno === "Pago" ? "text-green-700" : "text-blue-700"}`}>
                                {format(weekStart, 'dd/MM', { locale: ptBR })} - {format(weekEnd, 'dd/MM', { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Select
                              value={statusPagamentoSemanaBruno}
                              onValueChange={(value) => {
                                // Atualizar todos os romaneios de Bruno da semana
                                const romaneiosSemana = romaneios.filter(r => {
                                  if (!r.data_entrega_prevista || r.motoboy !== "Bruno") return false;
                                  const dataEntrega = parseISO(r.data_entrega_prevista);
                                  return dataEntrega >= weekStart && dataEntrega <= weekEnd;
                                });
                                romaneiosSemana.forEach(r => {
                                  updateStatusPagamentoMutation.mutate({ romaneioId: r.id, status: value });
                                });
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Aguardando">Aguardando</SelectItem>
                                <SelectItem value="Pago">Pago</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-1">
                          {weekStatsBruno.map((stat, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className={`w-12 ${statusPagamentoSemanaBruno === "Pago" ? "text-green-700" : "text-slate-700"}`}>{stat.dia}</span>
                              <span className={`text-xs ${statusPagamentoSemanaBruno === "Pago" ? "text-green-600" : "text-slate-500"}`}>{stat.data}</span>
                              <span className={statusPagamentoSemanaBruno === "Pago" ? "text-green-700" : "text-slate-600"}>{stat.quantidade}x</span>
                              <span className={`font-bold ${statusPagamentoSemanaBruno === "Pago" ? "text-green-800" : "text-blue-700"}`}>R$ {stat.valor.toFixed(2)}</span>
                            </div>
                          ))}
                          <div className={`pt-2 border-t-2 ${statusPagamentoSemanaBruno === "Pago" ? "border-green-400" : "border-blue-300"} flex justify-between items-center font-bold text-sm`}>
                            <span className={statusPagamentoSemanaBruno === "Pago" ? "text-green-900" : "text-blue-900"}>TOTAL</span>
                            <span className={statusPagamentoSemanaBruno === "Pago" ? "text-green-900" : "text-blue-900"}>R$ {totalSemanaBruno.toFixed(2)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Lista de Entregas */}
                  {isLoading ? (
                    <Card className="border-none shadow-lg">
                      <CardContent className="p-12 text-center">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Carregando...</p>
                      </CardContent>
                    </Card>
                  ) : romaneiosDoDia.length === 0 ? (
                    <Card className="border-none shadow-lg">
                      <CardContent className="p-12 text-center">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Nenhuma entrega para este dia</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      {/* Entregas Marcio */}
                      {romaneiosMarcioOrdenados.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold text-blue-900 mb-4">
                            Entregas - Marcio ({romaneiosMarcioOrdenados.length})
                          </h3>
                          <div className="grid grid-cols-1 gap-4">
                            {romaneiosMarcioOrdenados.map((romaneio, idx) => (
                              <EntregaCard key={romaneio.id} romaneio={romaneio} index={idx} motoboy="Marcio" />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Entregas Bruno */}
                      {romaneiosBrunoOrdenados.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold text-green-900 mb-4">
                            Entregas - Bruno ({romaneiosBrunoOrdenados.length})
                          </h3>
                          <div className="grid grid-cols-1 gap-4">
                            {romaneiosBrunoOrdenados.map((romaneio, idx) => (
                              <EntregaCard key={romaneio.id} romaneio={romaneio} index={idx} motoboy="Bruno" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Aba Marcio */}
            <TabsContent value="marcio">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendário */}
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
                        {romaneiosMarcio.length} entrega{romaneiosMarcio.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Entregas e Resumos Marcio */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Resumo do Dia */}
                  {Object.keys(statsMarcio).length > 0 && (
                    <Card className="border-none shadow-lg bg-blue-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-blue-900">Resumo do Dia</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {Object.entries(statsMarcio).sort((a, b) => a[0].localeCompare(b[0])).map(([local, stats]) => (
                          <div key={local} className="flex justify-between items-center text-sm">
                            <span className="text-slate-700">{local}</span>
                            <div className="text-right">
                              <span className="font-medium text-slate-900">{stats.quantidade}x</span>
                              <span className="text-blue-700 font-bold ml-2">R$ {stats.valor.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t-2 border-blue-300 flex justify-between items-center font-bold">
                          <span className="text-blue-900">TOTAL DO DIA</span>
                          <span className="text-blue-900 text-lg">R$ {totalMarcio.toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Resumo da Semana */}
                  <Card className={`border-none shadow-lg ${statusPagamentoSemanaMarcio === "Pago" ? "bg-green-50" : "bg-blue-50"}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className={`text-sm ${statusPagamentoSemanaMarcio === "Pago" ? "text-green-900" : "text-blue-900"}`}>
                            Semana • {statusPagamentoSemanaMarcio}
                          </CardTitle>
                          <p className={`text-xs ${statusPagamentoSemanaMarcio === "Pago" ? "text-green-700" : "text-blue-700"}`}>
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
                      {weekStatsMarcio.map((stat, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className={`w-12 ${statusPagamentoSemanaMarcio === "Pago" ? "text-green-700" : "text-slate-700"}`}>{stat.dia}</span>
                          <span className={`text-xs ${statusPagamentoSemanaMarcio === "Pago" ? "text-green-600" : "text-slate-500"}`}>{stat.data}</span>
                          <span className={statusPagamentoSemanaMarcio === "Pago" ? "text-green-700" : "text-slate-600"}>{stat.quantidade}x</span>
                          <span className={`font-bold ${statusPagamentoSemanaMarcio === "Pago" ? "text-green-800" : "text-blue-700"}`}>R$ {stat.valor.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className={`pt-2 border-t-2 ${statusPagamentoSemanaMarcio === "Pago" ? "border-green-400" : "border-blue-300"} flex justify-between items-center font-bold text-sm`}>
                        <span className={statusPagamentoSemanaMarcio === "Pago" ? "text-green-900" : "text-blue-900"}>TOTAL</span>
                        <span className={statusPagamentoSemanaMarcio === "Pago" ? "text-green-900" : "text-blue-900"}>R$ {totalSemanaMarcio.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lista de Entregas Marcio */}
                  {isLoading ? (
                    <Card className="border-none shadow-lg">
                      <CardContent className="p-12 text-center">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Carregando entregas de Marcio...</p>
                      </CardContent>
                    </Card>
                  ) : romaneiosMarcioOrdenados.length > 0 ? (
                    <div>
                      <h3 className="text-xl font-bold text-blue-900 mb-4">
                        Entregas - Marcio ({romaneiosMarcioOrdenados.length})
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {romaneiosMarcioOrdenados.map((romaneio, idx) => (
                          <EntregaCard key={romaneio.id} romaneio={romaneio} index={idx} motoboy="Marcio" />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Card className="border-none shadow-lg">
                      <CardContent className="p-12 text-center">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Nenhuma entrega para Marcio neste dia</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Aba Bruno */}
            <TabsContent value="bruno">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendário */}
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
                        {romaneiosBruno.length} entrega{romaneiosBruno.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Entregas e Resumos Bruno */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Resumo do Dia */}
                  {Object.keys(statsBruno).length > 0 && (
                    <Card className="border-none shadow-lg bg-green-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-green-900">Resumo do Dia</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {Object.entries(statsBruno).sort((a, b) => a[0].localeCompare(b[0])).map(([local, stats]) => (
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
                          <span className="text-green-900 text-lg">R$ {totalBruno.toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Resumo da Semana */}
                  <Card className={`border-none shadow-lg ${statusPagamentoSemanaBruno === "Pago" ? "bg-green-50" : "bg-blue-50"}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className={`text-sm ${statusPagamentoSemanaBruno === "Pago" ? "text-green-900" : "text-blue-900"}`}>
                            Semana • {statusPagamentoSemanaBruno}
                          </CardTitle>
                          <p className={`text-xs ${statusPagamentoSemanaBruno === "Pago" ? "text-green-700" : "text-blue-700"}`}>
                            {format(weekStart, 'dd/MM', { locale: ptBR })} - {format(weekEnd, 'dd/MM', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {weekStatsBruno.map((stat, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className={`w-12 ${statusPagamentoSemanaBruno === "Pago" ? "text-green-700" : "text-slate-700"}`}>{stat.dia}</span>
                          <span className={`text-xs ${statusPagamentoSemanaBruno === "Pago" ? "text-green-600" : "text-slate-500"}`}>{stat.data}</span>
                          <span className={statusPagamentoSemanaBruno === "Pago" ? "text-green-700" : "text-slate-600"}>{stat.quantidade}x</span>
                          <span className={`font-bold ${statusPagamentoSemanaBruno === "Pago" ? "text-green-800" : "text-blue-700"}`}>R$ {stat.valor.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className={`pt-2 border-t-2 ${statusPagamentoSemanaBruno === "Pago" ? "border-green-400" : "border-blue-300"} flex justify-between items-center font-bold text-sm`}>
                        <span className={statusPagamentoSemanaBruno === "Pago" ? "text-green-900" : "text-blue-900"}>TOTAL</span>
                        <span className={statusPagamentoSemanaBruno === "Pago" ? "text-green-900" : "text-blue-900"}>R$ {totalSemanaBruno.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lista de Entregas Bruno */}
                  {isLoading ? (
                    <Card className="border-none shadow-lg">
                      <CardContent className="p-12 text-center">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Carregando entregas de Bruno...</p>
                      </CardContent>
                    </Card>
                  ) : romaneiosBrunoOrdenados.length > 0 ? (
                    <div>
                      <h3 className="text-xl font-bold text-green-900 mb-4">
                        Entregas - Bruno ({romaneiosBrunoOrdenados.length})
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {romaneiosBrunoOrdenados.map((romaneio, idx) => (
                          <EntregaCard key={romaneio.id} romaneio={romaneio} index={idx} motoboy="Bruno" />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Card className="border-none shadow-lg">
                      <CardContent className="p-12 text-center">
                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Nenhuma entrega para Bruno neste dia</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
