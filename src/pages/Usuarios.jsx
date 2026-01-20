import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Monitor, Smartphone, UserCog, Search, UserPlus, Pencil, Trash2, CheckCircle, XCircle, Clock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Usuarios() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNovoUsuario, setShowNovoUsuario] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    usuario: '',
    senha: '',
    tipo_usuario: 'atendente',
    nome_motoboy: '',
    nome_atendente: ''
  });
  const [showEditarUsuario, setShowEditarUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  // Buscar todos os usuários (dispositivos)
  const { data: dispositivos = [], isLoading } = useQuery({
    queryKey: ['dispositivos-usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispositivos')
        .select('*')
        .order('status', { ascending: false })
        .order('usuario');

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar motoboys
  const { data: motoboys = [] } = useQuery({
    queryKey: ['motoboys-lista'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motoboys')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data || [];
    },
  });

  // Mutation para atualizar tipo
  const updateMutation = useMutation({
    mutationFn: async ({ id, tipo_usuario, nome_motoboy }) => {
      const { error } = await supabase
        .from('dispositivos')
        .update({ tipo_usuario, nome_motoboy: nome_motoboy || null })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos-usuarios'] });
      toast.success('Tipo de usuário atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar usuário');
    }
  });

  // Mutation para criar novo usuário
  const criarUsuarioMutation = useMutation({
    mutationFn: async (novoUser) => {
      const { error } = await supabase
        .from('dispositivos')
        .insert([{
          usuario: novoUser.usuario,
          nome: novoUser.nome,
          senha: novoUser.senha,
          tipo_usuario: novoUser.tipo_usuario,
          nome_motoboy: novoUser.tipo_usuario === 'motoboy' ? novoUser.nome_motoboy : null,
          nome_atendente: novoUser.tipo_usuario === 'atendente' ? novoUser.nome_atendente : null,
          status: 'Pendente',
          impressao_digital: 'user-' + Date.now(),
          ultimo_acesso: new Date().toISOString()
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos-usuarios'] });
      toast.success('Usuário criado! Aguardando autorização.');
      setShowNovoUsuario(false);
      setNovoUsuario({
        nome: '',
        usuario: '',
        senha: '',
        tipo_usuario: 'atendente',
        nome_motoboy: '',
        nome_atendente: ''
      });
    },
    onError: (error) => {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário');
    }
  });

  const handleCriarUsuario = () => {
    if (!novoUsuario.nome || !novoUsuario.usuario || !novoUsuario.senha) {
      toast.error('Preencha nome, usuário e senha');
      return;
    }
    if (novoUsuario.tipo_usuario === 'motoboy' && !novoUsuario.nome_motoboy) {
      toast.error('Selecione o motoboy');
      return;
    }
    if (novoUsuario.tipo_usuario === 'atendente' && !novoUsuario.nome_atendente) {
      toast.error('Informe o nome da atendente');
      return;
    }
    criarUsuarioMutation.mutate(novoUsuario);
  };

  // Mutation para editar usuário
  const editarUsuarioMutation = useMutation({
    mutationFn: async (userEdit) => {
      const updateData = {
        nome: userEdit.nome,
        usuario: userEdit.usuario,
        tipo_usuario: userEdit.tipo_usuario,
        nome_motoboy: userEdit.tipo_usuario === 'motoboy' ? userEdit.nome_motoboy : null,
        nome_atendente: userEdit.tipo_usuario === 'atendente' ? userEdit.nome_atendente : null,
      };

      // Só atualiza a senha se foi informada uma nova
      if (userEdit.senha) {
        updateData.senha = userEdit.senha;
      }

      console.log('Atualizando usuário:', userEdit.id, updateData);

      const { data, error } = await supabase
        .from('dispositivos')
        .update(updateData)
        .eq('id', userEdit.id)
        .select();

      if (error) {
        console.error('Erro Supabase:', error);
        throw error;
      }

      console.log('Resultado:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos-usuarios'] });
      toast.success('Usuário atualizado com sucesso!');
      setShowEditarUsuario(false);
      setUsuarioEditando(null);
    },
    onError: (error) => {
      console.error('Erro ao editar usuário:', error);
      toast.error('Erro ao editar usuário: ' + (error.message || 'Erro desconhecido'));
    }
  });

  // Mutation para autorizar usuário
  const autorizarUsuarioMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('dispositivos')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos-usuarios'] });
      toast.success(status === 'Autorizado' ? 'Usuário autorizado!' : 'Usuário bloqueado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    }
  });

  // Mutation para excluir usuário
  const excluirUsuarioMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('dispositivos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos-usuarios'] });
      toast.success('Usuário excluído!');
    },
    onError: () => {
      toast.error('Erro ao excluir usuário');
    }
  });

  const handleEditarUsuario = (dispositivo) => {
    setUsuarioEditando({
      id: dispositivo.id,
      nome: dispositivo.nome || '',
      usuario: dispositivo.usuario || '',
      senha: '',
      tipo_usuario: dispositivo.tipo_usuario || 'atendente',
      nome_motoboy: dispositivo.nome_motoboy || '',
      nome_atendente: dispositivo.nome_atendente || ''
    });
    setShowEditarUsuario(true);
  };

  const handleSalvarEdicao = () => {
    if (!usuarioEditando.nome || !usuarioEditando.usuario) {
      toast.error('Preencha nome e usuário');
      return;
    }
    if (usuarioEditando.tipo_usuario === 'motoboy' && !usuarioEditando.nome_motoboy) {
      toast.error('Selecione o motoboy');
      return;
    }
    if (usuarioEditando.tipo_usuario === 'atendente' && !usuarioEditando.nome_atendente) {
      toast.error('Informe o nome da atendente');
      return;
    }
    editarUsuarioMutation.mutate(usuarioEditando);
  };

  const handleAutorizar = (id, status) => {
    autorizarUsuarioMutation.mutate({ id, status });
  };

  const handleExcluirUsuario = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      excluirUsuarioMutation.mutate(id);
    }
  };

  const handleUpdateTipo = (id, tipo, nomeMotoboy) => {
    updateMutation.mutate({ id, tipo_usuario: tipo, nome_motoboy: nomeMotoboy });
  };

  const filteredUsers = dispositivos.filter(d =>
    d.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTipoBadge = (tipo, nomeMotoboy) => {
    const config = {
      admin: { bg: "bg-purple-100", text: "text-purple-700", label: "Administrador" },
      atendente: { bg: "bg-blue-100", text: "text-blue-700", label: "Atendente" },
      motoboy: { bg: "bg-orange-100", text: "text-orange-700", label: `Motoboy${nomeMotoboy ? `: ${nomeMotoboy}` : ''}` },
    };
    const { bg, text, label } = config[tipo] || { bg: "bg-slate-100", text: "text-slate-700", label: "Não Definido" };
    return <span className={`px-3 py-1 rounded-lg text-xs font-bold ${bg} ${text}`}>{label}</span>;
  };

  const getDeviceIcon = (nome) => {
    if (nome?.toLowerCase().includes('safari') || nome?.toLowerCase().includes('mac') || nome?.toLowerCase().includes('windows')) {
      return <Monitor className="w-5 h-5 text-slate-500" />;
    }
    return <Smartphone className="w-5 h-5 text-slate-500" />;
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
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white">Gerenciar Usuários</h1>
              <p className="text-base text-white opacity-90 mt-1">Defina os tipos de acesso para cada dispositivo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Botão Novo Usuário */}
        <div
          onClick={() => setShowNovoUsuario(true)}
          className="bg-white rounded-xl shadow-sm p-5 mb-6 cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-4"
          style={{ borderLeft: '4px solid #890d5d' }}
        >
          <div className="p-3 rounded-full" style={{ backgroundColor: '#890d5d' }}>
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Criar Novo Usuário</h3>
            <p className="text-sm text-slate-500">Adicione um novo usuário ao sistema</p>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou dispositivo..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#376295' }}
            />
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200" style={{ backgroundColor: '#890d5d' }}>
            <div className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Usuários Autorizados ({filteredUsers.length})</h2>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500">
                Carregando usuários...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <div className="text-slate-600 font-medium">Nenhum usuário encontrado</div>
                <div className="text-sm text-slate-500 mt-1">
                  Autorize dispositivos na página de Dispositivos
                </div>
              </div>
            ) : (
              filteredUsers.map((dispositivo) => (
                <UsuarioCard
                  key={dispositivo.id}
                  dispositivo={dispositivo}
                  motoboys={motoboys}
                  onUpdateTipo={handleUpdateTipo}
                  onEditar={handleEditarUsuario}
                  onExcluir={handleExcluirUsuario}
                  onAutorizar={handleAutorizar}
                  isUpdating={updateMutation.isPending}
                  getDeviceIcon={getDeviceIcon}
                  getTipoBadge={getTipoBadge}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Novo Usuário */}
      <Dialog open={showNovoUsuario} onOpenChange={setShowNovoUsuario}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" style={{ color: '#890d5d' }} />
              Criar Novo Usuário
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={novoUsuario.nome}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                placeholder="Nome do usuário"
              />
            </div>

            <div>
              <Label>Usuário (usado para login) *</Label>
              <Input
                type="text"
                value={novoUsuario.usuario}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, usuario: e.target.value })}
                placeholder="Digite o nome de usuário"
              />
            </div>

            <div>
              <Label>Senha *</Label>
              <Input
                type="password"
                value={novoUsuario.senha}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                placeholder="Digite uma senha"
              />
            </div>

            <div>
              <Label>Tipo de Usuário *</Label>
              <select
                value={novoUsuario.tipo_usuario}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, tipo_usuario: e.target.value })}
                className="w-full h-10 bg-white px-3 py-2 text-sm font-medium"
                style={{ border: '2px solid #93c5fd', borderRadius: '0.625rem' }}
              >
                <option value="admin">Administrador</option>
                <option value="atendente">Atendente</option>
                <option value="motoboy">Motoboy</option>
              </select>
            </div>

            {novoUsuario.tipo_usuario === 'atendente' && (
              <div>
                <Label>Nome da Atendente *</Label>
                <Input
                  value={novoUsuario.nome_atendente}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, nome_atendente: e.target.value })}
                  placeholder="Nome da atendente"
                />
              </div>
            )}

            {novoUsuario.tipo_usuario === 'motoboy' && (
              <div>
                <Label>Selecionar Motoboy *</Label>
                <select
                  value={novoUsuario.nome_motoboy}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, nome_motoboy: e.target.value })}
                  className="w-full h-10 bg-white px-3 py-2 text-sm font-medium"
                  style={{ border: '2px solid #93c5fd', borderRadius: '0.625rem' }}
                >
                  <option value="">Selecione...</option>
                  {motoboys.map(m => (
                    <option key={m.id} value={m.nome}>{m.nome}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  O motoboy só verá suas próprias entregas
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNovoUsuario(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCriarUsuario}
                disabled={criarUsuarioMutation.isPending}
                style={{ backgroundColor: '#890d5d' }}
                className="text-white"
              >
                {criarUsuarioMutation.isPending ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Usuário */}
      <Dialog open={showEditarUsuario} onOpenChange={setShowEditarUsuario}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" style={{ color: '#457bba' }} />
              Editar Usuário
            </DialogTitle>
          </DialogHeader>

          {usuarioEditando && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={usuarioEditando.nome}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, nome: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <Label>Usuário (usado para login) *</Label>
                <Input
                  type="text"
                  value={usuarioEditando.usuario}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, usuario: e.target.value })}
                  placeholder="Digite o nome de usuário"
                />
              </div>

              <div>
                <Label>Nova Senha (deixe em branco para manter)</Label>
                <Input
                  type="password"
                  value={usuarioEditando.senha}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, senha: e.target.value })}
                  placeholder="Digite uma nova senha"
                />
              </div>

              <div>
                <Label>Tipo de Usuário *</Label>
                <select
                  value={usuarioEditando.tipo_usuario}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, tipo_usuario: e.target.value })}
                  className="w-full h-10 bg-white px-3 py-2 text-sm font-medium"
                  style={{ border: '2px solid #93c5fd', borderRadius: '0.625rem' }}
                >
                  <option value="admin">Administrador</option>
                  <option value="atendente">Atendente</option>
                  <option value="motoboy">Motoboy</option>
                </select>
              </div>

              {usuarioEditando.tipo_usuario === 'atendente' && (
                <div>
                  <Label>Nome da Atendente *</Label>
                  <Input
                    value={usuarioEditando.nome_atendente}
                    onChange={(e) => setUsuarioEditando({ ...usuarioEditando, nome_atendente: e.target.value })}
                    placeholder="Nome da atendente"
                  />
                </div>
              )}

              {usuarioEditando.tipo_usuario === 'motoboy' && (
                <div>
                  <Label>Selecionar Motoboy *</Label>
                  <select
                    value={usuarioEditando.nome_motoboy}
                    onChange={(e) => setUsuarioEditando({ ...usuarioEditando, nome_motoboy: e.target.value })}
                    className="w-full h-10 bg-white px-3 py-2 text-sm font-medium"
                    style={{ border: '2px solid #93c5fd', borderRadius: '0.625rem' }}
                  >
                    <option value="">Selecione...</option>
                    {motoboys.map(m => (
                      <option key={m.id} value={m.nome}>{m.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditarUsuario(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSalvarEdicao}
                  disabled={editarUsuarioMutation.isPending}
                  style={{ backgroundColor: '#457bba' }}
                  className="text-white"
                >
                  {editarUsuarioMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de Card de Usuário
function UsuarioCard({ dispositivo, motoboys, onUpdateTipo, onEditar, onExcluir, onAutorizar, isUpdating, getDeviceIcon, getTipoBadge }) {
  const [tipoUsuario, setTipoUsuario] = React.useState(dispositivo.tipo_usuario || '');
  const [nomeMotoboy, setNomeMotoboy] = React.useState(dispositivo.nome_motoboy || '');
  const [mostrarSenha, setMostrarSenha] = React.useState(false);
  const isPendente = dispositivo.status !== 'Autorizado';

  const handleTipoChange = (novoTipo) => {
    setTipoUsuario(novoTipo);
    if (novoTipo !== 'motoboy') {
      setNomeMotoboy('');
      onUpdateTipo(dispositivo.id, novoTipo, null);
    }
  };

  const handleMotoboyChange = (nome) => {
    setNomeMotoboy(nome);
    if (nome) {
      onUpdateTipo(dispositivo.id, 'motoboy', nome);
    }
  };

  const getStatusBadge = () => {
    if (isPendente) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-700">
          <Clock className="w-3 h-3" />
          Pendente
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3" />
        Autorizado
      </span>
    );
  };

  return (
    <div className={`p-6 hover:bg-slate-50 transition-colors ${isPendente ? 'bg-yellow-50' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPendente ? 'bg-yellow-400' : 'bg-gradient-to-br from-[#457bba] to-[#890d5d]'}`}>
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg">
                {dispositivo.nome || dispositivo.usuario || 'Usuário'}
              </h3>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
              <span className="font-medium">Login: {dispositivo.usuario || '-'}</span>
              <span className="flex items-center gap-1 font-medium">
                Senha: {mostrarSenha ? (dispositivo.senha || '-') : '••••••'}
                <button
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                  title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Botões de Autorização */}
          {isPendente ? (
            <button
              onClick={() => onAutorizar(dispositivo.id, 'Autorizado')}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              Autorizar
            </button>
          ) : (
            <button
              onClick={() => onAutorizar(dispositivo.id, 'Bloqueado')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-lg transition-colors font-medium"
            >
              <XCircle className="w-4 h-4" />
              Bloquear
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Tipo:</span>
            <select
              value={tipoUsuario}
              onChange={(e) => handleTipoChange(e.target.value)}
              disabled={isUpdating}
              className="min-w-[160px] h-10 bg-white px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-50 cursor-pointer"
              style={{ border: '2px solid #93c5fd', borderRadius: '0.625rem' }}
            >
              <option value="">Selecione...</option>
              <option value="admin">Administrador</option>
              <option value="atendente">Atendente</option>
              <option value="motoboy">Motoboy</option>
            </select>
          </div>

          {tipoUsuario === 'motoboy' && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Motoboy:</span>
              <select
                value={nomeMotoboy}
                onChange={(e) => handleMotoboyChange(e.target.value)}
                disabled={isUpdating}
                className="min-w-[150px] h-10 bg-white px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-50 cursor-pointer"
                style={{ border: '2px solid #93c5fd', borderRadius: '0.625rem' }}
              >
                <option value="">Selecione...</option>
                {motoboys?.map(m => (
                  <option key={m.id} value={m.nome}>{m.nome}</option>
                ))}
              </select>
            </div>
          )}

          {tipoUsuario && getTipoBadge(tipoUsuario, nomeMotoboy)}

          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditar(dispositivo)}
              className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              title="Editar usuário"
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button
              onClick={() => onExcluir(dispositivo.id)}
              className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
              title="Excluir usuário"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}