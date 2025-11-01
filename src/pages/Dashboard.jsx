import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  FileText, 
  Package, 
  Clock, 
  CheckCircle, 
  Plus,
  TrendingUp,
  AlertCircle,
  Snowflake
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const StatusBadge = ({ status }) => {
  const config = {
    "Aguardando": { color: "bg-slate-100 text-slate-700 border-slate-300", icon: Clock },
    "Em Preparação": { color: "bg-blue-100 text-blue-700 border-blue-300", icon: Package },
    "Saiu para Entrega": { color: "bg-purple-100 text-purple-700 border-purple-300", icon: TrendingUp },
    "Entregue": { color: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle },
    "Não Entregue": { color: "bg-red-100 text-red-700 border-red-300", icon: AlertCircle },
    "Cancelado": { color: "bg-gray-100 text-gray-700 border-gray-300", icon: AlertCircle },
  };
  
  const { color, icon: Icon } = config[status] || config["Aguardando"];
  
  return (
    <Badge className={`${color} border font-medium`}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
};

export default function Dashboard() {
  const [periodo, setPeriodo] = useState("hoje");

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: romaneios, isLoading } = useQuery({
    queryKey: ['romaneios', user?.email],
    queryFn: async () => {
      if (!user) return [];
      if (user.tipo_usuario === 'admin' || user.role === 'admin') {
        return base44.entities.Romaneio.list('-created_date');
      }
      return base44.entities.Romaneio.filter(
        { atendente_email: user.email },
        '-created_date'
      );
    },
    enabled: !!user,
    initialData: [],
  });

  const stats = {
    total: romaneios.length,
    aguardando: romaneios.filter(r => r.status === 'Aguardando').length,
    emEntrega: romaneios.filter(r => r.status === 'Saiu para Entrega').length,
    entregues: romaneios.filter(r => r.status === 'Entregue').length,
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Painel de Controle
            </h1>
            <p className="text-slate-600">
              Olá, <span className="font-semibold text-[#457bba]">
                {user?.nome_atendente || user?.full_name}
              </span>
            </p>
          </div>
          <Link to={createPageUrl("NovoRomaneio")}>
            <Button className="bg-[#457bba] hover:bg-[#3a6ba0] text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Novo Romaneio
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-md hover:shadow-xl transition-shadow bg-white">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Total de Romaneios</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {stats.total}
                  </CardTitle>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <FileText className="w-6 h-6 text-[#457bba]" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-md hover:shadow-xl transition-shadow bg-white">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Aguardando</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {stats.aguardando}
                  </CardTitle>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <Clock className="w-6 h-6 text-slate-500" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-md hover:shadow-xl transition-shadow bg-white">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Em Entrega</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {stats.emEntrega}
                  </CardTitle>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Package className="w-6 h-6 text-[#890d5d]" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-md hover:shadow-xl transition-shadow bg-white">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Entregues</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {stats.entregues}
                  </CardTitle>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Romaneios Recentes */}
        <Card className="border-none shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-xl font-bold text-slate-900">
              Romaneios Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : romaneios.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Nenhum romaneio encontrado</p>
                <p className="text-sm text-slate-400 mt-1">
                  Comece criando seu primeiro romaneio
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {romaneios.slice(0, 10).map((romaneio) => (
                  <Link
                    key={romaneio.id}
                    to={createPageUrl(`DetalhesRomaneio?id=${romaneio.id}`)}
                    className="block p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-lg">
                            #{romaneio.numero_requisicao}
                          </h3>
                          <StatusBadge status={romaneio.status} />
                          {romaneio.item_geladeira && (
                            <Badge className="bg-cyan-100 text-cyan-700 border-cyan-300 border">
                              <Snowflake className="w-3 h-3 mr-1" />
                              Geladeira
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-600">
                          <div>
                            <span className="font-medium">Cliente:</span>{' '}
                            {romaneio.cliente_nome}
                          </div>
                          <div>
                            <span className="font-medium">Região:</span>{' '}
                            {romaneio.cidade_regiao}
                          </div>
                          <div>
                            <span className="font-medium">Motoboy:</span>{' '}
                            {romaneio.motoboy}
                          </div>
                        </div>
                        <div className="text-sm text-slate-500">
                          <span className="font-medium">Pagamento:</span>{' '}
                          {romaneio.forma_pagamento}
                          {romaneio.valor_troco && ` - R$ ${romaneio.valor_troco.toFixed(2)}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-500">
                          {format(new Date(romaneio.created_date), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {romaneio.periodo_entrega}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}