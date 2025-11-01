import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Package, 
  MapPin, 
  Phone, 
  CreditCard, 
  Clock,
  CheckCircle,
  XCircle,
  Snowflake,
  Navigation,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function MinhasEntregas() {
  const queryClient = useQueryClient();
  const [selectedRomaneio, setSelectedRomaneio] = useState(null);
  const [showConcluirDialog, setShowConcluirDialog] = useState(false);
  const [showProblemaDialog, setShowProblemaDialog] = useState(false);
  const [motivoProblema, setMotivoProblema] = useState("");

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: romaneios, isLoading } = useQuery({
    queryKey: ['minhas-entregas', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const todos = await base44.entities.Romaneio.list('-created_date');
      return todos.filter(r => 
        r.motoboy === user.full_name && 
        r.status !== 'Entregue' && 
        r.status !== 'Cancelado'
      );
    },
    enabled: !!user,
    initialData: [],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, motivo }) => {
      const data = { 
        status,
        ...(status === 'Entregue' && { data_entrega: new Date().toISOString() }),
        ...(motivo && { motivo_nao_entrega: motivo })
      };
      return base44.entities.Romaneio.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-entregas'] });
      toast.success('Status atualizado!');
      setShowConcluirDialog(false);
      setShowProblemaDialog(false);
      setSelectedRomaneio(null);
      setMotivoProblema("");
    },
  });

  const handleIniciarEntrega = (romaneio) => {
    updateStatusMutation.mutate({ id: romaneio.id, status: 'Saiu para Entrega' });
  };

  const handleConcluir = () => {
    if (selectedRomaneio) {
      updateStatusMutation.mutate({ id: selectedRomaneio.id, status: 'Entregue' });
    }
  };

  const handleProblema = () => {
    if (!motivoProblema.trim()) {
      toast.error('Descreva o motivo do problema');
      return;
    }
    if (selectedRomaneio) {
      updateStatusMutation.mutate({ 
        id: selectedRomaneio.id, 
        status: 'Não Entregue',
        motivo: motivoProblema
      });
    }
  };

  const abrirNavegacao = (romaneio) => {
    const end = romaneio.endereco;
    const endereco = `${end.rua}, ${end.numero}, ${end.bairro}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
    window.open(url, '_blank');
  };

  const entregas = {
    aguardando: romaneios.filter(r => r.status === 'Aguardando'),
    emAndamento: romaneios.filter(r => r.status === 'Saiu para Entrega'),
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      "Aguardando": { color: "bg-slate-100 text-slate-700", icon: Clock },
      "Saiu para Entrega": { color: "bg-purple-100 text-purple-700", icon: Package },
    };
    const { color, icon: Icon } = configs[status] || configs["Aguardando"];
    return (
      <Badge className={`${color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const EntregaCard = ({ romaneio }) => (
    <Card className="border-slate-200 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <CardTitle className="text-lg">#{romaneio.numero_requisicao}</CardTitle>
              <StatusBadge status={romaneio.status} />
              {romaneio.item_geladeira && (
                <Badge className="bg-cyan-100 text-cyan-700 border-cyan-300">
                  <Snowflake className="w-3 h-3 mr-1" />
                  GELADEIRA
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 font-medium">{romaneio.cliente_nome}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {romaneio.periodo_entrega}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Endereço */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#457bba] mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-slate-900">
                {romaneio.endereco.rua}, {romaneio.endereco.numero}
              </p>
              <p className="text-slate-600">{romaneio.endereco.bairro} - {romaneio.cidade_regiao}</p>
              {romaneio.endereco.complemento && (
                <p className="text-slate-500">{romaneio.endereco.complemento}</p>
              )}
              {romaneio.endereco.ponto_referencia && (
                <p className="text-slate-500 italic">Ref: {romaneio.endereco.ponto_referencia}</p>
              )}
              {romaneio.endereco.aos_cuidados_de && (
                <p className="text-slate-600 font-medium">A/C: {romaneio.endereco.aos_cuidados_de}</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => abrirNavegacao(romaneio)}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Abrir no Mapa
          </Button>
        </div>

        {/* Informações de Pagamento */}
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="w-4 h-4 text-slate-500" />
          <span className="font-medium">{romaneio.forma_pagamento}</span>
          {romaneio.valor_troco && (
            <span className="text-green-600 font-bold">
              Troco: R$ {romaneio.valor_troco.toFixed(2)}
            </span>
          )}
        </div>

        {/* Telefone */}
        <a
          href={`tel:${romaneio.endereco.observacoes || ''}`}
          className="flex items-center gap-2 text-sm text-[#457bba] hover:underline"
        >
          <Phone className="w-4 h-4" />
          Ligar para o cliente
        </a>

        {/* Observações */}
        {romaneio.observacoes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-yellow-800 mb-1">OBSERVAÇÕES:</p>
            <p className="text-sm text-yellow-900">{romaneio.observacoes}</p>
          </div>
        )}

        {romaneio.endereco.observacoes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-800 mb-1">OBS. DO ENDEREÇO:</p>
            <p className="text-sm text-blue-900">{romaneio.endereco.observacoes}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          {romaneio.status === 'Aguardando' && (
            <Button
              className="flex-1 bg-[#457bba] hover:bg-[#3a6ba0]"
              onClick={() => handleIniciarEntrega(romaneio)}
            >
              Iniciar Entrega
            </Button>
          )}
          {romaneio.status === 'Saiu para Entrega' && (
            <>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setSelectedRomaneio(romaneio);
                  setShowConcluirDialog(true);
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Concluir
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => {
                  setSelectedRomaneio(romaneio);
                  setShowProblemaDialog(true);
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Problema
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Minhas Entregas
          </h1>
          <p className="text-slate-600">
            {romaneios.length} entrega{romaneios.length !== 1 ? 's' : ''} pendente{romaneios.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Em Andamento */}
        {entregas.emAndamento.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              🚚 Em Andamento ({entregas.emAndamento.length})
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {entregas.emAndamento.map(romaneio => (
                <EntregaCard key={romaneio.id} romaneio={romaneio} />
              ))}
            </div>
          </div>
        )}

        {/* Aguardando */}
        {entregas.aguardando.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              📦 Aguardando Início ({entregas.aguardando.length})
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {entregas.aguardando.map(romaneio => (
                <EntregaCard key={romaneio.id} romaneio={romaneio} />
              ))}
            </div>
          </div>
        )}

        {romaneios.length === 0 && !isLoading && (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Nenhuma entrega pendente</p>
              <p className="text-sm text-slate-400 mt-1">
                Você está livre no momento
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog Concluir */}
        <Dialog open={showConcluirDialog} onOpenChange={setShowConcluirDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Entrega</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Confirma que a entrega foi realizada com sucesso?</p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowConcluirDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleConcluir}
                  disabled={updateStatusMutation.isPending}
                >
                  Confirmar Entrega
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Problema */}
        <Dialog open={showProblemaDialog} onOpenChange={setShowProblemaDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reportar Problema</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Descreva o motivo da não entrega *
                </label>
                <Textarea
                  value={motivoProblema}
                  onChange={(e) => setMotivoProblema(e.target.value)}
                  placeholder="Ex: Cliente ausente, endereço não localizado..."
                  rows={4}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowProblemaDialog(false);
                    setMotivoProblema("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleProblema}
                  disabled={updateStatusMutation.isPending}
                >
                  Confirmar Problema
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}