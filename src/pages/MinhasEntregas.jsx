
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Package, 
  MapPin, 
  Phone, 
  CreditCard, 
  Clock,
  CheckCircle,
  XCircle,
  Snowflake,
  Navigation,
  AlertCircle,
  DollarSign,
  FileText,
  Printer
} from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function MinhasEntregas() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRomaneio, setSelectedRomaneio] = useState(null);
  const [showConcluirDialog, setShowConcluirDialog] = useState(false);
  const [showProblemaDialog, setShowProblemaDialog] = useState(false);
  const [motivoProblema, setMotivoProblema] = useState("");
  const [filtroLocal, setFiltroLocal] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.tipo_usuario === 'admin' || user?.role === 'admin';
  // const isMotoboy = user?.tipo_usuario === 'entregador'; // Not directly used in the query filter, but useful for context

  const { data: romaneios, isLoading } = useQuery({
    queryKey: ['minhas-entregas', user?.full_name],
    queryFn: async () => {
      if (!user) return [];
      const todos = await base44.entities.Romaneio.list('-created_date');
      
      // Se for admin ou o usuário específico, mostrar entregas de todos os motoboys
      if (isAdmin || user.email === 'mariaizabeldelima0@gmail.com') { // Specific user override
        return todos.filter(r => 
          r.status !== 'Entregue' && 
          r.status !== 'Cancelado'
        );
      }
      
      // Se for motoboy, filtrar apenas suas entregas
      return todos.filter(r => 
        r.motoboy === user.full_name &&
        r.status !== 'Entregue' && 
        r.status !== 'Cancelado'
      );
    },
    enabled: !!user,
    initialData: [],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, motivo }) => {
      const data = { 
        status,
        ...(status === 'Entregue' && { data_entrega_realizada: new Date().toISOString() }),
        ...(motivo && { motivo_nao_entrega: motivo })
      };
      return base44.entities.Romaneio.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-entregas'] });
      toast.success('Status atualizado!');
      setShowConcluirDialog(false);
      setShowProblemaDialog(false);
      setSelectedRomaneio(null);
      setMotivoProblema("");
    },
  });

  // Filtrar entregas do dia selecionado
  const romaneiosDoDia = romaneios.filter(r => {
    if (!r.data_entrega_prevista) return false;
    const dataEntrega = parseISO(r.data_entrega_prevista);
    if (!isSameDay(dataEntrega, selectedDate)) return false;
    
    // Aplicar filtros
    if (filtroLocal !== "todos" && r.cidade_regiao !== filtroLocal) return false;
    if (filtroPeriodo !== "todos" && r.periodo_entrega !== filtroPeriodo) return false;
    
    return true;
  });

  // Locais únicos para o filtro
  const locaisUnicos = [...new Set(romaneios
    .filter(r => r.data_entrega_prevista && isSameDay(parseISO(r.data_entrega_prevista), selectedDate))
    .map(r => r.cidade_regiao))].sort();

  // Ordenar por local (cidade_regiao) e depois por período
  const romaneiosOrdenados = [...romaneiosDoDia].sort((a, b) => {
    // Primeiro por local
    const localCompare = a.cidade_regiao.localeCompare(b.cidade_regiao);
    if (localCompare !== 0) return localCompare;
    
    // Depois por período (Manhã antes de Tarde)
    if (a.periodo_entrega !== b.periodo_entrega) {
      return a.periodo_entrega === "Manhã" ? -1 : 1;
    }
    
    return 0;
  });

  const handleIniciarEntrega = (romaneio) => {
    updateStatusMutation.mutate({ id: romaneio.id, status: 'A Caminho' });
  };

  const handleConcluir = () => {
    if (selectedRomaneio) {
      updateStatusMutation.mutate({ id: selectedRomaneio.id, status: 'Entregue' });
    }
  };

  const handleProblema = () => {
    if (!motivoProblema.trim()) {
      toast.error('Descreva o motivo do problema');
      return;
    }
    if (selectedRomaneio) {
      updateStatusMutation.mutate({ 
        id: selectedRomaneio.id, 
        status: 'Não Entregue',
        motivo: motivoProblema
      });
    }
  };

  const abrirNavegacao = (romaneio) => {
    const end = romaneio.endereco;
    const endereco = `${end.rua}, ${end.numero}, ${end.bairro}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  // Verificar se precisa cobrar valor
  const precisaCobrar = (romaneio) => {
    return romaneio.valor_pagamento && 
           ["Dinheiro", "Maquina", "Troco P/"].includes(romaneio.forma_pagamento);
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      "Pendente": { color: "bg-slate-100 text-slate-700", icon: Clock },
      "A Caminho": { color: "bg-purple-100 text-purple-700", icon: Package },
    };
    const { color, icon: Icon } = configs[status] || configs["Pendente"];
    return (
      <Badge className={`${color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Agrupar por local
  const romaneiosPorLocal = romaneiosOrdenados.reduce((acc, r) => {
    if (!acc[r.cidade_regiao]) {
      acc[r.cidade_regiao] = [];
    }
    acc[r.cidade_regiao].push(r);
    return acc;
  }, {});

  const EntregaCard = ({ romaneio }) => {
    const deveSerCobrado = precisaCobrar(romaneio);
    
    return (
      <Card className={`border-slate-200 hover:shadow-lg transition-shadow ${deveSerCobrado ? 'ring-2 ring-orange-400' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <CardTitle className="text-lg">#{romaneio.numero_requisicao}</CardTitle>
                <StatusBadge status={romaneio.status} />
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
              className="w-full no-print"
              onClick={() => abrirNavegacao(romaneio)}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Abrir no Mapa
            </Button>
          </div>

          {/* Informações de Pagamento */}
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <span className="font-medium">{romaneio.forma_pagamento}</span>
          </div>

          {/* Telefone */}
          {romaneio.cliente_telefone && (
            <a
              href={`tel:${romaneio.cliente_telefone}`}
              className="flex items-center gap-2 text-sm text-[#457bba] hover:underline no-print"
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

          {/* Ações */}
          <div className="flex gap-2 pt-2 no-print">
            {romaneio.status === 'Pendente' && (
              <Button
                className="flex-1 bg-[#457bba] hover:bg-[#3a6ba0]"
                onClick={() => handleIniciarEntrega(romaneio)}
              >
                Iniciar Entrega
              </Button>
            )}
            {romaneio.status === 'A Caminho' && (
              <>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setSelectedRomaneio(romaneio);
                    setShowConcluirDialog(true);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Concluir
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setSelectedRomaneio(romaneio);
                    setShowProblemaDialog(true);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Problema
                </Button>
              </>
            )}
          </div>
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
                Minhas Entregas
              </h1>
              <p className="text-slate-600">
                Olá, <span className="font-semibold text-[#457bba]">{user?.full_name}</span>
              </p>
            </div>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Relatório
            </Button>
          </div>

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
              {/* Filtros - no-print */}
              <Card className="border-none shadow-lg no-print">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
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
                  {(filtroLocal !== "todos" || filtroPeriodo !== "todos") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setFiltroLocal("todos");
                        setFiltroPeriodo("todos");
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Cabeçalho para impressão */}
              <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-bold text-center mb-2">
                  Relatório de Entregas - {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                </h1>
                <p className="text-center text-sm text-slate-600">
                  Total: {romaneiosDoDia.length} entregas
                </p>
                {filtroLocal !== "todos" && <p className="text-center text-sm text-slate-600">Local: {filtroLocal}</p>}
                {filtroPeriodo !== "todos" && <p className="text-center text-sm text-slate-600">Período: {filtroPeriodo}</p>}
              </div>

              {isLoading ? (
                <Card className="border-none shadow-lg">
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Carregando...</p>
                  </CardContent>
                </Card>
              ) : romaneiosDoDia.length === 0 ? (
                <Card className="border-none shadow-lg no-print">
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Nenhuma entrega para este dia</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Selecione outro dia no calendário
                    </p>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(romaneiosPorLocal).map(([local, entregas]) => (
                  <div key={local} className="break-inside-avoid">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#457bba]" />
                      {local} ({entregas.length})
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                      {entregas.map(romaneio => (
                        <EntregaCard key={romaneio.id} romaneio={romaneio} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dialog Concluir */}
          <Dialog open={showConcluirDialog} onOpenChange={setShowConcluirDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Entrega</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Confirma que a entrega foi realizada com sucesso?</p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowConcluirDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleConcluir}
                    disabled={updateStatusMutation.isPending}
                  >
                    Confirmar Entrega
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Problema */}
          <Dialog open={showProblemaDialog} onOpenChange={setShowProblemaDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reportar Problema</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Descreva o motivo da não entrega *
                  </label>
                  <Textarea
                    value={motivoProblema}
                    onChange={(e) => setMotivoProblema(e.target.value)}
                    placeholder="Ex: Cliente ausente, endereço não localizado..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowProblemaDialog(false);
                      setMotivoProblema("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleProblema}
                    disabled={updateStatusMutation.isPending}
                  >
                    Confirmar Problema
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
