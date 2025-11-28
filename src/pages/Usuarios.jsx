import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, User, Mail, Phone, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Usuarios() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser?.tipo_usuario === 'admin';

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
    refetchOnMount: 'always',
    staleTime: 0,
    gcTime: 0,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ userId, tipo }) => {
      return base44.entities.User.update(userId, { tipo_usuario: tipo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Tipo de usuário atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar usuário');
    }
  });

  const handleUpdateTipo = (userId, tipo) => {
    updateMutation.mutate({ userId, tipo });
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTipoBadge = (tipo) => {
    const config = {
      admin: { color: "bg-red-100 text-red-700", label: "Administrador" },
      atendente: { color: "bg-blue-100 text-blue-700", label: "Atendente" },
      entregador: { color: "bg-green-100 text-green-700", label: "Motoboy" },
    };
    const { color, label } = config[tipo] || { color: "bg-slate-100 text-slate-700", label: "Não Definido" };
    return <Badge className={color}>{label}</Badge>;
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Usuários</h1>
            <p className="text-slate-600 mt-1">Gerencie os usuários do sistema</p>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {filteredUsers.map((usuario) => (
                <div key={usuario.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#457bba] to-[#890d5d] flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">
                            {usuario.full_name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {usuario.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {getTipoBadge(usuario.tipo_usuario)}
                      {isAdmin && (
                        <Select
                          value={usuario.tipo_usuario || ""}
                          onValueChange={(value) => handleUpdateTipo(usuario.id, value)}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Definir tipo de usuário" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <UserCog className="w-4 h-4 text-red-600" />
                                Administrador (Acesso Total)
                              </div>
                            </SelectItem>
                            <SelectItem value="atendente">
                              <div className="flex items-center gap-2">
                                <UserCog className="w-4 h-4 text-blue-600" />
                                Atendente (Criar e Ver Romaneios)
                              </div>
                            </SelectItem>
                            <SelectItem value="entregador">
                              <div className="flex items-center gap-2">
                                <UserCog className="w-4 h-4 text-green-600" />
                                Motoboy (Visualizar Entregas)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}