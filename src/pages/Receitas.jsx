import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Package, Send, AlertCircle } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

export default function Receitas() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [visualizarTodas, setVisualizarTodas] = useState(false);

  const { data: romaneios, isLoading: loadingRomaneios } = useQuery({
    queryKey: ['romaneios-receitas'],
    queryFn: () => base44.entities.Romaneio.list('-data_entrega_prevista'),
    initialData: [],
  });

  const { data: entregasBalcao, isLoading: loadingBalcao } = useQuery({
    queryKey: ['entregas-balcao-receitas'],
    queryFn: () => base44.entities.EntregaBalcao.list('-data_cadastro'),
    initialData: [],
  });

  const isLoading = loadingRomaneios || loadingBalcao;

  // Filtrar apenas entregas que precisam reter receita e foram entregues
  const entregasComReceita = [
    ...romaneios
      .filter(r => r.buscar_receita && r.status === 'Entregue')
      .map(r => ({
        ...r,
        tipo: 'romaneio',
        numero: r.numero_requisicao,
        data_referencia: r.data_entrega_realizada || r.data_entrega_prevista,
      })),
    ...entregasBalcao
      .filter(e => e.buscar_receita && e.status === 'Entregue')
      .map(e => ({
        ...e,
        tipo: 'balcao',
        numero: e.numero_registro,
        data_referencia: e.data_entrega || e.data_cadastro,
      }))
  ];

  // Aplicar filtros
  const entregasFiltradas = entregasComReceita.filter(e => {
    // Filtro de data
    if (!visualizarTodas && e.data_referencia) {
      const dataRef = parseISO(e.data_referencia);
      if (!isSameDay(dataRef, selectedDate)) return false;
    }

    // Busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      const match = 
        e.numero?.toLowerCase().includes(termo) ||
        e.cliente_nome?.toLowerCase().includes(termo) ||
        e.cliente_telefone?.includes(searchTerm) ||
        e.cliente_cpf?.includes(searchTerm);
      if (!match) return false;
    }

    return true;
  });

  // Separar por status de receita
  const receitasPendentes = entregasFiltradas.filter(e => !e.receita_recebida);
  const receitasRecebidas = entregasFiltradas.filter(e => e.receita_recebida);

  const TipoBadge = ({ tipo }) => {
    return tipo === 'romaneio' ? (
      <Badge className="bg-purple-100 text-purple-700">
        <Package className="w-3 h-3 mr-1" />
        Romaneio
      </Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-700">
        <Send className="w-3 h-3 mr-1" />
        Balcão
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Receitas</h1>
          <p className="text-slate-600">Gerenciamento de receitas retidas</p>
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
                    id="visualizar-todas-receitas"
                    checked={visualizarTodas}
                    onChange={(e) => setVisualizarTodas(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <label htmlFor="visualizar-todas-receitas" className="cursor-pointer text-sm">
                    Ver todas as receitas
                  </label>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                  className="rounded-md border"
                  disabled={visualizarTodas}
                />
                {!visualizarTodas && (
                  <div className="mt-4 text-center">
                    <p className="text-sm font-semibold text-slate-900">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {entregasFiltradas.length} receita{entregasFiltradas.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista */}
          <div className="lg:col-span-3 space-y-6">
            {/* Busca */}
            <Card className="border-none shadow-lg">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por número, nome, telefone ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none shadow-md bg-red-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-red-900">{receitasPendentes.length}</p>
                  <p className="text-sm text-red-700">Pendentes</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-green-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-green-900">{receitasRecebidas.length}</p>
                  <p className="text-sm text-green-700">Recebidas</p>
                </CardContent>
              </Card>
            </div>

            {/* Receitas Pendentes */}
            {receitasPendentes.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Receitas Pendentes ({receitasPendentes.length})
                </h2>
                <Card className="border-none shadow-lg">
                  <CardContent className="p-0 divide-y divide-slate-100">
                    {receitasPendentes.map(entrega => (
                      <Link
                        key={`${entrega.tipo}-${entrega.id}`}
                        to={entrega.tipo === 'romaneio' ? `/DetalhesRomaneio?id=${entrega.id}` : `/Balcao`}
                        className="block p-6 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-bold text-slate-900 text-lg">#{entrega.numero}</h3>
                              <TipoBadge tipo={entrega.tipo} />
                              <Badge className="bg-red-100 text-red-700 border-red-400 border-2 font-bold animate-pulse">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                RECEITA NÃO RETIRADA
                              </Badge>
                            </div>
                            <p className="text-slate-600">{entrega.cliente_nome}</p>
                            {entrega.cliente_telefone && (
                              <p className="text-sm text-slate-500">{entrega.cliente_telefone}</p>
                            )}
                          </div>
                          <div className="text-right text-sm text-slate-500">
                            {entrega.data_referencia && format(parseISO(entrega.data_referencia), "dd/MM/yyyy")}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Receitas Recebidas */}
            {receitasRecebidas.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Receitas Recebidas ({receitasRecebidas.length})
                </h2>
                <Card className="border-none shadow-lg">
                  <CardContent className="p-0 divide-y divide-slate-100">
                    {receitasRecebidas.map(entrega => (
                      <Link
                        key={`${entrega.tipo}-${entrega.id}`}
                        to={entrega.tipo === 'romaneio' ? `/DetalhesRomaneio?id=${entrega.id}` : `/Balcao`}
                        className="block p-6 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-bold text-slate-900 text-lg">#{entrega.numero}</h3>
                              <TipoBadge tipo={entrega.tipo} />
                              <Badge className="bg-green-100 text-green-700">
                                ✓ Receita Recebida
                              </Badge>
                            </div>
                            <p className="text-slate-600">{entrega.cliente_nome}</p>
                            {entrega.cliente_telefone && (
                              <p className="text-sm text-slate-500">{entrega.cliente_telefone}</p>
                            )}
                          </div>
                          <div className="text-right text-sm text-slate-500">
                            {entrega.data_referencia && format(parseISO(entrega.data_referencia), "dd/MM/yyyy")}
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
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Carregando...</p>
                </CardContent>
              </Card>
            )}

            {!isLoading && entregasFiltradas.length === 0 && (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Nenhuma receita encontrada</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}