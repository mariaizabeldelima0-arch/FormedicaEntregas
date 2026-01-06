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
  ArrowLeft,
  Printer,
  Search,
  ClipboardList,
  Package,
  Truck,
  Check,
  Sunrise,
  Sunset,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon
} from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate, Link } from "react-router-dom";

export default function Relatorios() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get('data');

  const [dataSelecionada, setDataSelecionada] = useState(dataParam || format(new Date(), "yyyy-MM-dd"));
  const [currentMonthDate, setCurrentMonthDate] = useState(dataParam ? parseISO(dataParam) : new Date());
  const [filtroStatus, setFiltroStatus] = useState(urlParams.get('status') || "todos");
  const [filtroLocal, setFiltroLocal] = useState(urlParams.get('local') || "todos");
  const [filtroMotoboy, setFiltroMotoboy] = useState(urlParams.get('motoboy') || "todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState(urlParams.get('periodo') || "todos");
  const [searchTerm, setSearchTerm] = useState(urlParams.get('busca') || "");

  // Função para gerar dias do mês
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: '', isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const dateStr = format(dayDate, 'yyyy-MM-dd');
      days.push({
        day: i,
        isCurrentMonth: true,
        isSelected: dateStr === dataSelecionada,
        date: dayDate
      });
    }

    return days;
  };

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
          <div className="w-16 h-16 border-4 border-slate-300 border-t-[#457bba] rounded-full animate-spin mx-auto mb-4"></div>
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
      "Pendente": { bg: "bg-slate-100", text: "text-slate-700", label: "Pendente" },
      "Produzindo no Laboratório": { bg: "bg-blue-100", text: "text-blue-700", label: "Produção" },
      "Preparando no Setor de Entregas": { bg: "bg-yellow-100", text: "text-yellow-700", label: "Preparando" },
      "A Caminho": { bg: "bg-purple-100", text: "text-purple-700", label: "Um Caminho" },
      "Entregue": { bg: "bg-green-100", text: "text-green-700", label: "Entregue" },
      "Não Entregue": { bg: "bg-red-100", text: "text-red-700", label: "Não Entregue" },
      "Voltou": { bg: "bg-orange-100", text: "text-orange-700", label: "Voltou" },
      "Cancelado": { bg: "bg-gray-100", text: "text-gray-700", label: "Cancelado" },
    };
    const config = configs[status] || configs["Pendente"];
    return (
      <Badge className={`${config.bg} ${config.text} text-xs flex items-center gap-1`}>
        {status === "Entregue" ? <Check className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
        {config.label}
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
        {/* Header com gradiente */}
        <div className="py-8 shadow-sm no-print" style={{
          background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
        }}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white">Relatório de Entregas</h1>
              <p className="text-base text-white opacity-90 mt-1">Visualização completa das entregas do dia - {format(parseISO(dataSelecionada), "dd 'de' MMMM", { locale: ptBR })}</p>
            </div>
            <Button
              className="bg-white hover:bg-slate-100"
              style={{ color: '#457bba' }}
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir ({entregasDoDia.length})
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
          {/* Sidebar Esquerda - Calendário */}
          <div className="w-80 flex-shrink-0 no-print">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
              {/* Navegação do Calendário */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const newDate = new Date(currentMonthDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setCurrentMonthDate(newDate);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>

                <span className="text-sm font-semibold text-slate-700">
                  {currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                </span>

                <button
                  onClick={() => {
                    const newDate = new Date(currentMonthDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setCurrentMonthDate(newDate);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Grid do Calendário */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {/* Dias da Semana */}
                {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((dia) => (
                  <div key={dia} className="text-center text-xs font-semibold text-slate-500 py-2">
                    {dia}
                  </div>
                ))}

                {/* Dias do Mês */}
                {getDaysInMonth(currentMonthDate).map((dayInfo, index) => {
                  if (!dayInfo.isCurrentMonth) {
                    return <div key={index} className="aspect-square" />;
                  }

                  const isSelected = dayInfo.isSelected;
                  const isToday = dayInfo.date?.toDateString() === new Date().toDateString();

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setDataSelecionada(format(dayInfo.date, 'yyyy-MM-dd'));
                      }}
                      className="aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center hover:bg-blue-50"
                      style={{
                        backgroundColor: isSelected ? '#376295' : 'transparent',
                        color: isSelected ? 'white' : isToday ? '#376295' : '#1e293b',
                        fontWeight: isToday || isSelected ? 'bold' : 'normal'
                      }}
                    >
                      {dayInfo.day}
                    </button>
                  );
                })}
              </div>

              {/* Data Selecionada */}
              <div className="text-center pt-4 border-t border-slate-200">
                <div className="text-base font-semibold text-slate-700">
                  {format(parseISO(dataSelecionada), "dd 'de' MMMM", { locale: ptBR })}
                </div>
                <div className="text-sm text-slate-500">
                  {entregasDoDia.length} entregas
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {/* Card Total */}
              <div
                onClick={() => setFiltroStatus("todos")}
                className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
                style={{
                  border: filtroStatus === "todos" ? '2px solid #376295' : '2px solid transparent'
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F0F8' }}>
                    <ClipboardList className="w-6 h-6" style={{ color: '#376295' }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Total</span>
                </div>
                <div className="text-4xl font-bold text-center" style={{ color: '#376295' }}>
                  {entregasDoDia.length}
                </div>
              </div>

              {/* Card Produção */}
              <div
                onClick={() => setFiltroStatus(filtroStatus === "Produzindo no Laboratório" ? "todos" : "Produzindo no Laboratório")}
                className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
                style={{
                  border: filtroStatus === "Produzindo no Laboratório" ? '2px solid #890d5d' : '2px solid transparent'
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#F5E8F5' }}>
                    <Package className="w-6 h-6" style={{ color: '#890d5d' }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Produção</span>
                </div>
                <div className="text-4xl font-bold text-center" style={{ color: '#890d5d' }}>
                  {porStatus['Produzindo no Laboratório'].length}
                </div>
              </div>

              {/* Card A Caminho */}
              <div
                onClick={() => setFiltroStatus(filtroStatus === "A Caminho" ? "todos" : "A Caminho")}
                className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
                style={{
                  border: filtroStatus === "A Caminho" ? '2px solid #f97316' : '2px solid transparent'
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#FEF3E8' }}>
                    <Truck className="w-6 h-6" style={{ color: '#f97316' }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">A Caminho</span>
                </div>
                <div className="text-4xl font-bold text-center" style={{ color: '#f97316' }}>
                  {porStatus['A Caminho'].length}
                </div>
              </div>

              {/* Card Entregues */}
              <div
                onClick={() => setFiltroStatus(filtroStatus === "Entregue" ? "todos" : "Entregue")}
                className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
                style={{
                  border: filtroStatus === "Entregue" ? '2px solid #22c55e' : '2px solid transparent'
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F5E8' }}>
                    <Check className="w-6 h-6" style={{ color: '#22c55e' }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Entregues</span>
                </div>
                <div className="text-4xl font-bold text-center" style={{ color: '#22c55e' }}>
                  {porStatus['Entregue'].length}
                </div>
              </div>
            </div>

            {/* Buscar e Filtrar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 no-print">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Buscar e Filtrar</h2>

                {/* Botão Limpar Filtros */}
                {(searchTerm || (filtroStatus !== "todos") || (filtroLocal !== "todos") || (filtroMotoboy !== "todos") || (filtroPeriodo !== "todos")) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFiltroStatus('todos');
                      setFiltroLocal('todos');
                      setFiltroMotoboy('todos');
                      setFiltroPeriodo('todos');
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpar Filtros
                  </button>
                )}
              </div>

              {/* Filtros Ativos */}
              {(searchTerm || (filtroStatus !== "todos") || (filtroLocal !== "todos") || (filtroMotoboy !== "todos") || (filtroPeriodo !== "todos")) && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Filtros ativos:</span>

                  {searchTerm && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                      <Search className="w-3.5 h-3.5" />
                      Busca: "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm('')}
                        className="ml-1 hover:bg-blue-200 rounded p-0.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}

                  {filtroStatus !== "todos" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                      Status: {filtroStatus === 'Produzindo no Laboratório' ? 'Produção' : filtroStatus}
                      <button
                        onClick={() => setFiltroStatus('todos')}
                        className="ml-1 hover:bg-purple-200 rounded p-0.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}

                  {filtroLocal !== "todos" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded text-sm font-medium">
                      Local: {filtroLocal}
                      <button
                        onClick={() => setFiltroLocal('todos')}
                        className="ml-1 hover:bg-orange-200 rounded p-0.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}

                  {filtroMotoboy !== "todos" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm font-medium">
                      Motoboy: {filtroMotoboy}
                      <button
                        onClick={() => setFiltroMotoboy('todos')}
                        className="ml-1 hover:bg-green-200 rounded p-0.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}

                  {filtroPeriodo !== "todos" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded text-sm font-medium">
                      Período: {filtroPeriodo}
                      <button
                        onClick={() => setFiltroPeriodo('todos')}
                        className="ml-1 hover:bg-amber-200 rounded p-0.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {/* Campo de Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por cliente, requisição ou motoboy..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                {/* Filtros em Linha */}
                <div className="grid grid-cols-4 gap-4">
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
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filtroLocal} onValueChange={setFiltroLocal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Regiões" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas Regiões</SelectItem>
                      {locaisUnicos.map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filtroMotoboy} onValueChange={setFiltroMotoboy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Motoboys" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos Motoboys</SelectItem>
                      {motoboysUnicos.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Períodos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos Períodos</SelectItem>
                      <SelectItem value="Manhã">Manhã</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

          <div className="print-wrapper">
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
                            <Sunrise className="w-4 h-4" />
                            Manhã
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
                                    <Badge className="bg-orange-100 text-orange-700">
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
                            <Sunset className="w-4 h-4" />
                            Tarde
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
                                    <Badge className="bg-orange-100 text-orange-700">
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
                              className="block text-sm text-slate-700 hover:text-[#457bba] hover:bg-slate-50 rounded px-2 py-1 transition-colors"
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
                            <span className="text-slate-700 hover:text-[#457bba]">
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
                            <span className="text-slate-700 hover:text-[#457bba]">
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
      </div>
    </>
  );
}
