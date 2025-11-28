import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  LogOut,
  Truck,
  BarChart3,
  Settings,
  UserCog,
  Send,
  Smartphone
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import DeviceGuard from "@/components/DeviceGuard";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isAtendente = user?.tipo_usuario === 'atendente' || user?.tipo_usuario === 'admin';
  const isEntregador = user?.tipo_usuario === 'entregador';
  const isAdmin = user?.tipo_usuario === 'admin' || user?.role === 'admin';

  const navigationItems = isEntregador ? [
    {
      title: "Minhas Entregas",
      url: createPageUrl("MinhasEntregas"),
      icon: Package,
    },
  ] : isAtendente ? [
    {
      title: "Entregas Moto",
      url: createPageUrl("Dashboard"),
      icon: Truck,
    },
    {
      title: "Sedex/Disktenha",
      url: createPageUrl("Sedex"),
      icon: Send,
    },
    {
      title: "Novo Romaneio",
      url: createPageUrl("NovoRomaneio"),
      icon: FileText,
    },
    {
      title: "Clientes",
      url: createPageUrl("Clientes"),
      icon: Users,
    },
    {
      title: "Histórico de Clientes",
      url: createPageUrl("HistoricoClientes"),
      icon: BarChart3,
    },
    {
      title: "Relatórios",
      url: createPageUrl("Relatorios"),
      icon: BarChart3,
    },
    {
      title: "Receitas",
      url: createPageUrl("Receitas"),
      icon: FileText,
    },
    {
      title: "Pagamentos",
      url: createPageUrl("Pagamentos"),
      icon: BarChart3,
    },
    {
      title: "Planilha Diária",
      url: createPageUrl("PlanilhaDiaria"),
      icon: BarChart3,
    },
    ...(user?.tipo_usuario === 'admin' ? [{
      title: "Painel dos Motoboys",
      url: createPageUrl("PainelMotoboys"),
      icon: Truck,
    },
    {
      title: "Dispositivos",
      url: createPageUrl("Dispositivos"),
      icon: Smartphone,
    }] : []),
  ] : [];

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <DeviceGuard>
    <SidebarProvider>
      <style>{`
        :root {
          --primary: #457bba;
          --secondary: #890d5d;
          --primary-hover: #3a6ba0;
          --secondary-hover: #6e0a4a;
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#457bba] to-[#890d5d] flex items-center justify-center shadow-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Formédica Entregas</h2>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                {isEntregador ? 'Entregas' : 'Menu Principal'}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`rounded-lg mb-1 transition-all duration-200 ${
                          location.pathname === item.url
                            ? 'bg-[#457bba] text-white hover:bg-[#3a6ba0]'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-4 h-4" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            {user && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#457bba] to-[#890d5d] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.nome_atendente?.[0] || user.full_name?.[0] || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {user.nome_atendente || user.full_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate capitalize">
                      {user.tipo_usuario || 'Usuário'}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Menu
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("Usuarios")} className="flex items-center cursor-pointer">
                            <UserCog className="w-4 h-4 mr-2" />
                            Usuários
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair da Conta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-slate-200 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors" />
              <h1 className="text-xl font-bold text-slate-900">Formédica Entregas</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
    </DeviceGuard>
  );
}