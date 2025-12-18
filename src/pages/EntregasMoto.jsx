import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '@/lib/theme';
import { supabase } from '@/api/supabaseClient';

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
};

export default function EntregasMoto() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('day'); // 'day' ou 'all'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState(''); // '' = todos, 'Produzindo no Laboratório', 'A Caminho', 'Entregue'
  const [filtros, setFiltros] = useState({
    motoboy: '',
    regiao: '',
    periodo: ''
  });
  
  // Função para gerar dias do mês
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Dias do mês anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: '', isCurrentMonth: false });
    }
    
    // Dias do mês atual
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
  
  const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                     'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  
  const weekDays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  
  const currentMonth = monthNames[currentMonthDate.getMonth()];
  const currentYear = currentMonthDate.getFullYear();
  
  const previousMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };
  
  const selectDay = (date) => {
    setSelectedDate(date);
  };

  const formatDate = (date) => {
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}/${date.getMonth() + 1}/${year}`;
  };

  // Buscar entregas do Supabase
  const buscarEntregas = async () => {
    try {
      setLoading(true);

      // Query base - buscar entregas com informações de clientes e motoboys
      let query = supabase
        .from('entregas')
        .select(`
          *,
          cliente:clientes(nome, telefone),
          endereco:enderecos(endereco_completo, cidade, bairro),
          motoboy:motoboys(nome)
        `)
        .order('created_at', { ascending: false });

      // Filtrar por data se viewMode = 'day'
      if (viewMode === 'day') {
        const dateStr = selectedDate.toISOString().split('T')[0];
        query = query.eq('data_entrega', dateStr);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntregas(data || []);
    } catch (error) {
      console.error('Erro ao buscar entregas:', error);
      setEntregas([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar entregas quando mudar a data ou viewMode
  useEffect(() => {
    buscarEntregas();
  }, [selectedDate, viewMode]);

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const total = entregas.length;
    const producao = entregas.filter(e => e.status === 'Produzindo no Laboratório').length;
    const caminho = entregas.filter(e => e.status === 'A Caminho').length;
    const entregues = entregas.filter(e => e.status === 'Entregue').length;

    return { total, producao, caminho, entregues };
  };

  const stats = calcularEstatisticas();

  // Filtrar entregas (busca + filtros)
  const entregasFiltradas = entregas.filter(entrega => {
    // Filtro de busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      const cliente = entrega.cliente?.nome?.toLowerCase() || '';
      const requisicao = entrega.requisicao?.toLowerCase() || '';
      const telefone = entrega.cliente?.telefone?.toLowerCase() || '';

      if (!cliente.includes(termo) && !requisicao.includes(termo) && !telefone.includes(termo)) {
        return false;
      }
    }

    // Filtro de status (via cards)
    if (filtroStatus && entrega.status !== filtroStatus) return false;

    // Outros filtros
    if (filtros.motoboy && entrega.motoboy?.nome !== filtros.motoboy) return false;
    if (filtros.regiao && entrega.regiao !== filtros.regiao) return false;
    if (filtros.periodo && entrega.periodo !== filtros.periodo) return false;

    return true;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.colors.background }}>
      {/* Calendário Lateral */}
      <div style={{
        width: '320px',
        background: 'white',
        borderRight: `1px solid ${theme.colors.border}`,
        padding: '1.5rem',
        overflowY: 'auto'
      }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: '1rem'
        }}>
          Selecione um dado
        </h3>
        
        {/* Navegação do Calendário */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <button onClick={previousMonth} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            color: theme.colors.text
          }}>
            <Icons.chevronLeft />
          </button>
          <span style={{ fontSize: '0.875rem', fontWeight: '500', textTransform: 'capitalize' }}>
            {monthNames[currentMonthDate.getMonth()]} de {currentMonthDate.getFullYear()}
          </span>
          <button onClick={nextMonth} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            color: theme.colors.text
          }}>
            <Icons.chevronRight />
          </button>
        </div>
        
        {/* Grade do Calendário */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.25rem',
          marginBottom: '0.5rem'
        }}>
          {weekDays.map(day => (
            <div key={day} style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: theme.colors.textLight,
              padding: '0.25rem'
            }}>
              {day}
            </div>
          ))}
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.25rem'
        }}>
          {getDaysInMonth(currentMonthDate).map((dayObj, idx) => (
            <button
              key={idx}
              disabled={!dayObj.isCurrentMonth}
              onClick={() => dayObj.isCurrentMonth && selectDay(dayObj.date)}
              style={{
                padding: '0.5rem',
                border: 'none',
                background: dayObj.isSelected ? theme.colors.primary : 'transparent',
                color: dayObj.isSelected ? 'white' : 
                       dayObj.isCurrentMonth ? theme.colors.text : theme.colors.textLight,
                borderRadius: '0.25rem',
                cursor: dayObj.isCurrentMonth ? 'pointer' : 'default',
                fontSize: '0.875rem',
                fontWeight: dayObj.isSelected ? '600' : '400'
              }}
            >
              {dayObj.day}
            </button>
          ))}
        </div>
        
        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          padding: '1rem',
          background: theme.colors.background,
          borderRadius: '0.5rem'
        }}>
          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: theme.colors.text }}>
            {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
          </p>
          <p style={{ fontSize: '0.75rem', color: theme.colors.textLight }}>
            {viewMode === 'day' ? entregas.length : 'Todos'} {entregas.length === 1 ? 'entrega' : 'entregas'}
          </p>
        </div>
        
        {/* Relatório do Dia */}
        <button
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'white',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: theme.colors.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Icons.clipboard />
          Relatório do Dia
        </button>
      </div>
      
      {/* Conteúdo Principal */}
      <div style={{ flex: 1, padding: '2rem' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              fontSize: '1.875rem', 
              fontWeight: '700',
              color: theme.colors.text,
              marginBottom: '0.25rem'
            }}>
              Entregas Moto
            </h1>
            <p style={{ color: theme.colors.textLight, fontSize: '0.875rem' }}>
              Olá, mariaizabeldelima0
            </p>
          </div>
          
          {/* Botões Por Dia / Todos / Novo Romaneio */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setViewMode('day')}
              style={{
                padding: '0.625rem 1.25rem',
                background: viewMode === 'day' ? theme.colors.primary : 'white',
                color: viewMode === 'day' ? 'white' : theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Icons.calendar />
              Por Dia
            </button>
            <button
              onClick={() => setViewMode('all')}
              style={{
                padding: '0.625rem 1.25rem',
                background: viewMode === 'all' ? theme.colors.primary : 'white',
                color: viewMode === 'all' ? 'white' : theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Todos
            </button>
            <button
              onClick={() => navigate('/novo-romaneio')}
              style={{
                padding: '0.625rem 1.25rem',
                background: theme.colors.secondary,
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
          
          {/* Campo de Busca */}
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
          
          {/* Filtros */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem'
          }}>
            {/* Filtro de Motoboy */}
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

            {/* Filtro de Região */}
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
              <option value="">Todos os Locais</option>
              <option value="BC">BC</option>
              <option value="ITAJAI">Itajaí</option>
              <option value="CAMBORIÚ">Camboriú</option>
              <option value="PRAIA BRAVA">Praia Brava</option>
              <option value="ITAPEMA">Itapema</option>
            </select>

            {/* Filtro de Período */}
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
              <option value="">Todos os Períodos</option>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
            </select>
          </div>
        </div>

        {/* Lista de Entregas */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: theme.colors.text,
              margin: 0
            }}>
              Entregas de {formatDate(selectedDate)}
            </h3>
            <button
              style={{
                padding: '0.5rem 1rem',
                background: 'white',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: theme.colors.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Icons.clipboard />
              Relatório do Dia
            </button>
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
                  : viewMode === 'day'
                    ? 'Não há entregas agendadas para este dia'
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
                    gridTemplateColumns: '1fr auto',
                    gap: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.primary;
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border;
                    e.currentTarget.style.boxShadow = 'none';
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
                      📍 {entrega.endereco?.endereco_completo || entrega.endereco_destino}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}