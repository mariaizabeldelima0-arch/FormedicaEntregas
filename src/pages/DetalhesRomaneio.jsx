import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function DetalhesRomaneio() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const romaneioId = urlParams.get('id');

  const { data: romaneio, isLoading } = useQuery({
    queryKey: ['romaneio', romaneioId],
    queryFn: async () => {
      const romaneios = await base44.entities.Romaneio.filter({ id: romaneioId });
      return romaneios[0];
    },
    enabled: !!romaneioId,
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!romaneio) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Romaneio não encontrado</p>
      </div>
    );
  }

  const StatusBadge = ({ status }) => {
    const configs = {
      "Aguardando": { color: "bg-slate-100 text-slate-700 border-slate-300", icon: Clock },
      "Em Preparação": { color: "bg-blue-100 text-blue-700 border-blue-300", icon: Package },
      "Saiu para Entrega": { color: "bg-purple-100 text-purple-700 border-purple-300", icon: Package },
      "Entregue": { color: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle },
      "Não Entregue": { color: "bg-red-100 text-red-700 border-red-300", icon: FileText },
      "Cancelado": { color: "bg-gray-100 text-gray-700 border-gray-300", icon: FileText },
    };
    const { color, icon: Icon } = configs[status] || configs["Aguardando"];
    return (
      <Badge className={`${color} border text-base px-3 py-1`}>
        <Icon className="w-4 h-4 mr-2" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
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
          <StatusBadge status={romaneio.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cliente */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#457bba]" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{romaneio.cliente_nome}</p>
                </div>
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
              <CardContent className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">
                  {romaneio.endereco.rua}, {romaneio.endereco.numero}
                </p>
                <p className="text-slate-600">
                  {romaneio.endereco.bairro} - {romaneio.cidade_regiao}
                </p>
                {romaneio.endereco.complemento && (
                  <p className="text-sm text-slate-500">
                    Complemento: {romaneio.endereco.complemento}
                  </p>
                )}
                {romaneio.endereco.ponto_referencia && (
                  <p className="text-sm text-slate-500 italic">
                    Referência: {romaneio.endereco.ponto_referencia}
                  </p>
                )}
                {romaneio.endereco.aos_cuidados_de && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <p className="text-sm font-semibold text-blue-800">
                      Aos cuidados de: {romaneio.endereco.aos_cuidados_de}
                    </p>
                  </div>
                )}
                {romaneio.endereco.observacoes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <p className="text-xs font-semibold text-yellow-800 mb-1">OBSERVAÇÕES DO ENDEREÇO:</p>
                    <p className="text-sm text-yellow-900">{romaneio.endereco.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Observações do Romaneio */}
            {romaneio.observacoes && (
              <Card className="border-none shadow-lg border-l-4 border-l-[#890d5d]">
                <CardHeader>
                  <CardTitle className="text-[#890d5d]">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700">{romaneio.observacoes}</p>
                </CardContent>
              </Card>
            )}

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
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Pagamento</p>
                    <p className="font-semibold text-slate-900">{romaneio.forma_pagamento}</p>
                    {romaneio.valor_troco && (
                      <p className="text-sm text-green-600 font-bold">
                        Troco: R$ {romaneio.valor_troco.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Período</p>
                    <p className="font-semibold text-slate-900">{romaneio.periodo_entrega}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Motoboy</p>
                    <p className="font-semibold text-slate-900">{romaneio.motoboy}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Atendente</p>
                    <p className="font-semibold text-slate-900">{romaneio.atendente_nome}</p>
                  </div>
                </div>

                {romaneio.item_geladeira && (
                  <div className="bg-cyan-100 border-2 border-cyan-300 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Snowflake className="w-5 h-5 text-cyan-700" />
                      <p className="font-bold text-cyan-900">ITEM DE GELADEIRA</p>
                    </div>
                  </div>
                )}

                {romaneio.status === 'Entregue' && romaneio.data_entrega && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-700 mb-1">Entregue em:</p>
                    <p className="font-semibold text-green-900">
                      {format(new Date(romaneio.data_entrega), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Código de Rastreamento */}
            {romaneio.codigo_rastreio && (
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
  );
}