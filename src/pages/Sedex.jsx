import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomDatePicker } from "@/components/CustomDatePicker";
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
import { Send, Plus, Search, MapPin, DollarSign, Package, ClipboardList, Truck, Check } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from 'react-router-dom';

export default function Sedex() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Parse URL params para restaurar estado
  const urlParams = new URLSearchParams(location.search);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const dataParam = urlParams.get('data');
    return dataParam ? new Date(dataParam) : new Date();
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(urlParams.get('busca') || "");
  const [filtroTipo, setFiltroTipo] = useState(urlParams.get('tipo') || "todos");
  const [filtroLocal, setFiltroLocal] = useState(urlParams.get('local') || "todos");
  const [visualizarTodas, setVisualizarTodas] = useState(urlParams.get('todas') === 'true');

  // Atualizar URL quando estado mudar
  useEffect(() => {
    const params = new URLSearchParams();
    if (!visualizarTodas) {
      params.set('data', format(selectedDate, 'yyyy-MM-dd'));
    }
    params.set('todas', visualizarTodas.toString());
    if (filtroTipo !== "todos") params.set('tipo', filtroTipo);
    if (filtroLocal !== "todos") params.set('local', filtroLocal);
    if (searchTerm) params.set('busca', searchTerm);
    
    navigate(`?${params.toString()}`, { replace: true });
  }, [selectedDate, filtroTipo, filtroLocal, searchTerm, visualizarTodas]);

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
    refetchOnMount: 'always',
    staleTime: 0,
    gcTime: 0,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const allRomaneios = await base44.entities.Romaneio.list();
      const allSedex = await base44.entities.EntregaSedex.list();
      
      const numeroJaExiste = 
        allRomaneios.some(r => r.numero_requisicao === data.numero_registro) ||
        allSedex.some(s => s.numero_registro === data.numero_registro);
      
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

  const entregasFiltradas = entregas.filter(e => {
    if (!visualizarTodas) {
      if (e.data_postagem) {
        const dataPostagem = parseISO(e.data_postagem);
        if (!isSameDay(dataPostagem, selectedDate)) return false;
      } else {
        return false;
      }
    }

    if (filtroTipo !== "todos" && e.tipo_entrega !== filtroTipo) return false;
    if (filtroLocal !== "todos" && e.cidade_destino !== filtroLocal) return false;

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

  const locaisUnicos = [...new Set(entregas.map(e => e.cidade_destino).filter(Boolean))].sort();

  const stats = {
    total: entregasFiltradas.length,
    sedex: entregasFiltradas.filter(e => e.tipo_entrega === 'Sedex').length,
    pac: entregasFiltradas.filter(e => e.tipo_entrega === 'PAC').length,
    disktenha: entregasFiltradas.filter(e => e.tipo_entrega === 'Disktenha').length,
    valorDisktenha: entregasFiltradas
      .filter(e => e.tipo_entrega === 'Disktenha' && e.valor_entrega)
      .reduce((sum, e) => sum + e.valor_entrega, 0),
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header com gradiente */}
      <div className="py-8 shadow-sm" style={{
        background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-white">Sedex / Disktenha</h1>
          <p className="text-base text-white opacity-90 mt-1">Gerencie entregas via Sedex, PAC e Disktenha</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar Esquerda - Calendário */}
        {!visualizarTodas && (
          <div className="w-80 flex-shrink-0">
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
                  className="rounded-xl border"
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

            <div className="mt-4 space-y-3">
              <Button
                variant="outline"
                onClick={() => setVisualizarTodas(!visualizarTodas)}
                className="w-full"
              >
                {visualizarTodas ? "Mostrar por Dia" : "Mostrar Todas"}
              </Button>
            </div>
          </div>
        )}

        {/* Conteúdo Principal */}
        <div className="flex-1">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {/* Card Total */}
            <div
              onClick={() => setFiltroTipo("todos")}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
              style={{
                border: filtroTipo === "todos" ? '2px solid #376295' : '2px solid transparent'
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F0F8' }}>
                  <ClipboardList className="w-6 h-6" style={{ color: '#376295' }} />
                </div>
                <span className="text-sm font-bold text-slate-700">Total</span>
              </div>
              <div className="text-4xl font-bold text-center" style={{ color: '#376295' }}>
                {stats.total}
              </div>
            </div>

            {/* Card Sedex */}
            <div
              onClick={() => setFiltroTipo(filtroTipo === "Sedex" ? "todos" : "Sedex")}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
              style={{
                border: filtroTipo === "Sedex" ? '2px solid #dc2626' : '2px solid transparent'
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#FEE8E8' }}>
                  <Send className="w-6 h-6" style={{ color: '#dc2626' }} />
                </div>
                <span className="text-sm font-bold text-slate-700">Sedex</span>
              </div>
              <div className="text-4xl font-bold text-center" style={{ color: '#dc2626' }}>
                {stats.sedex}
              </div>
            </div>

            {/* Card PAC */}
            <div
              onClick={() => setFiltroTipo(filtroTipo === "PAC" ? "todos" : "PAC")}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
              style={{
                border: filtroTipo === "PAC" ? '2px solid #2563eb' : '2px solid transparent'
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F0FE' }}>
                  <Package className="w-6 h-6" style={{ color: '#2563eb' }} />
                </div>
                <span className="text-sm font-bold text-slate-700">PAC</span>
              </div>
              <div className="text-4xl font-bold text-center" style={{ color: '#2563eb' }}>
                {stats.pac}
              </div>
            </div>

            {/* Card Disktenha */}
            <div
              onClick={() => setFiltroTipo(filtroTipo === "Disktenha" ? "todos" : "Disktenha")}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
              style={{
                border: filtroTipo === "Disktenha" ? '2px solid #9333ea' : '2px solid transparent'
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#F5E8FE' }}>
                  <Truck className="w-6 h-6" style={{ color: '#9333ea' }} />
                </div>
                <span className="text-sm font-bold text-slate-700">Disktenha</span>
              </div>
              <div className="text-4xl font-bold text-center" style={{ color: '#9333ea' }}>
                {stats.disktenha}
              </div>
            </div>

            {/* Card Valor Disktenha */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F5E8' }}>
                  <DollarSign className="w-6 h-6" style={{ color: '#3dac38' }} />
                </div>
                <span className="text-sm font-bold text-slate-700">Total R$</span>
              </div>
              <div className="text-3xl font-bold text-center" style={{ color: '#3dac38' }}>
                {stats.valorDisktenha.toFixed(2)}
              </div>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#457bba] hover:bg-[#3a6ba0] mb-6">
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
                      <CustomDatePicker
                        label="Data de Postagem *"
                        value={formData.data_postagem}
                        onChange={(value) => setFormData({ ...formData, data_postagem: value })}
                        placeholder="Selecione a data"
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
                <div>
                  <Select value={filtroLocal} onValueChange={setFiltroLocal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por Local" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Locais</SelectItem>
                      {locaisUnicos.map(local => (
                        <SelectItem key={local} value={local}>{local}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(filtroLocal !== "todos" || searchTerm) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFiltroLocal("todos");
                      setSearchTerm("");
                    }}
                  >
                    Limpar Filtros
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>
                  {visualizarTodas 
                    ? "Todas as Entregas" 
                    : `Entregas de ${format(selectedDate, "dd/MM/yyyy")}`
                  }
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