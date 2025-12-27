import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
} from "lucide-react";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function Pagamentos() {
  const queryClient = useQueryClient();

  // Estados
  const [mesAtual, setMesAtual] = useState(new Date());
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [verTodos, setVerTodos] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroMotoboy, setFiltroMotoboy] = useState("todos");

  // Buscar todas as entregas para gerenciar pagamentos
  const { data: entregas = [], isLoading, error: queryError } = useQuery({
    queryKey: ['pagamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(nome, telefone, cpf),
          endereco:enderecos(cidade, regiao),
          motoboy:motoboys(nome)
        `)
        .order('data_entrega', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    staleTime: 0,
    gcTime: 0,
  });

  // Invalidar cache quando componente montar
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
  }, [queryClient]);

  // Mostrar erro se houver
  useEffect(() => {
    if (queryError) {
      toast.error('Erro ao carregar pagamentos: ' + queryError.message);
    }
  }, [queryError]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-[#457bba] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Carregando pagamentos...</p>
        </div>
      </div>
    );
  }

  // Filtrar entregas
  const entregasFiltradas = entregas.filter(e => {
    // Filtro de data
    if (!verTodos && dataSelecionada && e.data_entrega) {
      if (!isSameDay(parseISO(e.data_entrega), dataSelecionada)) return false;
    }

    // Filtro de motoboy
    if (filtroMotoboy !== "todos" && e.motoboy?.nome !== filtroMotoboy) return false;

    // Busca por texto
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      const match =
        e.cliente?.nome?.toLowerCase().includes(termo) ||
        e.cliente?.telefone?.toLowerCase().includes(termo) ||
        e.requisicao?.toLowerCase().includes(termo);
      if (!match) return false;
    }

    return true;
  });

  // Calcular estatísticas
  const stats = {
    pendentes: entregasFiltradas.filter(e => !e.pagamento_recebido && e.status === 'Entregue').length,
    recebidos: entregasFiltradas.filter(e => e.pagamento_recebido).length,
    dinheiro: entregasFiltradas
      .filter(e => e.pagamento_recebido && (e.forma_pagamento === 'Dinheiro' || e.forma_pagamento === 'dinheiro'))
      .reduce((sum, e) => sum + (parseFloat(e.valor) || 0), 0),
    cartao: entregasFiltradas
      .filter(e => e.pagamento_recebido && (e.forma_pagamento === 'Cartão' || e.forma_pagamento === 'cartao' || e.forma_pagamento === 'Cartao'))
      .reduce((sum, e) => sum + (parseFloat(e.valor) || 0), 0),
  };

  // Motoboys únicos para o filtro
  const motoboysUnicos = [...new Set(entregas.map(e => e.motoboy?.nome))].filter(Boolean).sort();

  // Calendário
  const diasDoMes = eachDayOfInterval({
    start: startOfMonth(mesAtual),
    end: endOfMonth(mesAtual)
  });

  const primeiroDiaSemana = startOfMonth(mesAtual).getDay();
  const diasVaziosInicio = Array(primeiroDiaSemana).fill(null);

  const contarPagamentosDia = (dia) => {
    return entregas.filter(e =>
      e.data_entrega && isSameDay(parseISO(e.data_entrega), dia)
    ).length;
  };

  const mesAnterior = () => setMesAtual(subMonths(mesAtual, 1));
  const proximoMes = () => setMesAtual(addMonths(mesAtual, 1));

  const selecionarDia = (dia) => {
    setDataSelecionada(dia);
    setVerTodos(false);
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Pagamentos</h1>
          <p className="text-slate-600 mt-1">Gerenciamento de pagamentos das entregas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar com filtros */}
          <div className="lg:col-span-1">
            <Card className="border-none shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Filtrar por dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Checkbox Ver Todos */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ver-todos"
                    checked={verTodos}
                    onCheckedChange={setVerTodos}
                  />
                  <label
                    htmlFor="ver-todos"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Ver todos os pagamentos
                  </label>
                </div>

                {/* Calendário */}
                <div className="border rounded-lg p-3 bg-white">
                  {/* Header do calendário */}
                  <div className="flex items-center justify-between mb-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={mesAnterior}
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold">
                      {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={proximoMes}
                      className="h-8 w-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Dias da semana */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map(dia => (
                      <div key={dia} className="text-center text-xs font-medium text-slate-600">
                        {dia}
                      </div>
                    ))}
                  </div>

                  {/* Dias do mês */}
                  <div className="grid grid-cols-7 gap-1">
                    {diasVaziosInicio.map((_, index) => (
                      <div key={`vazio-${index}`} className="aspect-square" />
                    ))}
                    {diasDoMes.map(dia => {
                      const count = contarPagamentosDia(dia);
                      const isSelected = dataSelecionada && isSameDay(dia, dataSelecionada);
                      const isToday = isSameDay(dia, new Date());

                      return (
                        <button
                          key={dia.toISOString()}
                          onClick={() => selecionarDia(dia)}
                          disabled={verTodos}
                          className={`
                            aspect-square p-1 text-xs rounded-lg transition-all relative
                            ${isSelected ? 'bg-[#457bba] text-white font-bold' : ''}
                            ${!isSelected && isToday ? 'bg-blue-50 border border-[#457bba]' : ''}
                            ${!isSelected && !isToday ? 'hover:bg-slate-100' : ''}
                            ${verTodos ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          {format(dia, 'd')}
                          {count > 0 && !isSelected && (
                            <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#457bba] rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Data e contador */}
                {!verTodos && dataSelecionada && (
                  <div className="text-center py-3 bg-slate-50 rounded-lg">
                    <div className="text-sm font-semibold text-slate-900">
                      {format(dataSelecionada, "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {entregasFiltradas.length} pagamento{entregasFiltradas.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Área principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filtros superiores */}
            <Card className="border-none shadow-lg">
              <CardContent className="pt-6 space-y-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por número, nome ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Select Motoboy */}
                <Select value={filtroMotoboy} onValueChange={setFiltroMotoboy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os Motoboys" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Motoboys</SelectItem>
                    {motoboysUnicos.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pendentes */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-gradient-to-br from-yellow-50 to-orange-50">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-1">
                    {stats.pendentes}
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Pendentes</div>
                </CardContent>
              </Card>

              {/* Recebidos */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-green-600 mb-1">
                    {stats.recebidos}
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Recebidos</div>
                </CardContent>
              </Card>

              {/* Dinheiro */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    R$ {stats.dinheiro.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Dinheiro</div>
                </CardContent>
              </Card>

              {/* Cartão */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    R$ {stats.cartao.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Cartão</div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de pagamentos */}
            {entregasFiltradas.length === 0 ? (
              <Card className="border-none shadow-lg">
                <CardContent className="py-16">
                  <div className="text-center text-slate-400">
                    <DollarSign className="w-24 h-24 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Nenhum pagamento</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Pagamentos ({entregasFiltradas.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {entregasFiltradas.map(entrega => (
                      <Link
                        key={entrega.id}
                        to={`/detalhes-romaneio?id=${entrega.id}`}
                        className="block p-4 rounded-lg border border-slate-200 hover:border-[#457bba] hover:bg-slate-50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-900">
                                #{entrega.requisicao}
                              </span>
                              <span className="text-slate-600">-</span>
                              <span className="text-slate-700">
                                {entrega.cliente?.nome || entrega.cliente_nome}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                              <span>{entrega.motoboy?.nome || 'Sem motoboy'}</span>
                              <span>•</span>
                              <span>{entrega.data_entrega ? format(parseISO(entrega.data_entrega), "dd/MM/yyyy") : '-'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {entrega.valor && (
                              <div className="text-right">
                                <div className="font-bold text-lg text-slate-900">
                                  R$ {parseFloat(entrega.valor).toFixed(2)}
                                </div>
                                {entrega.forma_pagamento && (
                                  <div className="text-xs text-slate-600 flex items-center gap-1 justify-end">
                                    {entrega.forma_pagamento === 'Dinheiro' || entrega.forma_pagamento === 'dinheiro' ? (
                                      <>
                                        <Banknote className="w-3 h-3" />
                                        Dinheiro
                                      </>
                                    ) : (
                                      <>
                                        <CreditCard className="w-3 h-3" />
                                        Cartão
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            <Badge
                              className={
                                entrega.pagamento_recebido
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              }
                            >
                              {entrega.pagamento_recebido ? "Recebido" : "Pendente"}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
