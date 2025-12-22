import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  User,
  Phone,
  MapPin,
  Trash2,
  Edit,
  ArrowLeft,
  CreditCard,
  Mail,
  FileText,
  Package,
  Calendar,
  DollarSign,
  Search,
  CheckCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Mapeamento de regiões
const REGIOES = [
  { value: "BC", label: "Balneário Camboriú (BC)" },
  { value: "NOVA ESPERANÇA", label: "Nova Esperança" },
  { value: "CAMBORIÚ", label: "Camboriú" },
  { value: "BARRA", label: "Barra" },
  { value: "ESTALEIRO", label: "Estaleiro" },
  { value: "TAQUARAS", label: "Taquaras" },
  { value: "LARANJEIRAS", label: "Laranjeiras" },
  { value: "PRAIA DOS AMORES", label: "Praia dos Amores" },
  { value: "PRAIA BRAVA", label: "Praia Brava" },
  { value: "ITAJAI", label: "Itajaí" },
  { value: "ITAPEMA", label: "Itapema" },
  { value: "NAVEGANTES", label: "Navegantes" },
  { value: "PENHA", label: "Penha" },
  { value: "PORTO BELO", label: "Porto Belo" },
  { value: "TIJUCAS", label: "Tijucas" },
  { value: "PIÇARRAS", label: "Piçarras" },
  { value: "BOMBINHAS", label: "Bombinhas" },
  { value: "OUTRO", label: "Outro" }
];

const ClienteForm = ({ cliente, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(cliente || {
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    enderecos: [{
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      cep: "",
      regiao: "",
      ponto_referencia: "",
      observacoes: "",
      is_principal: true
    }]
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nome || !formData.telefone) {
      toast.error('Preencha nome e telefone');
      return;
    }

    if (!formData.enderecos.some(end => end.logradouro && end.numero && end.cidade)) {
      toast.error('Preencha pelo menos um endereço completo');
      return;
    }

    setSaving(true);
    const toastId = toast.loading(cliente?.id ? 'Atualizando cliente...' : 'Cadastrando cliente...');

    try {
      // 1. Criar ou atualizar cliente
      let clienteId;

      if (cliente?.id) {
        // Atualizar cliente existente
        const { error: updateError } = await supabase
          .from('clientes')
          .update({
            nome: formData.nome,
            cpf: formData.cpf || null,
            telefone: formData.telefone,
            email: formData.email || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', cliente.id);

        if (updateError) throw updateError;
        clienteId = cliente.id;

        // Deletar endereços antigos
        await supabase
          .from('enderecos')
          .delete()
          .eq('cliente_id', clienteId);
      } else {
        // Criar novo cliente
        const { data: novoCliente, error: createError } = await supabase
          .from('clientes')
          .insert([{
            nome: formData.nome,
            cpf: formData.cpf || null,
            telefone: formData.telefone,
            email: formData.email || null
          }])
          .select()
          .single();

        if (createError) throw createError;
        clienteId = novoCliente.id;
      }

      // 2. Criar endereços
      const enderecosParaInserir = formData.enderecos
        .filter(end => end.logradouro && end.numero && end.cidade)
        .map((end, index) => ({
          cliente_id: clienteId,
          logradouro: end.logradouro,
          numero: end.numero,
          complemento: end.complemento || null,
          bairro: end.bairro || null,
          cidade: end.cidade,
          cep: end.cep || null,
          regiao: end.regiao || null,
          ponto_referencia: end.ponto_referencia || null,
          observacoes: end.observacoes || null,
          is_principal: index === 0 // Primeiro endereço é o principal
        }));

      if (enderecosParaInserir.length > 0) {
        const { error: enderecoError } = await supabase
          .from('enderecos')
          .insert(enderecosParaInserir);

        if (enderecoError) throw enderecoError;
      }

      toast.success(cliente?.id ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!', { id: toastId });
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente: ' + error.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const addEndereco = () => {
    setFormData({
      ...formData,
      enderecos: [
        ...formData.enderecos,
        {
          logradouro: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          cep: "",
          regiao: "",
          ponto_referencia: "",
          observacoes: "",
          is_principal: false
        }
      ]
    });
  };

  const removeEndereco = (index) => {
    if (formData.enderecos.length === 1) {
      toast.error('É necessário pelo menos um endereço');
      return;
    }
    setFormData({
      ...formData,
      enderecos: formData.enderecos.filter((_, i) => i !== index)
    });
  };

  const updateEndereco = (index, field, value) => {
    const newEnderecos = [...formData.enderecos];
    newEnderecos[index] = { ...newEnderecos[index], [field]: value };
    setFormData({ ...formData, enderecos: newEnderecos });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div>
          <Label htmlFor="nome">Nome Completo *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Nome do cliente"
            required
          />
        </div>
        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            value={formData.cpf}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            placeholder="000.000.000-00"
          />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone *</Label>
          <Input
            id="telefone"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            placeholder="(00) 00000-0000"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="cliente@email.com"
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.875rem' }}>Endereços</h3>
          <Button type="button" variant="outline" size="sm" onClick={addEndereco}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Endereço
          </Button>
        </div>

        {formData.enderecos.map((endereco, index) => (
          <Card key={`endereco-${index}-${endereco.logradouro || 'new'}`}>
            <CardHeader style={{ paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle style={{ fontSize: '0.875rem' }}>
                  Endereço {index + 1} {index === 0 && "(Principal)"}
                </CardTitle>
                {formData.enderecos.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEndereco(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <Label>CEP</Label>
                  <Input
                    value={endereco.cep || ""}
                    onChange={(e) => updateEndereco(index, 'cep', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
                <div>
                  <Label>Região</Label>
                  <Select
                    key={`regiao-${index}-${endereco.regiao || 'empty'}`}
                    value={endereco.regiao}
                    onValueChange={(value) => updateEndereco(index, 'regiao', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a região" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIOES.map(regiao => (
                        <SelectItem key={regiao.value} value={regiao.value}>
                          {regiao.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <Label>Rua/Logradouro *</Label>
                  <Input
                    value={endereco.logradouro}
                    onChange={(e) => updateEndereco(index, 'logradouro', e.target.value)}
                    placeholder="Nome da rua"
                  />
                </div>
                <div>
                  <Label>Número *</Label>
                  <Input
                    value={endereco.numero}
                    onChange={(e) => updateEndereco(index, 'numero', e.target.value)}
                    placeholder="123"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <Label>Bairro</Label>
                  <Input
                    value={endereco.bairro}
                    onChange={(e) => updateEndereco(index, 'bairro', e.target.value)}
                    placeholder="Nome do bairro"
                  />
                </div>
                <div>
                  <Label>Cidade *</Label>
                  <Input
                    value={endereco.cidade}
                    onChange={(e) => updateEndereco(index, 'cidade', e.target.value)}
                    placeholder="Ex: Balneário Camboriú"
                  />
                </div>
              </div>

              <div>
                <Label>Complemento</Label>
                <Input
                  value={endereco.complemento}
                  onChange={(e) => updateEndereco(index, 'complemento', e.target.value)}
                  placeholder="Apto, Bloco, etc."
                />
              </div>

              <div>
                <Label>Ponto de Referência</Label>
                <Input
                  value={endereco.ponto_referencia}
                  onChange={(e) => updateEndereco(index, 'ponto_referencia', e.target.value)}
                  placeholder="Próximo a..."
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={endereco.observacoes}
                  onChange={(e) => updateEndereco(index, 'observacoes', e.target.value)}
                  placeholder="Observações importantes"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem' }}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          style={{ background: '#457bba' }}
          disabled={saving}
        >
          {saving ? 'Salvando...' : (cliente?.id ? 'Atualizar' : 'Cadastrar')}
        </Button>
      </div>
    </form>
  );
};

const StatusBadge = ({ status }) => {
  const configs = {
    "Produzindo no Laboratório": { color: "bg-blue-100 text-blue-700", icon: Package },
    "Preparando no Setor de Entregas": { color: "bg-yellow-100 text-yellow-700", icon: Package },
    "A Caminho": { color: "bg-purple-100 text-purple-700", icon: Package },
    "Entregue": { color: "bg-green-100 text-green-700", icon: CheckCircle },
    "Não Entregue": { color: "bg-red-100 text-red-700", icon: Clock },
    "Cancelado": { color: "bg-gray-100 text-gray-700", icon: Clock },
    "Pendente": { color: "bg-slate-100 text-slate-700", icon: Clock },
    "Voltou": { color: "bg-orange-100 text-orange-700", icon: Clock },
  };
  const { color, icon: Icon } = configs[status] || configs["Pendente"];
  return (
    <Badge className={color}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
};

export default function Clientes() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);

  // Estados para ficha do cliente (master-detail)
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [entregasCliente, setEntregasCliente] = useState([]);
  const [loadingEntregas, setLoadingEntregas] = useState(false);
  const [buscaEntregas, setBuscaEntregas] = useState("");
  const [filtroStatusEntrega, setFiltroStatusEntrega] = useState("todas");

  const loadClientes = async () => {
    setLoading(true);
    try {
      // Buscar clientes com seus endereços
      const { data, error } = await supabase
        .from('clientes')
        .select(`
          *,
          enderecos (*)
        `)
        .order('nome', { ascending: true });

      if (error) throw error;
      setClientes(data || []);

      // Selecionar o primeiro cliente automaticamente se não houver nenhum selecionado
      if (data && data.length > 0 && !clienteSelecionado) {
        handleSelectCliente(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const filteredClientes = clientes.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone?.includes(searchTerm) ||
    c.cpf?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (cliente, e) => {
    e?.stopPropagation();
    setEditingCliente(cliente);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setEditingCliente(null);
    }, 100);
  };

  const handleSuccess = () => {
    handleClose();
    loadClientes();
  };

  // Selecionar cliente e carregar entregas
  const handleSelectCliente = async (cliente) => {
    setClienteSelecionado(cliente);
    setBuscaEntregas("");
    setFiltroStatusEntrega("todas");
    await loadEntregasCliente(cliente.id);
  };

  // Carregar entregas do cliente
  const loadEntregasCliente = async (clienteId) => {
    setLoadingEntregas(true);
    try {
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(id, nome, telefone),
          endereco:enderecos(id, logradouro, numero, bairro, cidade, complemento),
          motoboy:motoboys(id, nome)
        `)
        .eq('cliente_id', clienteId)
        .order('data_entrega', { ascending: false });

      if (error) throw error;
      setEntregasCliente(data || []);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
      toast.error('Erro ao carregar histórico de entregas');
      setEntregasCliente([]);
    } finally {
      setLoadingEntregas(false);
    }
  };

  const handleDelete = async () => {
    if (!clienteToDelete) return;

    const toastId = toast.loading('Excluindo cliente...');

    try {
      // Verificar se cliente tem entregas
      const { data: entregas, error: entregasError } = await supabase
        .from('entregas')
        .select('id')
        .eq('cliente_id', clienteToDelete.id)
        .limit(1);

      if (entregasError) throw entregasError;

      if (entregas && entregas.length > 0) {
        toast.error('Não é possível excluir cliente com entregas cadastradas', { id: toastId });
        setDeleteDialogOpen(false);
        setClienteToDelete(null);
        return;
      }

      // Deletar endereços primeiro (relacionamento)
      await supabase
        .from('enderecos')
        .delete()
        .eq('cliente_id', clienteToDelete.id);

      // Deletar cliente
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteToDelete.id);

      if (error) throw error;

      toast.success('Cliente excluído com sucesso!', { id: toastId });
      setDeleteDialogOpen(false);
      setClienteToDelete(null);

      // Se o cliente excluído era o selecionado, limpar seleção
      if (clienteSelecionado?.id === clienteToDelete.id) {
        setClienteSelecionado(null);
        setEntregasCliente([]);
      }

      loadClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente: ' + error.message, { id: toastId });
    }
  };

  const confirmDelete = (cliente, e) => {
    e?.stopPropagation();
    setClienteToDelete(cliente);
    setDeleteDialogOpen(true);
  };

  // Filtrar entregas
  const entregasFiltradas = entregasCliente.filter(e => {
    // Filtro de status
    if (filtroStatusEntrega === "em_andamento") {
      // Mostrar apenas entregas em andamento (não finalizadas)
      if (e.status === 'Entregue' || e.status === 'Cancelado' || e.status === 'Não Entregue') {
        return false;
      }
    } else if (filtroStatusEntrega !== "todas" && e.status !== filtroStatusEntrega) {
      return false;
    }

    // Filtro de busca
    if (buscaEntregas) {
      const termo = buscaEntregas.toLowerCase();
      return e.requisicao?.toLowerCase().includes(termo) ||
             e.observacoes?.toLowerCase().includes(termo);
    }
    return true;
  });

  // Calcular estatísticas
  const totalEntregas = entregasCliente.length;
  const entregasEntregues = entregasCliente.filter(e => e.status === 'Entregue').length;
  const entregasEmAndamento = entregasCliente.filter(e =>
    e.status !== 'Entregue' &&
    e.status !== 'Cancelado' &&
    e.status !== 'Não Entregue'
  ).length;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Clientes</h1>
              <p className="text-slate-600 mt-1">Gerencie sua base de clientes</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                style={{ background: '#457bba' }}
                onClick={() => setEditingCliente(null)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent
              key={editingCliente?.id || 'new'}
              style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <DialogHeader>
                <DialogTitle>
                  {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                </DialogTitle>
                <DialogDescription>
                  {editingCliente
                    ? 'Atualize as informações do cliente e seus endereços.'
                    : 'Preencha os dados do novo cliente e pelo menos um endereço.'}
                </DialogDescription>
              </DialogHeader>
              <ClienteForm
                cliente={editingCliente}
                onSuccess={handleSuccess}
                onCancel={handleClose}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Layout Master-Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUNA ESQUERDA - Lista de Clientes */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Lista de Clientes</CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center text-slate-500">
                  Carregando clientes...
                </div>
              ) : filteredClientes.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {filteredClientes.map((cliente) => (
                    <div
                      key={cliente.id}
                      onClick={() => handleSelectCliente(cliente)}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                        clienteSelecionado?.id === cliente.id ? 'bg-blue-50 border-l-4 border-[#457bba]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#457bba] to-[#890d5d] flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {cliente.nome}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                            <Phone className="w-3 h-3" />
                            {cliente.telefone}
                          </div>
                          {/* Botões de ação inline */}
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleEdit(cliente, e)}
                              className="h-7 text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => confirmDelete(cliente, e)}
                              className="h-7 text-xs text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* COLUNA DIREITA - Ficha do Cliente */}
          <div className="lg:col-span-2 space-y-6">
            {clienteSelecionado ? (
              <>
                {/* SEÇÃO SUPERIOR - Cabeçalho Roxo Degradê */}
                <Card className="border-none shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#457bba] to-[#890d5d] text-white">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <User className="w-8 h-8" />
                      <div>
                        <div>{clienteSelecionado.nome}</div>
                        <div className="text-sm font-normal opacity-90 mt-1">
                          {clienteSelecionado.telefone}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* SEÇÃO INTERMEDIÁRIA - Endereços e Estatísticas */}
                <Card className="border-none shadow-lg">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Lado Esquerdo - Endereços */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="w-5 h-5 text-[#f59e0b]" />
                          <h3 className="font-semibold text-slate-900">Endereços</h3>
                        </div>
                        {clienteSelecionado.enderecos && clienteSelecionado.enderecos.length > 0 ? (
                          <div className="space-y-3">
                            {clienteSelecionado.enderecos.map((end, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 rounded-lg text-sm">
                                <div className="font-medium text-slate-900">
                                  {end.logradouro}, {end.numero}
                                </div>
                                {end.complemento && (
                                  <div className="text-slate-600">{end.complemento}</div>
                                )}
                                <div className="text-slate-600">
                                  {end.bairro && `${end.bairro} - `}
                                  {end.cidade}
                                </div>
                                {end.cep && (
                                  <div className="text-slate-500">CEP: {end.cep}</div>
                                )}
                                {end.regiao && (
                                  <div className="mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {end.regiao}
                                    </Badge>
                                  </div>
                                )}
                                {end.is_principal && (
                                  <div className="mt-2">
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                      Endereço Principal
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm">Nenhum endereço cadastrado</p>
                        )}

                        {/* Informações adicionais */}
                        <div className="mt-4 space-y-2">
                          {clienteSelecionado.cpf && (
                            <div className="flex items-center gap-2 text-sm">
                              <CreditCard className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600">CPF: {clienteSelecionado.cpf}</span>
                            </div>
                          )}
                          {clienteSelecionado.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600">{clienteSelecionado.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lado Direito - Estatísticas */}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-4">Estatísticas de Entregas</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <button
                            type="button"
                            onClick={() => setFiltroStatusEntrega("todas")}
                            className={`p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                              filtroStatusEntrega === "todas" ? "ring-2 ring-[#457bba]" : ""
                            }`}
                          >
                            <div className="text-3xl font-bold text-[#457bba]">{totalEntregas}</div>
                            <div className="text-xs text-slate-600 mt-1">Total de Entregas</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFiltroStatusEntrega("Entregue")}
                            className={`p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                              filtroStatusEntrega === "Entregue" ? "ring-2 ring-green-600" : ""
                            }`}
                          >
                            <div className="text-3xl font-bold text-green-600">{entregasEntregues}</div>
                            <div className="text-xs text-slate-600 mt-1">Entregues</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFiltroStatusEntrega("em_andamento")}
                            className={`p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                              filtroStatusEntrega === "em_andamento" ? "ring-2 ring-purple-600" : ""
                            }`}
                          >
                            <div className="text-3xl font-bold text-purple-600">{entregasEmAndamento}</div>
                            <div className="text-xs text-slate-600 mt-1">Em Andamento</div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* SEÇÃO INFERIOR - Histórico de Entregas */}
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#457bba]" />
                        Histórico de Entregas
                      </CardTitle>
                      <div className="text-sm text-slate-500">
                        {entregasFiltradas.length} entregas
                      </div>
                    </div>
                    {/* Barra de busca interna */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar por requisição..."
                          value={buscaEntregas}
                          onChange={(e) => setBuscaEntregas(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <select
                        value={filtroStatusEntrega}
                        onChange={(e) => setFiltroStatusEntrega(e.target.value)}
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#457bba] focus:border-transparent"
                      >
                        <option value="todas">Todos os Status</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="Entregue">Entregue</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Produzindo no Laboratório">Produção</option>
                        <option value="A Caminho">A Caminho</option>
                        <option value="Não Entregue">Não Entregue</option>
                        <option value="Voltou">Voltou</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingEntregas ? (
                      <div className="p-6 text-center text-slate-500">
                        Carregando histórico...
                      </div>
                    ) : entregasFiltradas.length === 0 ? (
                      <div className="p-12 text-center">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">
                          {buscaEntregas || filtroStatusEntrega !== "todas"
                            ? 'Nenhuma entrega encontrada com os filtros aplicados'
                            : 'Nenhuma entrega encontrada para este cliente'}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                        {entregasFiltradas.map((entrega) => (
                          <button
                            key={entrega.id}
                            type="button"
                            onClick={() => navigate(`/detalhes-romaneio?id=${entrega.id}`)}
                            className="w-full p-4 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="font-bold text-slate-900">
                                    #{entrega.requisicao}
                                  </span>
                                  <StatusBadge status={entrega.status} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                                  {entrega.motoboy?.nome && (
                                    <div>
                                      <span className="font-medium">Motoboy:</span> {entrega.motoboy.nome}
                                    </div>
                                  )}
                                  {entrega.regiao && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {entrega.regiao}
                                    </div>
                                  )}
                                  {entrega.data_entrega && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(entrega.data_entrega).toLocaleDateString('pt-BR')}
                                    </div>
                                  )}
                                  {entrega.valor && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      R$ {entrega.valor.toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Selecione um Cliente
                  </h3>
                  <p className="text-slate-600">
                    Escolha um cliente da lista para visualizar sua ficha completa e histórico de entregas
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente <strong>{clienteToDelete?.nome}</strong> e todos os seus endereços serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClienteToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} style={{ background: '#ef4444' }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
