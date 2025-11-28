import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
  Smartphone, 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle,
  Trash2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function Dispositivos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const { data: dispositivos, isLoading } = useQuery({
    queryKey: ['dispositivos'],
    queryFn: () => base44.entities.DispositivoAutorizado.list('-created_date'),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DispositivoAutorizado.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      toast.success('Dispositivo atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar dispositivo');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DispositivoAutorizado.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      toast.success('Dispositivo removido!');
    },
    onError: () => {
      toast.error('Erro ao remover dispositivo');
    }
  });

  const handleAutorizar = (dispositivo) => {
    updateMutation.mutate({
      id: dispositivo.id,
      data: { autorizado: true, aguardando_aprovacao: false }
    });
  };

  const handleBloquear = (dispositivo) => {
    updateMutation.mutate({
      id: dispositivo.id,
      data: { autorizado: false, aguardando_aprovacao: false }
    });
  };

  const dispositivosFiltrados = dispositivos.filter(d => {
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      const match = 
        d.user_email?.toLowerCase().includes(termo) ||
        d.device_name?.toLowerCase().includes(termo) ||
        d.device_fingerprint?.toLowerCase().includes(termo);
      if (!match) return false;
    }

    if (filtroStatus === "autorizados" && !d.autorizado) return false;
    if (filtroStatus === "pendentes" && !d.aguardando_aprovacao) return false;
    if (filtroStatus === "bloqueados" && (d.autorizado || d.aguardando_aprovacao)) return false;

    return true;
  });

  const stats = {
    total: dispositivos.length,
    autorizados: dispositivos.filter(d => d.autorizado).length,
    pendentes: dispositivos.filter(d => d.aguardando_aprovacao).length,
    bloqueados: dispositivos.filter(d => !d.autorizado && !d.aguardando_aprovacao).length,
  };

  const StatusBadge = ({ dispositivo }) => {
    if (dispositivo.autorizado) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300 border">
          <CheckCircle className="w-3 h-3 mr-1" />
          Autorizado
        </Badge>
      );
    }
    if (dispositivo.aguardando_aprovacao) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 border">
          <Clock className="w-3 h-3 mr-1" />
          Pendente
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-700 border-red-300 border">
        <XCircle className="w-3 h-3 mr-1" />
        Bloqueado
      </Badge>
    );
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
            <h1 className="text-3xl font-bold text-slate-900">Gerenciar Dispositivos</h1>
            <p className="text-slate-600">Autorize ou bloqueie dispositivos de acesso</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => setFiltroStatus("todos")} className="text-left">
            <Card className={`border-none shadow-md hover:shadow-xl transition-shadow ${filtroStatus === "todos" ? "ring-2 ring-[#457bba]" : ""}`}>
              <CardHeader className="pb-3">
                <p className="text-sm text-slate-500 font-medium">Total</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </CardHeader>
            </Card>
          </button>
          <button onClick={() => setFiltroStatus("autorizados")} className="text-left">
            <Card className={`border-none shadow-md hover:shadow-xl transition-shadow ${filtroStatus === "autorizados" ? "ring-2 ring-green-600" : ""}`}>
              <CardHeader className="pb-3">
                <p className="text-sm text-slate-500 font-medium">Autorizados</p>
                <p className="text-3xl font-bold text-green-600">{stats.autorizados}</p>
              </CardHeader>
            </Card>
          </button>
          <button onClick={() => setFiltroStatus("pendentes")} className="text-left">
            <Card className={`border-none shadow-md hover:shadow-xl transition-shadow ${filtroStatus === "pendentes" ? "ring-2 ring-yellow-600" : ""}`}>
              <CardHeader className="pb-3">
                <p className="text-sm text-slate-500 font-medium">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendentes}</p>
              </CardHeader>
            </Card>
          </button>
          <button onClick={() => setFiltroStatus("bloqueados")} className="text-left">
            <Card className={`border-none shadow-md hover:shadow-xl transition-shadow ${filtroStatus === "bloqueados" ? "ring-2 ring-red-600" : ""}`}>
              <CardHeader className="pb-3">
                <p className="text-sm text-slate-500 font-medium">Bloqueados</p>
                <p className="text-3xl font-bold text-red-600">{stats.bloqueados}</p>
              </CardHeader>
            </Card>
          </button>
        </div>

        {/* Busca */}
        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar por email, dispositivo ou fingerprint..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#457bba]" />
              Dispositivos Registrados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center">
                <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
                <p className="text-slate-500">Carregando...</p>
              </div>
            ) : dispositivosFiltrados.length === 0 ? (
              <div className="p-12 text-center">
                <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Nenhum dispositivo encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {dispositivosFiltrados.map((dispositivo) => (
                  <div key={dispositivo.id} className="p-6 hover:bg-slate-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Smartphone className="w-5 h-5 text-slate-500" />
                          <h3 className="font-bold text-slate-900">
                            {dispositivo.device_name}
                          </h3>
                          <StatusBadge dispositivo={dispositivo} />
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p><span className="font-medium">Usuário:</span> {dispositivo.user_email}</p>
                          <p><span className="font-medium">Fingerprint:</span> <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{dispositivo.device_fingerprint}</code></p>
                          {dispositivo.ultimo_acesso && (
                            <p><span className="font-medium">Último acesso:</span> {format(parseISO(dispositivo.ultimo_acesso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!dispositivo.autorizado && (
                          <Button
                            size="sm"
                            onClick={() => handleAutorizar(dispositivo)}
                            disabled={updateMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Autorizar
                          </Button>
                        )}
                        {dispositivo.autorizado && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBloquear(dispositivo)}
                            disabled={updateMutation.isPending}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Bloquear
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="border-slate-300">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Dispositivo</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover este dispositivo? O usuário precisará solicitar acesso novamente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(dispositivo.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}