import React, { useState } from "react";
import { User } from "lucide-react";

// Para futuras atualizações: mude esta versão e o conteúdo abaixo
const VERSAO_ATUAL = "filtro_atendente_v1";

export default function BannerAtualizacao() {
  const [visivel, setVisivel] = useState(() => {
    return localStorage.getItem('formedica_update_dismissed') !== VERSAO_ATUAL;
  });

  if (!visivel) return null;

  const fechar = () => {
    localStorage.setItem('formedica_update_dismissed', VERSAO_ATUAL);
    setVisivel(false);
  };

  return (
    <>
      <style>{`
        @media print {
          .banner-atualizacao-overlay { display: none !important; }
        }
      `}</style>
      <div
        className="banner-atualizacao-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}
      >
        <div style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
        }}>
          {/* Header roxo */}
          <div style={{
            background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)',
            padding: '28px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Nova Atualização
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}>
              <User size={28} />
              Filtro de Atendente
            </div>
          </div>

          {/* Corpo */}
          <div style={{
            backgroundColor: '#fff',
            padding: '24px',
          }}>
            <p style={{
              fontSize: '15px',
              color: '#334155',
              marginBottom: '20px',
              textAlign: 'center',
              fontWeight: '500',
            }}>
              O filtro de atendente agora mostra o seu nome automaticamente como primeira opção!
            </p>

            <div style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '12px',
            }}>
              Como usar:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {[
                'Na página de Entregas Moto, abra o filtro de atendentes',
                'O seu nome aparecerá automaticamente como primeira opção na lista',
                'Clique no seu nome para filtrar rapidamente as suas entregas',
                'Os demais atendentes continuam disponíveis logo abaixo',
              ].map((texto, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    minWidth: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #457bba, #890d5d)',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>{texto}</span>
                </div>
              ))}
            </div>

            <button
              onClick={fechar}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                letterSpacing: '0.5px',
              }}
            >
              Entendi!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
