import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Package,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function DetalheSedexDisktenha() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const entregaId = urlParams.get('id');

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState(null);

  // Buscar entrega
  const { data: entrega, isLoading, error } = useQuery({
    queryKey: ['sedex-detalhe', entregaId],
    queryFn: async () => {
      if (!entregaId) {
        throw new Error("ID da entrega não fornecido");
      }

      const { data, error } = await supabase
        .from('sedex_disktenha')
        .select('*')
        .eq('id', entregaId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!entregaId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('sedex_disktenha')
        .update(data)
        .eq('id', entregaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sedex-detalhe', entregaId] });
      queryClient.invalidateQueries({ queryKey: ['sedex-disktenha'] });
      toast.success('Entrega atualizada com sucesso!');
      setShowEditDialog(false);
    },
    onError: (error) => {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar entrega');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('sedex_disktenha')
        .delete()
        .eq('id', entregaId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Entrega excluída com sucesso!');
      navigate('/sedex');
    },
    onError: (error) => {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir entrega');
    }
  });

  const handleEdit = () => {
    setEditData({
      tipo: entrega.tipo,
      cliente: entrega.cliente,
      remetente: entrega.remetente || '',
      codigo_rastreio: entrega.codigo_rastreio,
      valor: entrega.valor,
      forma_pagamento: entrega.forma_pagamento,
      observacoes: entrega.observacoes || '',
      data_saida: entrega.data_saida,
      status: entrega.status,
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editData.cliente || !editData.codigo_rastreio) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    updateMutation.mutate({
      ...editData,
      valor: parseFloat(editData.valor) || 0,
    });
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir esta entrega?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !entrega) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Entrega Não Encontrada</h2>
            <p className="text-slate-500 mb-4">{error?.message || "A entrega não foi encontrada."}</p>
            <Button onClick={() => navigate('/sedex')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Definir cores por tipo
  const tipoColors = {
    SEDEX: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
    PAC: { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
    DISKTENHA: { bg: '#faf5ff', text: '#9333ea', border: '#d8b4fe' },
  };

  const tipoColor = tipoColors[entrega.tipo] || tipoColors.SEDEX;
  const isPago = entrega.forma_pagamento === 'Pago' || entrega.forma_pagamento === 'Pix';

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/sedex')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">
                {entrega.tipo} # {entrega.codigo_rastreio}
              </h1>
              <p className="text-slate-600">
                Criado em {format(parseISO(entrega.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <span
              className="px-4 py-2 rounded-md font-medium text-sm"
              style={{ background: tipoColor.bg, color: tipoColor.text }}
            >
              {entrega.tipo}
            </span>
            <span
              className={`px-4 py-2 rounded-md font-medium text-sm ${
                isPago ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}
            >
              {entrega.forma_pagamento}
            </span>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações da Entrega */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Informações da Entrega</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Número de Registro</p>
                    <p className="text-xl font-bold text-slate-900"># {entrega.codigo_rastreio}</p>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-slate-500 mb-1">Cliente</p>
                    <p className="text-lg font-medium text-slate-900">{entrega.cliente}</p>
                  </div>

                  {entrega.remetente && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Destinatário</p>
                      <p className="text-lg font-medium text-slate-900">{entrega.remetente}</p>
                    </div>
                  )}

                  {entrega.observacoes && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-slate-500 mb-2">Observações</p>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-slate-700">{entrega.observacoes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhes */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-6">Detalhes</h3>

                <div className="space-y-6">
                  {/* Tipo */}
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Tipo</p>
                      <span
                        className="inline-block px-3 py-1 rounded-md font-medium text-sm"
                        style={{ background: tipoColor.bg, color: tipoColor.text }}
                      >
                        {entrega.tipo}
                      </span>
                    </div>
                  </div>

                  {/* Pagamento */}
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-slate-400 mt-1" />
                    <div className="w-full">
                      <p className="text-sm text-slate-500 mb-1">também</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-md font-medium text-sm mb-2 ${
                          isPago ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {entrega.forma_pagamento}
                      </span>
                      <p className="text-2xl font-bold text-green-700 mt-2">
                        R$ {parseFloat(entrega.valor).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Data de Postagem */}
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Data de Postagem</p>
                      <p className="font-semibold text-slate-900">
                        {format(parseISO(entrega.data_saida), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-md font-medium text-sm ${
                        entrega.status === 'Entregue' ? 'bg-green-100 text-green-700' :
                        entrega.status === 'Saiu' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {entrega.status}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Entrega</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo *</Label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={editData.tipo}
                    onChange={(e) => setEditData({ ...editData, tipo: e.target.value })}
                  >
                    <option value="SEDEX">SEDEX</option>
                    <option value="PAC">PAC</option>
                    <option value="DISKTENHA">DISKTENHA</option>
                  </select>
                </div>
                <div>
                  <Label>Status *</Label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Saiu">Saiu</option>
                    <option value="Entregue">Entregue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente *</Label>
                  <Input
                    value={editData.cliente}
                    onChange={(e) => setEditData({ ...editData, cliente: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Remetente</Label>
                  <Input
                    value={editData.remetente}
                    onChange={(e) => setEditData({ ...editData, remetente: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Código de Rastreio *</Label>
                <Input
                  value={editData.codigo_rastreio}
                  onChange={(e) => setEditData({ ...editData, codigo_rastreio: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.valor}
                    onChange={(e) => setEditData({ ...editData, valor: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Forma de Pagamento</Label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={editData.forma_pagamento}
                    onChange={(e) => setEditData({ ...editData, forma_pagamento: e.target.value })}
                  >
                    <option value="Pago">Pago</option>
                    <option value="A Pagar">A Pagar</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Pix">Pix</option>
                    <option value="Cartão">Cartão</option>
                  </select>
                </div>
                <div>
                  <Label>Data de Saída</Label>
                  <Input
                    type="date"
                    value={editData.data_saida}
                    onChange={(e) => setEditData({ ...editData, data_saida: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={editData.observacoes}
                  onChange={(e) => setEditData({ ...editData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                  style={{ background: '#457bba' }}
                  className="text-white"
                >
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
