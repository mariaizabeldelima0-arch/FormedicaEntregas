
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  ArrowLeft,
  User,
  MapPin,
  Phone,
  CreditCard,
  Calendar,
  Package,
  Snowflake,
  Clock,
  CheckCircle,
  FileText,
  Printer,
  Edit,
  Save,
  X,
  Trash2,
  AlertCircle, // Added for error messages
  Search, // Added for client search
  Plus // Added for new client button
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ImpressaoRomaneio from "../components/ImpressaoRomaneio";

const CIDADES = [
  "BC", "Nova Esperança", "Camboriú", "Tabuleiro", "Monte Alegre",
  "Barra", "Estaleiro", "Taquaras", "Laranjeiras", "Itajai",
  "Espinheiros", "Praia dos Amores", "Praia Brava", "Itapema",
  "Navegantes", "Penha", "Porto Belo", "Tijucas", "Piçarras",
  "Bombinhas", "Clinica"
];

const FORMAS_PAGAMENTO = [
  "Pago", "Dinheiro", "Maquina", "Troco P/", "Via na Pasta",
  "Só Entregar", "Aguardando", "Pix - Aguardando", "Link - Aguardando",
  "Boleto", "Pagar MP"
];

const MOTOBOYS = ["Marcio", "Bruno"];

const STATUS_OPTIONS = [
  "Pendente",
  "Produzindo no Laboratório",
  "Preparando no Setor de Entregas",
  "A Caminho",
  "Entregue",
  "Não Entregue",
  "Voltou",
  "Cancelado"
];

const VALORES_ENTREGA = {
  "Marcio": {
    "Clinica": 9,
    "Nova Esperança": 11,
    "Camboriú": 16,
    "Tabuleiro": 11,
    "Monte Alegre": 11,
    "Barra": 11,
    "Estaleiro": 16,
    "Taquaras": 16,
    "Laranjeiras": 16,
    "Itajai": 19,
    "Espinheiros": 23,
    "Praia dos Amores": 13.50,
    "Praia Brava": 13.50,
    "Itapema": 27,
    "Navegantes": 30,
    "Penha": 52,
    "Porto Belo": 52,
    "Tijucas": 52,
    "Piçarras": 52,
    "Bombinhas": 72,
    "BC": 9
  },
  "Bruno": {
    "Clinica": 7,
    "Nova Esperança": 9,
    "Camboriú": 14,
    "Tabuleiro": 9,
    "Monte Alegre": 9,
    "Barra": 9,
    "Estaleiro": 14,
    "Taquaras": 14,
    "Laranjeiras": 14,
    "Itajai": 17,
    "Espinheiros": 21,
    "Praia dos Amores": 11.50,
    "Praia Brava": 11.50,
    "Itapema": 25,
    "Navegantes": 40,
    "Penha": 50,
    "Porto Belo": 30,
    "Tijucas": 50,
    "Piçarras": 50,
    "Bombinhas": 50,
    "BC": 9
  }
};

export default function DetalhesRomaneio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const romaneioId = urlParams.get('id');

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [novoStatus, setNovoStatus] = useState("");
  const [searchCliente, setSearchCliente] = useState("");

  const { data: clientes, isLoading: isLoadingClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list('nome'),
    initialData: [],
  });

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(searchCliente.toLowerCase()) ||
    c.telefone?.includes(searchCliente) ||
    c.cpf?.includes(searchCliente)
  );

  const { data: romaneio, isLoading, error } = useQuery({
    queryKey: ['romaneio', romaneioId],
    queryFn: async () => {
      if (!romaneioId) {
        console.error("No romaneioId provided");
        return null;
      }
      console.log("Fetching romaneio with ID:", romaneioId);
      try {
        // Tentar buscar diretamente primeiro
        const allRomaneios = await base44.entities.Romaneio.list();
        console.log("Total romaneios:", allRomaneios.length);
        const found = allRomaneios.find(r => r.id === romaneioId);

        if (!found) {
          console.error("Romaneio not found with id:", romaneioId);
          console.log("Available IDs:", allRomaneios.map(r => r.id));
        } else {
          console.log("Found romaneio:", found.numero_requisicao);
        }

        return found || null;
      } catch (err) {
        console.error("Error fetching romaneio:", err);
        throw err;
      }
    },
    enabled: !!romaneioId,
    retry: 2,
    retryDelay: 1000,
  });

  // Calcular valor da entrega quando motoboy ou cidade mudar no modo de edição
  useEffect(() => {
    if (isEditing && editData && editData.motoboy && editData.cidade_regiao) {
      const valor = VALORES_ENTREGA[editData.motoboy]?.[editData.cidade_regiao] || 0;
      setEditData(prev => ({ ...prev, valor_entrega: valor }));
    }
  }, [isEditing, editData?.motoboy, editData?.cidade_regiao]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const updateData = {
        numero_requisicao: data.numero_requisicao,
        cliente_id: data.cliente_id,
        cliente_nome: data.cliente_nome,
        cliente_telefone: data.cliente_telefone,
        endereco: data.endereco,
        cidade_regiao: data.cidade_regiao,
        forma_pagamento: data.forma_pagamento,
        valor_pagamento: data.valor_pagamento ? parseFloat(data.valor_pagamento) : null,
        valor_troco: data.valor_troco ? parseFloat(data.valor_troco) : null,
        valor_entrega: data.valor_entrega ? parseFloat(data.valor_entrega) : 0, // Added valor_entrega
        item_geladeira: data.item_geladeira === "true" || data.item_geladeira === true,
        buscar_receita: data.buscar_receita === "true" || data.buscar_receita === true,
        motoboy: data.motoboy,
        periodo_entrega: data.periodo_entrega,
        data_entrega_prevista: data.data_entrega_prevista,
        status: data.status,
        observacoes: data.observacoes,
      };

      if (data.status === 'Entregue' && !romaneio.data_entrega_realizada) {
        updateData.data_entrega_realizada = new Date().toISOString();
      }

      if (data.status !== 'Entregue' && romaneio.data_entrega_realizada) {
        updateData.data_entrega_realizada = null;
      }

      return base44.entities.Romaneio.update(romaneioId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneio', romaneioId] });
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
      toast.success('Romaneio atualizado com sucesso!');
      setIsEditing(false);
      setEditData(null);
    },
    onError: (error) => {
      console.error("Erro ao atualizar romaneio:", error);
      toast.error('Erro ao atualizar romaneio: ' + (error.message || 'Verifique os dados.'));
    }
  });

  const alterarStatusMutation = useMutation({
    mutationFn: async (status) => {
      const updateData = {
        status,
      };

      if (status === 'Entregue' && !romaneio.data_entrega_realizada) {
        updateData.data_entrega_realizada = new Date().toISOString();
      }

      if (status !== 'Entregue' && romaneio.data_entrega_realizada) {
        updateData.data_entrega_realizada = null;
      }

      return base44.entities.Romaneio.update(romaneioId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneio', romaneioId] });
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
      toast.success('Status atualizado com sucesso!');
      setShowStatusDialog(false);
      setNovoStatus("");
    },
    onError: (error) => {
      console.error("Erro ao atualizar status:", error);
      toast.error('Erro ao atualizar status: ' + (error.message || 'Verifique os dados.'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Romaneio.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
      toast.success('Romaneio excluído com sucesso!');
      navigate(createPageUrl("Dashboard"));
    },
    onError: (error) => {
      console.error("Erro ao excluir romaneio:", error);
      toast.error('Erro ao excluir romaneio');
    }
  });

  const handleAlterarStatus = () => {
    if (!novoStatus) {
      toast.error('Selecione um status');
      return;
    }
    alterarStatusMutation.mutate(novoStatus);
  };

  const handleDelete = () => {
    deleteMutation.mutate(romaneioId);
  };

  const handleEditStart = () => {
    const currentClient = clientes.find(c => c.id === romaneio.cliente_id);
    let initialEnderecoIndex = 0;

    // Try to find the matching address among client's addresses
    if (currentClient && currentClient.enderecos && romaneio.endereco) {
      const foundIndex = currentClient.enderecos.findIndex(
        addr =>
          addr.rua === romaneio.endereco.rua &&
          addr.numero === romaneio.endereco.numero &&
          addr.bairro === romaneio.endereco.bairro &&
          addr.cidade === romaneio.cidade_regiao
          // Add more fields if necessary for a robust match
      );
      if (foundIndex !== -1) {
        initialEnderecoIndex = foundIndex;
      }
    }

    setEditData({
      numero_requisicao: romaneio.numero_requisicao,
      cliente_id: romaneio.cliente_id,
      cliente_nome: romaneio.cliente_nome,
      cliente_telefone: romaneio.cliente_telefone || "",
      endereco: romaneio.endereco,
      endereco_index: initialEnderecoIndex, // Added
      cidade_regiao: romaneio.cidade_regiao,
      forma_pagamento: romaneio.forma_pagamento,
      valor_pagamento: romaneio.valor_pagamento || "",
      valor_troco: romaneio.valor_troco || "",
      valor_entrega: romaneio.valor_entrega || "", // Added valor_entrega
      item_geladeira: romaneio.item_geladeira || false,
      buscar_receita: romaneio.buscar_receita || false,
      motoboy: romaneio.motoboy,
      periodo_entrega: romaneio.periodo_entrega,
      data_entrega_prevista: romaneio.data_entrega_prevista,
      status: romaneio.status,
      observacoes: romaneio.observacoes || "",
    });
    setIsEditing(true);
  };

  const handleClienteChange = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
      const firstAddress = cliente.enderecos?.[0] || {
        rua: "",
        numero: "",
        bairro: "",
        complemento: "",
        ponto_referencia: "",
        aos_cuidados_de: "",
        observacoes: "",
        cidade: "", // Assuming addresses have a city field
      };
      setEditData({
        ...editData,
        cliente_id: clienteId,
        cliente_nome: cliente.nome,
        cliente_telefone: cliente.telefone,
        endereco_index: 0,
        endereco: firstAddress,
        cidade_regiao: firstAddress.cidade || editData.cidade_regiao, // Update city if address has one
      });
      setSearchCliente("");
    }
  };

  const handleSaveEdit = () => {
    if (!editData.numero_requisicao || !editData.cliente_nome) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    updateMutation.mutate(editData);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || isLoadingClientes) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Skeleton className="h-12 w-64" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Erro ao Carregar Romaneio</h2>
            <p className="text-red-500 mb-4">{error.message}</p>
            <p className="text-sm text-slate-500 mb-4">ID: {romaneioId}</p>
            <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!romaneio) {
    return (
      <div className="p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Romaneio Não Encontrado</h2>
            <p className="text-slate-500 mb-4">O romaneio que você está procurando não foi encontrado.</p>
            <p className="text-sm text-slate-400 mb-6">ID procurado: {romaneioId}</p>
            <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusBadge = ({ status }) => {
    const configs = {
      "Pendente": { color: "bg-slate-100 text-slate-700 border-slate-300", icon: Clock },
      "Produzindo no Laboratório": { color: "bg-blue-100 text-blue-700 border-blue-300", icon: Package },
      "Preparando no Setor de Entregas": { color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: Package },
      "A Caminho": { color: "bg-purple-100 text-purple-700 border-purple-300", icon: Clock },
      "Entregue": { color: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle },
      "Não Entregue": { color: "bg-red-100 text-red-700 border-red-300", icon: FileText },
      "Voltou": { color: "bg-orange-100 text-orange-700 border-orange-300", icon: Clock },
      "Cancelado": { color: "bg-gray-100 text-gray-700 border-gray-300", icon: FileText },
    };
    const { color, icon: Icon } = configs[status] || configs["Pendente"];
    return (
      <Badge className={`${color} border text-base px-3 py-1`}>
        <Icon className="w-4 h-4 mr-2" />
        {status}
      </Badge>
    );
  };

  const currentData = isEditing ? editData : romaneio;
  const currentClientData = isEditing ? clientes.find(c => c.id === editData?.cliente_id) : null;

  return (
    <>
      <ImpressaoRomaneio romaneio={romaneio} />

      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header - não imprime */}
          <div className="flex items-center gap-4 no-print">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">
                Romaneio #{romaneio.numero_requisicao}
              </h1>
              <p className="text-slate-600 mt-1">
                Criado em {format(new Date(romaneio.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            {!isEditing && <StatusBadge status={romaneio.status} />}
            <div className="flex gap-2">
              {/* Botão Alterar Status - sempre visível */}
              <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => setNovoStatus(romaneio.status)}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Alterar Status
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Alterar Status da Entrega</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Novo Status</Label>
                      <Select value={novoStatus} onValueChange={setNovoStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(status => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowStatusDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleAlterarStatus}
                        disabled={alterarStatusMutation.isPending}
                        className="bg-[#457bba] hover:bg-[#3a6ba0]"
                      >
                        {alterarStatusMutation.isPending ? 'Atualizando...' : 'Atualizar Status'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleEditStart}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    className="bg-[#457bba] hover:bg-[#3a6ba0]"
                    onClick={handlePrint}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este romaneio? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Confirmar Exclusão
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleSaveEdit}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Área de visualização (no-print) */}
          <div className="no-print">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna Principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informações Básicas */}
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#457bba]" />
                      Informações do Romaneio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <Label>Número da Requisição</Label>
                          <Input
                            value={editData.numero_requisicao}
                            onChange={(e) => setEditData({ ...editData, numero_requisicao: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select
                            value={editData.status}
                            onValueChange={(value) => setEditData({ ...editData, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map(status => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Data de Entrega Prevista</Label>
                          <Input
                            type="date"
                            value={editData.data_entrega_prevista}
                            onChange={(e) => setEditData({ ...editData, data_entrega_prevista: e.target.value })}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm text-slate-500">Número da Requisição</p>
                          <p className="text-lg font-bold text-slate-900">#{romaneio.numero_requisicao}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Status</p>
                          <StatusBadge status={romaneio.status} />
                        </div>
                        {romaneio.data_entrega_prevista && (
                          <div>
                            <p className="text-sm text-slate-500">Data de Entrega Prevista</p>
                            <p className="text-lg font-semibold text-slate-900">
                              {format(parseISO(romaneio.data_entrega_prevista), "dd/MM/yyyy", { locale: ptBR })} - {romaneio.periodo_entrega}
                            </p>
                          </div>
                        )}
                        {romaneio.valor_entrega > 0 && (
                          <div>
                            <p className="text-sm text-slate-500">Valor da Entrega</p>
                            <p className="text-lg font-bold text-green-600">R$ {romaneio.valor_entrega.toFixed(2)}</p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Cliente */}
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-[#457bba]" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input
                            placeholder="Buscar cliente por nome, CPF ou telefone..."
                            value={searchCliente}
                            onChange={(e) => setSearchCliente(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {searchCliente && clientesFiltrados.length > 0 && (
                          <Card className="max-h-60 overflow-y-auto">
                            <CardContent className="p-0">
                              {clientesFiltrados.slice(0, 5).map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleClienteChange(c.id)}
                                  className="w-full text-left p-3 hover:bg-slate-50 border-b last:border-b-0"
                                >
                                  <div className="font-medium text-slate-900">{c.nome}</div>
                                  <div className="text-sm text-slate-600">
                                    {c.telefone}
                                    {c.cpf && ` • ${c.cpf}`}
                                  </div>
                                </button>
                              ))}
                            </CardContent>
                          </Card>
                        )}
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{editData.cliente_nome}</p>
                            <p className="text-sm text-slate-600">{editData.cliente_telefone}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(createPageUrl("Clientes"))}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Cadastrar Novo Cliente
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-2xl font-bold text-slate-900">{currentData.cliente_nome}</p>
                        </div>
                        {currentData.cliente_telefone && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="w-4 h-4" />
                            {currentData.cliente_telefone}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Endereço */}
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#457bba]" />
                      Endereço de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isEditing ? (
                      <>
                        {currentClientData && currentClientData.enderecos?.length > 0 && (
                          <div>
                            <Label>Selecione o Endereço *</Label>
                            <Select
                              value={editData.endereco_index?.toString() || "0"}
                              onValueChange={(value) => {
                                const endereco = currentClientData.enderecos[parseInt(value)];
                                setEditData({
                                  ...editData,
                                  endereco_index: parseInt(value),
                                  endereco: endereco,
                                  cidade_regiao: endereco?.cidade || editData.cidade_regiao
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um endereço salvo" />
                              </SelectTrigger>
                              <SelectContent>
                                {currentClientData.enderecos.map((end, idx) => (
                                  <SelectItem key={idx} value={idx.toString()}>
                                    {end.cidade && `${end.cidade} - `}
                                    {end.rua}, {end.numero} - {end.bairro}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Rua</Label>
                            <Input
                              value={editData.endereco.rua}
                              onChange={(e) => setEditData({
                                ...editData,
                                endereco: { ...editData.endereco, rua: e.target.value }
                              })}
                            />
                          </div>
                          <div>
                            <Label>Número</Label>
                            <Input
                              value={editData.endereco.numero}
                              onChange={(e) => setEditData({
                                ...editData,
                                endereco: { ...editData.endereco, numero: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Bairro</Label>
                            <Input
                              value={editData.endereco.bairro}
                              onChange={(e) => setEditData({
                                ...editData,
                                endereco: { ...editData.endereco, bairro: e.target.value }
                              })}
                            />
                          </div>
                          <div>
                            <Label>Complemento</Label>
                            <Input
                              value={editData.endereco.complemento || ""}
                              onChange={(e) => setEditData({
                                ...editData,
                                endereco: { ...editData.endereco, complemento: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Ponto de Referência</Label>
                          <Input
                            value={editData.endereco.ponto_referencia || ""}
                            onChange={(e) => setEditData({
                              ...editData,
                              endereco: { ...editData.endereco, ponto_referencia: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Aos Cuidados De</Label>
                          <Input
                            value={editData.endereco.aos_cuidados_de || ""}
                            onChange={(e) => setEditData({
                              ...editData,
                              endereco: { ...editData.endereco, aos_cuidados_de: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Observações do Endereço</Label>
                          <Textarea
                            value={editData.endereco.observacoes || ""}
                            onChange={(e) => setEditData({
                              ...editData,
                              endereco: { ...editData.endereco, observacoes: e.target.value }
                            })}
                            rows={2}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-semibold text-slate-900">
                          {currentData.endereco.rua}, {currentData.endereco.numero}
                        </p>
                        <p className="text-slate-600">
                          {currentData.endereco.bairro} - {currentData.cidade_regiao}
                        </p>
                        {currentData.endereco.complemento && (
                          <p className="text-sm text-slate-500">
                            Complemento: {currentData.endereco.complemento}
                          </p>
                        )}
                        {currentData.endereco.ponto_referencia && (
                          <p className="text-sm text-slate-500 italic">
                            Referência: {currentData.endereco.ponto_referencia}
                          </p>
                        )}
                        {currentData.endereco.aos_cuidados_de && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                            <p className="text-sm font-semibold text-blue-800">
                              Aos cuidados de: {currentData.endereco.aos_cuidados_de}
                            </p>
                          </div>
                        )}
                        {currentData.endereco.observacoes && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                            <p className="text-xs font-semibold text-yellow-800 mb-1">OBSERVAÇÕES DO ENDEREÇO:</p>
                            <p className="text-sm text-yellow-900">{currentData.endereco.observacoes}</p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Observações do Romaneio */}
                <Card className="border-none shadow-lg border-l-4 border-l-[#890d5d]">
                  <CardHeader>
                    <CardTitle className="text-[#890d5d]">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={editData.observacoes}
                        onChange={(e) => setEditData({ ...editData, observacoes: e.target.value })}
                        placeholder="Observações importantes"
                        rows={3}
                      />
                    ) : (
                      <p className="text-slate-700">{currentData.observacoes || "Nenhuma observação"}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Motivo Não Entrega */}
                {romaneio.status === 'Não Entregue' && romaneio.motivo_nao_entrega && (
                  <Card className="border-none shadow-lg border-l-4 border-l-red-500 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-red-700">Motivo da Não Entrega</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-red-900">{romaneio.motivo_nao_entrega}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Coluna Lateral */}
              <div className="space-y-6">
                {/* Informações */}
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle>Informações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <Label>Cidade/Região</Label>
                          <Select
                            value={editData.cidade_regiao}
                            onValueChange={(value) => setEditData({ ...editData, cidade_regiao: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a cidade" />
                            </SelectTrigger>
                            <SelectContent>
                              {CIDADES.map(cidade => (
                                <SelectItem key={cidade} value={cidade}>
                                  {cidade}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Forma de Pagamento</Label>
                          <Select
                            value={editData.forma_pagamento}
                            onValueChange={(value) => setEditData({ ...editData, forma_pagamento: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a forma de pagamento" />
                            </SelectTrigger>
                            <SelectContent>
                              {FORMAS_PAGAMENTO.map(forma => (
                                <SelectItem key={forma} value={forma}>
                                  {forma}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {(editData.forma_pagamento === "Dinheiro" ||
                          editData.forma_pagamento === "Maquina" ||
                          editData.forma_pagamento === "Troco P/") && (
                            <div>
                              <Label>Valor (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editData.valor_pagamento}
                                onChange={(e) => setEditData({ ...editData, valor_pagamento: e.target.value })}
                              />
                            </div>
                          )}

                        {editData.forma_pagamento === "Troco P/" && (
                          <div>
                            <Label>Troco para (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={editData.valor_troco}
                              onChange={(e) => setEditData({ ...editData, valor_troco: e.target.value })}
                            />
                          </div>
                        )}

                        <div>
                          <Label>Período</Label>
                          <Select
                            value={editData.periodo_entrega}
                            onValueChange={(value) => setEditData({ ...editData, periodo_entrega: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o período" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Manhã">Manhã</SelectItem>
                              <SelectItem value="Tarde">Tarde</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Motoboy</Label>
                          <Select
                            value={editData.motoboy}
                            onValueChange={(value) => setEditData({ ...editData, motoboy: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o motoboy" />
                            </SelectTrigger>
                            <SelectContent>
                              {MOTOBOYS.map(motoboy => (
                                <SelectItem key={motoboy} value={motoboy}>
                                  {motoboy}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="valor_entrega_edit">Valor da Entrega (R$)</Label>
                          <Input
                            id="valor_entrega_edit"
                            type="number"
                            step="0.01"
                            value={editData.valor_entrega}
                            onChange={(e) => setEditData({ ...editData, valor_entrega: e.target.value })}
                            placeholder="0.00"
                            className="bg-slate-50"
                          />
                          <p className="text-xs text-slate-500 mt-1">Calculado automaticamente</p>
                        </div>

                        <div>
                          <Label>Item de Geladeira</Label>
                          <RadioGroup
                            value={(editData.item_geladeira || false).toString()}
                            onValueChange={(value) => setEditData({ ...editData, item_geladeira: value === "true" })}
                            className="flex gap-4 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="edit-geladeira-sim" />
                              <Label htmlFor="edit-geladeira-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="edit-geladeira-nao" />
                              <Label htmlFor="edit-geladeira-nao">Não</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div>
                          <Label>Buscar Receita</Label>
                          <RadioGroup
                            value={(editData.buscar_receita || false).toString()}
                            onValueChange={(value) => setEditData({ ...editData, buscar_receita: value === "true" })}
                            className="flex gap-4 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="edit-receita-sim" />
                              <Label htmlFor="edit-receita-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="edit-receita-nao" />
                              <Label htmlFor="edit-receita-nao">Não</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500">Região</p>
                            <p className="font-semibold text-slate-900">{currentData.cidade_regiao}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <CreditCard className="w-5 h-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500">Pagamento</p>
                            <p className="font-semibold text-slate-900">{currentData.forma_pagamento}</p>
                            {currentData.valor_pagamento && (
                              <p className="text-lg text-[#457bba] font-bold mt-1">
                                R$ {currentData.valor_pagamento.toFixed(2)}
                              </p>
                            )}
                            {currentData.valor_troco && (
                              <p className="text-sm text-green-600 font-bold">
                                Troco: R$ {currentData.valor_troco.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500">Período</p>
                            <p className="font-semibold text-slate-900">{currentData.periodo_entrega}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Package className="w-5 h-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500">Motoboy</p>
                            <p className="font-semibold text-slate-900">{currentData.motoboy}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500">Atendente</p>
                            <p className="font-semibold text-slate-900">{romaneio.atendente_nome}</p>
                          </div>
                        </div>

                        {currentData.item_geladeira && (
                          <div className="bg-cyan-100 border-2 border-cyan-300 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <Snowflake className="w-5 h-5 text-cyan-700" />
                              <p className="font-bold text-cyan-900">ITEM DE GELADEIRA</p>
                            </div>
                          </div>
                        )}

                        {currentData.buscar_receita && (
                          <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-yellow-700" />
                              <p className="font-bold text-yellow-900">BUSCAR RECEITA</p>
                            </div>
                          </div>
                        )}

                        {romaneio.status === 'Entregue' && romaneio.data_entrega_realizada && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs text-green-700 mb-1">Entregue em:</p>
                            <p className="font-semibold text-green-900">
                              {format(parseISO(romaneio.data_entrega_realizada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Código de Rastreamento */}
                {romaneio.codigo_rastreio && !isEditing && (
                  <Card className="border-none shadow-lg bg-gradient-to-br from-[#457bba] to-[#890d5d] text-white">
                    <CardHeader>
                      <CardTitle className="text-white">Código de Rastreio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-mono font-bold tracking-wider">
                        {romaneio.codigo_rastreio}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
