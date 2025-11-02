import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Search,
  Package,
  CheckCircle,
  Clock
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function HistoricoClientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  const { data: clientes, isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list('nome'),
    initialData: [],
  });

  const { data: romaneios, isLoading: loadingRomaneios } = useQuery({
    queryKey: ['romaneios-historico', clienteSelecionado?.id],
    queryFn: async () => {
      if (!clienteSelecionado) return [];
      return base44.entities.Romaneio.filter(
        { cliente_id: clienteSelecionado.id },
        '-data_entrega_prevista'
      );
    },
    enabled: !!clienteSelecionado,
    initialData: [],
  });

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone?.includes(searchTerm)
  );

  const StatusBadge = ({ status }) => {
    const configs = {
      "Produzindo no Laboratório": { color: "bg-blue-100 text-blue-700", icon: Package },
      "Preparando no Setor de Entregas": { color: "bg-yellow-100 text-yellow-700", icon: Package },
      "A Caminho": { color: "bg-purple-100 text-purple-700", icon: Package },
      "Entregue": { color: "bg-green-100 text-green-700", icon: CheckCircle },
      "Não Entregue": { color: "bg-red-100 text-red-700", icon: Clock },
      "Cancelado": { color: "bg-gray-100 text-gray-700", icon: Clock },
    };
    const { color, icon: Icon } = configs[status] || configs["Produzindo no Laboratório"];
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Histórico de Clientes</h1>
          <p className="text-slate-600 mt-1">Visualize o histórico completo de entregas por cliente</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Clientes */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
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
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {clientesFiltrados.map((cliente) => (
                  <button
                    key={cliente.id}
                    onClick={() => setClienteSelecionado(cliente)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
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
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ficha do Cliente e Histórico */}
          <div className="lg:col-span-2 space-y-6">
            {clienteSelecionado ? (
              <>
                {/* Ficha do Cliente */}
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-[#457bba] to-[#890d5d] text-white rounded-t-lg">
                    <CardTitle className="text-2xl">Ficha do Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Nome Completo</p>
                        <p className="text-lg font-semibold text-slate-900">{clienteSelecionado.nome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Telefone</p>
                        <p className="text-lg font-semibold text-slate-900">{clienteSelecionado.telefone}</p>
                      </div>
                    </div>

                    {clienteSelecionado.enderecos && clienteSelecionado.enderecos.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm text-slate-500 mb-3 font-semibold">Endereços Cadastrados</p>
                        <div className="space-y-3">
                          {clienteSelecionado.enderecos.map((end, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                              <MapPin className="w-4 h-4 text-[#457bba] mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
                                <p className="font-medium text-slate-900">
                                  {end.rua}, {end.numero}
                                </p>
                                <p className="text-slate-600">
                                  {end.bairro}
                                  {end.complemento && ` - ${end.complemento}`}
                                </p>
                                {end.ponto_referencia && (
                                  <p className="text-slate-500 italic text-xs mt-1">
                                    Ref: {end.ponto_referencia}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-[#457bba]">{romaneios.length}</p>
                          <p className="text-xs text-slate-500">Total de Entregas</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            {romaneios.filter(r => r.status === 'Entregue').length}
                          </p>
                          <p className="text-xs text-slate-500">Entregues</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">
                            {romaneios.filter(r => 
                              r.status !== 'Entregue' && 
                              r.status !== 'Cancelado' && 
                              r.status !== 'Não Entregue'
                            ).length}
                          </p>
                          <p className="text-xs text-slate-500">Em Andamento</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Histórico de Entregas */}
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#457bba]" />
                      Histórico de Entregas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingRomaneios ? (
                      <div className="p-6 text-center text-slate-500">
                        Carregando histórico...
                      </div>
                    ) : romaneios.length === 0 ? (
                      <div className="p-12 text-center">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhuma entrega encontrada</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {romaneios.map((romaneio) => (
                          <Link
                            key={romaneio.id}
                            to={createPageUrl(`DetalhesRomaneio?id=${romaneio.id}`)}
                            className="block p-6 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h3 className="font-bold text-slate-900">
                                    #{romaneio.numero_requisicao}
                                  </h3>
                                  <StatusBadge status={romaneio.status} />
                                  <Badge variant="outline" className="text-xs">
                                    {romaneio.periodo_entrega}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                                  <div>
                                    <span className="font-medium">Região:</span>{' '}
                                    {romaneio.cidade_regiao}
                                  </div>
                                  <div>
                                    <span className="font-medium">Motoboy:</span>{' '}
                                    {romaneio.motoboy}
                                  </div>
                                  <div>
                                    <span className="font-medium">Pagamento:</span>{' '}
                                    {romaneio.forma_pagamento}
                                  </div>
                                  <div>
                                    <span className="font-medium">Atendente:</span>{' '}
                                    {romaneio.atendente_nome}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-slate-900">
                                  {romaneio.data_entrega_prevista && 
                                    format(parseISO(romaneio.data_entrega_prevista), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                                {romaneio.status === 'Entregue' && romaneio.data_entrega_realizada && (
                                  <div className="text-xs text-green-600 mt-1">
                                    Entregue em {format(new Date(romaneio.data_entrega_realizada), "dd/MM/yyyy", { locale: ptBR })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
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
                    Escolha um cliente da lista para visualizar seu histórico completo de entregas
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}