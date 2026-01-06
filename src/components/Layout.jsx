import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/lib/theme';

// Ícones SVG simples
const Icons = {
  entregas: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  aviao: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
  ),
  adicionar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  usuarios: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  historico: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  grafico: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  documento: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  dinheiro: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  calendario: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  moto: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="5" cy="18" r="3"/>
      <circle cx="19" cy="18" r="3"/>
      <path d="M5.59 13.51l2.53-2.53L10 13v5l-.47-.53L7 15 5.59 13.51z"/>
      <path d="M12 13v5l2-2 2.5 2.5 1-1L15 15"/>
      <path d="M16 8h2l2 5"/>
    </svg>
  ),
  celular: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),
};

export default function Layout({ children }) {
  const { user, userType, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  const menuItems = {
    admin: [
      { icon: 'entregas', label: 'Entregas Moto', path: '/' },
      { icon: 'aviao', label: 'Sedex/Disktenha', path: '/sedex' },
      { icon: 'adicionar', label: 'Novo Romaneio', path: '/novo-romaneio' },
      { icon: 'usuarios', label: 'Clientes', path: '/clientes' },
      { icon: 'grafico', label: 'Relatórios', path: '/relatorios' },
      { icon: 'documento', label: 'Receitas', path: '/receitas' },
      { icon: 'dinheiro', label: 'Pagamentos', path: '/pagamentos' },
      { icon: 'calendario', label: 'Planilha Diária', path: '/planilha-diaria' },
      { icon: 'moto', label: 'Painel dos Motoboys', path: '/painel-motoboys' },
      { icon: 'celular', label: 'Dispositivos', path: '/dispositivos' },
    ],
    atendente: [
      { icon: 'entregas', label: 'Entregas Moto', path: '/' },
      { icon: 'aviao', label: 'Sedex/Disktenha', path: '/sedex' },
      { icon: 'adicionar', label: 'Novo Romaneio', path: '/novo-romaneio' },
      { icon: 'usuarios', label: 'Clientes', path: '/clientes' },
      { icon: 'grafico', label: 'Relatórios', path: '/relatorios' },
      { icon: 'dinheiro', label: 'Pagamentos', path: '/pagamentos' },
    ],
    motoboy: [
      { icon: 'moto', label: 'Minhas Entregas', path: '/' },
    ],
  };

  const currentMenu = menuItems[userType] || menuItems.admin;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.colors.background }}>
      {/* Menu Lateral */}
      <div style={{
        width: isMenuExpanded ? '200px' : '64px',
        background: 'white',
        borderRight: `1px solid ${theme.colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease'
      }}>
        {/* Logo */}
        <div style={{
          padding: '2rem 1rem',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMenuExpanded ? 'flex-start' : 'center',
          gap: '0.75rem',
          height: '132px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: theme.colors.primary,
            borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.125rem',
            flexShrink: 0
          }}>
            F
          </div>
          {isMenuExpanded && (
            <div style={{
              overflow: 'hidden',
              transition: 'opacity 0.3s ease',
              flex: 1
            }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: theme.colors.text,
                margin: 0,
                lineHeight: 1.2,
                whiteSpace: 'nowrap'
              }}>
                Formédica
              </h2>
              <p style={{
                fontSize: '0.75rem',
                color: theme.colors.textLight,
                margin: 0,
                lineHeight: 1.2,
                whiteSpace: 'nowrap'
              }}>
                Entregas
              </p>
            </div>
          )}
        </div>

        {/* Botão Toggle */}
        <div style={{
          padding: '0.75rem 1rem',
          borderBottom: `1px solid ${theme.colors.border}`
        }}>
          <button
            onClick={() => setIsMenuExpanded(!isMenuExpanded)}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              cursor: 'pointer',
              color: theme.colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.375rem',
              transition: 'background 0.15s',
              width: '100%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            title={isMenuExpanded ? 'Recolher menu' : 'Expandir menu'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMenuExpanded ? (
                <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
              ) : (
                <path d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
              )}
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, padding: '0.5rem 0', overflowY: 'auto' }}>
          {isMenuExpanded && (
            <p style={{
              padding: '0.5rem 1rem',
              fontSize: '0.6875rem',
              fontWeight: '600',
              color: theme.colors.textLight,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem'
            }}>
              Menu Principal
            </p>
          )}
          {currentMenu.map((item) => {
            const isActive = location.pathname === item.path;
            const IconComponent = Icons[item.icon];
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={!isMenuExpanded ? item.label : ''}
                style={{
                  width: '100%',
                  padding: isMenuExpanded ? '0.625rem 1rem' : '0.625rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isMenuExpanded ? 'flex-start' : 'center',
                  gap: '0.75rem',
                  border: 'none',
                  background: isActive ? `${theme.colors.primary}10` : 'transparent',
                  color: isActive ? theme.colors.primary : theme.colors.text,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? '500' : '400',
                  borderLeft: isActive ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
                  textAlign: 'left',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {IconComponent && <IconComponent />}
                </span>
                {isMenuExpanded && (
                  <span style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div style={{
          padding: '1rem',
          borderTop: `1px solid ${theme.colors.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMenuExpanded ? 'flex-start' : 'center',
            gap: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                background: theme.colors.secondary,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.875rem',
                flexShrink: 0
              }}
              title={!isMenuExpanded ? user?.nome || 'Usuário' : ''}
            >
              {user?.nome?.charAt(0) || 'U'}
            </div>
            {isMenuExpanded && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  color: theme.colors.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {user?.nome || 'Usuário'}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '0.6875rem',
                  color: theme.colors.textLight,
                  textTransform: 'capitalize'
                }}>
                  {userType}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            title={!isMenuExpanded ? 'Sair' : ''}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '0.375rem',
              color: theme.colors.text,
              cursor: 'pointer',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: '500'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {isMenuExpanded && <span>Sair</span>}
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}