import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  User,
  CreditCard,
  MessageCircle,
  Edit
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function Balcao() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNovoDialog, setShowNovoDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [entregaEditando, setEntregaEditando] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: entregas, isLoading } = useQuery({
    queryKey: ['entregas-balcao'],
    queryFn: () => base44.entities.EntregaBalcao.list('-data_cadastro'),
    initialData: [],
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
    onError: () => {
      toast.error('Erro ao cadastrar entrega');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const updateData = {
        ...data,
        valor_pagamento: data.valor_pagamento ? parseFloat(data.valor_pagamento) : null,
      };

      // Atualizar data_pronto quando mudar para "Pronto"
      if (data.status === "Pronto" && !entregaEditando.data_pronto) {
        updateData.data_pronto = new Date().toISOString();
      }

      // Atualizar data_entrega quando mudar para "Entregue"
      if (data.status === "Entregue" && !entregaEditando.data_entrega) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.numero_registro || !formData.cliente_nome || !formData.cliente_telefone) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    criarMutation.mutate(formData);
  };

  const handleEdit = (entrega) => {
    setEntregaEditando(entrega);
    setShowEditDialog(true);
  };

  const handleUpdateStatus = (entrega, novoStatus) => {
    updateMutation.mutate({
      id: entrega.id,
      data: { ...entrega, status: novoStatus }
    });
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

  // Filtrar entregas
  const entregasFiltradas = entregas.filter(e => {
    const termo = searchTerm.toLowerCase();
    return (
      e.numero_registro.toLowerCase().includes(termo) ||
      e.cliente_nome.toLowerCase().includes(termo) ||
      e.cliente_telefone.includes(searchTerm) ||
      e.cliente_cpf?.includes(searchTerm)
    );
  });

  // Separar por status
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

    return (
      <Card className={`border-slate-200 ${precisaLembrete ? 'ring-2 ring-red-400' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
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

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-none shadow-md bg-blue-50">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-blue-900">{entregasProduzindo.length}</p>
                <p className="text-sm text-blue-700">Produzindo</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md bg-green-50">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-900">{entregasProntas.length}</p>
                <p className="text-sm text-green-700">Prontas</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md bg-slate-50">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-slate-900">{entregasEntregues.length}</p>
                <p className="text-sm text-slate-700">Entregues</p>
              </CardContent>
            </Card>
          </div>

          {/* Listas de Entregas */}
          <div className="space-y-6">
            {/* Prontas */}
            {entregasProntas.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Prontas para Retirada ({entregasProntas.length})
                </h2>
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
                <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Em Produção ({entregasProduzindo.length})
                </h2>
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
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Entregues ({entregasEntregues.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entregasEntregues.map(entrega => (
                    <EntregaCard key={entrega.id} entrega={entrega} />
                  ))}
                </div>
              </div>
            )}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Entrega</DialogTitle>
          </DialogHeader>
          {entregaEditando && (
            <div className="space-y-4">
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
                  onClick={() => updateMutation.mutate({ id: entregaEditando.id, data: entregaEditando })}
                  className="bg-[#457bba] hover:bg-[#3a6ba0]"
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}