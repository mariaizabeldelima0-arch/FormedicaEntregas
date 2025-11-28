import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { CheckCircle, XCircle, FileText, Filter, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PlanilhaDiaria() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Parse URL params para restaurar estado
  const urlParams = new URLSearchParams(location.search);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const dataParam = urlParams.get('data');
    return dataParam ? new Date(dataParam) : new Date();
  });
  const [filtroMotoboy, setFiltroMotoboy] = useState(urlParams.get('motoboy') || "todos");
  const [visualizarTodas, setVisualizarTodas] = useState(urlParams.get('todas') === 'true');
  const [editandoId, setEditandoId] = useState(null);
  const [editData, setEditData] = useState({});

  // Atualizar URL quando estado mudar
  useEffect(() => {
    const params = new URLSearchParams();
    if (!visualizarTodas) {
      params.set('data', format(selectedDate, 'yyyy-MM-dd'));
    }
    params.set('todas', visualizarTodas.toString());
    if (filtroMotoboy !== "todos") params.set('motoboy', filtroMotoboy);
    
    navigate(`?${params.toString()}`, { replace: true });
  }, [selectedDate, filtroMotoboy, visualizarTodas]);

  const { data: romaneios, isLoading } = useQuery({
    queryKey: ['romaneios-planilha'],
    queryFn: () => base44.entities.Romaneio.list('-data_entrega_prevista'),
    initialData: [],
    refetchOnMount: true,
    staleTime: 0,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Romaneio.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneios-planilha'] });
      toast.success('Atualizado com sucesso!');
      setEditandoId(null);
      setEditData({});
    },
    onError: () => {
      toast.error('Erro ao atualizar');
    }
  });

  // Filtrar romaneios
  const romaneiosFiltrados = romaneios.filter(r => {
    if (!visualizarTodas && r.data_entrega_prevista) {
      const dataEntrega = parseISO(r.data_entrega_prevista);
      if (!isSameDay(dataEntrega, selectedDate)) return false;
    }

    if (filtroMotoboy !== "todos" && r.motoboy !== filtroMotoboy) return false;

    return true;
  });

  // Ordenar por cidade
  const romaneiosOrdenados = [...romaneiosFiltrados].sort((a, b) => {
    const cidadeCompare = a.cidade_regiao.localeCompare(b.cidade_regiao);
    if (cidadeCompare !== 0) return cidadeCompare;
    return a.periodo_entrega === "Manhã" ? -1 : 1;
  });

  // Motoboys únicos
  const motoboysUnicos = [...new Set(romaneios.map(r => r.motoboy).filter(Boolean))];

  const handleEdit = (romaneio) => {
    setEditandoId(romaneio.id);
    setEditData({
      observacoes: romaneio.observacoes || "",
      forma_pagamento: romaneio.forma_pagamento,
      periodo_entrega: romaneio.periodo_entrega,
      status: romaneio.status,
      receita_recebida: romaneio.receita_recebida || false,
      pagamento_recebido: romaneio.pagamento_recebido || false,
    });
  };

  const handleSave = (id) => {
    updateMutation.mutate({ id, data: editData });
  };

  const handleCancel = () => {
    setEditandoId(null);
    setEditData({});
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-full mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Planilha Diária</h1>
          <p className="text-slate-600">Visualize e edite todas as entregas do dia</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendário */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Selecione a Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="visualizar-todas"
                    checked={visualizarTodas}
                    onChange={(e) => setVisualizarTodas(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <label htmlFor="visualizar-todas" className="cursor-pointer text-sm">
                    Ver todas
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
                      {romaneiosFiltrados.length} entrega{romaneiosFiltrados.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Planilha */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filtros */}
            <Card className="border-none shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Filter className="w-5 h-5 text-slate-500" />
                  <Select value={filtroMotoboy} onValueChange={setFiltroMotoboy}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por Motoboy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Motoboys</SelectItem>
                      {motoboysUnicos.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filtroMotoboy !== "todos" && (
                    <Button variant="outline" size="sm" onClick={() => setFiltroMotoboy("todos")}>
                      Limpar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabela */}
            <Card className="border-none shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b-2 border-slate-300">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Ver</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Cidade</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Cliente</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Contato</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Nº Req</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Pgto</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Período</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Status</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Receita</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Pago</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Motoboy</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Observações</th>
                      <th className="px-3 py-3 text-center font-semibold text-slate-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan="13" className="p-12 text-center text-slate-500">
                          Carregando...
                        </td>
                      </tr>
                    ) : romaneiosOrdenados.length === 0 ? (
                      <tr>
                        <td colSpan="13" className="p-12 text-center text-slate-500">
                          Nenhuma entrega encontrada
                        </td>
                      </tr>
                    ) : (
                      romaneiosOrdenados.map((romaneio) => {
                        const isEditing = editandoId === romaneio.id;
                        return (
                          <tr key={romaneio.id} className="hover:bg-slate-50">
                            <td className="px-3 py-3">
                              <Link 
                                to={createPageUrl(`DetalhesRomaneio?id=${romaneio.id}`)}
                                className="text-[#457bba] hover:text-[#3a6ba0] inline-flex items-center gap-1"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            </td>
                            <td className="px-3 py-3 text-slate-700 font-medium">{romaneio.cidade_regiao}</td>
                            <td className="px-3 py-3 text-slate-700">{romaneio.cliente_nome}</td>
                            <td className="px-3 py-3 text-slate-600 text-xs">{romaneio.cliente_telefone}</td>
                            <td className="px-3 py-3 text-slate-700 font-mono text-xs">#{romaneio.numero_requisicao}</td>
                            <td className="px-3 py-3">
                              {isEditing ? (
                                <select
                                  value={editData.forma_pagamento}
                                  onChange={(e) => setEditData({ ...editData, forma_pagamento: e.target.value })}
                                  className="w-full text-xs p-1 border rounded"
                                >
                                  <option value="Pago">Pago</option>
                                  <option value="Dinheiro">Dinheiro</option>
                                  <option value="Maquina">Maquina</option>
                                  <option value="Troco P/">Troco P/</option>
                                  <option value="Via na Pasta">Via na Pasta</option>
                                  <option value="Só Entregar">Só Entregar</option>
                                  <option value="Aguardando">Aguardando</option>
                                </select>
                              ) : (
                                <span className="text-xs text-slate-600">{romaneio.forma_pagamento}</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {isEditing ? (
                                <select
                                  value={editData.periodo_entrega}
                                  onChange={(e) => setEditData({ ...editData, periodo_entrega: e.target.value })}
                                  className="w-full text-xs p-1 border rounded"
                                >
                                  <option value="Manhã">Manhã</option>
                                  <option value="Tarde">Tarde</option>
                                </select>
                              ) : (
                                <span className="text-xs text-slate-600">{romaneio.periodo_entrega}</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {isEditing ? (
                                <select
                                  value={editData.status}
                                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                  className="w-full text-xs p-1 border rounded"
                                >
                                  <option value="Pendente">Pendente</option>
                                  <option value="Produzindo no Laboratório">Produção</option>
                                  <option value="Preparando no Setor de Entregas">Preparando</option>
                                  <option value="A Caminho">A Caminho</option>
                                  <option value="Entregue">Entregue</option>
                                  <option value="Não Entregue">Não Entregue</option>
                                  <option value="Voltou">Voltou</option>
                                  <option value="Cancelado">Cancelado</option>
                                </select>
                              ) : (
                                <span className="text-xs text-slate-600">{romaneio.status}</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {isEditing ? (
                                <input
                                  type="checkbox"
                                  checked={editData.receita_recebida}
                                  onChange={(e) => setEditData({ ...editData, receita_recebida: e.target.checked })}
                                  className="rounded border-slate-300"
                                />
                              ) : romaneio.receita_recebida ? (
                                <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {isEditing ? (
                                <input
                                  type="checkbox"
                                  checked={editData.pagamento_recebido}
                                  onChange={(e) => setEditData({ ...editData, pagamento_recebido: e.target.checked })}
                                  className="rounded border-slate-300"
                                />
                              ) : romaneio.pagamento_recebido ? (
                                <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                              )}
                            </td>
                            <td className="px-3 py-3 text-slate-700 text-xs">{romaneio.motoboy}</td>
                            <td className="px-3 py-3">
                              {isEditing ? (
                                <Input
                                  value={editData.observacoes}
                                  onChange={(e) => setEditData({ ...editData, observacoes: e.target.value })}
                                  className="text-xs"
                                  placeholder="Observações..."
                                />
                              ) : (
                                <span className="text-xs text-slate-600">{romaneio.observacoes || "-"}</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {isEditing ? (
                                <div className="flex gap-1 justify-center">
                                  <Button size="sm" onClick={() => handleSave(romaneio.id)} disabled={updateMutation.isPending}>
                                    ✓
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={handleCancel}>
                                    ✕
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="ghost" onClick={() => handleEdit(romaneio)}>
                                  <FileText className="w-4 h-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}