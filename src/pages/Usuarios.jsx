import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, UserCog, Search, UserPlus, Pencil, Trash2, CheckCircle, XCircle, Eye, EyeOff, Power } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CustomDropdown } from '@/components/CustomDropdown';
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
    usuario: '',
    senha: '',
    tipo_usuario: 'atendente',
  });
  const [showEditarUsuario, setShowEditarUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  // Buscar todos os usuários da tabela usuarios
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('usuario');

      if (error) throw error;
      return data || [];
    },
  });

  // Mutation para atualizar tipo
  const updateMutation = useMutation({
    mutationFn: async ({ id, tipo_usuario }) => {
      const { error } = await supabase
        .from('usuarios')
        .update({ tipo_usuario })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
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
        .from('usuarios')
        .insert([{
          usuario: novoUser.usuario,
          nome: novoUser.usuario,
          senha: novoUser.senha,
          tipo_usuario: novoUser.tipo_usuario,
          ativo: true
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário criado com sucesso!');
      setShowNovoUsuario(false);
      setNovoUsuario({
        usuario: '',
        senha: '',
        tipo_usuario: 'atendente',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar usuário:', error);
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast.error('Já existe um usuário com esse login');
      } else {
        toast.error('Erro ao criar usuário');
      }
    }
  });

  const handleCriarUsuario = () => {
    if (!novoUsuario.usuario || !novoUsuario.senha) {
      toast.error('Preencha usuário e senha');
      return;
    }
    criarUsuarioMutation.mutate(novoUsuario);
  };

  // Mutation para editar usuário
  const editarUsuarioMutation = useMutation({
    mutationFn: async (userEdit) => {
      const updateData = {
        usuario: userEdit.usuario,
        nome: userEdit.usuario,
        tipo_usuario: userEdit.tipo_usuario,
      };

      // Só atualiza a senha se foi informada uma nova
      if (userEdit.senha) {
        updateData.senha = userEdit.senha;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', userEdit.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário atualizado com sucesso!');
      setShowEditarUsuario(false);
      setUsuarioEditando(null);
    },
    onError: (error) => {
      console.error('Erro ao editar usuário:', error);
      toast.error('Erro ao editar usuário: ' + (error.message || 'Erro desconhecido'));
    }
  });

  // Mutation para ativar/desativar usuário
  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }) => {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { ativo }) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success(ativo ? 'Usuário ativado!' : 'Usuário desativado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    }
  });

  // Mutation para excluir usuário
  const excluirUsuarioMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      toast.success('Usuário excluído!');
    },
    onError: () => {
      toast.error('Erro ao excluir usuário');
    }
  });

  const handleEditarUsuario = (usuario) => {
    setUsuarioEditando({
      id: usuario.id,
      usuario: usuario.usuario || '',
      senha: '',
      tipo_usuario: usuario.tipo_usuario || 'atendente',
    });
    setShowEditarUsuario(true);
  };

  const handleSalvarEdicao = () => {
    if (!usuarioEditando.usuario) {
      toast.error('Preencha o usuário');
      return;
    }
    editarUsuarioMutation.mutate(usuarioEditando);
  };

  const handleToggleAtivo = (id, ativo) => {
    toggleAtivoMutation.mutate({ id, ativo });
  };

  const handleExcluirUsuario = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Todos os dispositivos vinculados serão removidos.')) {
      excluirUsuarioMutation.mutate(id);
    }
  };

  const handleUpdateTipo = (id, tipo) => {
    updateMutation.mutate({ id, tipo_usuario: tipo });
  };

  const filteredUsers = usuarios.filter(u =>
    u.usuario?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTipoBadge = (tipo) => {
    const config = {
      admin: { bg: "bg-purple-100", text: "text-purple-700", label: "Administrador" },
      atendente: { bg: "bg-blue-100", text: "text-blue-700", label: "Atendente" },
      motoboy: { bg: "bg-orange-100", text: "text-orange-700", label: "Motoboy" },
    };
    const { bg, text, label } = config[tipo] || { bg: "bg-slate-100", text: "text-slate-700", label: "Não Definido" };
    return <span className={`px-3 py-1 rounded-lg text-xs font-bold ${bg} ${text}`}>{label}</span>;
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
              <p className="text-base text-white opacity-90 mt-1">Gerencie os usuários e seus tipos de acesso</p>
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
              placeholder="Buscar por usuário..."
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
              <h2 className="text-lg font-bold text-white">Usuários ({filteredUsers.length})</h2>
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
                  Clique em "Criar Novo Usuário" para adicionar
                </div>
              </div>
            ) : (
              filteredUsers.map((usuario) => (
                <UsuarioCard
                  key={usuario.id}
                  usuario={usuario}
                  onUpdateTipo={handleUpdateTipo}
                  onEditar={handleEditarUsuario}
                  onExcluir={handleExcluirUsuario}
                  onToggleAtivo={handleToggleAtivo}
                  isUpdating={updateMutation.isPending}
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
              <Label>Usuário *</Label>
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

            <CustomDropdown
              label="Tipo de Usuário *"
              options={[
                { value: 'admin', label: 'Administrador' },
                { value: 'atendente', label: 'Atendente' },
                { value: 'motoboy', label: 'Motoboy' }
              ]}
              value={novoUsuario.tipo_usuario}
              onChange={(value) => setNovoUsuario({ ...novoUsuario, tipo_usuario: value })}
              placeholder="Selecione o tipo"
            />

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
                <Label>Usuário *</Label>
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

              <CustomDropdown
                label="Tipo de Usuário *"
                options={[
                  { value: 'admin', label: 'Administrador' },
                  { value: 'atendente', label: 'Atendente' },
                  { value: 'motoboy', label: 'Motoboy' }
                ]}
                value={usuarioEditando.tipo_usuario}
                onChange={(value) => setUsuarioEditando({ ...usuarioEditando, tipo_usuario: value })}
                placeholder="Selecione o tipo"
              />

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
function UsuarioCard({ usuario, onUpdateTipo, onEditar, onExcluir, onToggleAtivo, isUpdating, getTipoBadge }) {
  const [tipoUsuario, setTipoUsuario] = React.useState(usuario.tipo_usuario || '');
  const [mostrarSenha, setMostrarSenha] = React.useState(false);
  const isInativo = !usuario.ativo;

  const handleTipoChange = (novoTipo) => {
    setTipoUsuario(novoTipo);
    onUpdateTipo(usuario.id, novoTipo);
  };

  const getStatusBadge = () => {
    if (isInativo) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" />
          Inativo
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3" />
        Ativo
      </span>
    );
  };

  return (
    <div className={`p-6 hover:bg-slate-50 transition-colors ${isInativo ? 'bg-red-50 opacity-70' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isInativo ? 'bg-red-400' : 'bg-gradient-to-br from-[#457bba] to-[#890d5d]'}`}>
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg">
                {usuario.usuario || 'Usuário'}
              </h3>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
              <span className="flex items-center gap-1 font-medium">
                Senha: {mostrarSenha ? (usuario.senha || '-') : '••••••'}
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Tipo:</span>
            <div className="min-w-[160px]">
              <CustomDropdown
                options={[
                  { value: '', label: 'Selecione...' },
                  { value: 'admin', label: 'Administrador' },
                  { value: 'atendente', label: 'Atendente' },
                  { value: 'motoboy', label: 'Motoboy' }
                ]}
                value={tipoUsuario}
                onChange={handleTipoChange}
                disabled={isUpdating}
                placeholder="Selecione..."
              />
            </div>
          </div>

          {tipoUsuario && getTipoBadge(tipoUsuario)}

          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleAtivo(usuario.id, !usuario.ativo)}
              className={`p-2 rounded-lg transition-colors ${usuario.ativo ? 'text-orange-500 hover:bg-orange-100' : 'text-green-500 hover:bg-green-100'}`}
              title={usuario.ativo ? 'Desativar usuário' : 'Ativar usuário'}
            >
              <Power className="w-5 h-5" />
            </button>
            <button
              onClick={() => onEditar(usuario)}
              className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              title="Editar usuário"
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button
              onClick={() => onExcluir(usuario.id)}
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
