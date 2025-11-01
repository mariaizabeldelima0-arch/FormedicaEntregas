import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, User, Phone, MapPin, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

const ClienteForm = ({ cliente, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(cliente || {
    nome: "",
    telefone: "",
    enderecos: [{
      rua: "",
      numero: "",
      bairro: "",
      complemento: "",
      ponto_referencia: "",
      aos_cuidados_de: "",
      observacoes: ""
    }]
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (cliente?.id) {
        return base44.entities.Cliente.update(cliente.id, data);
      }
      return base44.entities.Cliente.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success(cliente ? 'Cliente atualizado!' : 'Cliente cadastrado!');
      onSuccess();
    },
    onError: () => {
      toast.error('Erro ao salvar cliente');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.telefone) {
      toast.error('Preencha nome e telefone');
      return;
    }
    saveMutation.mutate(formData);
  };

  const addEndereco = () => {
    setFormData({
      ...formData,
      enderecos: [
        ...formData.enderecos,
        {
          rua: "",
          numero: "",
          bairro: "",
          complemento: "",
          ponto_referencia: "",
          aos_cuidados_de: "",
          observacoes: ""
        }
      ]
    });
  };

  const removeEndereco = (index) => {
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Label htmlFor="telefone">Telefone *</Label>
          <Input
            id="telefone"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            placeholder="(00) 00000-0000"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-slate-900">Endereços</h3>
          <Button type="button" variant="outline" size="sm" onClick={addEndereco}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Endereço
          </Button>
        </div>

        {formData.enderecos.map((endereco, index) => (
          <Card key={index} className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Endereço {index + 1}</CardTitle>
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
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Label>Rua</Label>
                  <Input
                    value={endereco.rua}
                    onChange={(e) => updateEndereco(index, 'rua', e.target.value)}
                    placeholder="Nome da rua"
                  />
                </div>
                <div>
                  <Label>Número</Label>
                  <Input
                    value={endereco.numero}
                    onChange={(e) => updateEndereco(index, 'numero', e.target.value)}
                    placeholder="Nº"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Bairro</Label>
                  <Input
                    value={endereco.bairro}
                    onChange={(e) => updateEndereco(index, 'bairro', e.target.value)}
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <Label>Complemento</Label>
                  <Input
                    value={endereco.complemento}
                    onChange={(e) => updateEndereco(index, 'complemento', e.target.value)}
                    placeholder="Apto, Bloco, etc."
                  />
                </div>
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
                <Label>Aos Cuidados De</Label>
                <Input
                  value={endereco.aos_cuidados_de}
                  onChange={(e) => updateEndereco(index, 'aos_cuidados_de', e.target.value)}
                  placeholder="Nome do destinatário"
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

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-[#457bba] hover:bg-[#3a6ba0]"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Salvando...' : cliente ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
};

export default function Clientes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list('-created_date'),
    initialData: [],
  });

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone.includes(searchTerm)
  );

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingCliente(null);
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Clientes</h1>
            <p className="text-slate-600 mt-1">Gerencie sua base de clientes</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-[#457bba] hover:bg-[#3a6ba0]"
                onClick={() => setEditingCliente(null)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                </DialogTitle>
              </DialogHeader>
              <ClienteForm 
                cliente={editingCliente}
                onSuccess={handleClose}
                onCancel={handleClose}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {filteredClientes.map((cliente) => (
                <div
                  key={cliente.id}
                  className="p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#457bba] to-[#890d5d] flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">
                            {cliente.nome}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4" />
                            {cliente.telefone}
                          </div>
                        </div>
                      </div>
                      {cliente.enderecos && cliente.enderecos.length > 0 && (
                        <div className="ml-15 space-y-2">
                          {cliente.enderecos.map((end, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>
                                {end.rua}, {end.numero} - {end.bairro}
                                {end.complemento && ` (${end.complemento})`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(cliente)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}