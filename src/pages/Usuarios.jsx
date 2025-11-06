
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, UserCog, Mail, Phone, Shield } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Usuarios() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => base44.entities.User.list('full_name'),
    initialData: [],
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário atualizado com sucesso!');
      setDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast.error('Erro ao atualizar usuário');
    }
  });

  const handleUpdateUser = (userId, tipoUsuario) => {
    updateUserMutation.mutate({
      userId,
      data: { tipo_usuario: tipoUsuario }
    });
  };

  const filteredUsers = usuarios.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTipoBadge = (tipo) => {
    const config = {
      admin: { color: "bg-purple-100 text-purple-700 border-purple-300", label: "Admin" },
      atendente: { color: "bg-blue-100 text-blue-700 border-blue-300", label: "Atendente" },
      entregador: { color: "bg-green-100 text-green-700 border-green-300", label: "Motoboy" },
      balcao: { color: "bg-orange-100 text-orange-700 border-orange-300", label: "Balcão" }, // New badge type
    };
    const { color, label } = config[tipo] || config.atendente;
    return <Badge className={`${color} border`}>{label}</Badge>;
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gerenciar Usuários</h1>
            <p className="text-slate-600 mt-1">Defina permissões e tipos de usuários</p>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-[#457bba]" />
              Usuários do Sistema
            </CardTitle>
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-4 max-w-md"
            />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {isLoading ? (
                <div className="p-6 text-center text-slate-500">Carregando usuários...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nenhum usuário encontrado</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#457bba] to-[#890d5d] flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {user.full_name?.[0] || user.email?.[0] || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-lg">
                            {user.nome_atendente || user.full_name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            {user.telefone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.telefone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getTipoBadge(user.tipo_usuario || 'atendente')}
                        <Dialog open={dialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (!open) setSelectedUser(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Alterar Tipo
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Alterar Tipo de Usuário</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label>Usuário</Label>
                                <p className="text-lg font-semibold text-slate-900 mt-1">
                                  {selectedUser?.nome_atendente || selectedUser?.full_name}
                                </p>
                                <p className="text-sm text-slate-600">{selectedUser?.email}</p>
                              </div>
                              <div>
                                <Label>Tipo de Usuário</Label>
                                <Select
                                  defaultValue={selectedUser?.tipo_usuario || 'atendente'}
                                  onValueChange={(value) => {
                                    if (selectedUser) {
                                      handleUpdateUser(selectedUser.id, value);
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">
                                      <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-purple-600" />
                                        Admin (Acesso Total)
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="atendente">
                                      <div className="flex items-center gap-2">
                                        <UserCog className="w-4 h-4 text-blue-600" />
                                        Atendente (Criar Romaneios)
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="entregador">
                                      <div className="flex items-center gap-2">
                                        <UserCog className="w-4 h-4 text-green-600" />
                                        Motoboy (Visualizar Entregas)
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="balcao">
                                      <div className="flex items-center gap-2">
                                        <UserCog className="w-4 h-4 text-orange-600" />
                                        Balcão (Gerenciar Balcão e Romaneios)
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
