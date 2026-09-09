import React from 'react';
import { Check, X } from 'lucide-react';
import { conferirRequisitos, forcaDaSenha } from '@/lib/senha';

// Mostra as regras da senha e o quão forte ela está.
// Usado na tela do link do e-mail (DefinirSenha) e na troca obrigatória
// dentro do sistema (BannerTrocarSenha), para que a regra seja sempre a mesma.
export default function RequisitosSenha({ senha }) {
  const requisitos = conferirRequisitos(senha);
  const forca = forcaDaSenha(senha);

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Barra de força — só aparece depois que a pessoa começa a digitar */}
      {forca && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '4px'
          }}>
            <span>Força da senha</span>
            <span style={{ fontWeight: '700', color: '#374151' }}>{forca.rotulo}</span>
          </div>
          <div style={{
            height: '6px',
            background: '#e5e7eb',
            borderRadius: '999px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${forca.preenchimento}%`,
              background: forca.cor,
              borderRadius: '999px',
              transition: 'width 0.2s ease, background 0.2s ease'
            }} />
          </div>
        </div>
      )}

      {/* Lista das exigências */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {requisitos.map((r) => (
          <li
            key={r.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              color: r.ok ? '#629537' : '#6b7280',
              marginBottom: '3px'
            }}
          >
            {r.ok
              ? <Check size={14} strokeWidth={3} style={{ flexShrink: 0 }} />
              : <X size={14} strokeWidth={3} style={{ flexShrink: 0, color: '#9ca3af' }} />}
            {r.texto}
          </li>
        ))}
      </ul>
    </div>
  );
}
