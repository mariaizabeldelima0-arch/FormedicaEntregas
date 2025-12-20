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
  AlertCircle,
  Search,
  Plus,
  DollarSign, // Added for payment status
  Upload, // Added for image upload
  Image as ImageIcon // Renamed to ImageIcon to avoid conflict with Image component if any
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
  "Bombinhas", "Clinica", "Outro"
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
    "BC": 9,
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
    "Bombinhas": 72
  },
  "Bruno": {
    "BC": 7,
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
    "Bombinhas": 50
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
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagemTipo, setImagemTipo] = useState("");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedClientes, setSelectedClientes] = useState([]);

  const { data: clientes, isLoading: isLoadingClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list('nome'),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.tipo_usuario === 'admin' || user?.role === 'admin';

  const clientesFiltrados = clientes.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.telefone?.includes(searchCliente) ||
      c.cpf?.includes(searchCliente);
    
    const hasEndereco = c.enderecos && c.enderecos.length > 0;
    const notSelected = !selectedClientes.find(sc => sc.id === c.id);
    
    return matchesSearch && hasEndereco && notSelected;
  });

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
      if (!data.endereco_selecionado) {
        throw new Error('Selecione um endereço para entrega');
      }

      const clientesNomes = selectedClientes.map(c => c.nome).join(", ");
      const clientesTelefones = selectedClientes.map(c => c.telefone).join(", ");
      
      const cidadeFinal = data.cidade_regiao === "Outro" ? data.cidade_outro : data.cidade_regiao;

      const updateData = {
        numero_requisicao: data.numero_requisicao,
        cliente_id: selectedClientes[0].id,
        clientes_ids: selectedClientes.map(c => c.id),
        cliente_nome: clientesNomes,
        cliente_telefone: clientesTelefones,
        endereco: data.endereco_selecionado,
        cidade_regiao: cidadeFinal,
        forma_pagamento: data.forma_pagamento,
        valor_pagamento: data.valor_pagamento ? parseFloat(data.valor_pagamento) : null,
        valor_troco: data.valor_troco ? parseFloat(data.valor_troco) : null,
        valor_entrega: data.valor_entrega ? parseFloat(data.valor_entrega) : 0,
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

  const updateStatusPagamentoMutation = useMutation({
    mutationFn: async (status) => {
      return base44.entities.Romaneio.update(romaneioId, {
        status_pagamento_motoboy: status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneio', romaneioId] });
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
      toast.success('Status de pagamento atualizado!');
    },
  });

  const updateConfirmacoesMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Romaneio.update(romaneioId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneio', romaneioId] });
      toast.success('Informações atualizadas!');
    },
  });

  const uploadImagesMutation = useMutation({
    mutationFn: async ({ files, tipo }) => {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return { url: file_url, tipo };
      });
      
      const novasImagens = await Promise.all(uploadPromises);
      const imagensAtuais = romaneio.imagens || [];
      
      return base44.entities.Romaneio.update(romaneio.id, {
        ...romaneio,
        imagens: [...imagensAtuais, ...novasImagens]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneio', romaneioId] });
      toast.success('Imagens anexadas com sucesso!');
      setShowImageDialog(false);
      setSelectedFiles([]);
      setImagemTipo("");
    },
    onError: () => {
      toast.error('Erro ao anexar imagens');
    }
  });

  const removeImageMutation = useMutation({
    mutationFn: async (imageUrl) => {
      const imagensAtualizadas = romaneio.imagens.filter(img => img.url !== imageUrl);
      return base44.entities.Romaneio.update(romaneio.id, {
        ...romaneio,
        imagens: imagensAtualizadas
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneio', romaneioId] });
      toast.success('Imagem removida!');
    },
    onError: () => {
      toast.error('Erro ao remover imagem');
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
    const clientesIds = romaneio.clientes_ids || [romaneio.cliente_id];
    const clientesIniciais = clientes.filter(c => clientesIds.includes(c.id));
    setSelectedClientes(clientesIniciais);

    setEditData({
      numero_requisicao: romaneio.numero_requisicao,
      endereco_selecionado: romaneio.endereco,
      cidade_regiao: romaneio.cidade_regiao,
      cidade_outro: CIDADES.slice(0, -1).includes(romaneio.cidade_regiao) ? "" : romaneio.cidade_regiao,
      forma_pagamento: romaneio.forma_pagamento,
      valor_pagamento: romaneio.valor_pagamento || "",
      valor_troco: romaneio.valor_troco || "",
      valor_entrega: romaneio.valor_entrega || "",
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

  const handleAddCliente = (cliente) => {
    setSelectedClientes([...selectedClientes, cliente]);
    setSearchCliente("");
  };

  const handleRemoveCliente = (clienteId) => {
    setSelectedClientes(selectedClientes.filter(c => c.id !== clienteId));
    if (editData.endereco_selecionado) {
      const enderecoClienteRemovido = selectedClientes
        .find(c => c.id === clienteId)
        ?.enderecos?.some(e => JSON.stringify(e) === JSON.stringify(editData.endereco_selecionado));
      
      if (enderecoClienteRemovido) {
        setEditData({ ...editData, endereco_selecionado: null });
      }
    }
  };

  const handleSaveEdit = () => {
    if (selectedClientes.length === 0) {
      toast.error('Selecione pelo menos um cliente');
      return;
    }

    if (!editData.numero_requisicao) {
      toast.error('Informe o número da requisição');
      return;
    }

    if (!editData.cidade_regiao) {
      toast.error('Selecione a cidade/região');
      return;
    }

    if (editData.cidade_regiao === "Outro" && !editData.cidade_outro) {
      toast.error('Informe o nome da outra cidade');
      return;
    }

    if (!editData.forma_pagamento) {
      toast.error('Selecione a forma de pagamento');
      return;
    }

    if (!editData.endereco_selecionado) {
      toast.error('Selecione um endereço para entrega');
      return;
    }

    updateMutation.mutate(editData);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
    setSelectedClientes([]);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUploadImages = () => {
    if (!imagemTipo) {
      toast.error('Selecione o tipo da imagem');
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error('Selecione pelo menos uma imagem');
      return;
    }
    uploadImagesMutation.mutate({ files: selectedFiles, tipo: imagemTipo });
  };

  if (isLoading || isLoadingClientes) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
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
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
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
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
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

  return (
    <>
      <ImpressaoRomaneio romaneio={romaneio} />

      <div className="p-6 md:p-12 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header - não imprime */}
          <div className="flex items-center gap-4 no-print">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
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
                    className="bg-[#457bba] hover:bg-[#3a6ba0] text-white"
                    onClick={handleEditStart}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Romaneio
                  </Button>
                  <Button
                    className="bg-[#890d5d] hover:bg-[#6e0a4a] text-white"
                    onClick={handlePrint}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-3 bg-red-100 rounded-full">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                          </div>
                          <AlertDialogTitle className="text-xl">Confirmar Exclusão</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-base">
                          Tem certeza que deseja excluir permanentemente o romaneio <strong className="text-slate-900">#{romaneio.numero_requisicao}</strong> do cliente <strong className="text-slate-900">{romaneio.cliente_nome}</strong>?
                          <br /><br />
                          <span className="text-red-600 font-semibold">Esta ação não pode ser desfeita.</span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {excluirMutation.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
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
                <Card className="border-l-4 border-l-[#457bba] shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-blue-50/30 to-transparent">
                    <CardTitle className="flex items-center gap-2 text-lg">
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
                <Card className="border-l-4 border-l-[#10b981] shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-green-50/30 to-transparent">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5 text-[#10b981]" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Label>Cliente(s) *</Label>
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
                                  onClick={() => handleAddCliente(c)}
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
                        {selectedClientes.length > 0 && (
                          <div className="space-y-2">
                            {selectedClientes.map((cliente) => (
                              <div key={cliente.id} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900">{cliente.nome}</p>
                                  <p className="text-sm text-slate-600">{cliente.telefone}</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveCliente(cliente.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
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
                <Card className="border-l-4 border-l-[#f59e0b] shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-amber-50/30 to-transparent">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="w-5 h-5 text-[#f59e0b]" />
                      Endereço de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isEditing ? (
                      <>
                        {selectedClientes.length > 0 && (
                          <div>
                            <Label>Selecione o Endereço de Entrega *</Label>
                            <p className="text-xs text-slate-500 mb-2">Escolha apenas um endereço para esta entrega</p>
                            <div className="space-y-2 mt-2">
                              {selectedClientes.map((cliente) => (
                                <div key={cliente.id}>
                                  <p className="font-semibold text-slate-900 mb-2 text-sm">
                                    {cliente.nome}
                                  </p>
                                  {cliente.enderecos && cliente.enderecos.map((endereco, endIdx) => {
                                    const enderecoKey = `${cliente.id}-${endIdx}`;
                                    const isSelected = editData.endereco_selecionado && 
                                      JSON.stringify(editData.endereco_selecionado) === JSON.stringify(endereco);
                                    
                                    return (
                                      <button
                                        key={enderecoKey}
                                        type="button"
                                        onClick={() => {
                                          const cidadeEndereco = endereco.cidade;
                                          const cidadeExiste = CIDADES.slice(0, -1).includes(cidadeEndereco);
                                          
                                          setEditData({ 
                                            ...editData, 
                                            endereco_selecionado: endereco,
                                            cidade_regiao: cidadeExiste ? cidadeEndereco : "Outro",
                                            cidade_outro: cidadeExiste ? "" : cidadeEndereco || ""
                                          });
                                        }}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-all mb-2 ${
                                          isSelected
                                            ? 'border-[#457bba] bg-blue-50'
                                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="text-sm text-slate-700">
                                            <p className="font-medium">{endereco.rua}, {endereco.numero}</p>
                                            <p>{endereco.bairro} - {endereco.cidade || editData.cidade_regiao}</p>
                                            {endereco.complemento && (
                                              <p className="text-slate-500">Complemento: {endereco.complemento}</p>
                                            )}
                                            {endereco.ponto_referencia && (
                                              <p className="text-slate-500 italic">Ref: {endereco.ponto_referencia}</p>
                                            )}
                                          </div>
                                          {isSelected && (
                                            <Badge className="bg-[#457bba] text-white">Selecionado</Badge>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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

                {/* Seção de Imagens */}
                <Card className="border-none shadow-lg">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-[#457bba]" />
                        Imagens Anexadas
                      </CardTitle>
                      <Button
                        onClick={() => setShowImageDialog(true)}
                        size="sm"
                        className="bg-[#457bba] hover:bg-[#3a6ba0]"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Anexar Imagens
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {!romaneio.imagens || romaneio.imagens.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>Nenhuma imagem anexada</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {romaneio.imagens.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img.url}
                              alt={`Imagem ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-lg border-2 border-slate-200"
                            />
                            <Badge
                              className={`absolute top-2 left-2 ${
                                img.tipo === 'pagamento'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {img.tipo === 'pagamento' ? 'Pagamento' : 'Receita'}
                            </Badge>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                              onClick={() => removeImageMutation.mutate(img.url)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <a
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute bottom-2 right-2 bg-white/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ImageIcon className="w-4 h-4 text-slate-700" />
                            </a>
                          </div>
                        ))}
                      </div>
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
                <Card className="border-l-4 border-l-[#8b5cf6] shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-purple-50/30 to-transparent">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="w-5 h-5 text-[#8b5cf6]" />
                      Informações
                    </CardTitle>
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

                        {editData.cidade_regiao === "Outro" && (
                          <div>
                            <Label htmlFor="cidade_outro_edit">Nome da Cidade *</Label>
                            <Input
                              id="cidade_outro_edit"
                              value={editData.cidade_outro || ""}
                              onChange={(e) => setEditData({ ...editData, cidade_outro: e.target.value })}
                              placeholder="Digite o nome da cidade"
                            />
                          </div>
                        )}

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
                    {/* Status Pagamento Motoboy - apenas para admin */}
                    {!isEditing && isAdmin && (
                      <div>
                        <Label>Pagamento Motoboy</Label>
                        <Select
                          value={romaneio.status_pagamento_motoboy || "Aguardando"}
                          onValueChange={(value) => updateStatusPagamentoMutation.mutate(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Aguardando">Aguardando</SelectItem>
                            <SelectItem value="Pago">Pago</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Status Pagamento Motoboy - apenas visualização para motoboy */}
                    {!isEditing && !isAdmin && (
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Pagamento</p>
                          <Badge className={romaneio.status_pagamento_motoboy === "Pago" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                            {romaneio.status_pagamento_motoboy || "Aguardando"}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Confirmações - apenas display mode e para admin */}
                    {!isEditing && isAdmin && (
                      <>
                        <div>
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={romaneio.pagamento_recebido || false}
                              onChange={(e) => updateConfirmacoesMutation.mutate({ pagamento_recebido: e.target.checked })}
                              className="rounded border-slate-300"
                            />
                            <span>Pagamento Recebido</span>
                          </Label>
                        </div>

                        {romaneio.buscar_receita && (
                          <div>
                            <Label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={romaneio.receita_recebida || false}
                                onChange={(e) => updateConfirmacoesMutation.mutate({ receita_recebida: e.target.checked })}
                                className="rounded border-slate-300"
                              />
                              <span>Receita Recebida</span>
                            </Label>
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

      {/* Dialog para Upload de Imagens */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Anexar Imagens</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tipo de Imagem *</Label>
              <Select value={imagemTipo} onValueChange={setImagemTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagamento">Comprovante de Pagamento</SelectItem>
                  <SelectItem value="receita">Receita Médica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Selecione as Imagens *</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {selectedFiles.length > 0 && (
                <p className="text-sm text-slate-600 mt-2">
                  {selectedFiles.length} arquivo(s) selecionado(s)
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImageDialog(false);
                  setSelectedFiles([]);
                  setImagemTipo("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadImages}
                disabled={uploadImagesMutation.isPending || !imagemTipo || selectedFiles.length === 0}
                className="bg-[#457bba] hover:bg-[#3a6ba0]"
              >
                {uploadImagesMutation.isPending ? 'Enviando...' : 'Anexar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}