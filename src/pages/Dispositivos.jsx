import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Smartphone,
  Monitor,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
  Users,
  User,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Dispositivos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');

  // Buscar dispositivos com dados do usuário vinculado
  const { data: dispositivos = [], isLoading } = useQuery({
    queryKey: ['dispositivos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispositivos')
        .select('*, usuarios(id, usuario, tipo_usuario)')
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
      dispositivo.usuarios?.nome?.toLowerCase().includes(buscaLower) ||
      dispositivo.usuarios?.usuario?.toLowerCase().includes(buscaLower) ||
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

  // Mutation para renomear
  const renomearMutation = useMutation({
    mutationFn: async ({ id, nome }) => {
      const { error } = await supabase
        .from('dispositivos')
        .update({ nome })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      toast.success('Dispositivo renomeado!');
    },
    onError: () => {
      toast.error('Erro ao renomear dispositivo');
    }
  });

  const handleRenomear = (id, nome) => {
    renomearMutation.mutate({ id, nome });
  };

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
      <div className="py-8 shadow-sm" style={{
        background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white">Gerenciar Dispositivos</h1>
              <p className="text-base text-white opacity-90 mt-1">Autorizar ou bloquear dispositivos de acesso</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Cards de Estatísticas - Responsivo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-6">
          {/* Card Gerenciar Usuários */}
          <div
            onClick={() => navigate(createPageUrl("Usuarios"))}
            className="rounded-xl shadow-sm p-3 sm:p-5 cursor-pointer transition-all hover:shadow-md hover:scale-105"
            style={{ backgroundColor: '#890d5d' }}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <div className="p-1 sm:p-1.5 rounded-lg bg-white/20">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white">Usuários</span>
            </div>
            <div className="text-center">
              <span className="text-white font-semibold text-xs sm:text-sm">Gerenciar</span>
            </div>
          </div>
          <div
            onClick={() => setFiltroStatus('todos')}
            className="bg-white rounded-xl shadow-sm p-3 sm:p-5 cursor-pointer transition-all hover:shadow-md"
            style={{
              border: filtroStatus === 'todos' ? '2px solid #376295' : '2px solid transparent'
            }}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <div className="p-1 sm:p-1.5 rounded-lg" style={{ backgroundColor: '#E8F0F8' }}>
                <Monitor className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#376295' }} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-700">Total</span>
            </div>
            <div className="text-2xl sm:text-4xl font-bold text-center" style={{ color: '#376295' }}>{stats.total}</div>
          </div>

          <div
            onClick={() => setFiltroStatus('autorizados')}
            className="bg-white rounded-xl shadow-sm p-3 sm:p-5 cursor-pointer transition-all hover:shadow-md"
            style={{
              border: filtroStatus === 'autorizados' ? '2px solid #3dac38' : '2px solid transparent'
            }}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <div className="p-1 sm:p-1.5 rounded-lg" style={{ backgroundColor: '#E8F5E8' }}>
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#3dac38' }} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-700">Autorizados</span>
            </div>
            <div className="text-2xl sm:text-4xl font-bold text-center" style={{ color: '#3dac38' }}>{stats.autorizados}</div>
          </div>

          <div
            onClick={() => setFiltroStatus('pendentes')}
            className="bg-white rounded-xl shadow-sm p-3 sm:p-5 cursor-pointer transition-all hover:shadow-md"
            style={{
              border: filtroStatus === 'pendentes' ? '2px solid #f97316' : '2px solid transparent'
            }}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <div className="p-1 sm:p-1.5 rounded-lg" style={{ backgroundColor: '#FEF3E8' }}>
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#f97316' }} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-700">Pendentes</span>
            </div>
            <div className="text-2xl sm:text-4xl font-bold text-center" style={{ color: '#f97316' }}>{stats.pendentes}</div>
          </div>

          <div
            onClick={() => setFiltroStatus('bloqueados')}
            className="bg-white rounded-xl shadow-sm p-3 sm:p-5 cursor-pointer transition-all hover:shadow-md col-span-2 sm:col-span-1"
            style={{
              border: filtroStatus === 'bloqueados' ? '2px solid #ef4444' : '2px solid transparent'
            }}
          >
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <div className="p-1 sm:p-1.5 rounded-lg" style={{ backgroundColor: '#fef2f2' }}>
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#ef4444' }} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-700">Bloqueados</span>
            </div>
            <div className="text-2xl sm:text-4xl font-bold text-center" style={{ color: '#ef4444' }}>{stats.bloqueados}</div>
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
              placeholder="Buscar por nome do usuário, dispositivo ou impressão digital..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{
                '--tw-ring-color': '#376295'
              }}
              onFocus={(e) => e.target.style.borderColor = '#376295'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
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
                  onRenomear={handleRenomear}
                  isUpdating={
                    autorizarMutation.isPending ||
                    bloquearMutation.isPending ||
                    deletarMutation.isPending ||
                    renomearMutation.isPending
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
function DispositivoCard({ dispositivo, onAutorizar, onBloquear, onDeletar, onRenomear, isUpdating }) {
  const [editando, setEditando] = useState(false);
  const [novoNome, setNovoNome] = useState(dispositivo.nome || '');

  const handleSalvarNome = () => {
    const nomeTrimmed = novoNome.trim();
    if (!nomeTrimmed) {
      toast.error('O nome não pode ficar vazio');
      return;
    }
    if (nomeTrimmed !== dispositivo.nome) {
      onRenomear(dispositivo.id, nomeTrimmed);
    }
    setEditando(false);
  };

  const handleCancelar = () => {
    setNovoNome(dispositivo.nome || '');
    setEditando(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSalvarNome();
    if (e.key === 'Escape') handleCancelar();
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Autorizado':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#E8F5E8', color: '#3dac38' }}>
            <CheckCircle className="w-3 h-3" />
            Autorizado
          </span>
        );
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#FEF3E8', color: '#f97316' }}>
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'Bloqueado':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
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

  const getTipoBadge = (tipo) => {
    if (!tipo) return null;
    const config = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin' },
      atendente: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Atendente' },
      motoboy: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Motoboy' },
    };
    const c = config[tipo] || { bg: 'bg-slate-100', text: 'text-slate-700', label: tipo };
    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.bg} ${c.text}`}>{c.label}</span>;
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

  const usuario = dispositivo.usuarios;

  return (
    <div className="p-4 sm:p-6 hover:bg-slate-50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="mt-1 flex-shrink-0">{getDeviceIcon(dispositivo.nome)}</div>

          <div className="flex-1 min-w-0">
            {/* Nome e Status */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              {editando ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="font-bold text-slate-900 border border-slate-300 rounded-lg px-2 sm:px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#376295] focus:border-[#376295] flex-1 min-w-0"
                  />
                  <button
                    onClick={handleSalvarNome}
                    className="p-1.5 text-white rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
                    style={{ backgroundColor: '#3dac38' }}
                    title="Salvar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelar}
                    className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors flex-shrink-0"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base break-words">{dispositivo.nome || 'Dispositivo Desconhecido'}</h3>
                  <button
                    onClick={() => setEditando(true)}
                    className="p-1 text-slate-400 hover:text-[#376295] hover:bg-slate-100 rounded transition-colors flex-shrink-0"
                    title="Renomear dispositivo"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {getStatusBadge(dispositivo.status)}
            </div>

            {/* Informações do dispositivo */}
            <div className="space-y-1 text-xs sm:text-sm">
              {usuario && (
                <div className="text-slate-600 flex flex-wrap items-center gap-1 sm:gap-2">
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span className="font-medium">Usuário:</span>
                  <span className="text-slate-900">{usuario.usuario}</span>
                  {getTipoBadge(usuario.tipo_usuario)}
                </div>
              )}
              <div className="text-slate-600">
                <span className="font-medium">ID:</span>{' '}
                <span className="font-mono text-xs text-slate-700 break-all">
                  {dispositivo.impressao_digital?.slice(0, 20) || '-'}...
                </span>
              </div>
              <div className="text-slate-600">
                <span className="font-medium">Último acesso:</span>{' '}
                <span className="text-slate-900">{formatDate(dispositivo.ultimo_acesso)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação - Responsivo */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:ml-4">
          {dispositivo.status === 'Pendente' && (
            <>
              <button
                onClick={() => onAutorizar(dispositivo.id)}
                disabled={isUpdating}
                className="flex items-center gap-1.5 sm:gap-2 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#3dac38' }}
              >
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Autorizar</span>
              </button>
              <button
                onClick={() => onBloquear(dispositivo.id)}
                disabled={isUpdating}
                className="flex items-center gap-1.5 sm:gap-2 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#ef4444' }}
              >
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Bloquear</span>
              </button>
            </>
          )}

          {dispositivo.status === 'Autorizado' && (
            <button
              onClick={() => onBloquear(dispositivo.id)}
              disabled={isUpdating}
              className="flex items-center gap-1.5 sm:gap-2 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#ef4444' }}
            >
              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Bloquear</span>
            </button>
          )}

          {dispositivo.status === 'Bloqueado' && (
            <button
              onClick={() => onAutorizar(dispositivo.id)}
              disabled={isUpdating}
              className="flex items-center gap-1.5 sm:gap-2 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#3dac38' }}
            >
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Autorizar</span>
            </button>
          )}

          <button
            onClick={() => onDeletar(dispositivo.id)}
            disabled={isUpdating}
            className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
