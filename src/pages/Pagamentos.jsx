import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Search, CreditCard, Package } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Pagamentos() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [visualizarTodos, setVisualizarTodos] = useState(false);
  const [filtroMotoboy, setFiltroMotoboy] = useState("todos");

  const { data: romaneios, isLoading } = useQuery({
    queryKey: ['romaneios-pagamentos'],
    queryFn: () => base44.entities.Romaneio.list('-data_entrega_prevista'),
    initialData: [],
  });

  // Filtrar romaneios que precisam de pagamento
  // Exclui "Pago" a menos que tenha imagem de pagamento
  const romaneiosComPagamento = romaneios.filter(r => {
    const formaNaoPaga = r.forma_pagamento && r.forma_pagamento !== "Pago";
    const temImagemPagamento = r.imagens?.some(img => img.tipo === 'pagamento');
    return formaNaoPaga || (r.forma_pagamento === "Pago" && temImagemPagamento);
  });

  // Aplicar filtros
  const romaneiosFiltrados = romaneiosComPagamento.filter(r => {
    // Filtro de data
    if (!visualizarTodos && r.data_entrega_prevista) {
      const dataEntrega = parseISO(r.data_entrega_prevista);
      if (!isSameDay(dataEntrega, selectedDate)) return false;
    }

    // Filtro de motoboy
    if (filtroMotoboy !== "todos" && r.motoboy !== filtroMotoboy) return false;

    // Busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      const match = 
        r.numero_requisicao?.toLowerCase().includes(termo) ||
        r.cliente_nome?.toLowerCase().includes(termo) ||
        r.cliente_telefone?.includes(searchTerm);
      if (!match) return false;
    }

    return true;
  });

  // Motoboys únicos
  const motoboysUnicos = [...new Set(romaneios.map(r => r.motoboy).filter(Boolean))];

  // Separar por status de pagamento
  const pagamentosPendentes = romaneiosFiltrados.filter(r => !r.pagamento_recebido);
  const pagamentosRecebidos = romaneiosFiltrados.filter(r => r.pagamento_recebido);

  // Calcular totais por forma de pagamento
  const totaisPorForma = pagamentosRecebidos.reduce((acc, r) => {
    if (r.valor_pagamento && (r.forma_pagamento === "Dinheiro" || r.forma_pagamento === "Maquina")) {
      const forma = r.forma_pagamento;
      if (!acc[forma]) acc[forma] = 0;
      acc[forma] += r.valor_pagamento;
    }
    return acc;
  }, {});

  const totalDinheiro = totaisPorForma["Dinheiro"] || 0;
  const totalCartao = totaisPorForma["Maquina"] || 0;

  const StatusPagamentoBadge = ({ recebido }) => {
    return recebido ? (
      <Badge className="bg-green-100 text-green-700">
        ✓ Pago
      </Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-700">
        Pendente
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Pagamentos</h1>
          <p className="text-slate-600">Gerenciamento de pagamentos das entregas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendário */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Filtrar por Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="visualizar-todos-pagamentos"
                    checked={visualizarTodos}
                    onChange={(e) => setVisualizarTodos(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <label htmlFor="visualizar-todos-pagamentos" className="cursor-pointer text-sm">
                    Ver todos os pagamentos
                  </label>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                  className="rounded-md border"
                  disabled={visualizarTodos}
                />
                {!visualizarTodos && (
                  <div className="mt-4 text-center">
                    <p className="text-sm font-semibold text-slate-900">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {romaneiosFiltrados.length} pagamento{romaneiosFiltrados.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista */}
          <div className="lg:col-span-3 space-y-6">
            {/* Busca e Filtros */}
            <Card className="border-none shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por número, nome ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filtroMotoboy} onValueChange={setFiltroMotoboy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Motoboy" />
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

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-none shadow-md bg-yellow-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-yellow-900">{pagamentosPendentes.length}</p>
                  <p className="text-sm text-yellow-700">Pendentes</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-green-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-green-900">{pagamentosRecebidos.length}</p>
                  <p className="text-sm text-green-700">Recebidos</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-blue-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-xl font-bold text-blue-900">R$ {totalDinheiro.toFixed(2)}</p>
                  <p className="text-sm text-blue-700">Dinheiro</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-purple-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-xl font-bold text-purple-900">R$ {totalCartao.toFixed(2)}</p>
                  <p className="text-sm text-purple-700">Cartão</p>
                </CardContent>
              </Card>
            </div>

            {/* Pagamentos Pendentes */}
            {pagamentosPendentes.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pagamentos Pendentes ({pagamentosPendentes.length})
                </h2>
                <Card className="border-none shadow-lg">
                  <CardContent className="p-0 divide-y divide-slate-100">
                    {pagamentosPendentes.map(romaneio => (
                      <Link
                        key={romaneio.id}
                        to={`/DetalhesRomaneio?id=${romaneio.id}`}
                        className="block p-6 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-bold text-slate-900 text-lg">#{romaneio.numero_requisicao}</h3>
                              <StatusPagamentoBadge recebido={romaneio.pagamento_recebido} />
                              <Badge className="bg-slate-100 text-slate-700">
                                <CreditCard className="w-3 h-3 mr-1" />
                                {romaneio.forma_pagamento}
                              </Badge>
                              {romaneio.valor_pagamento && (
                                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-400 border-2 font-bold">
                                  R$ {romaneio.valor_pagamento.toFixed(2)}
                                </Badge>
                              )}
                              {romaneio.motoboy && (
                                <Badge variant="outline">
                                  {romaneio.motoboy}
                                </Badge>
                              )}
                            </div>
                            <p className="text-slate-600">{romaneio.cliente_nome}</p>
                            {romaneio.imagens?.filter(img => img.tipo === 'pagamento').length > 0 && (
                              <Badge className="bg-blue-100 text-blue-700">
                                <Package className="w-3 h-3 mr-1" />
                                {romaneio.imagens.filter(img => img.tipo === 'pagamento').length} imagem(ns)
                              </Badge>
                            )}
                          </div>
                          <div className="text-right text-sm text-slate-500">
                            {romaneio.data_entrega_prevista && format(parseISO(romaneio.data_entrega_prevista), "dd/MM/yyyy")}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Pagamentos Recebidos */}
            {pagamentosRecebidos.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pagamentos Recebidos ({pagamentosRecebidos.length})
                </h2>
                <Card className="border-none shadow-lg">
                  <CardContent className="p-0 divide-y divide-slate-100">
                    {pagamentosRecebidos.map(romaneio => (
                      <Link
                        key={romaneio.id}
                        to={`/DetalhesRomaneio?id=${romaneio.id}`}
                        className="block p-6 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-bold text-slate-900 text-lg">#{romaneio.numero_requisicao}</h3>
                              <StatusPagamentoBadge recebido={romaneio.pagamento_recebido} />
                              <Badge className="bg-slate-100 text-slate-700">
                                <CreditCard className="w-3 h-3 mr-1" />
                                {romaneio.forma_pagamento}
                              </Badge>
                              {romaneio.valor_pagamento && (
                                <Badge className="bg-green-100 text-green-700">
                                  R$ {romaneio.valor_pagamento.toFixed(2)}
                                </Badge>
                              )}
                              {romaneio.motoboy && (
                                <Badge variant="outline">
                                  {romaneio.motoboy}
                                </Badge>
                              )}
                            </div>
                            <p className="text-slate-600">{romaneio.cliente_nome}</p>
                            {romaneio.imagens?.filter(img => img.tipo === 'pagamento').length > 0 && (
                              <Badge className="bg-blue-100 text-blue-700">
                                <Package className="w-3 h-3 mr-1" />
                                {romaneio.imagens.filter(img => img.tipo === 'pagamento').length} imagem(ns)
                              </Badge>
                            )}
                          </div>
                          <div className="text-right text-sm text-slate-500">
                            {romaneio.data_entrega_prevista && format(parseISO(romaneio.data_entrega_prevista), "dd/MM/yyyy")}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {isLoading && (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Carregando...</p>
                </CardContent>
              </Card>
            )}

            {!isLoading && romaneiosFiltrados.length === 0 && (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Nenhum pagamento encontrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}