import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/lib/theme';

export default function Layout({ children }) {
  const { user, userType, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(true);

  const menuItems = {
    admin: [
      { icon: '🏠', label: 'Entregas Moto', path: '/' },
      { icon: '✈️', label: 'Sedex/Disktenha', path: '/sedex' },
      { icon: '➕', label: 'Novo Romaneio', path: '/novo-romaneio' },
      { icon: '👥', label: 'Clientes', path: '/clientes' },
      { icon: '📋', label: 'Histórico de Clientes', path: '/historico-clientes' },
      { icon: '📊', label: 'Relatórios', path: '/relatorios' },
      { icon: '📄', label: 'Receitas', path: '/receitas' },
      { icon: '💰', label: 'Pagamentos', path: '/pagamentos' },
      { icon: '📅', label: 'Planilha Diária', path: '/planilha-diaria' },
      { icon: '🏍️', label: 'Painel dos Motoboys', path: '/painel-motoboys' },
      { icon: '📱', label: 'Dispositivos', path: '/dispositivos' },
    ],
    atendente: [
      { icon: '🏠', label: 'Entregas Moto', path: '/' },
      { icon: '✈️', label: 'Sedex/Disktenha', path: '/sedex' },
      { icon: '➕', label: 'Novo Romaneio', path: '/novo-romaneio' },
      { icon: '👥', label: 'Clientes', path: '/clientes' },
      { icon: '📋', label: 'Histórico de Clientes', path: '/historico-clientes' },
      { icon: '📊', label: 'Relatórios', path: '/relatorios' },
      { icon: '💰', label: 'Pagamentos', path: '/pagamentos' },
    ],
    motoboy: [
      { icon: '🏍️', label: 'Minhas Entregas', path: '/' },
    ],
  };

  const currentMenu = menuItems[userType] || menuItems.admin;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.colors.background }}>
      {/* Menu Lateral */}
      <div style={{
        width: menuOpen ? '250px' : '70px',
        background: 'white',
        borderRight: `1px solid ${theme.colors.border}`,
        transition: 'width 0.3s',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Logo */}
        <div style={{
          padding: '1.5rem',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: theme.colors.primary,
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}>
            F
          </div>
          {menuOpen && (
            <div>
              <h2 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 'bold',
                color: theme.colors.text,
                margin: 0
              }}>
                Formédica
              </h2>
              <p style={{ 
                fontSize: '0.75rem', 
                color: theme.colors.textLight,
                margin: 0
              }}>
                Entregas
              </p>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          <p style={{
            padding: '0 1rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: theme.colors.textLight,
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
            display: menuOpen ? 'block' : 'none'
          }}>
            Menu Principal
          </p>
          {currentMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  border: 'none',
                  background: isActive ? `${theme.colors.primary}15` : 'transparent',
                  color: isActive ? theme.colors.primary : theme.colors.text,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? '600' : '400',
                  borderLeft: isActive ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.background = theme.colors.background;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                {menuOpen && <span>{item.label}</span>}
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
            gap: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: theme.colors.secondary,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {user?.nome?.charAt(0) || 'U'}
            </div>
            {menuOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: theme.colors.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {user?.nome || 'Usuário'}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '0.75rem',
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
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '0.5rem',
              color: theme.colors.text,
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span>🚪</span>
            {menuOpen && <span>Sair</span>}
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