import React from 'react';
import { theme } from '@/lib/theme';

export default function EntregasMoto() {
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: '0.5rem'
        }}>
          Entregas Moto
        </h1>
        <p style={{ color: theme.colors.textLight }}>
          Olá, mariaizabeldelima0
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[
          { label: 'Total', value: 0, color: theme.colors.primary, icon: '📋' },
          { label: 'Produção', value: 0, color: '#3b82f6', icon: '🔨' },
          { label: 'A Caminho', value: 0, color: '#f59e0b', icon: '🏍️' },
          { label: 'Entregues', value: 0, color: theme.colors.success, icon: '✅' },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              border: `2px solid ${card.color}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '0.75rem'
            }}>
              <span style={{ fontSize: '2rem' }}>{card.icon}</span>
              <span style={{
                background: `${card.color}20`,
                color: card.color,
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {card.label}
              </span>
            </div>
            <p style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: card.color,
              margin: 0
            }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Área de conteúdo */}
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>
          📦
        </div>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: '0.5rem'
        }}>
          Nenhum romaneio encontrado
        </h3>
        <p style={{
          color: theme.colors.textLight,
          marginBottom: '1.5rem'
        }}>
          Não há entregas agendadas para este dia
        </p>
        <button
          style={{
            padding: '0.75rem 1.5rem',
            background: theme.colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          + Novo Romaneio
        </button>
      </div>
    </div>
  );
}