
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
import { Snowflake, Plus, ArrowLeft, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

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

  const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get('data');

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
    valor_pagamento: "",
    valor_troco: "",
    valor_entrega: "",
    item_geladeira: "false",
    buscar_receita: "false",
    motoboy: "",
    motoboy_email: "",
    periodo_entrega: "Tarde",
    data_entrega_prevista: dataParam || format(new Date(), "yyyy-MM-dd"),
    observacoes: "",
  });

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [searchCliente, setSearchCliente] = useState("");

  // Filtrar apenas clientes com endereço para romaneios
  const clientesFiltrados = clientes.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.telefone?.includes(searchCliente) ||
      c.cpf?.includes(searchCliente);
    
    // Apenas clientes com endereço podem ser usados para romaneios
    const hasEndereco = c.enderecos && c.enderecos.length > 0;
    
    return matchesSearch && hasEndereco;
  });

  // Calcular valor da entrega quando motoboy ou cidade mudar
  useEffect(() => {
    if (formData.motoboy && formData.cidade_regiao) {
      const valor = VALORES_ENTREGA[formData.motoboy]?.[formData.cidade_regiao] || 0;
      setFormData(prev => ({ ...prev, valor_entrega: valor.toString() }));
    }
  }, [formData.motoboy, formData.cidade_regiao]);

  useEffect(() => {
    if (formData.cidade_regiao) {
      let motoboySugerido = "";
      if (REGIOES_MARCIO.includes(formData.cidade_regiao)) {
        motoboySugerido = "Marcio";
      } else if (REGIOES_BRUNO.includes(formData.cidade_regiao)) {
        motoboySugerido = "Bruno";
      }

      if (motoboySugerido && !formData.motoboy) {
        setFormData(prev => ({ ...prev, motoboy: motoboySugerido }));
      }
    }
  }, [formData.cidade_regiao]);

  useEffect(() => {
    if (selectedCliente && selectedCliente.enderecos && selectedCliente.enderecos.length > 0) {
      const endereco = selectedCliente.enderecos[formData.endereco_index];
      if (endereco.cidade && endereco.cidade !== formData.cidade_regiao) {
        setFormData(prev => ({ ...prev, cidade_regiao: endereco.cidade }));
      }
    }
  }, [selectedCliente, formData.endereco_index]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const cliente = clientes.find(c => c.id === data.cliente_id);
      const endereco = cliente.enderecos[data.endereco_index];

      const codigo_rastreio = Math.random().toString(36).substring(2, 10).toUpperCase();

      return base44.entities.Romaneio.create({
        ...data,
        cliente_nome: cliente.nome,
        cliente_telefone: cliente.telefone,
        atendente_nome: user.nome_atendente || user.full_name,
        atendente_email: user.email,
        endereco: endereco,
        status: "Pendente",
        codigo_rastreio,
        item_geladeira: data.item_geladeira === "true" || data.item_geladeira === true,
        buscar_receita: data.buscar_receita === "true" || data.buscar_receita === true,
        valor_pagamento: data.valor_pagamento ? parseFloat(data.valor_pagamento) : null,
        valor_troco: data.valor_troco ? parseFloat(data.valor_troco) : null,
        valor_entrega: data.valor_entrega ? parseFloat(data.valor_entrega) : 0,
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

    if (!formData.cliente_id || !formData.numero_requisicao || !formData.cidade_regiao ||
        !formData.forma_pagamento || !formData.motoboy || !formData.periodo_entrega ||
        !formData.data_entrega_prevista || formData.item_geladeira === "" || formData.buscar_receita === "") {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const requiresValorPagamento = ["Dinheiro", "Maquina", "Troco P/"].includes(formData.forma_pagamento);
    if (requiresValorPagamento && (formData.valor_pagamento === "" || parseFloat(formData.valor_pagamento) <= 0)) {
        toast.error('Informe o valor de pagamento');
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
    setSearchCliente("");
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

        <form onSubmit={handleSubmit}>
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Informações do Romaneio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cliente com Busca */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cliente *</Label>
                  <div className="space-y-2">
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
                    {selectedCliente && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{selectedCliente.nome}</p>
                          <p className="text-sm text-slate-600">{selectedCliente.telefone}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCliente(null);
                            setFormData({ ...formData, cliente_id: "", endereco_index: 0 });
                          }}
                        >
                          Alterar
                        </Button>
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
                          {end.cidade && `${end.cidade} - `}
                          {end.rua}, {end.numero} - {end.bairro}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Cidade, Período e Data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div>
                  <Label htmlFor="data_entrega_prevista">Data de Entrega *</Label>
                  <Input
                    id="data_entrega_prevista"
                    type="date"
                    value={formData.data_entrega_prevista}
                    onChange={(e) => setFormData({ ...formData, data_entrega_prevista: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Pagamento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                {(formData.forma_pagamento === "Dinheiro" ||
                  formData.forma_pagamento === "Maquina" ||
                  formData.forma_pagamento === "Troco P/") && (
                  <div>
                    <Label htmlFor="valor_pagamento">Valor (R$) *</Label>
                    <Input
                      id="valor_pagamento"
                      type="number"
                      step="0.01"
                      value={formData.valor_pagamento}
                      onChange={(e) => setFormData({ ...formData, valor_pagamento: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                )}

                {formData.forma_pagamento === "Troco P/" && (
                  <div>
                    <Label htmlFor="valor_troco">Troco para (R$)</Label>
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

              {/* Motoboy e Valor da Entrega */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <Label htmlFor="valor_entrega">Valor da Entrega (R$)</Label>
                  <Input
                    id="valor_entrega"
                    type="number"
                    step="0.01"
                    value={formData.valor_entrega}
                    onChange={(e) => setFormData({ ...formData, valor_entrega: e.target.value })}
                    placeholder="0.00"
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-slate-500 mt-1">Valor calculado automaticamente</p>
                </div>
              </div>

              {/* Item de Geladeira */}
              <div className="bg-cyan-50 border-2 border-cyan-200 rounded-lg p-4">
                <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                  <Snowflake className="w-5 h-5 text-cyan-600" />
                  Item de Geladeira? *
                </Label>
                <RadioGroup
                  value={(formData.item_geladeira || false).toString()}
                  onValueChange={(value) => setFormData({ ...formData, item_geladeira: value })}
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

              {/* Buscar Receita */}
              <div className={`border-2 rounded-lg p-4 ${formData.buscar_receita === "true" || formData.buscar_receita === true ? 'bg-yellow-50 border-yellow-400' : 'bg-slate-50 border-slate-200'}`}>
                <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-yellow-600" />
                  Buscar Receita? *
                </Label>
                <RadioGroup
                  value={(formData.buscar_receita || false).toString()}
                  onValueChange={(value) => setFormData({ ...formData, buscar_receita: value })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="receita-sim" />
                    <Label htmlFor="receita-sim" className="cursor-pointer">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="receita-nao" />
                    <Label htmlFor="receita-nao" className="cursor-pointer">Não</Label>
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
                  disabled={createMutation.isPending}
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
