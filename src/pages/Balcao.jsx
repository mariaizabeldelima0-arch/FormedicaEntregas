import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  User,
  CreditCard,
  MessageCircle,
  Edit,
  Trash2,
  Calendar as CalendarIcon
} from "lucide-react";
import { format, differenceInDays, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function Balcao() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNovoDialog, setShowNovoDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);
  const [entregaEditando, setEntregaEditando] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEntregas, setSelectedEntregas] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos"); // Novo filtro
  const [visualizarTodas, setVisualizarTodas] = useState(false); // Novo toggle

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: entregas, isLoading } = useQuery({
    queryKey: ['entregas-balcao'],
    queryFn: () => base44.entities.EntregaBalcao.list('-data_cadastro'),
    initialData: [],
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list('nome'),
    initialData: [],
  });

  const [formData, setFormData] = useState({
    numero_registro: "",
    cliente_nome: "",
    cliente_telefone: "",
    cliente_cpf: "",
    forma_pagamento: "Pago",
    valor_pagamento: "",
    observacoes: "",
  });

  const criarMutation = useMutation({
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

      // Criar ou atualizar cliente
      let clienteId = null;
      const clienteExistente = clientes.find(c => 
        c.telefone === data.cliente_telefone || 
        (data.cliente_cpf && c.cpf === data.cliente_cpf)
      );

      if (clienteExistente) {
        clienteId = clienteExistente.id;
      } else {
        const novoCliente = await base44.entities.Cliente.create({
          nome: data.cliente_nome,
          telefone: data.cliente_telefone,
          cpf: data.cliente_cpf || null,
          enderecos: []
        });
        clienteId = novoCliente.id;
      }

      return base44.entities.EntregaBalcao.create({
        ...data,
        cliente_id: clienteId,
        atendente_nome: user.nome_atendente || user.full_name,
        atendente_email: user.email,
        status: "Produzindo",
        data_cadastro: new Date().toISOString(),
        valor_pagamento: data.valor_pagamento ? parseFloat(data.valor_pagamento) : null,
        buscar_receita: false,
        receita_recebida: false,
        imagens: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-balcao'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Entrega de balcão cadastrada!');
      setShowNovoDialog(false);
      setFormData({
        numero_registro: "",
        cliente_nome: "",
        cliente_telefone: "",
        cliente_cpf: "",
        forma_pagamento: "Pago",
        valor_pagamento: "",
        observacoes: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao cadastrar entrega');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const updateData = {
        ...data,
        valor_pagamento: data.valor_pagamento ? parseFloat(data.valor_pagamento) : null,
      };

      // Atualizar data_pronto quando mudar para "Pronto"
      if (data.status === "Pronto" && !data.data_pronto) {
        updateData.data_pronto = new Date().toISOString();
      }

      // Atualizar data_entrega quando mudar para "Entregue"
      if (data.status === "Entregue" && !data.data_entrega) {
        updateData.data_entrega = new Date().toISOString();
      }

      return base44.entities.EntregaBalcao.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-balcao'] });
      toast.success('Entrega atualizada!');
      setShowEditDialog(false);
      setEntregaEditando(null);
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }) => {
      const promises = ids.map(id => {
        // Find the original delivery to preserve its data
        const entrega = entregas.find(e => e.id === id);
        if (!entrega) return Promise.resolve(); // Skip if delivery not found

        const updateData = {
          ...entrega, // Preserve other fields from original entrega
          status
        };

        // Update data_pronto when changing to "Pronto"
        if (status === "Pronto" && !entrega.data_pronto) {
          updateData.data_pronto = new Date().toISOString();
        }

        // Update data_entrega when changing to "Entregue"
        if (status === "Entregue" && !entrega.data_entrega) {
          updateData.data_entrega = new Date().toISOString();
        }

        return base44.entities.EntregaBalcao.update(id, updateData);
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-balcao'] });
      toast.success(`${selectedEntregas.length} entrega${selectedEntregas.length !== 1 ? 's' : ''} atualizada${selectedEntregas.length !== 1 ? 's' : ''}!`);
      setShowBulkStatusDialog(false);
      setSelectedEntregas([]);
      setBulkStatus("");
    },
    onError: () => {
      toast.error('Erro ao atualizar entregas');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.EntregaBalcao.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-balcao'] });
      toast.success('Entrega excluída com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir entrega');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.numero_registro || !formData.cliente_nome || !formData.cliente_telefone) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    criarMutation.mutate(formData);
  };

  const handleEdit = (entrega) => {
    setEntregaEditando({
      // Ensure data_cadastro is in 'yyyy-MM-dd' format for the input type="date"
      ...entrega,
      data_cadastro: entrega.data_cadastro ? format(parseISO(entrega.data_cadastro), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      valor_pagamento: entrega.valor_pagamento !== null ? entrega.valor_pagamento.toString() : "" // Convert to string for input
    });
    setShowEditDialog(true);
  };

  const handleUpdateStatus = (entrega, novoStatus) => {
    updateMutation.mutate({
      id: entrega.id,
      data: { ...entrega, status: novoStatus }
    });
  };

  const handleBulkStatusChange = () => {
    if (!bulkStatus) {
      toast.error('Selecione um status');
      return;
    }
    bulkUpdateMutation.mutate({
      ids: selectedEntregas,
      status: bulkStatus
    });
  };

  const handleSelectAll = (entregasToSelect) => {
    const idsToSelect = entregasToSelect.map(e => e.id);
    const areAllSelectedInThisGroup = idsToSelect.length > 0 && idsToSelect.every(id => selectedEntregas.includes(id));

    if (areAllSelectedInThisGroup) {
      // If all in this group are already selected, deselect them
      setSelectedEntregas(prev => prev.filter(id => !idsToSelect.includes(id)));
    } else {
      // Otherwise, select all in this group (and keep others selected)
      setSelectedEntregas(prev => [...new Set([...prev, ...idsToSelect])]);
    }
  };

  const handleSelectEntrega = (id) => {
    setSelectedEntregas(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const calcularDiasAguardando = (entrega) => {
    if (!entrega.data_pronto || entrega.status === "Entregue") return 0;
    return differenceInDays(new Date(), new Date(entrega.data_pronto));
  };

  const abrirWhatsApp = (entrega) => {
    const telefone = entrega.cliente_telefone.replace(/\D/g, '');
    const mensagem = `Olá ${entrega.cliente_nome}! Seu pedido #${entrega.numero_registro} está pronto para retirada há ${calcularDiasAguardando(entrega)} dias. Aguardamos você!`;
    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  // Filtrar entregas por data e termo de busca
  const entregasFiltradas = entregas.filter(e => {
    // Sempre filtrar por data quando não está em visualizar todas
    if (!visualizarTodas) {
      const matchesDate = e.data_cadastro && isSameDay(parseISO(e.data_cadastro), selectedDate);
      if (!matchesDate) return false;
    }
    
    // Filtro de status - IMPORTANTE: aplicar DEPOIS do filtro de data
    if (filtroStatus !== "todos" && e.status !== filtroStatus) return false;

    // Busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      const matchesSearch = (
        e.numero_registro.toLowerCase().includes(termo) ||
        e.cliente_nome.toLowerCase().includes(termo) ||
        e.cliente_telefone.includes(searchTerm) ||
        e.cliente_cpf?.includes(searchTerm)
      );
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  // Separar por status (DEPOIS de aplicar todos os filtros incluindo data)
  const entregasProduzindo = entregasFiltradas.filter(e => e.status === "Produzindo");
  const entregasProntas = entregasFiltradas.filter(e => e.status === "Pronto");
  const entregasEntregues = entregasFiltradas.filter(e => e.status === "Entregue");

  const StatusBadge = ({ status }) => {
    const config = {
      "Produzindo": { color: "bg-blue-100 text-blue-700", icon: Clock },
      "Pronto": { color: "bg-green-100 text-green-700", icon: Package },
      "Entregue": { color: "bg-slate-100 text-slate-700", icon: CheckCircle },
    };
    const { color, icon: Icon } = config[status];
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const EntregaCard = ({ entrega }) => {
    const diasAguardando = calcularDiasAguardando(entrega);
    const precisaLembrete = diasAguardando >= 10 && entrega.status === "Pronto";
    const isSelected = selectedEntregas.includes(entrega.id);

    return (
      <Card className={`border-slate-200 ${precisaLembrete ? 'ring-2 ring-red-400' : ''} ${isSelected ? 'ring-2 ring-blue-400' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => handleSelectEntrega(entrega.id)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <CardTitle className="text-lg">#{entrega.numero_registro}</CardTitle>
                <StatusBadge status={entrega.status} />
                {precisaLembrete && (
                  <Badge className="bg-red-100 text-red-700 border-red-400 border-2">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {diasAguardando} dias aguardando
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-600 font-medium">{entrega.cliente_nome}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-4 h-4" />
            {entrega.cliente_telefone}
          </div>

          {entrega.cliente_cpf && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CreditCard className="w-4 h-4" />
              {entrega.cliente_cpf}
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500">Pagamento</p>
            <p className="font-medium text-slate-900">{entrega.forma_pagamento}</p>
            {entrega.valor_pagamento && (
              <p className="text-sm text-slate-700 mt-1">
                Valor: R$ {entrega.valor_pagamento.toFixed(2)}
              </p>
            )}
          </div>

          <div className="text-xs text-slate-500">
            <p>Atendente: {entrega.atendente_nome}</p>
            <p>Cadastrado em: {format(new Date(entrega.data_cadastro), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
            {entrega.data_pronto && (
              <p>Pronto em: {format(new Date(entrega.data_pronto), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
            )}
            {entrega.status === "Pronto" && diasAguardando > 0 && (
              <p className="text-orange-600 font-semibold mt-1">
                Aguardando há {diasAguardando} dia{diasAguardando > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {entrega.observacoes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <p className="text-xs text-yellow-900">{entrega.observacoes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {entrega.status === "Produzindo" && (
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleUpdateStatus(entrega, "Pronto")}
              >
                Marcar como Pronto
              </Button>
            )}
            {entrega.status === "Pronto" && (
              <>
                <Button
                  size="sm"
                  className="flex-1 bg-slate-600 hover:bg-slate-700"
                  onClick={() => handleUpdateStatus(entrega, "Entregue")}
                >
                  Entregue
                </Button>
                {precisaLembrete && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => abrirWhatsApp(entrega)}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(entrega)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a entrega #{entrega.numero_registro}? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(entrega.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Confirmar Exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Balcão</h1>
              <p className="text-slate-600 mt-1">Gerenciamento de entregas para retirada no balcão</p>
            </div>
            <Button
              className="bg-[#457bba] hover:bg-[#3a6ba0]"
              onClick={() => setShowNovoDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Entrega
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendário */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Selecione o Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="visualizar-todas"
                      checked={visualizarTodas}
                      onCheckedChange={(checked) => setVisualizarTodas(checked)}
                    />
                    <Label htmlFor="visualizar-todas" className="cursor-pointer text-sm">
                      Visualizar todas as entregas
                    </Label>
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
                        {entregasFiltradas.length} entrega{entregasFiltradas.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Conteúdo Principal */}
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

              {/* Ações em Lote */}
              {selectedEntregas.length > 0 && (
                <Card className="border-none shadow-lg bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                      <Badge variant="outline" className="text-sm">
                        {selectedEntregas.length} selecionada{selectedEntregas.length !== 1 ? 's' : ''}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setShowBulkStatusDialog(true)}
                          className="bg-[#457bba] hover:bg-[#3a6ba0]"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Alterar Status
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedEntregas([])}
                        >
                          Limpar Seleção
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Estatísticas - Agora Clicáveis */}
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setFiltroStatus("Produzindo")}
                  className={`text-left rounded-lg ${filtroStatus === "Produzindo" ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <Card className={`border-none shadow-md ${filtroStatus === "Produzindo" ? 'bg-blue-100' : 'bg-blue-50'} cursor-pointer hover:shadow-lg transition-all`}>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-blue-900">{entregasProduzindo.length}</p>
                      <p className="text-sm text-blue-700">Produzindo</p>
                    </CardContent>
                  </Card>
                </button>
                <button
                  onClick={() => setFiltroStatus("Pronto")}
                  className={`text-left rounded-lg ${filtroStatus === "Pronto" ? 'ring-2 ring-green-500' : ''}`}
                >
                  <Card className={`border-none shadow-md ${filtroStatus === "Pronto" ? 'bg-green-100' : 'bg-green-50'} cursor-pointer hover:shadow-lg transition-all`}>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-green-900">{entregasProntas.length}</p>
                      <p className="text-sm text-green-700">Prontas</p>
                    </CardContent>
                  </Card>
                </button>
                <button
                  onClick={() => setFiltroStatus("Entregue")}
                  className={`text-left rounded-lg ${filtroStatus === "Entregue" ? 'ring-2 ring-slate-500' : ''}`}
                >
                  <Card className={`border-none shadow-md ${filtroStatus === "Entregue" ? 'bg-slate-100' : 'bg-slate-50'} cursor-pointer hover:shadow-lg transition-all`}>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-slate-900">{entregasEntregues.length}</p>
                      <p className="text-sm text-slate-700">Entregues</p>
                    </CardContent>
                  </Card>
                </button>
              </div>
              {filtroStatus !== "todos" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltroStatus("todos")}
                  className="w-full"
                >
                  Limpar Filtro de Status
                </Button>
              )}

              {/* Listas de Entregas */}
              <div className="space-y-6">
                {/* Prontas */}
                {entregasProntas.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Prontas para Retirada ({entregasProntas.length})
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll(entregasProntas)}
                      >
                        <Checkbox
                          checked={entregasProntas.length > 0 && entregasProntas.every(e => selectedEntregas.includes(e.id))}
                          className="mr-2"
                        />
                        Selecionar Todas
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {entregasProntas.map(entrega => (
                        <EntregaCard key={entrega.id} entrega={entrega} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Produzindo */}
                {entregasProduzindo.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Em Produção ({entregasProduzindo.length})
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll(entregasProduzindo)}
                      >
                        <Checkbox
                          checked={entregasProduzindo.length > 0 && entregasProduzindo.every(e => selectedEntregas.includes(e.id))}
                          className="mr-2"
                        />
                        Selecionar Todas
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {entregasProduzindo.map(entrega => (
                        <EntregaCard key={entrega.id} entrega={entrega} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Entregues */}
                {entregasEntregues.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Entregues ({entregasEntregues.length})
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll(entregasEntregues)}
                      >
                        <Checkbox
                          checked={entregasEntregues.length > 0 && entregasEntregues.every(e => selectedEntregas.includes(e.id))}
                          className="mr-2"
                        />
                        Selecionar Todas
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {entregasEntregues.map(entrega => (
                        <EntregaCard key={entrega.id} entrega={entrega} />
                      ))}
                    </div>
                  </div>
                )}

                {entregasFiltradas.length === 0 && (
                  <Card className="border-none shadow-lg">
                    <CardContent className="p-12 text-center">
                      <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium">Nenhuma entrega encontrada para este dia</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Nova Entrega */}
      <Dialog open={showNovoDialog} onOpenChange={setShowNovoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Entrega de Balcão</DialogTitle>
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
                <Label>Nome do Cliente *</Label>
                <Input
                  value={formData.cliente_nome}
                  onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone *</Label>
                <Input
                  value={formData.cliente_telefone}
                  onChange={(e) => setFormData({ ...formData, cliente_telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
              <div>
                <Label>CPF (opcional)</Label>
                <Input
                  value={formData.cliente_cpf}
                  onChange={(e) => setFormData({ ...formData, cliente_cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Forma de Pagamento *</Label>
                <Select
                  value={formData.forma_pagamento}
                  onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Vai pagar na Retirada">Vai pagar na Retirada</SelectItem>
                    <SelectItem value="Aguardando">Aguardando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_pagamento}
                  onChange={(e) => setFormData({ ...formData, valor_pagamento: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowNovoDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#457bba] hover:bg-[#3a6ba0]">
                Cadastrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Entrega</DialogTitle>
          </DialogHeader>
          {entregaEditando && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número de Registro *</Label>
                  <Input
                    value={entregaEditando.numero_registro}
                    onChange={(e) => setEntregaEditando({ ...entregaEditando, numero_registro: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Nome do Cliente *</Label>
                  <Input
                    value={entregaEditando.cliente_nome}
                    onChange={(e) => setEntregaEditando({ ...entregaEditando, cliente_nome: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefone *</Label>
                  <Input
                    value={entregaEditando.cliente_telefone}
                    onChange={(e) => setEntregaEditando({ ...entregaEditando, cliente_telefone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>CPF</Label>
                  <Input
                    value={entregaEditando.cliente_cpf || ""}
                    onChange={(e) => setEntregaEditando({ ...entregaEditando, cliente_cpf: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Atendente *</Label>
                  <Input
                    value={entregaEditando.atendente_nome}
                    onChange={(e) => setEntregaEditando({ ...entregaEditando, atendente_nome: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data do Pedido *</Label>
                  <Input
                    type="date"
                    value={entregaEditando.data_cadastro}
                    onChange={(e) => setEntregaEditando({ ...entregaEditando, data_cadastro: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Forma de Pagamento *</Label>
                  <Select
                    value={entregaEditando.forma_pagamento}
                    onValueChange={(value) => setEntregaEditando({ ...entregaEditando, forma_pagamento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pago">Pago</SelectItem>
                      <SelectItem value="Vai pagar na Retirada">Vai pagar na Retirada</SelectItem>
                      <SelectItem value="Aguardando">Aguardando</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={entregaEditando.valor_pagamento || ""}
                    onChange={(e) => setEntregaEditando({ ...entregaEditando, valor_pagamento: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={entregaEditando.status}
                  onValueChange={(value) => setEntregaEditando({ ...entregaEditando, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Produzindo">Produzindo</SelectItem>
                    <SelectItem value="Pronto">Pronto</SelectItem>
                    <SelectItem value="Entregue">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={entregaEditando.observacoes || ""}
                  onChange={(e) => setEntregaEditando({ ...entregaEditando, observacoes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    const dataToUpdate = {
                      ...entregaEditando,
                      data_cadastro: new Date(entregaEditando.data_cadastro).toISOString(),
                      valor_pagamento: entregaEditando.valor_pagamento ? parseFloat(entregaEditando.valor_pagamento) : null,
                    };
                    updateMutation.mutate({ id: entregaEditando.id, data: dataToUpdate });
                  }}
                  className="bg-[#457bba] hover:bg-[#3a6ba0]"
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Alterar Status em Lote */}
      <Dialog open={showBulkStatusDialog} onOpenChange={setShowBulkStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status de {selectedEntregas.length} Entrega{selectedEntregas.length !== 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Novo Status</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Produzindo">Produzindo</SelectItem>
                  <SelectItem value="Pronto">Pronto</SelectItem>
                  <SelectItem value="Entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBulkStatusDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBulkStatusChange}
                disabled={bulkUpdateMutation.isPending || !bulkStatus}
                className="bg-[#457bba] hover:bg-[#3a6ba0]"
              >
                {bulkUpdateMutation.isPending ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}