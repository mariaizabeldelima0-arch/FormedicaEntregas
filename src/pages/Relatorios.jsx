import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
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
  ChevronLeft,
  Printer,
  Search,
  Check,
  Truck,
  Sun,
  Moon
} from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate, Link } from "react-router-dom";

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

  // Buscar entregas do Supabase
  const { data: entregas = [], isLoading, error: queryError } = useQuery({
    queryKey: ['entregas-relatorio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(nome, telefone),
          endereco:enderecos(cidade, regiao),
          motoboy:motoboys(nome)
        `)
        .order('data_entrega', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 rounded-full animate-spin mx-auto mb-4" style={{ borderTopColor: '#376295' }}></div>
          <p className="text-slate-600 font-medium">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (queryError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Erro ao carregar relatório</p>
          <p className="text-slate-500 text-sm">{queryError.message}</p>
        </div>
      </div>
    );
  }

  // Filtrar entregas por data e filtros
  const entregasDoDia = entregas.filter(e => {
    if (!e.data_entrega) return false;
    const dataEntrega = parseISO(e.data_entrega);
    if (!isSameDay(dataEntrega, parseISO(dataSelecionada))) return false;

    // Filtro de status
    if (filtroStatus !== "todos" && e.status !== filtroStatus) return false;

    // Filtro de local (região do endereço)
    if (filtroLocal !== "todos" && e.endereco?.regiao !== filtroLocal) return false;

    // Filtro de motoboy
    if (filtroMotoboy !== "todos" && e.motoboy?.nome !== filtroMotoboy) return false;

    // Filtro de período
    if (filtroPeriodo !== "todos" && e.periodo_entrega !== filtroPeriodo) return false;

    // Busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      const match =
        e.cliente?.nome?.toLowerCase().includes(termo) ||
        e.requisicao?.toLowerCase().includes(termo) ||
        e.motoboy?.nome?.toLowerCase().includes(termo);
      if (!match) return false;
    }

    return true;
  });

  // Dados únicos para filtros
  const locaisUnicos = [...new Set(entregas
    .filter(e => e.data_entrega && isSameDay(parseISO(e.data_entrega), parseISO(dataSelecionada)))
    .map(e => e.endereco?.regiao))].filter(Boolean).sort();

  const motoboysUnicos = [...new Set(entregas
    .filter(e => e.data_entrega && isSameDay(parseISO(e.data_entrega), parseISO(dataSelecionada)))
    .map(e => e.motoboy?.nome))].filter(Boolean).sort();

  // Agrupar por local e ordenar
  const porLocal = entregasDoDia.reduce((acc, e) => {
    const local = e.endereco?.regiao || 'Sem região';
    if (!acc[local]) acc[local] = [];
    acc[local].push(e);
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
    'Pendente': entregasDoDia.filter(e => e.status === 'Pendente'),
    'Produzindo no Laboratório': entregasDoDia.filter(e => e.status === 'Produzindo no Laboratório'),
    'Preparando no Setor de Entregas': entregasDoDia.filter(e => e.status === 'Preparando no Setor de Entregas'),
    'A Caminho': entregasDoDia.filter(e => e.status === 'A Caminho'),
    'Entregue': entregasDoDia.filter(e => e.status === 'Entregue'),
    'Não Entregue': entregasDoDia.filter(e => e.status === 'Não Entregue'),
    'Voltou': entregasDoDia.filter(e => e.status === 'Voltou'),
    'Cancelado': entregasDoDia.filter(e => e.status === 'Cancelado'),
  };

  // Agrupar por período
  const porPeriodo = {
    'Manhã': entregasDoDia.filter(e => e.periodo_entrega === 'Manhã'),
    'Tarde': entregasDoDia.filter(e => e.periodo_entrega === 'Tarde'),
  };

  // Agrupar por motoboy
  const porMotoboy = entregasDoDia.reduce((acc, e) => {
    const motoboy = e.motoboy?.nome || 'Sem motoboy';
    if (!acc[motoboy]) acc[motoboy] = [];
    acc[motoboy].push(e);
    return acc;
  }, {});

  const handlePrint = () => {
    window.print();
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      "Pendente": { bgColor: "#F5E8F5", textColor: "#890d5d", label: "Pendente" },
      "Produzindo no Laboratório": { bgColor: "#F5E8F5", textColor: "#890d5d", label: "Produção" },
      "Preparando no Setor de Entregas": { bgColor: "#FEF3E8", textColor: "#f97316", label: "Preparando" },
      "A Caminho": { bgColor: "#FEF3E8", textColor: "#f97316", label: "A Caminho" },
      "Entregue": { bgColor: "#E8F5E8", textColor: "#3dac38", label: "Entregue" },
      "Não Entregue": { bgColor: "#fef2f2", textColor: "#ef4444", label: "Não Entregue" },
      "Voltou": { bgColor: "#FEF3E8", textColor: "#f97316", label: "Voltou" },
      "Cancelado": { bgColor: "#f1f5f9", textColor: "#64748b", label: "Cancelado" },
    };
    const config = configs[status] || configs["Pendente"];
    return (
      <Badge
        className="text-xs flex items-center gap-1"
        style={{
          backgroundColor: config.bgColor,
          color: config.textColor
        }}
      >
        {status === "Entregue" ? <Check className="w-3 h-3" /> : <Truck className="w-3 h-3" />} {config.label}
      </Badge>
    );
  };

  return (
    <>
      <style>{`
        @media print {
          * {
            visibility: hidden !important;
          }
          .print-wrapper,
          .print-wrapper * {
            visibility: visible !important;
          }
          .print-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header Customizado */}
        <div className="py-8 shadow-sm no-print" style={{
          background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
        }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <div>
                  <h1 className="text-4xl font-bold text-white">Relatório de Entregas</h1>
                  <p className="text-base text-white opacity-90 mt-1">Visualização completa das entregas do dia</p>
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                <Printer className="w-4 h-4" />
                Imprimir ({entregasDoDia.length})
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

          {/* Filtros e Busca */}
          <Card className="border-none shadow-lg no-print">
            <CardHeader>
              <CardTitle>Filtros e Busca</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Dados</label>
                <Input
                  type="date"
                  value={dataSelecionada}
                  onChange={(e) => setDataSelecionada(e.target.value)}
                  className="max-w-xs"
                />
              </div>

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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
                  <Select key={`status-${filtroStatus}`} value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
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
                  <Select key={`local-${filtroLocal}`} value={filtroLocal} onValueChange={setFiltroLocal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
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
                  <Select key={`motoboy-${filtroMotoboy}`} value={filtroMotoboy} onValueChange={setFiltroMotoboy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
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
                  <Select key={`periodo-${filtroPeriodo}`} value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Manhã">Manhã</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="print-wrapper">
            {/* Cabeçalho do Relatório */}
            <div className="text-white p-6 rounded-lg mb-6" style={{
              background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
            }}>
              <h2 className="text-2xl font-bold">
                Relatório do Dia {format(parseISO(dataSelecionada), "dd/MM/yyyy")}
              </h2>
            </div>

            {/* Cards de Resumo - Clicáveis */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card
                className="cursor-pointer hover:shadow-xl transition-all"
                style={{
                  border: filtroStatus === "todos" ? '2px solid #376295' : '2px solid transparent'
                }}
                onClick={() => setFiltroStatus("todos")}
              >
                <CardContent className="p-6">
                  <p className="text-sm text-slate-600 mb-1">Total</p>
                  <p className="text-4xl font-bold" style={{ color: '#376295' }}>{entregasDoDia.length}</p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-xl transition-all"
                style={{
                  border: filtroStatus === "Entregue" ? '2px solid #3dac38' : '2px solid transparent'
                }}
                onClick={() => setFiltroStatus(filtroStatus === "Entregue" ? "todos" : "Entregue")}
              >
                <CardContent className="p-6">
                  <p className="text-sm text-slate-600 mb-1">Entregues</p>
                  <p className="text-4xl font-bold" style={{ color: '#3dac38' }}>{porStatus['Entregue'].length}</p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-xl transition-all"
                style={{
                  border: filtroStatus === "A Caminho" ? '2px solid #f97316' : '2px solid transparent'
                }}
                onClick={() => setFiltroStatus(filtroStatus === "A Caminho" ? "todos" : "A Caminho")}
              >
                <CardContent className="p-6">
                  <p className="text-sm text-slate-600 mb-1">A Caminho</p>
                  <p className="text-4xl font-bold" style={{ color: '#f97316' }}>{porStatus['A Caminho'].length}</p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-xl transition-all"
                style={{
                  border: filtroStatus === "Pendente" ? '2px solid #890d5d' : '2px solid transparent'
                }}
                onClick={() => setFiltroStatus(filtroStatus === "Pendente" ? "todos" : "Pendente")}
              >
                <CardContent className="p-6">
                  <p className="text-sm text-slate-600 mb-1">Pendente</p>
                  <p className="text-4xl font-bold" style={{ color: '#890d5d' }}>{porStatus['Pendente'].length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Entregas por Local */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Entregas por Local</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(porLocal).sort((a, b) => a[0].localeCompare(b[0])).map(([local, entregas]) => (
                    <div key={local} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b">
                        <h3 className="font-bold text-slate-900">{local}</h3>
                        <Badge variant="outline">{entregas.length}</Badge>
                      </div>

                      {/* Manhã */}
                      {entregas.filter(e => e.periodo_entrega === 'Manhã').length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                            <Sun className="w-4 h-4" /> Manhã
                          </p>
                          <div className="space-y-2 pl-4">
                            {entregas.filter(e => e.periodo_entrega === 'Manhã').map(e => (
                              <Link
                                key={e.id}
                                to={`/detalhes-romaneio?id=${e.id}`}
                                className="flex justify-between items-center text-sm py-2 hover:bg-slate-50 rounded px-2 transition-colors"
                              >
                                <span className="text-slate-700">
                                  # {e.requisicao} - {e.cliente?.nome || e.cliente_nome}
                                </span>
                                <div className="flex items-center gap-2">
                                  {e.valor && (
                                    <Badge
                                      style={{
                                        backgroundColor: "#E8F0F8",
                                        color: "#376295"
                                      }}
                                    >
                                      R$ {e.valor.toFixed(2)}
                                    </Badge>
                                  )}
                                  <StatusBadge status={e.status} />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tarde */}
                      {entregas.filter(e => e.periodo_entrega === 'Tarde').length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                            <Moon className="w-4 h-4" /> Tarde
                          </p>
                          <div className="space-y-2 pl-4">
                            {entregas.filter(e => e.periodo_entrega === 'Tarde').map(e => (
                              <Link
                                key={e.id}
                                to={`/detalhes-romaneio?id=${e.id}`}
                                className="flex justify-between items-center text-sm py-2 hover:bg-slate-50 rounded px-2 transition-colors"
                              >
                                <span className="text-slate-700">
                                  # {e.requisicao} - {e.cliente?.nome || e.cliente_nome}
                                </span>
                                <div className="flex items-center gap-2">
                                  {e.valor && (
                                    <Badge
                                      style={{
                                        backgroundColor: "#E8F0F8",
                                        color: "#376295"
                                      }}
                                    >
                                      R$ {e.valor.toFixed(2)}
                                    </Badge>
                                  )}
                                  <StatusBadge status={e.status} />
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

            {/* Entregas por Status */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Entregas por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(porStatus).map(([status, entregas]) => (
                    entregas.length > 0 && (
                      <div key={status} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-slate-900">{status}</h3>
                          <Badge variant="outline">{entregas.length}</Badge>
                        </div>
                        <div className="space-y-2">
                          {entregas.map(e => (
                            <Link
                              key={e.id}
                              to={`/detalhes-romaneio?id=${e.id}`}
                              className="block text-sm text-slate-700 hover:bg-slate-50 rounded px-2 py-1 transition-colors"
                              style={{
                                '--hover-color': '#376295'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#376295'}
                              onMouseLeave={(e) => e.currentTarget.style.color = ''}
                            >
                              # {e.requisicao} - {e.cliente?.nome || e.cliente_nome}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Entregas por Motoboy */}
            <Card className="mb-6">
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
                        {entregas.map(e => (
                          <Link
                            key={e.id}
                            to={`/detalhes-romaneio?id=${e.id}`}
                            className="flex justify-between items-center text-sm hover:bg-slate-50 rounded px-2 py-1 transition-colors"
                          >
                            <span
                              className="text-slate-700"
                              onMouseEnter={(e) => e.currentTarget.style.color = '#376295'}
                              onMouseLeave={(e) => e.currentTarget.style.color = ''}
                            >
                              # {e.requisicao} - {e.cliente?.nome || e.cliente_nome}
                            </span>
                            <StatusBadge status={e.status} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Entregas por Período */}
            <Card>
              <CardHeader>
                <CardTitle>Entregas por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(porPeriodo).map(([periodo, entregas]) => (
                    <div key={periodo} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-900">{periodo}</h3>
                        <Badge variant="outline">{entregas.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {entregas.map(e => (
                          <Link
                            key={e.id}
                            to={`/detalhes-romaneio?id=${e.id}`}
                            className="flex justify-between items-center text-sm hover:bg-slate-50 rounded px-2 py-1 transition-colors"
                          >
                            <span
                              className="text-slate-700"
                              onMouseEnter={(e) => e.currentTarget.style.color = '#376295'}
                              onMouseLeave={(e) => e.currentTarget.style.color = ''}
                            >
                              # {e.requisicao} - {e.cliente?.nome || e.cliente_nome}
                            </span>
                            <StatusBadge status={e.status} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
