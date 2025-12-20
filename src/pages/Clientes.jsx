import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, User, Phone, MapPin, Trash2, Edit, ArrowLeft, CreditCard, Mail } from "lucide-react";
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

export default function Clientes() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
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

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    // Limpar o estado após o dialog começar a fechar
    setTimeout(() => {
      setEditingCliente(null);
    }, 100);
  };

  const handleSuccess = () => {
    handleClose();
    loadClientes();
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
      loadClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente: ' + error.message, { id: toastId });
    }
  };

  const confirmDelete = (cliente) => {
    setClienteToDelete(cliente);
    setDeleteDialogOpen(true);
  };

  return (
    <div style={{ padding: '2rem', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b' }}>Clientes</h1>
              <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Gerencie sua base de clientes</p>
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

        <Card style={{ border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <CardHeader>
            <Input
              placeholder="Buscar por nome, CPF, telefone ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '400px' }}
            />
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                Carregando clientes...
              </div>
            ) : filteredClientes.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </div>
            ) : (
              <div>
                {filteredClientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    style={{
                      padding: '1.5rem',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <User className="w-6 h-6" style={{ color: 'white' }} />
                          </div>
                          <div>
                            <h3 style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.125rem' }}>
                              {cliente.nome}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Phone className="w-3 h-3" />
                                {cliente.telefone}
                              </div>
                              {cliente.cpf && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <CreditCard className="w-3 h-3" />
                                  {cliente.cpf}
                                </div>
                              )}
                              {cliente.email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Mail className="w-3 h-3" />
                                  {cliente.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {cliente.enderecos && cliente.enderecos.length > 0 && (
                          <div style={{ marginLeft: '60px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {cliente.enderecos.map((end, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                                <MapPin className="w-4 h-4" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span>
                                  {end.cep && `${end.cep} - `}
                                  {end.regiao && `${end.regiao} - `}
                                  {end.logradouro}, {end.numero}
                                  {end.bairro && ` - ${end.bairro}`}
                                  {end.cidade && ` - ${end.cidade}`}
                                  {end.complemento && ` (${end.complemento})`}
                                  {end.is_principal && <span style={{ fontWeight: 600, color: '#457bba' }}> • Principal</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(cliente)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmDelete(cliente)}
                          style={{ color: '#ef4444', borderColor: '#fee2e2' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
