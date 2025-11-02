import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  FileText,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  RotateCcw,
  Printer
} from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Relatorios() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get('data');
  
  const [dataSelecionada, setDataSelecionada] = useState(dataParam || format(new Date(), "yyyy-MM-dd"));

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: romaneios, isLoading } = useQuery({
    queryKey: ['romaneios-relatorio', user?.email],
    queryFn: async () => {
      if (!user) return [];
      if (user.tipo_usuario === 'admin' || user.role === 'admin') {
        return base44.entities.Romaneio.list('-data_entrega_prevista');
      }
      return base44.entities.Romaneio.filter(
        { atendente_email: user.email },
        '-data_entrega_prevista'
      );
    },
    enabled: !!user,
    initialData: [],
  });

  // Filtrar romaneios por data
  const romaneiosDoDia = romaneios.filter(r => {
    if (!r.data_entrega_prevista) return false;
    const dataEntrega = parseISO(r.data_entrega_prevista);
    return isSameDay(dataEntrega, parseISO(dataSelecionada));
  });

  // Agrupar por status
  const porStatus = {
    pendente: romaneiosDoDia.filter(r => r.status === 'Pendente'),
    produzindo: romaneiosDoDia.filter(r => r.status === 'Produzindo no Laboratório'),
    preparando: romaneiosDoDia.filter(r => r.status === 'Preparando no Setor de Entregas'),
    aCaminho: romaneiosDoDia.filter(r => r.status === 'A Caminho'),
    entregues: romaneiosDoDia.filter(r => r.status === 'Entregue'),
    naoEntregue: romaneiosDoDia.filter(r => r.status === 'Não Entregue'),
    voltou: romaneiosDoDia.filter(r => r.status === 'Voltou'),
    cancelado: romaneiosDoDia.filter(r => r.status === 'Cancelado'),
  };

  // Agrupar por período
  const porPeriodo = {
    manha: romaneiosDoDia.filter(r => r.periodo_entrega === 'Manhã'),
    tarde: romaneiosDoDia.filter(r => r.periodo_entrega === 'Tarde'),
  };

  // Agrupar por motoboy
  const porMotoboy = romaneiosDoDia.reduce((acc, r) => {
    if (!acc[r.motoboy]) acc[r.motoboy] = [];
    acc[r.motoboy].push(r);
    return acc;
  }, {});

  const handlePrint = () => {
    window.print();
  };

  const StatusBadge = ({ status }) => {
    const config = {
      "Pendente": { color: "bg-slate-100 text-slate-700", icon: Clock },
      "Produzindo no Laboratório": { color: "bg-blue-100 text-blue-700", icon: Package },
      "Preparando no Setor de Entregas": { color: "bg-yellow-100 text-yellow-700", icon: Package },
      "A Caminho": { color: "bg-purple-100 text-purple-700", icon: Truck },
      "Entregue": { color: "bg-green-100 text-green-700", icon: CheckCircle },
      "Não Entregue": { color: "bg-red-100 text-red-700", icon: AlertCircle },
      "Voltou": { color: "bg-orange-100 text-orange-700", icon: RotateCcw },
      "Cancelado": { color: "bg-gray-100 text-gray-700", icon: AlertCircle },
    };
    const { color, icon: Icon } = config[status] || config["Pendente"];
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>

      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header - Não imprime */}
          <div className="flex items-center gap-4 no-print">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">Relatório de Entregas</h1>
              <p className="text-slate-600 mt-1">Visualização completa das entregas do dia</p>
            </div>
            <Button
              className="bg-[#457bba] hover:bg-[#3a6ba0]"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>

          {/* Seletor de Data - Não imprime */}
          <Card className="border-none shadow-lg no-print">
            <CardHeader>
              <CardTitle>Selecione a Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                className="max-w-xs"
              />
            </CardContent>
          </Card>

          {/* Relatório - Imprimível */}
          <div className="space-y-6">
            {/* Cabeçalho do Relatório */}
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#457bba] to-[#890d5d] text-white">
                <CardTitle className="text-2xl">
                  Relatório do Dia {format(parseISO(dataSelecionada), "dd/MM/yyyy", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Resumo Geral */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                  <p className="text-sm text-slate-500 font-medium">Total</p>
                  <p className="text-3xl font-bold text-slate-900">{romaneiosDoDia.length}</p>
                </CardHeader>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                  <p className="text-sm text-slate-500 font-medium">Entregues</p>
                  <p className="text-3xl font-bold text-green-600">{porStatus.entregues.length}</p>
                </CardHeader>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                  <p className="text-sm text-slate-500 font-medium">A Caminho</p>
                  <p className="text-3xl font-bold text-purple-600">{porStatus.aCaminho.length}</p>
                </CardHeader>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                  <p className="text-sm text-slate-500 font-medium">Pendente</p>
                  <p className="text-3xl font-bold text-slate-600">{porStatus.pendente.length}</p>
                </CardHeader>
              </Card>
            </div>

            {/* Por Status */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Entregas por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(porStatus).map(([key, entregas]) => (
                    entregas.length > 0 && (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-slate-900">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </h3>
                          <Badge variant="outline">{entregas.length}</Badge>
                        </div>
                        <div className="space-y-2">
                          {entregas.map(r => (
                            <div key={r.id} className="text-sm text-slate-600">
                              #{r.numero_requisicao} - {r.cliente_nome}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Por Motoboy */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Entregas por Motoboy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(porMotoboy).map(([motoboy, entregas]) => (
                    <div key={motoboy} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-900">{motoboy}</h3>
                        <Badge variant="outline">{entregas.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {entregas.map(r => (
                          <div key={r.id} className="flex justify-between text-sm">
                            <span className="text-slate-600">
                              #{r.numero_requisicao} - {r.cliente_nome}
                            </span>
                            <StatusBadge status={r.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Por Período */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Entregas por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">Manhã</h3>
                      <Badge variant="outline">{porPeriodo.manha.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {porPeriodo.manha.map(r => (
                        <div key={r.id} className="flex justify-between text-sm">
                          <span className="text-slate-600">
                            #{r.numero_requisicao} - {r.cliente_nome}
                          </span>
                          <StatusBadge status={r.status} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">Tarde</h3>
                      <Badge variant="outline">{porPeriodo.tarde.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {porPeriodo.tarde.map(r => (
                        <div key={r.id} className="flex justify-between text-sm">
                          <span className="text-slate-600">
                            #{r.numero_requisicao} - {r.cliente_nome}
                          </span>
                          <StatusBadge status={r.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}