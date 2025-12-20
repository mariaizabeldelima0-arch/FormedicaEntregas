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

// Ícones SVG
const Icons = {
  clipboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  box: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  truck: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  calendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  chevronLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  chevronRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  edit: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  trash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
};

export default function EntregasMoto() {
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

  // Carregar entregas
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
      setEntregas(data || []);
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
      const entregaDate = new Date(entrega.data_entrega);
      if (entregaDate.toDateString() !== selectedDate.toDateString()) {
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
    <div style={{ padding: '2rem', background: theme.colors.background, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: theme.colors.text
            }}>
              Entregas Moto
            </h1>
            <button
              onClick={() => navigate('/novo-romaneio')}
              style={{
                padding: '0.75rem 1.5rem',
                background: theme.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              + Novo Romaneio
            </button>
          </div>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {[
            { label: 'Total', value: stats.total, color: theme.colors.primary, icon: 'clipboard', statusFilter: '' },
            { label: 'Produção', value: stats.producao, color: '#3b82f6', icon: 'box', statusFilter: 'Produzindo no Laboratório' },
            { label: 'A Caminho', value: stats.caminho, color: '#f59e0b', icon: 'truck', statusFilter: 'A Caminho' },
            { label: 'Entregues', value: stats.entregues, color: theme.colors.success, icon: 'check', statusFilter: 'Entregue' },
          ].map((card) => {
            const IconComponent = Icons[card.icon];
            const isActive = filtroStatus === card.statusFilter;
            return (
              <div
                key={card.label}
                onClick={() => setFiltroStatus(card.statusFilter)}
                style={{
                  background: isActive ? card.color : 'white',
                  padding: '1.25rem',
                  borderRadius: '0.5rem',
                  border: isActive ? `2px solid ${card.color}` : `1px solid ${theme.colors.border}`,
                  boxShadow: isActive ? `0 4px 12px ${card.color}40` : '0 1px 2px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  transform: isActive ? 'translateY(-2px)' : 'none'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ color: isActive ? 'white' : card.color }}>
                    {IconComponent && <IconComponent />}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: isActive ? 'white' : card.color
                  }}>
                    {card.label}
                  </span>
                </div>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: isActive ? 'white' : theme.colors.text,
                  margin: 0
                }}>
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Buscar e Filtrar */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: '1rem'
          }}>
            Buscar e Filtrar
          </h3>

          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, requisição ou telefone..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
            <div style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.colors.textLight
            }}>
              <Icons.search />
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem'
          }}>
            <select
              value={filtros.motoboy}
              onChange={(e) => setFiltros({...filtros, motoboy: e.target.value})}
              style={{
                padding: '0.625rem 1rem',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: theme.colors.text,
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">Todos Motoboys</option>
              <option value="Marcio">Marcio</option>
              <option value="Bruno">Bruno</option>
            </select>

            <select
              value={filtros.regiao}
              onChange={(e) => setFiltros({...filtros, regiao: e.target.value})}
              style={{
                padding: '0.625rem 1rem',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: theme.colors.text,
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">Todas Regiões</option>
              <option value="BC">BC</option>
              <option value="ITAJAI">Itajaí</option>
              <option value="ITAPEMA">Itapema</option>
              <option value="NAVEGANTES">Navegantes</option>
            </select>

            <select
              value={filtros.periodo}
              onChange={(e) => setFiltros({...filtros, periodo: e.target.value})}
              style={{
                padding: '0.625rem 1rem',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: theme.colors.text,
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">Todos Períodos</option>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
            </select>
          </div>
        </div>

        {/* Calendário */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '1.5rem'
        }}>
          {/* Header do Calendário */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.calendar />
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: theme.colors.text,
                margin: 0
              }}>
                Calendário
              </h3>
            </div>
            <div style={{
              display: 'inline-flex',
              background: theme.colors.background,
              borderRadius: '0.375rem',
              padding: '0.25rem'
            }}>
              <button
                onClick={() => setViewMode('day')}
                style={{
                  padding: '0.5rem 1rem',
                  background: viewMode === 'day' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: viewMode === 'day' ? theme.colors.primary : theme.colors.textLight,
                  boxShadow: viewMode === 'day' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                Dia
              </button>
              <button
                onClick={() => setViewMode('month')}
                style={{
                  padding: '0.5rem 1rem',
                  background: viewMode === 'month' ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: viewMode === 'month' ? theme.colors.primary : theme.colors.textLight,
                  boxShadow: viewMode === 'month' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                Mês
              </button>
            </div>
          </div>

          {/* Navegação do mês */}
          {viewMode === 'month' && (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <button
                  onClick={() => {
                    const newDate = new Date(currentMonthDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setCurrentMonthDate(newDate);
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'white',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    color: theme.colors.text
                  }}
                >
                  <Icons.chevronLeft />
                </button>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: theme.colors.text,
                  margin: 0,
                  textTransform: 'capitalize'
                }}>
                  {formatMonthYear(currentMonthDate)}
                </h4>
                <button
                  onClick={() => {
                    const newDate = new Date(currentMonthDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setCurrentMonthDate(newDate);
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'white',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    color: theme.colors.text
                  }}
                >
                  <Icons.chevronRight />
                </button>
              </div>

              {/* Grid do Calendário */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.5rem'
              }}>
                {/* Cabeçalho dos dias da semana */}
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div
                    key={day}
                    style={{
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: theme.colors.textLight,
                      padding: '0.5rem'
                    }}
                  >
                    {day}
                  </div>
                ))}

                {/* Dias do mês */}
                {getDaysInMonth(currentMonthDate).map((dayInfo, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      if (dayInfo.isCurrentMonth) {
                        setSelectedDate(dayInfo.date);
                        setViewMode('day');
                      }
                    }}
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: dayInfo.isSelected ? '600' : '400',
                      color: dayInfo.isCurrentMonth ? theme.colors.text : theme.colors.textLight,
                      background: dayInfo.isSelected ? theme.colors.primary : 'transparent',
                      border: dayInfo.isSelected ? 'none' : `1px solid ${theme.colors.border}`,
                      borderRadius: '0.375rem',
                      cursor: dayInfo.isCurrentMonth ? 'pointer' : 'default',
                      opacity: dayInfo.isCurrentMonth ? 1 : 0.4,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (dayInfo.isCurrentMonth && !dayInfo.isSelected) {
                        e.currentTarget.style.background = theme.colors.background;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!dayInfo.isSelected) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {dayInfo.day}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Visualização de dia único */}
          {viewMode === 'day' && (
            <div style={{
              padding: '1rem',
              background: theme.colors.background,
              borderRadius: '0.375rem',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: theme.colors.primary,
                margin: 0,
                textTransform: 'capitalize'
              }}>
                {formatDate(selectedDate)}
              </p>
              <button
                onClick={() => setViewMode('month')}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'white',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: theme.colors.text
                }}
              >
                Ver Calendário Completo
              </button>
            </div>
          )}
        </div>

        {/* Lista de Entregas */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: `1px solid ${theme.colors.border}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: theme.colors.text,
              margin: 0
            }}>
              Entregas {viewMode === 'day' ? `de ${formatDate(selectedDate)}` : ''}
            </h3>
          </div>

          {loading ? (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid #e2e8f0',
                borderTop: '4px solid #457bba',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }} />
              <p style={{ color: theme.colors.textLight }}>Carregando entregas...</p>
            </div>
          ) : entregasFiltradas.length === 0 ? (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>📦</div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: theme.colors.text,
                marginBottom: '0.5rem'
              }}>
                Nenhum romaneio encontrado
              </h3>
              <p style={{
                color: theme.colors.textLight,
                fontSize: '0.875rem'
              }}>
                {searchTerm || Object.values(filtros).some(f => f)
                  ? 'Nenhuma entrega corresponde aos filtros aplicados'
                  : 'Não há entregas cadastradas'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {entregasFiltradas.map(entrega => (
                <div
                  key={entrega.id}
                  style={{
                    padding: '1rem',
                    background: theme.colors.background,
                    borderRadius: '0.375rem',
                    border: `1px solid ${theme.colors.border}`,
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: '1rem',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Informações principais */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: theme.colors.primary
                      }}>
                        #{entrega.requisicao}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        background: entrega.status === 'Entregue' ? '#dcfce7' :
                                   entrega.status === 'A Caminho' ? '#fef3c7' : '#dbeafe',
                        color: entrega.status === 'Entregue' ? '#166534' :
                               entrega.status === 'A Caminho' ? '#92400e' : '#1e40af',
                        borderRadius: '0.25rem',
                        fontWeight: '500'
                      }}>
                        {entrega.status}
                      </span>
                      {entrega.item_geladeira && (
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.5rem',
                          background: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '0.25rem',
                          fontWeight: '500'
                        }}>
                          ❄️ Geladeira
                        </span>
                      )}
                    </div>

                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: theme.colors.text,
                      marginBottom: '0.25rem'
                    }}>
                      {entrega.cliente?.nome || 'Cliente não informado'}
                    </h4>

                    <p style={{
                      fontSize: '0.875rem',
                      color: theme.colors.textLight,
                      marginBottom: '0.5rem'
                    }}>
                      📍 {entrega.endereco ? `${entrega.endereco.logradouro}, ${entrega.endereco.numero} - ${entrega.endereco.bairro} - ${entrega.endereco.cidade}` : entrega.endereco_destino}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: theme.colors.textLight }}>
                      <span>🏍️ {entrega.motoboy?.nome || 'Sem motoboy'}</span>
                      <span>🕐 {entrega.periodo}</span>
                      <span>💰 {entrega.forma_pagamento}</span>
                      {entrega.cliente?.telefone && <span>📞 {entrega.cliente.telefone}</span>}
                    </div>
                  </div>

                  {/* Valor */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'center'
                  }}>
                    <span style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: theme.colors.primary
                    }}>
                      R$ {entrega.valor?.toFixed(2) || '0.00'}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      color: theme.colors.textLight
                    }}>
                      {entrega.regiao}
                    </span>
                  </div>

                  {/* Botões de Ação */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => visualizarDetalhes(entrega)}
                      style={{
                        padding: '0.5rem',
                        background: 'white',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        color: theme.colors.primary
                      }}
                      title="Ver detalhes"
                    >
                      <Icons.eye />
                    </button>
                    <button
                      onClick={() => navigate(`/editar-romaneio/${entrega.id}`)}
                      style={{
                        padding: '0.5rem',
                        background: 'white',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        color: theme.colors.primary
                      }}
                      title="Editar"
                    >
                      <Icons.edit />
                    </button>
                    <button
                      onClick={() => confirmarExclusao(entrega)}
                      style={{
                        padding: '0.5rem',
                        background: 'white',
                        border: `1px solid #fee2e2`,
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        color: '#ef4444'
                      }}
                      title="Excluir"
                    >
                      <Icons.trash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de Detalhes */}
      <Dialog open={detalhesOpen} onOpenChange={setDetalhesOpen}>
        <DialogContent style={{ maxWidth: '600px' }}>
          <DialogHeader>
            <DialogTitle>Detalhes da Entrega #{entregaSelecionada?.requisicao}</DialogTitle>
          </DialogHeader>
          {entregaSelecionada && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Status Atual */}
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Status Atual</h4>
                <span style={{
                  fontSize: '0.875rem',
                  padding: '0.25rem 0.75rem',
                  background: entregaSelecionada.status === 'Entregue' ? '#dcfce7' :
                             entregaSelecionada.status === 'A Caminho' ? '#fef3c7' : '#dbeafe',
                  color: entregaSelecionada.status === 'Entregue' ? '#166534' :
                         entregaSelecionada.status === 'A Caminho' ? '#92400e' : '#1e40af',
                  borderRadius: '0.25rem',
                  fontWeight: '500'
                }}>
                  {entregaSelecionada.status}
                </span>
              </div>

              {/* Alterar Status */}
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Alterar Status</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['Produzindo no Laboratório', 'A Caminho', 'Entregue'].map(status => (
                    <Button
                      key={status}
                      onClick={() => handleMudarStatus(entregaSelecionada, status)}
                      disabled={entregaSelecionada.status === status}
                      variant={entregaSelecionada.status === status ? 'default' : 'outline'}
                      size="sm"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Informações do Cliente */}
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Cliente</h4>
                <p style={{ fontSize: '0.875rem', color: theme.colors.text }}>
                  {entregaSelecionada.cliente?.nome}<br />
                  {entregaSelecionada.cliente?.telefone}
                </p>
              </div>

              {/* Endereço */}
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Endereço</h4>
                <p style={{ fontSize: '0.875rem', color: theme.colors.text }}>
                  {entregaSelecionada.endereco ?
                    `${entregaSelecionada.endereco.logradouro}, ${entregaSelecionada.endereco.numero} - ${entregaSelecionada.endereco.bairro} - ${entregaSelecionada.endereco.cidade}` :
                    entregaSelecionada.endereco_destino
                  }
                </p>
              </div>

              {/* Detalhes da Entrega */}
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Detalhes</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div><strong>Motoboy:</strong> {entregaSelecionada.motoboy?.nome || 'Não definido'}</div>
                  <div><strong>Período:</strong> {entregaSelecionada.periodo}</div>
                  <div><strong>Região:</strong> {entregaSelecionada.regiao}</div>
                  <div><strong>Pagamento:</strong> {entregaSelecionada.forma_pagamento}</div>
                  <div><strong>Valor:</strong> R$ {entregaSelecionada.valor?.toFixed(2)}</div>
                  <div><strong>Data:</strong> {new Date(entregaSelecionada.data_entrega).toLocaleDateString('pt-BR')}</div>
                </div>
                {entregaSelecionada.observacoes && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Observações:</strong>
                    <p style={{ marginTop: '0.25rem' }}>{entregaSelecionada.observacoes}</p>
                  </div>
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
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A entrega <strong>#{entregaParaExcluir?.requisicao}</strong> será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEntregaParaExcluir(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} style={{ background: '#ef4444' }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
