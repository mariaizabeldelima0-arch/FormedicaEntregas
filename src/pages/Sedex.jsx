
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Plus, Search, MapPin, DollarSign, Package } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from 'react-router-dom'; // Added Link import

export default function Sedex() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroLocal, setFiltroLocal] = useState("todos");

  const [formData, setFormData] = useState({
    numero_registro: "",
    cliente_nome: "",
    tipo_entrega: "",
    status_pagamento: "Aguardando",
    valor_entrega: "",
    data_postagem: format(new Date(), "yyyy-MM-dd"),
    codigo_rastreio: "",
    observacoes: "",
    destinatario: "",
    cidade_destino: "",
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: entregas, isLoading } = useQuery({
    queryKey: ['entregas-sedex'],
    queryFn: () => base44.entities.EntregaSedex.list('-data_postagem'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Verificar duplicação de número
      const allRomaneios = await base44.entities.Romaneio.list();
      const allSedex = await base44.entities.EntregaSedex.list();
      const allBalcao = await base44.entities.EntregaBalcao.list();
      
      const numeroJaExiste = 
        allRomaneios.some(r => r.numero_requisicao === data.numero_registro) ||
        allSedex.some(s => s.numero_registro === data.numero_registro) ||
        allBalcao.some(b => b.numero_registro === data.numero_registro);
      
      if (numeroJaExiste) {
        throw new Error('Este número de registro já está em uso. Por favor, use outro número.');
      }

      return base44.entities.EntregaSedex.create({
        ...data,
        atendente_nome: user?.nome_atendente || user?.full_name,
        atendente_email: user?.email,
        valor_entrega: data.valor_entrega ? parseFloat(data.valor_entrega) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-sedex'] });
      toast.success('Entrega cadastrada com sucesso!');
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao cadastrar entrega');
    }
  });

  const resetForm = () => {
    setFormData({
      numero_registro: "",
      cliente_nome: "",
      tipo_entrega: "",
      status_pagamento: "Aguardando",
      valor_entrega: "",
      data_postagem: format(new Date(), "yyyy-MM-dd"),
      codigo_rastreio: "",
      observacoes: "",
      destinatario: "",
      cidade_destino: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.numero_registro || !formData.cliente_nome || !formData.tipo_entrega || !formData.data_postagem) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.tipo_entrega === "Disktenha" && (!formData.valor_entrega || parseFloat(formData.valor_entrega) <= 0)) {
      toast.error('Informe o valor da entrega para Disktenha');
      return;
    }

    createMutation.mutate(formData);
  };

  // Filtrar entregas
  const entregasFiltradas = entregas.filter(e => {
    // Filtro de data
    if (e.data_postagem) {
      const dataPostagem = parseISO(e.data_postagem);
      if (!isSameDay(dataPostagem, selectedDate)) return false;
    }

    // Filtro de tipo
    if (filtroTipo !== "todos" && e.tipo_entrega !== filtroTipo) return false;

    // Filtro de local
    if (filtroLocal !== "todos" && e.cidade_destino !== filtroLocal) return false;

    // Busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      const match = 
        e.cliente_nome?.toLowerCase().includes(termo) ||
        e.numero_registro?.toLowerCase().includes(termo) ||
        e.codigo_rastreio?.toLowerCase().includes(termo) ||
        e.destinatario?.toLowerCase().includes(termo);
      if (!match) return false;
    }

    return true;
  });

  // Locais únicos para filtro
  const locaisUnicos = [...new Set(entregas.map(e => e.cidade_destino).filter(Boolean))].sort();

  // Stats
  const stats = {
    total: entregasFiltradas.length,
    sedex: entregasFiltradas.filter(e => e.tipo_entrega === 'Sedex').length,
    pac: entregasFiltradas.filter(e => e.tipo_entrega === 'PAC').length,
    disktenha: entregasFiltradas.filter(e => e.tipo_entrega === 'Disktenha').length,
  };

  const TipoBadge = ({ tipo }) => {
    const config = {
      "Sedex": { color: "bg-red-100 text-red-700 border-red-300", icon: Send },
      "PAC": { color: "bg-blue-100 text-blue-700 border-blue-300", icon: Package },
      "Disktenha": { color: "bg-purple-100 text-purple-700 border-purple-300", icon: Send },
    };
    const { color, icon: Icon } = config[tipo] || config["Sedex"];
    return (
      <Badge className={`${color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {tipo}
      </Badge>
    );
  };

  const StatusPagamentoBadge = ({ status }) => {
    const color = status === "Pago" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";
    return <Badge className={color}>{status}</Badge>;
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Sedex / Disktenha
            </h1>
            <p className="text-slate-600">
              Gerencie entregas via Sedex, PAC e Disktenha
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#457bba] hover:bg-[#3a6ba0]">
                <Plus className="w-4 h-4 mr-2" />
                Nova Entrega
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Entrega</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Número de Registro *</Label>
                    <Input
                      value={formData.numero_registro}
                      onChange={(e) => setFormData({ ...formData, numero_registro: e.target.value })}
                      placeholder="Ex: REG-001"
                      required
                    />
                  </div>
                  <div>
                    <Label>Data de Postagem *</Label>
                    <Input
                      type="date"
                      value={formData.data_postagem}
                      onChange={(e) => setFormData({ ...formData, data_postagem: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Cliente *</Label>
                  <Input
                    value={formData.cliente_nome}
                    onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                    placeholder="Nome do cliente"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Destinatário</Label>
                    <Input
                      value={formData.destinatario}
                      onChange={(e) => setFormData({ ...formData, destinatario: e.target.value })}
                      placeholder="Nome do destinatário"
                    />
                  </div>
                  <div>
                    <Label>Cidade de Destino</Label>
                    <Input
                      value={formData.cidade_destino}
                      onChange={(e) => setFormData({ ...formData, cidade_destino: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Entrega *</Label>
                    <Select
                      value={formData.tipo_entrega}
                      onValueChange={(value) => setFormData({ ...formData, tipo_entrega: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sedex">Sedex</SelectItem>
                        <SelectItem value="PAC">PAC</SelectItem>
                        <SelectItem value="Disktenha">Disktenha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status de Pagamento *</Label>
                    <Select
                      value={formData.status_pagamento}
                      onValueChange={(value) => setFormData({ ...formData, status_pagamento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pago">Pago</SelectItem>
                        <SelectItem value="Aguardando">Aguardando</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.tipo_entrega === "Disktenha" && (
                  <div>
                    <Label>Valor da Entrega (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.valor_entrega}
                      onChange={(e) => setFormData({ ...formData, valor_entrega: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                )}

                <div>
                  <Label>Código de Rastreio</Label>
                  <Input
                    value={formData.codigo_rastreio}
                    onChange={(e) => setFormData({ ...formData, codigo_rastreio: e.target.value })}
                    placeholder="Ex: BR123456789BR"
                  />
                </div>

                <div>
                  <Label>Atendente</Label>
                  <Input
                    value={user?.nome_atendente || user?.full_name || ""}
                    disabled
                    className="bg-slate-100"
                  />
                </div>

                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações adicionais"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} className="bg-[#457bba] hover:bg-[#3a6ba0]">
                    {createMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendário */}
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
              />
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-xs text-slate-500">
                  {entregasFiltradas.length} entrega{entregasFiltradas.length !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lista e Filtros */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                  <p className="text-sm text-slate-500 font-medium">Total</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                  <p className="text-sm text-slate-500 font-medium">Sedex</p>
                  <p className="text-3xl font-bold text-red-600">{stats.sedex}</p>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                  <p className="text-sm text-slate-500 font-medium">PAC</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.pac}</p>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                  <p className="text-sm text-slate-500 font-medium">Disktenha</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.disktenha}</p>
                </CardHeader>
              </Card>
            </div>

            {/* Busca e Filtros */}
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Buscar e Filtrar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por cliente, registro, rastreio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Tipos</SelectItem>
                      <SelectItem value="Sedex">Sedex</SelectItem>
                      <SelectItem value="PAC">PAC</SelectItem>
                      <SelectItem value="Disktenha">Disktenha</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filtroLocal} onValueChange={setFiltroLocal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Local" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Locais</SelectItem>
                      {locaisUnicos.map(local => (
                        <SelectItem key={local} value={local}>{local}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Lista */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>
                  Entregas de {format(selectedDate, "dd/MM/yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-12 text-center">
                    <Send className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Carregando...</p>
                  </div>
                ) : entregasFiltradas.length === 0 ? (
                  <div className="p-12 text-center">
                    <Send className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Nenhuma entrega encontrada</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {entregasFiltradas.map((entrega) => (
                      <Link
                        key={entrega.id}
                        to={`/DetalhesSedex?id=${entrega.id}`}
                        className="block p-6 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-bold text-slate-900 text-lg">
                                #{entrega.numero_registro}
                              </h3>
                              <TipoBadge tipo={entrega.tipo_entrega} />
                              <StatusPagamentoBadge status={entrega.status_pagamento} />
                              {entrega.valor_entrega && (
                                <Badge className="bg-green-100 text-green-700">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  R$ {entrega.valor_entrega.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-600">
                              <div>
                                <span className="font-medium">Cliente:</span> {entrega.cliente_nome}
                              </div>
                              {entrega.destinatario && (
                                <div>
                                  <span className="font-medium">Destinatário:</span> {entrega.destinatario}
                                </div>
                              )}
                              {entrega.cidade_destino && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {entrega.cidade_destino}
                                </div>
                              )}
                            </div>
                            {entrega.codigo_rastreio && (
                              <div className="text-sm text-slate-600">
                                <span className="font-medium">Rastreio:</span> {entrega.codigo_rastreio}
                              </div>
                            )}
                            {entrega.observacoes && (
                              <div className="text-sm text-slate-500 italic">
                                {entrega.observacoes}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm text-slate-500">
                            <div>{entrega.atendente_nome}</div>
                            <div className="text-xs">
                              {entrega.data_postagem && format(parseISO(entrega.data_postagem), "dd/MM/yyyy")}
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
