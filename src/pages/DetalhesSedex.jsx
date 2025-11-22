import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Send,
  Package,
  MapPin,
  DollarSign,
  User,
  Calendar,
  FileText,
  Edit,
  Save,
  X,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function DetalhesSedex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const entregaId = urlParams.get('id');

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  const { data: entrega, isLoading, error } = useQuery({
    queryKey: ['entrega-sedex', entregaId],
    queryFn: async () => {
      if (!entregaId) return null;
      const all = await base44.entities.EntregaSedex.list();
      return all.find(e => e.id === entregaId) || null;
    },
    enabled: !!entregaId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.EntregaSedex.update(entregaId, {
      ...data,
      valor_entrega: data.valor_entrega ? parseFloat(data.valor_entrega) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entrega-sedex', entregaId] });
      queryClient.invalidateQueries({ queryKey: ['entregas-sedex'] });
      toast.success('Entrega atualizada!');
      setIsEditing(false);
      setEditData(null);
    },
    onError: () => {
      toast.error('Erro ao atualizar entrega');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.EntregaSedex.delete(entregaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-sedex'] });
      toast.success('Entrega excluída!');
      navigate(createPageUrl("Sedex"));
    },
    onError: () => {
      toast.error('Erro ao excluir entrega');
    }
  });

  const handleEditStart = () => {
    setEditData({
      numero_registro: entrega.numero_registro,
      cliente_nome: entrega.cliente_nome,
      tipo_entrega: entrega.tipo_entrega,
      status_pagamento: entrega.status_pagamento,
      valor_entrega: entrega.valor_entrega || "",
      data_postagem: entrega.data_postagem,
      codigo_rastreio: entrega.codigo_rastreio || "",
      observacoes: entrega.observacoes || "",
      destinatario: entrega.destinatario || "",
      cidade_destino: entrega.cidade_destino || "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editData.numero_registro || !editData.cliente_nome || !editData.tipo_entrega) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    if (editData.tipo_entrega === "Disktenha" && (!editData.valor_entrega || parseFloat(editData.valor_entrega) <= 0)) {
      toast.error('Informe o valor da entrega para Disktenha');
      return;
    }
    updateMutation.mutate(editData);
  };

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

  if (error || !entrega) {
    return (
      <div className="p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Entrega Não Encontrada</h2>
            <Button onClick={() => navigate(createPageUrl("Sedex"))}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const TipoBadge = ({ tipo }) => {
    const config = {
      "Sedex": { color: "bg-red-100 text-red-700 border-red-300", icon: Send },
      "PAC": { color: "bg-blue-100 text-blue-700 border-blue-300", icon: Package },
      "Disktenha": { color: "bg-purple-100 text-purple-700 border-purple-300", icon: Send },
    };
    const { color, icon: Icon } = config[tipo] || config["Sedex"];
    return (
      <Badge className={`${color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {tipo}
      </Badge>
    );
  };

  const StatusPagamentoBadge = ({ status }) => {
    const color = status === "Pago" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";
    return <Badge className={color}>{status}</Badge>;
  };

  const currentData = isEditing ? editData : entrega;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">
              {entrega.tipo_entrega} #{entrega.numero_registro}
            </h1>
            <p className="text-slate-600 mt-1">
              Criado em {format(new Date(entrega.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          {!isEditing && (
            <>
              <TipoBadge tipo={entrega.tipo_entrega} />
              <StatusPagamentoBadge status={entrega.status_pagamento} />
            </>
          )}
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={handleEditStart}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir esta entrega?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setIsEditing(false); setEditData(null); }}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#457bba]" />
                  Informações da Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label>Número de Registro *</Label>
                      <Input
                        value={editData.numero_registro}
                        onChange={(e) => setEditData({ ...editData, numero_registro: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Cliente *</Label>
                      <Input
                        value={editData.cliente_nome}
                        onChange={(e) => setEditData({ ...editData, cliente_nome: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Destinatário</Label>
                      <Input
                        value={editData.destinatario}
                        onChange={(e) => setEditData({ ...editData, destinatario: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Cidade de Destino</Label>
                      <Input
                        value={editData.cidade_destino}
                        onChange={(e) => setEditData({ ...editData, cidade_destino: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Tipo de Entrega *</Label>
                      <Select
                        value={editData.tipo_entrega}
                        onValueChange={(value) => setEditData({ ...editData, tipo_entrega: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sedex">Sedex</SelectItem>
                          <SelectItem value="PAC">PAC</SelectItem>
                          <SelectItem value="Disktenha">Disktenha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status de Pagamento *</Label>
                      <Select
                        value={editData.status_pagamento}
                        onValueChange={(value) => setEditData({ ...editData, status_pagamento: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pago">Pago</SelectItem>
                          <SelectItem value="Aguardando">Aguardando</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editData.tipo_entrega === "Disktenha" && (
                      <div>
                        <Label>Valor (R$) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editData.valor_entrega}
                          onChange={(e) => setEditData({ ...editData, valor_entrega: e.target.value })}
                        />
                      </div>
                    )}
                    <div>
                      <Label>Data de Postagem *</Label>
                      <Input
                        type="date"
                        value={editData.data_postagem}
                        onChange={(e) => setEditData({ ...editData, data_postagem: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Código de Rastreio</Label>
                      <Input
                        value={editData.codigo_rastreio}
                        onChange={(e) => setEditData({ ...editData, codigo_rastreio: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Observações</Label>
                      <Textarea
                        value={editData.observacoes}
                        onChange={(e) => setEditData({ ...editData, observacoes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-slate-500">Número de Registro</p>
                      <p className="text-lg font-bold text-slate-900">#{entrega.numero_registro}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Cliente</p>
                      <p className="text-lg font-semibold text-slate-900">{entrega.cliente_nome}</p>
                    </div>
                    {entrega.destinatario && (
                      <div>
                        <p className="text-sm text-slate-500">Destinatário</p>
                        <p className="text-slate-700">{entrega.destinatario}</p>
                      </div>
                    )}
                    {entrega.cidade_destino && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <MapPin className="w-4 h-4" />
                        {entrega.cidade_destino}
                      </div>
                    )}
                    {entrega.codigo_rastreio && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Código de Rastreio</p>
                        <p className="font-mono font-bold text-slate-900">{entrega.codigo_rastreio}</p>
                      </div>
                    )}
                    {entrega.observacoes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-900">{entrega.observacoes}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isEditing && (
                  <>
                    <div className="flex items-start gap-3">
                      <Send className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Tipo</p>
                        <TipoBadge tipo={entrega.tipo_entrega} />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Pagamento</p>
                        <StatusPagamentoBadge status={entrega.status_pagamento} />
                        {entrega.valor_entrega && (
                          <p className="text-lg font-bold text-green-600 mt-1">
                            R$ {entrega.valor_entrega.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Data de Postagem</p>
                        <p className="font-semibold text-slate-900">
                          {entrega.data_postagem && format(parseISO(entrega.data_postagem), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Atendente</p>
                        <p className="font-semibold text-slate-900">{entrega.atendente_nome}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}