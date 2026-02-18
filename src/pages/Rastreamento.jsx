import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  Package,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  Snowflake
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Rastreamento() {
  const [codigoRastreio, setCodigoRastreio] = useState("");
  const [pesquisar, setPesquisar] = useState(false);

  const { data: romaneio, isLoading } = useQuery({
    queryKey: ['rastreamento', codigoRastreio],
    queryFn: async () => {
      const romaneios = await base44.entities.Romaneio.filter({ 
        codigo_rastreio: codigoRastreio.toUpperCase() 
      });
      return romaneios[0];
    },
    enabled: pesquisar && codigoRastreio.length > 0,
  });

  const handlePesquisar = (e) => {
    e.preventDefault();
    setPesquisar(true);
  };

  const statusConfig = {
    "Aguardando": {
      color: "bg-slate-100 text-slate-700 border-slate-300",
      icon: Clock,
      description: "Sua entrega está aguardando processamento"
    },
    "Em Preparação": {
      color: "bg-blue-100 text-blue-700 border-blue-300",
      icon: Package,
      description: "Sua entrega está sendo preparada"
    },
    "Saiu para Entrega": {
      color: "bg-purple-100 text-purple-700 border-purple-300",
      icon: Truck,
      description: "Sua entrega está a caminho"
    },
    "Entregue": {
      color: "bg-green-100 text-green-700 border-green-300",
      icon: CheckCircle,
      description: "Sua entrega foi concluída com sucesso"
    },
    "Não Entregue": {
      color: "bg-red-100 text-red-700 border-red-300",
      icon: AlertCircle,
      description: "Houve um problema com a entrega"
    },
  };

  const StatusTimeline = ({ status }) => {
    const etapas = [
      { key: "Aguardando", label: "Aguardando" },
      { key: "Saiu para Entrega", label: "Em Rota" },
      { key: "Entregue", label: "Entregue" },
    ];

    const statusIndex = etapas.findIndex(e => e.key === status);

    return (
      <div className="relative">
        <div className="flex justify-between items-center">
          {etapas.map((etapa, index) => {
            const isActive = index <= statusIndex;
            const isCurrent = index === statusIndex;
            return (
              <div key={etapa.key} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive
                        ? "bg-[#457bba] border-[#457bba] text-white"
                        : "bg-white border-slate-300 text-slate-400"
                    } ${isCurrent ? "ring-4 ring-[#457bba]/30" : ""}`}
                  >
                    {isActive ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-slate-300" />
                    )}
                  </div>
                  <p
                    className={`text-xs mt-2 font-medium ${
                      isActive ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {etapa.label}
                  </p>
                </div>
                {index < etapas.length - 1 && (
                  <div
                    className={`absolute top-5 left-1/2 w-full h-0.5 -z-10 ${
                      index < statusIndex ? "bg-[#457bba]" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Logo/Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#457bba] to-[#890d5d] shadow-lg mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            Rastreie sua Entrega
          </h1>
          <p className="text-slate-600 text-lg">
            Digite o código de rastreamento para acompanhar seu pedido
          </p>
        </div>

        {/* Form de Busca */}
        <Card className="border-none shadow-xl">
          <CardContent className="p-6">
            <form onSubmit={handlePesquisar} className="flex gap-3">
              <Input
                value={codigoRastreio}
                onChange={(e) => {
                  setCodigoRastreio(e.target.value.toUpperCase());
                  setPesquisar(false);
                }}
                placeholder="Ex: ABC12345"
                className="text-lg"
              />
              <Button 
                type="submit"
                className="bg-[#457bba] hover:bg-[#3a6ba0] px-8"
              >
                <Search className="w-5 h-5 mr-2" />
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resultados */}
        {pesquisar && (
          <>
            {isLoading ? (
              <Card className="border-none shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#457bba] mx-auto mb-4"></div>
                  <p className="text-slate-500">Buscando...</p>
                </CardContent>
              </Card>
            ) : romaneio ? (
              <div className="space-y-6">
                {/* Status Atual */}
                <Card className="border-none shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-[#457bba] to-[#890d5d] p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm opacity-90">Pedido</p>
                        <p className="text-2xl font-bold">#{romaneio.numero_requisicao}</p>
                      </div>
                      {romaneio.item_geladeira && (
                        <Badge className="bg-white/20 text-white border-white/30">
                          <Snowflake className="w-4 h-4 mr-1" />
                          Geladeira
                        </Badge>
                      )}
                      {romaneio.coleta && (
                        <Badge className="bg-white/20 text-white border-white/30">
                          <Package className="w-4 h-4 mr-1" />
                          Coleta
                        </Badge>
                      )}
                    </div>
                    <StatusTimeline status={romaneio.status} />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {statusConfig[romaneio.status] && (
                        <>
                          <div className={`p-3 rounded-xl ${statusConfig[romaneio.status].color}`}>
                            {React.createElement(statusConfig[romaneio.status].icon, {
                              className: "w-6 h-6"
                            })}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-900 mb-1">
                              {romaneio.status}
                            </h3>
                            <p className="text-slate-600">
                              {statusConfig[romaneio.status].description}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Informações da Entrega */}
                <Card className="border-none shadow-xl">
                  <CardHeader>
                    <CardTitle>Informações da Entrega</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-[#457bba] mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Endereço de Entrega</p>
                        <p className="font-semibold text-slate-900">
                          {romaneio.endereco.rua}, {romaneio.endereco.numero}
                        </p>
                        <p className="text-slate-600">
                          {romaneio.endereco.bairro} - {romaneio.cidade_regiao}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-[#457bba] mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Período de Entrega</p>
                        <p className="font-semibold text-slate-900">{romaneio.periodo_entrega}</p>
                      </div>
                    </div>

                    {romaneio.status === 'Entregue' && romaneio.data_entrega && (
                      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-green-700 mb-1">Entregue em</p>
                          <p className="font-semibold text-green-900">
                            {format(new Date(romaneio.data_entrega), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    )}

                    {romaneio.status === 'Não Entregue' && romaneio.motivo_nao_entrega && (
                      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-red-700 mb-1">Motivo</p>
                          <p className="text-red-900">{romaneio.motivo_nao_entrega}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-none shadow-xl">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Código não encontrado
                  </h3>
                  <p className="text-slate-600">
                    Verifique o código de rastreamento e tente novamente
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}