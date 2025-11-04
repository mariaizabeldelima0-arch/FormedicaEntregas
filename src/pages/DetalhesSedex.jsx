
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
import { ArrowLeft, Send, Package, MapPin, DollarSign, Edit, Save, X, Trash2, AlertCircle } from "lucide-react";
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
      if (!entregaId) {
        console.error("No entregaId provided");
        return null;
      }
      console.log("Fetching entrega with ID:", entregaId);
      try {
        const allEntregas = await base44.entities.EntregaSedex.list();
        console.log("Total entregas:", allEntregas.length);
        const found = allEntregas.find(e => e.id === entregaId);
        
        if (!found) {
          console.error("Entrega not found with id:", entregaId);
          console.log("Available IDs:", allEntregas.map(e => e.id));
        } else {
          console.log("Found entrega:", found.numero_registro);
        }
        
        return found || null;
      } catch (err) {
        console.error("Error fetching entrega:", err);
        throw err;
      }
    },
    enabled: !!entregaId,
    retry: 2,
    retryDelay: 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.EntregaSedex.update(entregaId, {
        ...data,
        valor_entrega: data.valor_entrega ? parseFloat(data.valor_entrega) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entrega-sedex', entregaId] });
      queryClient.invalidateQueries({ queryKey: ['entregas-sedex'] });
      toast.success('Entrega atualizada com sucesso!');
      setIsEditing(false);
      setEditData(null);
    },
    onError: (error) => {
      console.error("Erro ao atualizar entrega:", error);
      toast.error('Erro ao atualizar entrega');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.EntregaSedex.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-sedex'] });
      toast.success('Entrega excluída com sucesso!');
      navigate(createPageUrl("Sedex"));
    },
    onError: (error) => {
      console.error("Erro ao excluir entrega:", error);
      toast.error('Erro ao excluir entrega');
    }
  });

  const handleEditStart = () => {
    setEditData({
      numero_registro: entrega.numero_registro,
      cliente_nome: entrega.cliente_nome,
      destinatario: entrega.destinatario || "",
      cidade_destino: entrega.cidade_destino || "",
      tipo_entrega: entrega.tipo_entrega,
      status_pagamento: entrega.status_pagamento,
      valor_entrega: entrega.valor_entrega || "",
      data_postagem: entrega.data_postagem,
      codigo_rastreio: entrega.codigo_rastreio || "",
      observacoes: entrega.observacoes || "",
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editData.numero_registro || !editData.cliente_nome || !editData.tipo_entrega) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    updateMutation.mutate(editData);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleDelete = () => {
    deleteMutation.mutate(entregaId);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Sedex"))}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Skeleton className="h-12 w-64" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Erro ao Carregar Entrega</h2>
            <p className="text-red-500 mb-4">{error.message}</p>
            <p className="text-sm text-slate-500 mb-4">ID: {entregaId}</p>
            <Button onClick={() => navigate(createPageUrl("Sedex"))}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!entrega) {
    return (
      <div className="p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <Send className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Entrega Não Encontrada</h2>
            <p className="text-slate-500 mb-4">A entrega que você está procurando não foi encontrada.</p>
            <p className="text-sm text-slate-400 mb-6">ID procurado: {entregaId}</p>
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
      <Badge className={`${color} border text-base px-3 py-1`}>
        <Icon className="w-4 h-4 mr-2" />
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
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Sedex"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">
              Entrega #{entrega.numero_registro}
            </h1>
            <p className="text-slate-600 mt-1">
              Cadastrado em {format(new Date(entrega.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          {!isEditing && <TipoBadge tipo={entrega.tipo_entrega} />}
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
                        Tem certeza que deseja excluir esta entrega? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Confirmar Exclusão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Principais */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Informações da Entrega</CardTitle>
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
                      <Label>Data de Postagem *</Label>
                      <Input
                        type="date"
                        value={editData.data_postagem}
                        onChange={(e) => setEditData({ ...editData, data_postagem: e.target.value })}
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
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-slate-500">Número de Registro</p>
                      <p className="text-lg font-bold text-slate-900">#{entrega.numero_registro}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Data de Postagem</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {format(parseISO(entrega.data_postagem), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Tipo</p>
                      <TipoBadge tipo={entrega.tipo_entrega} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Status de Pagamento</p>
                      <StatusPagamentoBadge status={entrega.status_pagamento} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Cliente e Destinatário */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Cliente e Destinatário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-slate-500">Cliente</p>
                      <p className="text-xl font-bold text-slate-900">{currentData.cliente_nome}</p>
                    </div>
                    {currentData.destinatario && (
                      <div>
                        <p className="text-sm text-slate-500">Destinatário</p>
                        <p className="text-lg font-semibold text-slate-900">{currentData.destinatario}</p>
                      </div>
                    )}
                    {currentData.cidade_destino && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#457bba]" />
                        <div>
                          <p className="text-sm text-slate-500">Cidade de Destino</p>
                          <p className="font-semibold text-slate-900">{currentData.cidade_destino}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Observações */}
            {(isEditing || entrega.observacoes) && (
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editData.observacoes}
                      onChange={(e) => setEditData({ ...editData, observacoes: e.target.value })}
                      placeholder="Observações adicionais"
                      rows={3}
                    />
                  ) : (
                    <p className="text-slate-700">{currentData.observacoes || "Nenhuma observação"}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            {/* Rastreio e Valor */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label>Código de Rastreio</Label>
                      <Input
                        value={editData.codigo_rastreio}
                        onChange={(e) => setEditData({ ...editData, codigo_rastreio: e.target.value })}
                        placeholder="Ex: BR123456789BR"
                      />
                    </div>
                    {editData.tipo_entrega === "Disktenha" && (
                      <div>
                        <Label>Valor da Entrega (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editData.valor_entrega}
                          onChange={(e) => setEditData({ ...editData, valor_entrega: e.target.value })}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {currentData.codigo_rastreio && (
                      <div>
                        <p className="text-sm text-slate-500 mb-2">Código de Rastreio</p>
                        <div className="bg-slate-100 rounded-lg p-3">
                          <p className="font-mono font-bold text-slate-900">{currentData.codigo_rastreio}</p>
                        </div>
                      </div>
                    )}
                    {currentData.valor_entrega && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-700 mb-1">Valor da Entrega</p>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-700" />
                          <p className="text-2xl font-bold text-green-900">
                            R$ {currentData.valor_entrega.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-slate-500">Atendente</p>
                      <p className="font-semibold text-slate-900">{entrega.atendente_nome}</p>
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
