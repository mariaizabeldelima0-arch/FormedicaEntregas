import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Snowflake, Plus, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

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

const REGIOES_MARCIO = [
  "BC", "Nova Esperança", "Camboriú", "Tabuleiro", "Monte Alegre", 
  "Barra", "Estaleiro", "Clinica"
];

const REGIOES_BRUNO = [
  "Taquaras", "Laranjeiras", "Itajai", "Espinheiros", "Praia dos Amores", 
  "Praia Brava", "Itapema", "Navegantes", "Penha", "Porto Belo", 
  "Tijucas", "Piçarras", "Bombinhas"
];

export default function NovoRomaneio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list('nome'),
    initialData: [],
  });

  const [formData, setFormData] = useState({
    numero_requisicao: "",
    cliente_id: "",
    endereco_index: 0,
    cidade_regiao: "",
    forma_pagamento: "",
    valor_troco: "",
    item_geladeira: false,
    motoboy: "",
    motoboy_email: "",
    periodo_entrega: "",
    observacoes: "",
  });

  const [clienteBloqueado, setClienteBloqueado] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);

  // Verificar se cliente tem entrega pendente
  useEffect(() => {
    const checkClientePendente = async () => {
      if (!formData.cliente_id) {
        setClienteBloqueado(false);
        return;
      }

      const romaneios = await base44.entities.Romaneio.filter({
        cliente_id: formData.cliente_id,
      });

      const pendentes = romaneios.filter(r => 
        r.status !== 'Entregue' && r.status !== 'Cancelado'
      );

      setClienteBloqueado(pendentes.length > 0);
    };

    checkClientePendente();
  }, [formData.cliente_id]);

  // Auto-preencher motoboy baseado na cidade
  useEffect(() => {
    if (formData.cidade_regiao && !formData.motoboy) {
      let motoboySugerido = "";
      if (REGIOES_MARCIO.includes(formData.cidade_regiao)) {
        motoboySugerido = "Marcio";
      } else if (REGIOES_BRUNO.includes(formData.cidade_regiao)) {
        motoboySugerido = "Bruno";
      }
      
      if (motoboySugerido) {
        setFormData(prev => ({ ...prev, motoboy: motoboySugerido }));
      }
    }
  }, [formData.cidade_regiao]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const cliente = clientes.find(c => c.id === data.cliente_id);
      const endereco = cliente.enderecos[data.endereco_index];
      
      const codigo_rastreio = Math.random().toString(36).substring(2, 10).toUpperCase();

      return base44.entities.Romaneio.create({
        ...data,
        cliente_nome: cliente.nome,
        atendente_nome: user.nome_atendente || user.full_name,
        atendente_email: user.email,
        endereco: endereco,
        status: "Aguardando",
        codigo_rastreio,
        item_geladeira: data.item_geladeira === "true" || data.item_geladeira === true,
        valor_troco: data.valor_troco ? parseFloat(data.valor_troco) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
      toast.success('Romaneio criado com sucesso!');
      navigate(createPageUrl("Dashboard"));
    },
    onError: (error) => {
      toast.error('Erro ao criar romaneio');
      console.error(error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (clienteBloqueado) {
      toast.error('Este cliente possui uma entrega pendente');
      return;
    }

    if (!formData.cliente_id || !formData.numero_requisicao || !formData.cidade_regiao || 
        !formData.forma_pagamento || !formData.motoboy || !formData.periodo_entrega ||
        formData.item_geladeira === "") {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    createMutation.mutate(formData);
  };

  const handleClienteChange = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    setSelectedCliente(cliente);
    setFormData({
      ...formData,
      cliente_id: clienteId,
      endereco_index: 0,
    });
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Novo Romaneio
            </h1>
            <p className="text-slate-600 mt-1">Crie uma nova ordem de entrega</p>
          </div>
        </div>

        {clienteBloqueado && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Este cliente possui uma entrega pendente. Aguarde a conclusão antes de criar um novo romaneio.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Informações do Romaneio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cliente e Número */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cliente *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.cliente_id}
                      onValueChange={handleClienteChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(createPageUrl("Clientes"))}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="numero_requisicao">Número da Requisição *</Label>
                  <Input
                    id="numero_requisicao"
                    value={formData.numero_requisicao}
                    onChange={(e) => setFormData({ ...formData, numero_requisicao: e.target.value })}
                    placeholder="Ex: REQ-001"
                    required
                  />
                </div>
              </div>

              {/* Endereço */}
              {selectedCliente && selectedCliente.enderecos && selectedCliente.enderecos.length > 0 && (
                <div>
                  <Label>Endereço de Entrega *</Label>
                  <Select
                    value={formData.endereco_index.toString()}
                    onValueChange={(value) => setFormData({ ...formData, endereco_index: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCliente.enderecos.map((end, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {end.rua}, {end.numero} - {end.bairro}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Cidade e Período */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cidade/Região *</Label>
                  <Select
                    value={formData.cidade_regiao}
                    onValueChange={(value) => setFormData({ ...formData, cidade_regiao: value })}
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
                  <Label>Período de Entrega *</Label>
                  <Select
                    value={formData.periodo_entrega}
                    onValueChange={(value) => setFormData({ ...formData, periodo_entrega: value })}
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
              </div>

              {/* Pagamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Forma de Pagamento *</Label>
                  <Select
                    value={formData.forma_pagamento}
                    onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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

                {formData.forma_pagamento === "Troco P/" && (
                  <div>
                    <Label htmlFor="valor_troco">Valor do Troco (R$)</Label>
                    <Input
                      id="valor_troco"
                      type="number"
                      step="0.01"
                      value={formData.valor_troco}
                      onChange={(e) => setFormData({ ...formData, valor_troco: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              {/* Motoboy */}
              <div>
                <Label>Motoboy *</Label>
                <Select
                  value={formData.motoboy}
                  onValueChange={(value) => setFormData({ ...formData, motoboy: value })}
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

              {/* Item de Geladeira */}
              <div className="bg-cyan-50 border-2 border-cyan-200 rounded-lg p-4">
                <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                  <Snowflake className="w-5 h-5 text-cyan-600" />
                  Item de Geladeira? *
                </Label>
                <RadioGroup
                  value={formData.item_geladeira.toString()}
                  onValueChange={(value) => setFormData({ ...formData, item_geladeira: value === "true" })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="geladeira-sim" />
                    <Label htmlFor="geladeira-sim" className="cursor-pointer">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="geladeira-nao" />
                    <Label htmlFor="geladeira-nao" className="cursor-pointer">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre a entrega"
                  rows={3}
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl("Dashboard"))}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-[#457bba] hover:bg-[#3a6ba0]"
                  disabled={createMutation.isPending || clienteBloqueado}
                >
                  {createMutation.isPending ? 'Criando...' : 'Criar Romaneio'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}