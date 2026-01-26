import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Search,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
  CheckCircle2,
  Circle,
  Edit,
  Calendar,
  ClipboardList,
  AlertCircle,
  Check,
  Paperclip,
} from "lucide-react";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const FORMAS_PAGAMENTO = [
  'Pago', 'Dinheiro', 'Maquina', 'Troco P/', 'Via na Pasta',
  'Só Entregar', 'Aguardando', 'Pix - Aguardando',
  'Link - Aguardando', 'Boleto', 'Pagar MP'
];

// Verifica se a forma de pagamento indica que já foi recebido
// Apenas formas que começam com "Pago" indicam pagamento já realizado
// "Dinheiro", "Máquina", "Receber" etc. indicam que ainda precisa cobrar
const verificarSeJaRecebido = (forma) => {
  if (!forma) return false;
  // Normalizar removendo acentos e convertendo para minúsculo
  const formaLower = forma.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  // Apenas "Pago..." indica que já foi recebido
  return formaLower.startsWith('pago');
};

export default function Pagamentos() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Estados
  const [mesAtual, setMesAtual] = useState(new Date());
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [verTodos, setVerTodos] = useState(true); // Iniciar com "ver todos"
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroMotoboy, setFiltroMotoboy] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos"); // "todos", "pendentes", "recebidos", "dinheiro", "cartao"

  // Estados para o modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [entregaEditando, setEntregaEditando] = useState(null);
  const [formaPagamentoEdit, setFormaPagamentoEdit] = useState('');
  const [pagamentoRecebidoEdit, setPagamentoRecebidoEdit] = useState(false);

  // Buscar todas as entregas para gerenciar pagamentos
  const { data: entregas = [], isLoading, error: queryError } = useQuery({
    queryKey: ['pagamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(nome, telefone, cpf),
          endereco:enderecos(cidade, regiao),
          motoboy:motoboys(nome)
        `)
        .order('data_entrega', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    staleTime: 0,
    gcTime: 0,
  });

  // Mutation para atualizar pagamento
  const updatePagamentoMutation = useMutation({
    mutationFn: async ({ entregaId, formaPagamento, pagamentoRecebido }) => {
      const updates = {};
      if (formaPagamento !== undefined) updates.forma_pagamento = formaPagamento;
      if (pagamentoRecebido !== undefined) updates.pagamento_recebido = pagamentoRecebido;

      const { error } = await supabase
        .from('entregas')
        .update(updates)
        .eq('id', entregaId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar múltiplas queries para atualizar outras páginas
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['receitas'] });
      toast.success('Pagamento atualizado com sucesso!');
      setEditModalOpen(false);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar pagamento: ' + error.message);
    },
  });

  // Função para abrir modal de edição
  const abrirModalEditar = (e, entrega) => {
    e.preventDefault();
    e.stopPropagation();
    setEntregaEditando(entrega);
    setFormaPagamentoEdit(entrega.forma_pagamento || '');
    setPagamentoRecebidoEdit(entrega.pagamento_recebido || false);
    // Aguardar um ciclo de renderização antes de abrir o modal
    setTimeout(() => setEditModalOpen(true), 0);
  };

  // Função para salvar alterações
  const salvarAlteracoes = () => {
    if (!formaPagamentoEdit) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }

    // Se a forma de pagamento indica que já foi pago, marcar automaticamente como recebido
    const deveMarcarRecebido = verificarSeJaRecebido(formaPagamentoEdit);

    updatePagamentoMutation.mutate({
      entregaId: entregaEditando.id,
      formaPagamento: formaPagamentoEdit,
      pagamentoRecebido: deveMarcarRecebido ? true : pagamentoRecebidoEdit,
    });
  };

  // Invalidar cache quando componente montar
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
  }, [queryClient]);

  // Mutation silenciosa para corrigir pagamentos (sem toast individual)
  const corrigirPagamentoMutation = useMutation({
    mutationFn: async (entregaId) => {
      console.log('Tentando corrigir entrega:', entregaId);
      const { data, error } = await supabase
        .from('entregas')
        .update({ pagamento_recebido: true })
        .eq('id', entregaId)
        .select();

      console.log('Resultado:', { data, error });
      if (error) {
        console.error('Erro detalhado:', JSON.stringify(error, null, 2));
        throw error;
      }
      return data;
    },
  });

  // Corrigir automaticamente entregas que têm forma de pagamento "Pago" mas não estão marcadas como recebidas
  const [jaCorrigiu, setJaCorrigiu] = useState(false);
  useEffect(() => {
    const corrigirPagamentosExistentes = async () => {
      if (jaCorrigiu) return;
      if (isLoading) return;
      if (!entregas || entregas.length === 0) return;

      const entregasParaCorrigir = entregas.filter(e => {
        const deveReceber = verificarSeJaRecebido(e.forma_pagamento);
        const aindaNaoRecebido = !e.pagamento_recebido;
        return deveReceber && aindaNaoRecebido;
      });

      if (entregasParaCorrigir.length === 0) {
        setJaCorrigiu(true);
        return;
      }

      setJaCorrigiu(true);

      let corrigidos = 0;
      let erros = 0;

      // Corrigir uma por uma
      for (const entrega of entregasParaCorrigir) {
        try {
          await corrigirPagamentoMutation.mutateAsync(entrega.id);
          corrigidos++;
        } catch (err) {
          console.error('Erro ao corrigir entrega:', entrega.id, err);
          erros++;
        }
      }

      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['receitas'] });

      if (corrigidos > 0) {
        toast.success(`${corrigidos} pagamento(s) corrigido(s) automaticamente`);
      }
      if (erros > 0) {
        toast.error(`${erros} pagamento(s) não puderam ser corrigidos`);
      }
    };

    corrigirPagamentosExistentes();
  }, [entregas, isLoading, jaCorrigiu, queryClient]);

  // Mostrar erro se houver
  useEffect(() => {
    if (queryError) {
      toast.error('Erro ao carregar pagamentos: ' + queryError.message);
    }
  }, [queryError]);

  // Limpar portals quando o modal fechar
  useEffect(() => {
    if (!editModalOpen) {
      // Aguardar um momento para o modal fechar completamente
      const timer = setTimeout(() => {
        const portals = document.querySelectorAll('[data-radix-popper-content-wrapper]');
        portals.forEach(portal => {
          try {
            portal.remove();
          } catch (e) {
            // Ignorar erros de remoção
          }
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editModalOpen]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-[#457bba] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Carregando pagamentos...</p>
        </div>
      </div>
    );
  }

  // Filtrar entregas (sem filtro de status para estatísticas)
  const entregasBase = entregas.filter(e => {
    // Filtro de data
    if (!verTodos && dataSelecionada && e.data_entrega) {
      if (!isSameDay(parseISO(e.data_entrega), dataSelecionada)) return false;
    }

    // Filtro de motoboy
    if (filtroMotoboy !== "todos" && e.motoboy?.nome !== filtroMotoboy) return false;

    // Busca por texto
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      const match =
        e.cliente?.nome?.toLowerCase().includes(termo) ||
        e.cliente?.telefone?.toLowerCase().includes(termo) ||
        e.requisicao?.toLowerCase().includes(termo);
      if (!match) return false;
    }

    return true;
  });

  // Funções para verificar forma de pagamento
  const ehDinheiro = (forma) => {
    if (!forma) return false;
    const f = forma.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // "Dinheiro", "Receber Dinheiro", "Receber" (sozinho = dinheiro por padrão)
    return f.includes('dinheiro') || (f.includes('receber') && !f.includes('maquina') && !f.includes('cartao'));
  };

  const ehCartao = (forma) => {
    if (!forma) return false;
    const f = forma.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // "Máquina", "Maquina", "Cartão", "Receber Máquina", "Receber Cartão"
    return f.includes('maquina') || f.includes('cartao');
  };

  // Aplicar filtro de status de pagamento
  const entregasFiltradas = entregasBase.filter(e => {
    if (filtroStatus === "pendentes" && e.pagamento_recebido) return false;
    if (filtroStatus === "recebidos" && !e.pagamento_recebido) return false;
    // Filtros de dinheiro e cartão mostram todas as entregas com essa forma, independente do status
    if (filtroStatus === "dinheiro" && !ehDinheiro(e.forma_pagamento)) return false;
    if (filtroStatus === "cartao" && !ehCartao(e.forma_pagamento)) return false;
    return true;
  });

  // Calcular estatísticas (baseado nas entregas sem filtro de status)
  const stats = {
    pendentes: entregasBase.filter(e => !e.pagamento_recebido).length,
    recebidos: entregasBase.filter(e => e.pagamento_recebido).length,
    dinheiro: entregasBase
      .filter(e => ehDinheiro(e.forma_pagamento) && !e.pagamento_recebido)
      .reduce((sum, e) => sum + (parseFloat(e.valor_venda) || 0), 0),
    cartao: entregasBase
      .filter(e => ehCartao(e.forma_pagamento) && !e.pagamento_recebido)
      .reduce((sum, e) => sum + (parseFloat(e.valor_venda) || 0), 0),
  };

  // Motoboys únicos para o filtro
  const motoboysUnicos = [...new Set(entregas.map(e => e.motoboy?.nome))].filter(Boolean).sort();

  // Calendário
  const diasDoMes = eachDayOfInterval({
    start: startOfMonth(mesAtual),
    end: endOfMonth(mesAtual)
  });

  const primeiroDiaSemana = startOfMonth(mesAtual).getDay();
  const diasVaziosInicio = Array(primeiroDiaSemana).fill(null);

  const contarPagamentosDia = (dia) => {
    return entregas.filter(e =>
      e.data_entrega && isSameDay(parseISO(e.data_entrega), dia)
    ).length;
  };

  const mesAnterior = () => setMesAtual(subMonths(mesAtual, 1));
  const proximoMes = () => setMesAtual(addMonths(mesAtual, 1));

  const selecionarDia = (dia) => {
    setDataSelecionada(dia);
    setVerTodos(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Customizado */}
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
              <h1 className="text-4xl font-bold text-white">Pagamentos</h1>
              <p className="text-base text-white opacity-90 mt-1">Gerenciamento de pagamentos das entregas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar com filtros */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Filtrar por dados</h3>

              {/* Botões Por Dia / Todos */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setVerTodos(false);
                    if (!dataSelecionada) {
                      setDataSelecionada(new Date());
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: !verTodos ? '#376295' : 'white',
                    color: !verTodos ? 'white' : '#64748b',
                    border: !verTodos ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  Por Dia
                </button>

                <button
                  onClick={() => {
                    setVerTodos(true);
                    setDataSelecionada(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: verTodos ? '#376295' : 'white',
                    color: verTodos ? 'white' : '#64748b',
                    border: verTodos ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  <ClipboardList className="w-4 h-4" />
                  Todos
                </button>
              </div>

                {/* Calendário */}
                <div className="border rounded-lg p-3">
                  {/* Header do calendário */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={mesAnterior}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 text-slate-600" />
                    </button>
                    <span className="text-sm font-semibold text-slate-700">
                      {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    <button
                      onClick={proximoMes}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>

                  {/* Dias da semana */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map(dia => (
                      <div key={dia} className="text-center text-xs font-semibold text-slate-500 py-2">
                        {dia}
                      </div>
                    ))}
                  </div>

                  {/* Dias do mês */}
                  <div className="grid grid-cols-7 gap-1">
                    {diasVaziosInicio.map((_, index) => (
                      <div key={`vazio-${index}`} className="aspect-square" />
                    ))}
                    {diasDoMes.map(dia => {
                      const count = contarPagamentosDia(dia);
                      const isSelected = dataSelecionada && isSameDay(dia, dataSelecionada);
                      const isToday = isSameDay(dia, new Date());

                      return (
                        <button
                          key={dia.toISOString()}
                          onClick={() => selecionarDia(dia)}
                          className="aspect-square rounded-lg text-sm flex flex-col items-center justify-center relative transition-all hover:bg-blue-50"
                          style={{
                            backgroundColor: isSelected ? '#376295' :
                              !isSelected && isToday ? '#e2e8f0' :
                              !isSelected && !isToday && count > 0 ? '#F5E8F5' : 'transparent',
                            color: isSelected ? 'white' :
                              isSelected === false && isToday ? '#376295' :
                              !isSelected && !isToday && count > 0 ? '#890d5d' : '#1e293b',
                            fontWeight: isSelected || isToday || count > 0 ? 'bold' : 'normal',
                            boxShadow: isSelected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                          }}
                        >
                          <span>{format(dia, 'd')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              {/* Data e contador */}
              <div className="text-center pt-4 border-t border-slate-200">
                {dataSelecionada && !verTodos && (
                  <div className="text-base font-semibold text-slate-700">
                    {format(dataSelecionada, "dd 'de' MMMM", { locale: ptBR })}
                  </div>
                )}
                <div className="text-sm text-slate-500">
                  {entregasFiltradas.length} pagamento{entregasFiltradas.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Área principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Busca e Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Buscar e Filtrar</h2>
              <div className="space-y-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por número, nome ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                {/* Select Motoboy */}
                <Select value={filtroMotoboy} onValueChange={setFiltroMotoboy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os Motoboys" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Motoboys</SelectItem>
                    {motoboysUnicos.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pendentes */}
              <div
                onClick={() => setFiltroStatus(filtroStatus === 'pendentes' ? 'todos' : 'pendentes')}
                className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
                style={{ border: filtroStatus === 'pendentes' ? '2px solid #f97316' : '2px solid transparent' }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#FEF3E8' }}>
                    <AlertCircle className="w-6 h-6" style={{ color: '#f97316' }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Pendentes</span>
                </div>
                <div className="text-4xl font-bold text-center" style={{ color: '#f97316' }}>
                  {stats.pendentes}
                </div>
              </div>

              {/* Recebidos */}
              <div
                onClick={() => setFiltroStatus(filtroStatus === 'recebidos' ? 'todos' : 'recebidos')}
                className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
                style={{ border: filtroStatus === 'recebidos' ? '2px solid #3dac38' : '2px solid transparent' }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F5E8' }}>
                    <Check className="w-6 h-6" style={{ color: '#3dac38' }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Recebidos</span>
                </div>
                <div className="text-4xl font-bold text-center" style={{ color: '#3dac38' }}>
                  {stats.recebidos}
                </div>
              </div>

              {/* Dinheiro */}
              <div
                onClick={() => setFiltroStatus(filtroStatus === 'dinheiro' ? 'todos' : 'dinheiro')}
                className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
                style={{ border: filtroStatus === 'dinheiro' ? '2px solid #376295' : '2px solid transparent' }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F0F8' }}>
                    <Banknote className="w-6 h-6" style={{ color: '#376295' }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Dinheiro</span>
                </div>
                <div className="text-2xl font-bold text-center" style={{ color: '#376295' }}>
                  R$ {stats.dinheiro.toFixed(2)}
                </div>
              </div>

              {/* Cartão */}
              <div
                onClick={() => setFiltroStatus(filtroStatus === 'cartao' ? 'todos' : 'cartao')}
                className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
                style={{ border: filtroStatus === 'cartao' ? '2px solid #890d5d' : '2px solid transparent' }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#F5E8F5' }}>
                    <CreditCard className="w-6 h-6" style={{ color: '#890d5d' }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Cartão</span>
                </div>
                <div className="text-2xl font-bold text-center" style={{ color: '#890d5d' }}>
                  R$ {stats.cartao.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Lista de pagamentos */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              {entregasFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Nenhum pagamento encontrado
                  </h3>
                  <p className="text-sm text-slate-600">
                    {searchTerm || filtroMotoboy !== "todos"
                      ? 'Tente ajustar os filtros de busca'
                      : 'Não há pagamentos cadastrados'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="space-y-3">
                    {entregasFiltradas.map(entrega => (
                      <Link
                        key={entrega.id}
                        to={`/detalhes-romaneio?id=${entrega.id}`}
                        className="block p-5 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-base font-semibold" style={{ color: '#376295' }}>
                                #{entrega.requisicao}
                              </span>
                              <Badge
                                className="px-3 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: entrega.pagamento_recebido ? "#E8F5E8" : "#FEF3E8",
                                  color: entrega.pagamento_recebido ? "#3dac38" : "#f97316"
                                }}
                              >
                                {entrega.pagamento_recebido ? "Recebido" : "Pendente"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                              <div>
                                <span className="font-medium">Cliente:</span> {entrega.cliente?.nome || entrega.cliente_nome}
                              </div>
                              <div>
                                <span className="font-medium">Motoboy:</span> {entrega.motoboy?.nome || 'Sem motoboy'}
                              </div>
                              <div>
                                <span className="font-medium">Data:</span>{' '}
                                {entrega.data_entrega ? format(parseISO(entrega.data_entrega), "dd/MM/yyyy") : '-'}
                              </div>
                              {entrega.forma_pagamento && (
                                <div>
                                  <span className="font-medium">Forma:</span> {entrega.forma_pagamento}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            {/* Valor a receber - apenas para formas que requerem cobrança */}
                            {(ehDinheiro(entrega.forma_pagamento) || ehCartao(entrega.forma_pagamento)) && entrega.valor_venda > 0 && (
                              <div className="text-right">
                                <div className="text-xs text-slate-500">A Receber</div>
                                <div className="font-bold text-lg" style={{ color: entrega.pagamento_recebido ? '#3dac38' : '#1b5e20' }}>
                                  R$ {parseFloat(entrega.valor_venda).toFixed(2)}
                                </div>
                              </div>
                            )}
                            <button
                              onClick={(e) => abrirModalEditar(e, entrega)}
                              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium text-slate-700"
                              title="Editar pagamento"
                            >
                              <Edit className="w-4 h-4" />
                              Editar
                            </button>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição de Pagamento */}
      <Dialog
        key={`dialog-${entregaEditando?.id || 'none'}`}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Pagamento</DialogTitle>
            <DialogDescription>
              #{entregaEditando?.requisicao} - {entregaEditando?.cliente?.nome || entregaEditando?.cliente_nome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Forma de Pagamento *
              </label>
              <Select
                key={`forma-pagamento-${entregaEditando?.id}`}
                value={formaPagamentoEdit}
                onValueChange={setFormaPagamentoEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map(forma => (
                    <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status de Pagamento */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Status do Pagamento
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!pagamentoRecebidoEdit}
                    onChange={() => setPagamentoRecebidoEdit(false)}
                    className="w-4 h-4 text-orange-600"
                  />
                  <span className="text-sm">Pendente</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={pagamentoRecebidoEdit}
                    onChange={() => setPagamentoRecebidoEdit(true)}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-sm">Recebido</span>
                </label>
              </div>
            </div>

            {/* Informações da entrega */}
            {entregaEditando && (
              <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Valor:</span>
                  <span className="font-semibold">
                    R$ {parseFloat(entregaEditando.valor || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Data:</span>
                  <span>
                    {entregaEditando.data_entrega ? format(parseISO(entregaEditando.data_entrega), "dd/MM/yyyy") : '-'}
                  </span>
                </div>
                {entregaEditando.motoboy?.nome && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Motoboy:</span>
                    <span>{entregaEditando.motoboy.nome}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={updatePagamentoMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={salvarAlteracoes}
              disabled={updatePagamentoMutation.isPending}
              style={{ background: updatePagamentoMutation.isPending ? '#94a3b8' : '#376295' }}
              className="text-white"
            >
              {updatePagamentoMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
