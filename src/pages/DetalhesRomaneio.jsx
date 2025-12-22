import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  FileText,
  Printer,
  Edit,
  Trash2,
  AlertCircle,
  DollarSign,
  CreditCard,
  Snowflake,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const STATUS_CONFIGS = {
  "Pendente": { color: "bg-slate-100 text-slate-700", icon: Clock },
  "Produzindo no Laboratório": { color: "bg-blue-100 text-blue-700", icon: Package },
  "Preparando no Setor de Entregas": { color: "bg-yellow-100 text-yellow-700", icon: Package },
  "A Caminho": { color: "bg-purple-100 text-purple-700", icon: Package },
  "Entregue": { color: "bg-green-100 text-green-700", icon: CheckCircle },
  "Não Entregue": { color: "bg-red-100 text-red-700", icon: AlertCircle },
  "Voltou": { color: "bg-orange-100 text-orange-700", icon: Clock },
  "Cancelado": { color: "bg-gray-100 text-gray-700", icon: FileText },
};

const StatusBadge = ({ status }) => {
  const { color, icon: Icon } = STATUS_CONFIGS[status] || STATUS_CONFIGS["Pendente"];
  return (
    <Badge className={`${color} text-base px-4 py-2`}>
      <Icon className="w-4 h-4 mr-2" />
      {status}
    </Badge>
  );
};

export default function DetalhesRomaneio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const romaneioId = urlParams.get('id');

  const { data: romaneio, isLoading, error } = useQuery({
    queryKey: ['romaneio', romaneioId],
    queryFn: async () => {
      if (!romaneioId) {
        throw new Error("ID do romaneio não fornecido");
      }

      const { data, error } = await supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(id, nome, telefone, cpf, email),
          endereco:enderecos(id, logradouro, numero, bairro, cidade, complemento, cep, regiao),
          motoboy:motoboys(id, nome)
        `)
        .eq('id', romaneioId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!romaneioId,
    retry: 2,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este romaneio?')) return;

    try {
      const { error } = await supabase
        .from('entregas')
        .delete()
        .eq('id', romaneioId);

      if (error) throw error;

      toast.success('Romaneio excluído com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir romaneio');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Skeleton className="h-12 w-64" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !romaneio) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <Card className="max-w-2xl mx-auto border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Romaneio Não Encontrado</h2>
            <p className="text-slate-500 mb-4">
              {error?.message || "O romaneio que você está procurando não foi encontrado."}
            </p>
            <Button onClick={() => navigate(-1)} style={{ background: '#457bba' }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen print:p-0 print:bg-white">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header - não imprime */}
        <div className="flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Romaneio #{romaneio.requisicao}</h1>
              <p className="text-slate-600 mt-1">Detalhes da entrega</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/editar-romaneio?id=${romaneio.id}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Card Principal com Gradiente */}
        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#457bba] to-[#890d5d] text-white">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">#{romaneio.requisicao}</CardTitle>
                <p className="text-sm opacity-90">
                  {romaneio.data_entrega && format(parseISO(romaneio.data_entrega), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <StatusBadge status={romaneio.status} />
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Informações do Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cliente */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#457bba] mb-3">
                  <User className="w-5 h-5" />
                  <h3 className="font-semibold text-lg">Cliente</h3>
                </div>
                <div className="space-y-2 pl-7">
                  <div>
                    <p className="text-sm text-slate-500">Nome</p>
                    <p className="font-medium text-slate-900">{romaneio.cliente?.nome || romaneio.cliente_nome}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <p className="text-slate-700">{romaneio.cliente?.telefone || romaneio.cliente_telefone}</p>
                  </div>
                  {romaneio.cliente?.cpf && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <p className="text-slate-700">{romaneio.cliente.cpf}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#f59e0b] mb-3">
                  <MapPin className="w-5 h-5" />
                  <h3 className="font-semibold text-lg">Endereço de Entrega</h3>
                </div>
                <div className="space-y-2 pl-7">
                  {romaneio.endereco ? (
                    <>
                      <p className="font-medium text-slate-900">
                        {romaneio.endereco.logradouro}, {romaneio.endereco.numero}
                      </p>
                      {romaneio.endereco.complemento && (
                        <p className="text-slate-600">{romaneio.endereco.complemento}</p>
                      )}
                      <p className="text-slate-600">
                        {romaneio.endereco.bairro && `${romaneio.endereco.bairro} - `}
                        {romaneio.endereco.cidade}
                      </p>
                      {romaneio.endereco.cep && (
                        <p className="text-slate-600">CEP: {romaneio.endereco.cep}</p>
                      )}
                      {romaneio.endereco.regiao && (
                        <Badge variant="outline" className="mt-2">{romaneio.endereco.regiao}</Badge>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-600">{romaneio.endereco_completo || 'Endereço não informado'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-6" />

            {/* Detalhes da Entrega */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Motoboy */}
              {romaneio.motoboy?.nome && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Motoboy</p>
                  <p className="font-semibold text-blue-900">{romaneio.motoboy.nome}</p>
                </div>
              )}

              {/* Data de Entrega */}
              {romaneio.data_entrega && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <p className="text-sm">Data de Entrega</p>
                  </div>
                  <p className="font-semibold text-purple-900">
                    {format(parseISO(romaneio.data_entrega), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}

              {/* Região */}
              {romaneio.regiao && (
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    <p className="text-sm">Região</p>
                  </div>
                  <p className="font-semibold text-amber-900">{romaneio.regiao}</p>
                </div>
              )}
            </div>

            {/* Pagamento */}
            {romaneio.forma_pagamento && (
              <>
                <div className="border-t pt-6" />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 mb-3">
                    <DollarSign className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">Pagamento</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
                    <div>
                      <p className="text-sm text-slate-500">Forma de Pagamento</p>
                      <p className="font-medium text-slate-900">{romaneio.forma_pagamento}</p>
                    </div>
                    {romaneio.valor && (
                      <div>
                        <p className="text-sm text-slate-500">Valor</p>
                        <p className="font-medium text-slate-900">R$ {romaneio.valor.toFixed(2)}</p>
                      </div>
                    )}
                    {romaneio.valor_troco && (
                      <div>
                        <p className="text-sm text-slate-500">Troco para</p>
                        <p className="font-medium text-slate-900">R$ {romaneio.valor_troco.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Observações */}
            {romaneio.observacoes && (
              <>
                <div className="border-t pt-6" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <FileText className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">Observações</h3>
                  </div>
                  <div className="pl-7 p-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-700 whitespace-pre-wrap">{romaneio.observacoes}</p>
                  </div>
                </div>
              </>
            )}

            {/* Informações Adicionais */}
            <div className="border-t pt-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {romaneio.item_geladeira && (
                <div className="flex items-center gap-2 p-3 bg-cyan-50 rounded-lg">
                  <Snowflake className="w-5 h-5 text-cyan-600" />
                  <span className="text-sm font-medium text-cyan-900">Item Geladeira</span>
                </div>
              )}
              {romaneio.buscar_receita && (
                <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-900">Buscar Receita</span>
                </div>
              )}
              {romaneio.created_at && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg col-span-2">
                  <Clock className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-500">Criado em</p>
                    <p className="text-sm font-medium text-slate-900">
                      {format(parseISO(romaneio.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Versão para impressão */}
        <div className="hidden print:block">
          <div className="p-8 bg-white">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Formédica Entregas</h1>
              <p className="text-slate-600">Romaneio de Entrega</p>
            </div>

            <div className="border-2 border-slate-200 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">#{romaneio.requisicao}</h2>
                  <p className="text-slate-600">
                    {romaneio.data_entrega && format(parseISO(romaneio.data_entrega), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Status:</p>
                  <p className="text-lg">{romaneio.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">Cliente:</h3>
                  <p>{romaneio.cliente?.nome || romaneio.cliente_nome}</p>
                  <p className="text-sm text-slate-600">{romaneio.cliente?.telefone || romaneio.cliente_telefone}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Endereço:</h3>
                  {romaneio.endereco ? (
                    <>
                      <p>{romaneio.endereco.logradouro}, {romaneio.endereco.numero}</p>
                      <p>{romaneio.endereco.bairro} - {romaneio.endereco.cidade}</p>
                    </>
                  ) : (
                    <p>{romaneio.endereco_completo}</p>
                  )}
                </div>
              </div>

              {romaneio.observacoes && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-semibold mb-2">Observações:</h3>
                  <p className="text-sm">{romaneio.observacoes}</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Assinatura do Cliente</p>
                    <div className="mt-8 border-b border-slate-400 w-64"></div>
                  </div>
                  {romaneio.valor && (
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Valor Total</p>
                      <p className="text-2xl font-bold">R$ {romaneio.valor.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
