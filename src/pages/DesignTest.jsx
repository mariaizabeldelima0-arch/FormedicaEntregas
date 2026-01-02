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
  Edit,
  Trash2,
  Clock,
  Banknote,
  Phone,
  Snowflake,
  FileText
} from 'lucide-react';
import { PageHeader, LoadingState, EmptyState } from '@/components';

// Componente de Dropdown Customizado
function CustomDropdown({ options, value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}
      >
        <span className="text-sm text-slate-700">{displayText}</span>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ border: '1px solid #376295' }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="px-4 py-3 cursor-pointer transition-colors text-sm text-slate-700 hover:bg-blue-50"
              style={{
                backgroundColor: value === option.value ? '#E8F0F8' : 'white',
                fontWeight: value === option.value ? '600' : 'normal'
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [cardSelecionado, setCardSelecionado] = useState('total');
  const [filtros, setFiltros] = useState({
    status: '',
    atendente: '',
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
          valor: 45.50,
          forma_pagamento: 'Dinheiro',
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
          valor: 32.00,
          forma_pagamento: 'Cartão',
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
          valor: 28.75,
          forma_pagamento: 'Pix',
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
        },
        {
          id: 'exemplo-4',
          status: 'A Caminho',
          requisicao: 'REQ-001',
          data_entrega: selectedDate.toISOString(),
          regiao: 'ITAJAÍ',
          periodo: 'Tarde',
          valor: 52.00,
          forma_pagamento: 'Boleto',
          item_geladeira: true,
          cliente: {
            nome: 'Roberto Santos Silva',
            telefone: '(47) 99876-5432'
          },
          endereco: {
            logradouro: 'Rua das Acácias',
            numero: '456',
            complemento: 'Casa',
            bairro: 'Centro',
            cidade: 'Itajaí'
          },
          motoboy: {
            nome: 'Marcio'
          }
        },
        {
          id: 'exemplo-5',
          status: 'Produzindo no Laboratório',
          requisicao: 'REQ-002',
          data_entrega: selectedDate.toISOString(),
          regiao: 'PRAIA BRAVA',
          periodo: 'Manhã',
          valor: 65.00,
          forma_pagamento: 'Pix - Aguardando',
          reter_receita: true,
          cliente: {
            nome: 'Fernanda Lima Costa',
            telefone: '(47) 98888-7777'
          },
          endereco: {
            logradouro: 'Avenida Atlântica',
            numero: '2000',
            complemento: 'Apto 302',
            bairro: 'Praia Brava',
            cidade: 'Balneário Camboriú'
          },
          motoboy: {
            nome: 'Bruno'
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
      <div className="px-6 py-6 shadow-sm" style={{
        background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)'
      }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Entregas Moto</h1>
          <p className="text-sm text-white opacity-90">Olá, mariaizabeldelima0</p>
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
                {currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
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
              {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((dia) => (
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

            {/* Botão Relatório do Dia */}
            <button
              onClick={() => {
                const dataFormatada = selectedDate.toISOString().split('T')[0];
                navigate(`/relatorios?data=${dataFormatada}`);
              }}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ClipboardList className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Relatório do Dia</span>
            </button>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {/* Card Total */}
            <div
              onClick={() => { setFiltroStatus(''); setCardSelecionado('total'); }}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
              style={{
                border: cardSelecionado === 'total' ? '2px solid #376295' : '2px solid transparent'
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F0F8' }}>
                  <ClipboardList className="w-6 h-6" style={{ color: '#376295' }} />
                </div>
                <span className="text-sm font-bold text-slate-700">Total</span>
              </div>
              <div className="text-4xl font-bold text-center" style={{ color: '#376295' }}>
                {stats.total}
              </div>
            </div>

            {/* Card Produção */}
            <div
              onClick={() => { setFiltroStatus('Produzindo no Laboratório'); setCardSelecionado('producao'); }}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
              style={{
                border: cardSelecionado === 'producao' ? '2px solid #890d5d' : '2px solid transparent'
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#F5E8F5' }}>
                  <Package className="w-6 h-6" style={{ color: '#890d5d' }} />
                </div>
                <span className="text-sm font-bold text-slate-700">Produção</span>
              </div>
              <div className="text-4xl font-bold text-center" style={{ color: '#890d5d' }}>
                {stats.producao}
              </div>
            </div>

            {/* Card A Caminho */}
            <div
              onClick={() => { setFiltroStatus('A Caminho'); setCardSelecionado('caminho'); }}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
              style={{
                border: cardSelecionado === 'caminho' ? '2px solid #f97316' : '2px solid transparent'
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#FEF3E8' }}>
                  <Truck className="w-6 h-6" style={{ color: '#f97316' }} />
                </div>
                <span className="text-sm font-bold text-slate-700">A Caminho</span>
              </div>
              <div className="text-4xl font-bold text-center" style={{ color: '#f97316' }}>
                {stats.caminho}
              </div>
            </div>

            {/* Card Entregues */}
            <div
              onClick={() => { setFiltroStatus('Entregue'); setCardSelecionado('entregues'); }}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md"
              style={{
                border: cardSelecionado === 'entregues' ? '2px solid #22c55e' : '2px solid transparent'
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F5E8' }}>
                  <Check className="w-6 h-6" style={{ color: '#22c55e' }} />
                </div>
                <span className="text-sm font-bold text-slate-700">Entregues</span>
              </div>
              <div className="text-4xl font-bold text-center" style={{ color: '#22c55e' }}>
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
              <div className="mb-1">
                <span className="text-sm font-bold text-white uppercase">Novo Romaneio</span>
              </div>
              <div className="text-5xl font-bold text-white">+</div>
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
                <CustomDropdown
                  options={[
                    { value: '', label: 'Status' },
                    { value: 'Produzindo no Laboratório', label: 'Produzindo no Laboratório' },
                    { value: 'A Caminho', label: 'A Caminho' },
                    { value: 'Entregue', label: 'Entregue' }
                  ]}
                  value={filtros.status}
                  onChange={(value) => setFiltros({ ...filtros, status: value })}
                  placeholder="Status"
                />

                <CustomDropdown
                  options={[
                    { value: '', label: 'Atendentes' }
                  ]}
                  value={filtros.atendente}
                  onChange={(value) => setFiltros({ ...filtros, atendente: value })}
                  placeholder="Atendentes"
                />

                <CustomDropdown
                  options={[
                    { value: '', label: 'Motoboys' },
                    ...Array.from(new Set(entregas.map(e => e.motoboy?.nome).filter(Boolean))).map(nome => ({
                      value: nome,
                      label: nome
                    }))
                  ]}
                  value={filtros.motoboy}
                  onChange={(value) => setFiltros({ ...filtros, motoboy: value })}
                  placeholder="Motoboys"
                />

                <CustomDropdown
                  options={[
                    { value: '', label: 'Regiões' },
                    ...Array.from(new Set(entregas.map(e => e.regiao).filter(Boolean))).map(regiao => ({
                      value: regiao,
                      label: regiao
                    }))
                  ]}
                  value={filtros.regiao}
                  onChange={(value) => setFiltros({ ...filtros, regiao: value })}
                  placeholder="Regiões"
                />

                <CustomDropdown
                  options={[
                    { value: '', label: 'Períodos' },
                    { value: 'Manhã', label: 'Manhã' },
                    { value: 'Tarde', label: 'Tarde' }
                  ]}
                  value={filtros.periodo}
                  onChange={(value) => setFiltros({ ...filtros, periodo: value })}
                  placeholder="Períodos"
                />
              </div>
            </div>
          </div>

          {/* Seção de Entregas */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {/* Cabeçalho */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Entregas de {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </h2>
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
                  onClick={() => visualizarDetalhes(entrega)}
                  className="p-5 mb-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all cursor-pointer hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-6">
                    {/* Lado Esquerdo - Informações */}
                    <div className="flex-1">
                      {/* Linha 1: Requisição + Status */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base font-semibold" style={{ color: '#376295' }}>
                          #{entrega.requisicao}
                        </span>
                        <span
                          className="px-3 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor:
                              entrega.status === 'Entregue'
                                ? '#E8F5E8'
                                : entrega.status === 'A Caminho'
                                ? '#FEF3E8'
                                : '#F5E8F5',
                            color:
                              entrega.status === 'Entregue'
                                ? '#22c55e'
                                : entrega.status === 'A Caminho'
                                ? '#f97316'
                                : '#890d5d'
                          }}
                        >
                          {entrega.status === 'Produzindo no Laboratório' ? 'Produção' : entrega.status}
                        </span>
                      </div>

                      {/* Linha 2: Nome do Cliente */}
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {entrega.cliente?.nome || 'Cliente não informado'}
                      </h3>

                      {/* Linha 3: Endereço */}
                      <div className="mb-3 text-sm text-slate-600">
                        <span>
                          {entrega.endereco
                            ? `${entrega.endereco.logradouro}, ${entrega.endereco.numero} - ${entrega.endereco.bairro} - ${entrega.endereco.cidade}`
                            : entrega.endereco_destino || 'Endereço não informado'}
                        </span>
                      </div>

                      {/* Linha 4: Informações com ícones */}
                      <div className="flex flex-wrap gap-4 text-sm text-slate-900">
                        {entrega.motoboy && (
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4" style={{ color: '#1e293b' }} />
                            <span>{entrega.motoboy.nome}</span>
                          </div>
                        )}
                        {entrega.periodo && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" style={{ color: '#1e293b' }} />
                            <span>{entrega.periodo}</span>
                          </div>
                        )}
                        {entrega.forma_pagamento && (
                          <div className="flex items-center gap-1.5">
                            <Banknote className="w-4 h-4" style={{ color: '#1e293b' }} />
                            <span>{entrega.forma_pagamento}</span>
                          </div>
                        )}
                        {entrega.cliente?.telefone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4" style={{ color: '#1e293b' }} />
                            <span>{entrega.cliente.telefone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lado Direito - Badges + Valor + Região + Ações */}
                    <div className="flex flex-col items-center gap-3">
                      {/* Badges Geladeira e Reter Receita */}
                      {(entrega.item_geladeira || entrega.reter_receita) && (
                        <div className="flex items-center gap-2">
                          {entrega.item_geladeira && (
                            <span className="px-4 py-2 rounded text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: '#cffafe', color: '#0c4a6e' }}>
                              <Snowflake className="w-5 h-5" />
                              Geladeira
                            </span>
                          )}
                          {entrega.reter_receita && (
                            <span className="px-4 py-2 rounded text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                              <FileText className="w-5 h-5" />
                              Reter Receita
                            </span>
                          )}
                        </div>
                      )}

                      {/* Valor, Região e Botões */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold" style={{ color: '#376295' }}>
                            R$ {entrega.valor?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-sm font-medium" style={{ color: '#376295' }}>
                            {entrega.regiao}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/editar-romaneio', { state: { entrega } });
                            }}
                            className="p-2 rounded-lg transition-all border border-slate-300 hover:bg-slate-50"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" style={{ color: '#376295' }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmarExclusao(entrega);
                            }}
                            className="p-2 rounded-lg transition-all border border-slate-300 hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </div>
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
