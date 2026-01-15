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
  ChevronLeft,
  Edit,
  Trash2,
  FileText,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Package,
  Printer,
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
      numero_requisicao: entrega.numero_requisicao || '',
      codigo_rastreio: entrega.codigo_rastreio || '',
      valor: entrega.valor,
      forma_pagamento: entrega.forma_pagamento,
      observacoes: entrega.observacoes || '',
      data_saida: entrega.data_saida,
      status: entrega.status,
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editData.cliente || !editData.numero_requisicao) {
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
            <Button onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Definir cores por tipo
  const tipoColors = {
    SEDEX: { bg: '#F5E8F5', text: '#890d5d' },
    PAC: { bg: '#FEF3E8', text: '#f97316' },
    DISKTENHA: { bg: '#E8F5E8', text: '#22c55e' },
  };

  const tipoColor = tipoColors[entrega.tipo] || tipoColors.SEDEX;
  const isPago = entrega.forma_pagamento === 'Pago' || entrega.forma_pagamento === 'Pix';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header com gradiente */}
      <div className="py-8 shadow-sm mb-6" style={{
        background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
      }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white">Detalhes da Entrega</h1>
              <p className="text-base text-white opacity-90 mt-1">Visualização completa da entrega</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-6 space-y-6">
        {/* Cabeçalho com informações e botões */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {entrega.tipo} #{entrega.numero_requisicao || entrega.codigo_rastreio}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Criado em {format(parseISO(entrega.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{ backgroundColor: '#376295', color: 'white' }}
              >
                <Edit size={16} />
                Editar
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{ backgroundColor: '#890d5d', color: 'white' }}
              >
                <Printer size={16} />
                Imprimir
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                <Trash2 size={16} />
                Excluir
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5" style={{ color: '#376295' }} />
              <h2 className="text-lg font-semibold">Informações da Entrega</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Número da Requisição */}
              <div>
                <p className="text-sm text-slate-500 mb-1">Número da Requisição</p>
                <p className="text-xl font-bold" style={{ color: '#376295' }}>#{entrega.numero_requisicao || '-'}</p>
              </div>

              {/* Tipo */}
              <div>
                <p className="text-sm text-slate-500 mb-1">Tipo</p>
                <span
                  className="inline-block px-3 py-1 rounded-md font-medium text-sm"
                  style={{ background: tipoColor.bg, color: tipoColor.text }}
                >
                  {entrega.tipo}
                </span>
              </div>

              {/* Status */}
              <div>
                <p className="text-sm text-slate-500 mb-1">Status</p>
                <span
                  className="inline-block px-3 py-1 rounded-md font-medium text-sm"
                  style={{
                    backgroundColor:
                      entrega.status === 'Entregue' ? '#E8F5E8' :
                      entrega.status === 'Saiu' ? '#FEF3E8' : '#F5E8F5',
                    color:
                      entrega.status === 'Entregue' ? '#22c55e' :
                      entrega.status === 'Saiu' ? '#f97316' : '#890d5d'
                  }}
                >
                  {entrega.status}
                </span>
              </div>

              {/* Data de Postagem */}
              <div>
                <p className="text-sm text-slate-500 mb-1">Data de Postagem</p>
                <p className="font-semibold text-slate-900">
                  {format(parseISO(entrega.data_saida), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Cliente */}
                <div>
                  <p className="text-sm text-slate-500 mb-1">Cliente</p>
                  <p className="text-lg font-medium text-slate-900">{entrega.cliente}</p>
                </div>

                {/* Destinatário */}
                {entrega.remetente && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Destinatário</p>
                    <p className="text-lg font-medium text-slate-900">{entrega.remetente}</p>
                  </div>
                )}

                {/* Código de Rastreio */}
                {entrega.codigo_rastreio && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Código de Rastreio</p>
                    <p className="text-lg font-medium text-slate-900">{entrega.codigo_rastreio}</p>
                  </div>
                )}

                {/* Atendente */}
                {entrega.atendente && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Atendente</p>
                    <p className="text-lg font-medium text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: '#376295' }} />
                      {entrega.atendente}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Valor - Apenas para DISKTENHA */}
            {entrega.tipo === 'DISKTENHA' && (
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5" style={{ color: '#22c55e' }} />
                  <div>
                    <p className="text-sm text-slate-500 mb-1">A Pagar</p>
                    <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                      R$ {parseFloat(entrega.valor || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            {entrega.observacoes && (
              <div className="border-t pt-6 mt-6">
                <p className="text-sm text-slate-500 mb-2">Observações</p>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-700">{entrega.observacoes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
                    className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
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
                    className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
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
                  <Label>Destinatário</Label>
                  <Input
                    value={editData.remetente}
                    onChange={(e) => setEditData({ ...editData, remetente: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número da Requisição *</Label>
                  <Input
                    placeholder="Ex: 123456"
                    value={editData.numero_requisicao}
                    onChange={(e) => setEditData({ ...editData, numero_requisicao: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Código de Rastreio</Label>
                  <Input
                    placeholder="Ex: BR123456789BR"
                    value={editData.codigo_rastreio}
                    onChange={(e) => setEditData({ ...editData, codigo_rastreio: e.target.value })}
                  />
                </div>
              </div>

              <div className={editData.tipo === 'DISKTENHA' ? "grid grid-cols-2 gap-4" : ""}>
                {editData.tipo === 'DISKTENHA' && (
                  <div>
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.valor}
                      onChange={(e) => setEditData({ ...editData, valor: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <Label>Status do Pagamento</Label>
                  <select
                    className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={editData.forma_pagamento}
                    onChange={(e) => setEditData({ ...editData, forma_pagamento: e.target.value })}
                  >
                    <option value="Aguardando">Aguardando</option>
                    <option value="Pago">Pago</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Data de Saída</Label>
                <Input
                  type="date"
                  value={editData.data_saida}
                  onChange={(e) => setEditData({ ...editData, data_saida: e.target.value })}
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
