import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Smartphone,
  Monitor,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Clock
} from 'lucide-react';

export default function Dispositivos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');

  // Buscar dispositivos
  const { data: dispositivos = [], isLoading } = useQuery({
    queryKey: ['dispositivos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispositivos')
        .select('*')
        .order('ultimo_acesso', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Filtrar dispositivos
  const dispositivosFiltrados = dispositivos.filter(dispositivo => {
    // Filtro por status
    const passaFiltroStatus =
      filtroStatus === 'todos' ||
      (filtroStatus === 'autorizados' && dispositivo.status === 'Autorizado') ||
      (filtroStatus === 'pendentes' && dispositivo.status === 'Pendente') ||
      (filtroStatus === 'bloqueados' && dispositivo.status === 'Bloqueado');

    if (!passaFiltroStatus) return false;

    // Filtro por busca
    if (busca.trim() === '') return true;

    const buscaLower = busca.toLowerCase();
    return (
      dispositivo.nome?.toLowerCase().includes(buscaLower) ||
      dispositivo.usuario?.toLowerCase().includes(buscaLower) ||
      dispositivo.impressao_digital?.toLowerCase().includes(buscaLower)
    );
  });

  // Calcular estatísticas
  const stats = {
    total: dispositivos.length,
    autorizados: dispositivos.filter(d => d.status === 'Autorizado').length,
    pendentes: dispositivos.filter(d => d.status === 'Pendente').length,
    bloqueados: dispositivos.filter(d => d.status === 'Bloqueado').length,
  };

  // Mutation para autorizar
  const autorizarMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('dispositivos')
        .update({ status: 'Autorizado' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      toast.success('Dispositivo autorizado!');
    },
    onError: () => {
      toast.error('Erro ao autorizar dispositivo');
    }
  });

  // Mutation para bloquear
  const bloquearMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('dispositivos')
        .update({ status: 'Bloqueado' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      toast.success('Dispositivo bloqueado!');
    },
    onError: () => {
      toast.error('Erro ao bloquear dispositivo');
    }
  });

  // Mutation para deletar
  const deletarMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('dispositivos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      toast.success('Dispositivo removido!');
    },
    onError: () => {
      toast.error('Erro ao remover dispositivo');
    }
  });

  const handleAutorizar = (id) => {
    autorizarMutation.mutate(id);
  };

  const handleBloquear = (id) => {
    bloquearMutation.mutate(id);
  };

  const handleDeletar = (id) => {
    if (window.confirm('Tem certeza que deseja remover este dispositivo?')) {
      deletarMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Gerenciar Dispositivos</h1>
              <p className="text-sm text-slate-600">Autorizar ou bloquear dispositivos de acesso</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            onClick={() => setFiltroStatus('todos')}
            className={`bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500 cursor-pointer transition-all hover:shadow-md ${
              filtroStatus === 'todos' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="text-sm text-slate-600 mb-1">Total</div>
            <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
          </div>

          <div
            onClick={() => setFiltroStatus('autorizados')}
            className={`bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500 cursor-pointer transition-all hover:shadow-md ${
              filtroStatus === 'autorizados' ? 'ring-2 ring-green-500' : ''
            }`}
          >
            <div className="text-sm text-slate-600 mb-1">Autorizados</div>
            <div className="text-3xl font-bold text-green-600">{stats.autorizados}</div>
          </div>

          <div
            onClick={() => setFiltroStatus('pendentes')}
            className={`bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500 cursor-pointer transition-all hover:shadow-md ${
              filtroStatus === 'pendentes' ? 'ring-2 ring-yellow-500' : ''
            }`}
          >
            <div className="text-sm text-slate-600 mb-1">Pendentes</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendentes}</div>
          </div>

          <div
            onClick={() => setFiltroStatus('bloqueados')}
            className={`bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500 cursor-pointer transition-all hover:shadow-md ${
              filtroStatus === 'bloqueados' ? 'ring-2 ring-red-500' : ''
            }`}
          >
            <div className="text-sm text-slate-600 mb-1">Bloqueados</div>
            <div className="text-3xl font-bold text-red-600">{stats.bloqueados}</div>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por e-mail, dispositivo ou impressão digital..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lista de Dispositivos */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-bold text-slate-900">Dispositivos Registrados</h2>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500">
                Carregando dispositivos...
              </div>
            ) : dispositivosFiltrados.length === 0 ? (
              <div className="p-12 text-center">
                <Monitor className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <div className="text-slate-600 font-medium">Nenhum dispositivo encontrado</div>
                <div className="text-sm text-slate-500 mt-1">
                  {busca ? 'Tente ajustar sua busca' : 'Não há dispositivos cadastrados'}
                </div>
              </div>
            ) : (
              dispositivosFiltrados.map((dispositivo) => (
                <DispositivoCard
                  key={dispositivo.id}
                  dispositivo={dispositivo}
                  onAutorizar={handleAutorizar}
                  onBloquear={handleBloquear}
                  onDeletar={handleDeletar}
                  isUpdating={
                    autorizarMutation.isPending ||
                    bloquearMutation.isPending ||
                    deletarMutation.isPending
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de Card de Dispositivo
function DispositivoCard({ dispositivo, onAutorizar, onBloquear, onDeletar, isUpdating }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Autorizado':
        return (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Autorizado
          </span>
        );
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'Bloqueado':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
            <XCircle className="w-3 h-3" />
            Bloqueado
          </span>
        );
      default:
        return null;
    }
  };

  const getDeviceIcon = (nome) => {
    if (nome?.toLowerCase().includes('safari') || nome?.toLowerCase().includes('mac')) {
      return <Monitor className="w-5 h-5 text-slate-600" />;
    }
    return <Smartphone className="w-5 h-5 text-slate-600" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="mt-1">{getDeviceIcon(dispositivo.nome)}</div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-slate-900">{dispositivo.nome || 'Dispositivo Desconhecido'}</h3>
              {getStatusBadge(dispositivo.status)}
            </div>

            <div className="space-y-1 text-sm">
              <div className="text-slate-600">
                <span className="font-medium">Usuário:</span>{' '}
                <span className="text-slate-900">{dispositivo.usuario || '-'}</span>
              </div>
              <div className="text-slate-600">
                <span className="font-medium">Impressão digital:</span>{' '}
                <span className="font-mono text-xs text-slate-700">
                  {dispositivo.impressao_digital || '-'}
                </span>
              </div>
              <div className="text-slate-600">
                <span className="font-medium">Último acesso:</span>{' '}
                <span className="text-slate-900">{formatDate(dispositivo.ultimo_acesso)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 ml-4">
          {dispositivo.status === 'Pendente' && (
            <button
              onClick={() => onAutorizar(dispositivo.id)}
              disabled={isUpdating}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Autorizar
            </button>
          )}

          {dispositivo.status === 'Autorizado' && (
            <button
              onClick={() => onBloquear(dispositivo.id)}
              disabled={isUpdating}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Bloquear
            </button>
          )}

          {dispositivo.status === 'Bloqueado' && (
            <button
              onClick={() => onAutorizar(dispositivo.id)}
              disabled={isUpdating}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Autorizar
            </button>
          )}

          <button
            onClick={() => onDeletar(dispositivo.id)}
            disabled={isUpdating}
            className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
