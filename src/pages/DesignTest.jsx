import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '@/lib/theme';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Package,
  Truck,
  Check,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { PageHeader, LoadingState, EmptyState } from '@/components';

// 🎨 PÁGINA DE TESTE DE DESIGN - Experimentos visuais antes de aplicar no código real
export default function DesignTest() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtros, setFiltros] = useState({
    motoboy: '',
    regiao: '',
    periodo: ''
  });

  // Estados para modals
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [entregaSelecionada, setEntregaSelecionada] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entregaParaExcluir, setEntregaParaExcluir] = useState(null);

  // Função para gerar dias do mês
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: '', isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      days.push({
        day: i,
        isCurrentMonth: true,
        isSelected: i === selectedDate.getDate() &&
                   month === selectedDate.getMonth() &&
                   year === selectedDate.getFullYear(),
        date: dayDate
      });
    }

    return days;
  };

  // Carregar entregas (com dados de exemplo)
  const loadEntregas = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(id, nome, telefone),
          endereco:enderecos(id, logradouro, numero, bairro, cidade, complemento),
          motoboy:motoboys(id, nome)
        `)
        .eq('tipo', 'moto')
        .order('data_entrega', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Adicionar dados de exemplo para visualização
      const entregasReais = data || [];
      const exemplos = [
        {
          id: 'exemplo-1',
          status: 'A Caminho',
          requisicao: '12345',
          data_entrega: selectedDate.toISOString(),
          regiao: 'Centro',
          periodo: 'Manhã',
          cliente: {
            nome: 'Maria Silva Santos',
            telefone: '(11) 98765-4321'
          },
          endereco: {
            logradouro: 'Rua das Flores',
            numero: '123',
            complemento: 'Apto 45',
            bairro: 'Jardim Paulista',
            cidade: 'São Paulo'
          },
          motoboy: {
            nome: 'João Motoboy'
          }
        },
        {
          id: 'exemplo-2',
          status: 'Produzindo no Laboratório',
          requisicao: '12346',
          data_entrega: selectedDate.toISOString(),
          regiao: 'Zona Sul',
          periodo: 'Tarde',
          cliente: {
            nome: 'Carlos Eduardo Oliveira',
            telefone: '(11) 97654-3210'
          },
          endereco: {
            logradouro: 'Avenida Paulista',
            numero: '1578',
            complemento: 'Sala 201',
            bairro: 'Bela Vista',
            cidade: 'São Paulo'
          },
          motoboy: {
            nome: 'Pedro Express'
          }
        },
        {
          id: 'exemplo-3',
          status: 'Entregue',
          requisicao: '12347',
          data_entrega: selectedDate.toISOString(),
          regiao: 'Zona Norte',
          periodo: 'Manhã',
          cliente: {
            nome: 'Ana Paula Costa',
            telefone: '(11) 96543-2109'
          },
          endereco: {
            logradouro: 'Rua Augusta',
            numero: '789',
            bairro: 'Consolação',
            cidade: 'São Paulo'
          },
          motoboy: {
            nome: 'João Motoboy'
          }
        }
      ];

      setEntregas([...exemplos, ...entregasReais]);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
      toast.error('Erro ao carregar entregas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntregas();
  }, []);

  // Filtrar entregas
  const entregasFiltradas = entregas.filter(entrega => {
    // Filtro de data (se viewMode === 'day')
    if (viewMode === 'day') {
      if (!entrega.data_entrega) {
        return false;
      }
      const entregaDate = new Date(entrega.data_entrega);
      if (isNaN(entregaDate.getTime()) || entregaDate.toDateString() !== selectedDate.toDateString()) {
        return false;
      }
    }

    // Filtro de status
    if (filtroStatus && entrega.status !== filtroStatus) {
      return false;
    }

    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchCliente = entrega.cliente?.nome?.toLowerCase().includes(searchLower);
      const matchRequisicao = entrega.requisicao?.toLowerCase().includes(searchLower);
      const matchTelefone = entrega.cliente?.telefone?.includes(searchTerm);

      if (!matchCliente && !matchRequisicao && !matchTelefone) {
        return false;
      }
    }

    // Filtros adicionais
    if (filtros.motoboy && entrega.motoboy?.nome !== filtros.motoboy) {
      return false;
    }

    if (filtros.regiao && entrega.regiao !== filtros.regiao) {
      return false;
    }

    if (filtros.periodo && entrega.periodo !== filtros.periodo) {
      return false;
    }

    return true;
  });

  // Estatísticas
  const stats = {
    total: entregasFiltradas.length,
    producao: entregasFiltradas.filter(e => e.status === 'Produzindo no Laboratório').length,
    caminho: entregasFiltradas.filter(e => e.status === 'A Caminho').length,
    entregues: entregasFiltradas.filter(e => e.status === 'Entregue').length,
  };

  // Formatação de data
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatMonthYear = (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  // Mudar status da entrega
  const handleMudarStatus = async (entrega, novoStatus) => {
    const toastId = toast.loading('Alterando status...');

    try {
      const { error } = await supabase
        .from('entregas')
        .update({ status: novoStatus })
        .eq('id', entrega.id);

      if (error) throw error;

      toast.success('Status alterado com sucesso!', { id: toastId });
      loadEntregas();
      setDetalhesOpen(false);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status', { id: toastId });
    }
  };

  // Excluir entrega
  const handleExcluir = async () => {
    if (!entregaParaExcluir) return;

    const toastId = toast.loading('Excluindo entrega...');

    try {
      const { error } = await supabase
        .from('entregas')
        .delete()
        .eq('id', entregaParaExcluir.id);

      if (error) throw error;

      toast.success('Entrega excluída com sucesso!', { id: toastId });
      setDeleteDialogOpen(false);
      setEntregaParaExcluir(null);
      setDetalhesOpen(false);
      loadEntregas();
    } catch (error) {
      console.error('Erro ao excluir entrega:', error);
      toast.error('Erro ao excluir entrega', { id: toastId });
    }
  };

  const confirmarExclusao = (entrega) => {
    setEntregaParaExcluir(entrega);
    setDeleteDialogOpen(true);
  };

  const visualizarDetalhes = (entrega) => {
    setEntregaSelecionada(entrega);
    setDetalhesOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Customizado */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900">Entregas Moto</h1>
          <p className="text-sm text-slate-600">Olá, mariaizabeldelima0</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar Esquerda - Calendário */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
            {/* Botões Por Dia / Todos */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setViewMode('day')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{
                  backgroundColor: viewMode === 'day' ? '#376295' : 'white',
                  color: viewMode === 'day' ? 'white' : '#64748b',
                  border: viewMode === 'day' ? 'none' : '1px solid #e2e8f0'
                }}
              >
                <Calendar className="w-4 h-4" />
                Por Dia
              </button>

              <button
                onClick={() => {
                  setViewMode('all');
                  setFiltroStatus('');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{
                  backgroundColor: viewMode === 'all' ? '#376295' : 'white',
                  color: viewMode === 'all' ? 'white' : '#64748b',
                  border: viewMode === 'all' ? 'none' : '1px solid #e2e8f0'
                }}
              >
                <ClipboardList className="w-4 h-4" />
                Todos
              </button>
            </div>

            {/* Navegação do Calendário */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const newDate = new Date(currentMonthDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCurrentMonthDate(newDate);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>

              <span className="text-sm font-semibold text-slate-700">
                {currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>

              <button
                onClick={() => {
                  const newDate = new Date(currentMonthDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCurrentMonthDate(newDate);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Grid do Calendário */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {/* Dias da Semana */}
              {['dom', 'seg', 'ter', 'qua', 'qui', 'sexo', 'sáb'].map((dia) => (
                <div key={dia} className="text-center text-xs font-semibold text-slate-500 py-2">
                  {dia}
                </div>
              ))}

              {/* Dias do Mês */}
              {getDaysInMonth(currentMonthDate).map((dayInfo, index) => {
                if (!dayInfo.isCurrentMonth) {
                  return <div key={index} className="aspect-square" />;
                }

                const isSelected = dayInfo.isSelected;
                const isToday = dayInfo.date?.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(dayInfo.date)}
                    className="aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center hover:bg-blue-50"
                    style={{
                      backgroundColor: isSelected ? '#376295' : 'transparent',
                      color: isSelected ? 'white' : isToday ? '#376295' : '#1e293b',
                      fontWeight: isToday || isSelected ? 'bold' : 'normal'
                    }}
                  >
                    {dayInfo.day}
                  </button>
                );
              })}
            </div>

            {/* Data Selecionada */}
            <div className="text-center pt-4 border-t border-slate-200">
              <div className="text-base font-semibold text-slate-700">
                {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
              </div>
              <div className="text-sm text-slate-500">
                {stats.total} entregas
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {/* Card Total - com borda azul */}
            <div
              onClick={() => setFiltroStatus('')}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
              style={{
                border: '2px solid #376295'
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">Total</span>
                <ClipboardList className="w-6 h-6" style={{ color: '#376295' }} />
              </div>
              <div className="text-4xl font-bold" style={{ color: '#376295' }}>
                {stats.total}
              </div>
            </div>

            {/* Card Produção */}
            <div
              onClick={() => setFiltroStatus('Produzindo no Laboratório')}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">Produção</span>
                <Package className="w-6 h-6" style={{ color: '#7ea8d4' }} />
              </div>
              <div className="text-4xl font-bold text-slate-900">
                {stats.producao}
              </div>
            </div>

            {/* Card Um Caminho */}
            <div
              onClick={() => setFiltroStatus('A Caminho')}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">Um Caminho</span>
                <Truck className="w-6 h-6" style={{ color: '#f97316' }} />
              </div>
              <div className="text-4xl font-bold text-slate-900">
                {stats.caminho}
              </div>
            </div>

            {/* Card Entregues */}
            <div
              onClick={() => setFiltroStatus('Entregue')}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">Entregues</span>
                <Check className="w-6 h-6" style={{ color: '#22c55e' }} />
              </div>
              <div className="text-4xl font-bold text-slate-900">
                {stats.entregues}
              </div>
            </div>

            {/* Card Novo Romaneio */}
            <div
              onClick={() => navigate('/novo-romaneio')}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center text-center"
              style={{
                background: 'linear-gradient(135deg, #890d5d 0%, #6E0A4A 100%)'
              }}
            >
              <span className="text-sm font-medium text-white mb-2">Novo Romaneio</span>
              <div className="text-4xl font-bold text-white">+</div>
            </div>
          </div>

          {/* Seção Buscar e Filtrar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Buscar e Filtrar</h2>

            <div className="space-y-4">
              {/* Campo de Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por cliente, requisição, atendente ou telefone..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Filtros em Linha */}
              <div className="grid grid-cols-5 gap-4">
                <select className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                  <option>Todos os status</option>
                  <option>Produzindo no Laboratório</option>
                  <option>A Caminho</option>
                  <option>Entregue</option>
                </select>

                <select className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                  <option>Todos os 20</option>
                </select>

                <select
                  value={filtros.motoboy}
                  onChange={(e) => setFiltros({ ...filtros, motoboy: e.target.value })}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Todos Motoboys</option>
                  {Array.from(new Set(entregas.map(e => e.motoboy?.nome).filter(Boolean))).map(nome => (
                    <option key={nome} value={nome}>{nome}</option>
                  ))}
                </select>

                <select className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                  <option>Todos os</option>
                </select>

                <select
                  value={filtros.periodo}
                  onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Todos os Períodos</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção de Entregas */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Entregas de {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </h2>
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                <ClipboardList className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Relatório do Dia</span>
              </button>
            </div>

            {/* Empty State */}
            {loading ? (
              <div className="py-24 text-center">
                <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-4 rounded-full animate-spin mb-4"
                  style={{ borderTopColor: '#376295' }}
                />
                <p className="text-slate-600">Carregando entregas...</p>
              </div>
            ) : entregasFiltradas.length === 0 ? (
              <div className="py-24 text-center">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Nenhuma entrega encontrada
                </h3>
                <p className="text-sm text-slate-600">
                  {searchTerm || filtros.motoboy || filtros.regiao || filtros.periodo
                    ? 'Tente ajustar os filtros de busca'
                    : viewMode === 'day'
                    ? 'Não há entregas para esta data'
                    : 'Não há entregas cadastradas'}
                </p>
              </div>
            ) : (
              entregasFiltradas.map((entrega) => (
                <div
                  key={entrega.id}
                  className="p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Informações da Entrega */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Status Badge */}
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor:
                              entrega.status === 'Entregue'
                                ? '#E8F5E8'
                                : entrega.status === 'A Caminho'
                                ? '#F5E8F5'
                                : entrega.status === 'Produzindo no Laboratório'
                                ? '#FEF9E8'
                                : '#f3f4f6',
                            color:
                              entrega.status === 'Entregue'
                                ? '#629537'
                                : entrega.status === 'A Caminho'
                                ? '#6E0A4A'
                                : entrega.status === 'Produzindo no Laboratório'
                                ? '#D8CA15'
                                : '#6b7280'
                          }}
                        >
                          {entrega.status}
                        </span>

                        {/* Requisição */}
                        {entrega.requisicao && (
                          <span className="text-sm font-mono text-slate-600">
                            #{entrega.requisicao}
                          </span>
                        )}
                      </div>

                      {/* Cliente */}
                      <div className="mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {entrega.cliente?.nome || 'Cliente não informado'}
                          </span>
                          {entrega.cliente?.telefone && (
                            <span className="text-sm text-slate-600">
                              • {entrega.cliente.telefone}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Endereço */}
                      {entrega.endereco && (
                        <div className="text-sm text-slate-600 mb-2">
                          {entrega.endereco.logradouro}, {entrega.endereco.numero}
                          {entrega.endereco.complemento && ` - ${entrega.endereco.complemento}`}
                          <br />
                          {entrega.endereco.bairro} - {entrega.endereco.cidade}
                        </div>
                      )}

                      {/* Informações Adicionais */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {entrega.motoboy && (
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4" style={{ color: '#376295' }} />
                            <span className="text-slate-600">{entrega.motoboy.nome}</span>
                          </div>
                        )}
                        {entrega.regiao && (
                          <div className="text-slate-600">
                            <span className="font-medium">Região:</span> {entrega.regiao}
                          </div>
                        )}
                        {entrega.periodo && (
                          <div className="text-slate-600">
                            <span className="font-medium">Período:</span> {entrega.periodo}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => visualizarDetalhes(entrega)}
                        className="p-2 rounded-lg transition-all"
                        style={{ color: '#376295' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8F0F8'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Visualizar detalhes"
                      >
                        <Eye className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => navigate('/editar-romaneio', { state: { entrega } })}
                        className="p-2 rounded-lg transition-all"
                        style={{ color: '#376295' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8F0F8'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Editar entrega"
                      >
                        <Edit className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => confirmarExclusao(entrega)}
                        className="p-2 rounded-lg transition-all"
                        style={{ color: '#C70D12' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Excluir entrega"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={detalhesOpen} onOpenChange={setDetalhesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#376295' }}>Detalhes da Entrega</DialogTitle>
          </DialogHeader>
          {entregaSelecionada && (
            <div className="space-y-4">
              {/* Status Atual */}
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">
                  Status Atual
                </label>
                <span
                  className="inline-block px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    backgroundColor:
                      entregaSelecionada.status === 'Entregue'
                        ? '#E8F5E8'
                        : entregaSelecionada.status === 'A Caminho'
                        ? '#F5E8F5'
                        : '#FEF9E8',
                    color:
                      entregaSelecionada.status === 'Entregue'
                        ? '#629537'
                        : entregaSelecionada.status === 'A Caminho'
                        ? '#6E0A4A'
                        : '#D8CA15'
                  }}
                >
                  {entregaSelecionada.status}
                </span>
              </div>

              {/* Cliente */}
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  Cliente
                </label>
                <div className="text-slate-900">
                  {entregaSelecionada.cliente?.nome || 'Não informado'}
                </div>
                {entregaSelecionada.cliente?.telefone && (
                  <div className="text-sm text-slate-600">
                    {entregaSelecionada.cliente.telefone}
                  </div>
                )}
              </div>

              {/* Endereço */}
              {entregaSelecionada.endereco && (
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">
                    Endereço
                  </label>
                  <div className="text-slate-900">
                    {entregaSelecionada.endereco.logradouro}, {entregaSelecionada.endereco.numero}
                    {entregaSelecionada.endereco.complemento && ` - ${entregaSelecionada.endereco.complemento}`}
                    <br />
                    {entregaSelecionada.endereco.bairro} - {entregaSelecionada.endereco.cidade}
                  </div>
                </div>
              )}

              {/* Botões de Ação no Modal */}
              <div className="flex gap-2 pt-4 border-t border-slate-200">
                {entregaSelecionada.status !== 'Entregue' && (
                  <Button
                    onClick={() => handleMudarStatus(entregaSelecionada, 'Entregue')}
                    style={{ backgroundColor: '#629537' }}
                    className="text-white hover:opacity-90"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Marcar como Entregue
                  </Button>
                )}
                {entregaSelecionada.status !== 'A Caminho' && (
                  <Button
                    onClick={() => handleMudarStatus(entregaSelecionada, 'A Caminho')}
                    style={{ backgroundColor: '#6E0A4A' }}
                    className="text-white hover:opacity-90"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Marcar como A Caminho
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: '#376295' }}>
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta entrega? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              style={{ backgroundColor: '#C70D12' }}
              className="text-white hover:opacity-90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
