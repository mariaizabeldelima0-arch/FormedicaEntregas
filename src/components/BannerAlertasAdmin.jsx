import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/api/supabaseClient';
import { Bell, Smartphone, CheckCircle, XCircle, ChevronDown, User, FilePenLine } from 'lucide-react';
import { theme } from '@/lib/theme';

export default function BannerAlertasAdmin({ isMenuExpanded }) {
  const [dispositivos, setDispositivos] = useState([]);
  const [edicoes, setEdicoes] = useState([]);
  const [expandido, setExpandido] = useState(false);
  const [carregando, setCarregando] = useState({});
  const canalRef = useRef(null);

  const fetchDados = useCallback(async () => {
    const hoje = new Date().toISOString().split('T')[0];
    const [resDispositivos, resEdicoes] = await Promise.all([
      supabase
        .from('dispositivos')
        .select('id, nome, usuario_id, ultimo_acesso, usuarios(usuario, tipo_usuario)')
        .eq('status', 'Pendente')
        .order('ultimo_acesso', { ascending: false }),
      supabase
        .from('notificacoes_edicoes')
        .select('*')
        .gte('created_at', `${hoje}T00:00:00`)
        .lte('created_at', `${hoje}T23:59:59`)
        .order('created_at', { ascending: false })
    ]);

    setDispositivos(resDispositivos.data || []);
    setEdicoes(resEdicoes.data || []);
  }, []);

  useEffect(() => {
    fetchDados();

    const canal = supabase
      .channel('admin-alertas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispositivos' }, fetchDados)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes_edicoes' }, fetchDados)
      .subscribe();

    canalRef.current = canal;

    return () => {
      supabase.removeChannel(canal);
    };
  }, [fetchDados]);

  const total = dispositivos.length + edicoes.length;

  const setCarregandoItem = (id, valor) => {
    setCarregando(prev => ({ ...prev, [id]: valor }));
  };

  const atualizarDispositivo = async (id, status) => {
    setCarregandoItem(id, true);
    await supabase.from('dispositivos').update({ status }).eq('id', id);
    setCarregandoItem(id, false);
    fetchDados();
  };

  if (total === 0) return null;

  const tipoLabel = {
    admin: { bg: '#ede9fe', text: '#6d28d9', label: 'Admin' },
    atendente: { bg: '#dbeafe', text: '#1d4ed8', label: 'Atendente' },
    motoboy: { bg: '#ffedd5', text: '#c2410c', label: 'Motoboy' },
  };

  const getTipo = (tipo) => tipoLabel[tipo] || { bg: '#f1f5f9', text: '#475569', label: tipo };

  return (
    <>
      <style>{`
        @media print { .banner-alertas-admin, .painel-alertas-admin { display: none !important; } }
        @keyframes badge-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>

      {/* Botão no menu lateral */}
      <button
        className="banner-alertas-admin no-print"
        onClick={() => setExpandido(v => !v)}
        title={!isMenuExpanded ? `${total} ${total === 1 ? 'pendência' : 'pendências'}` : ''}
        style={{
          width: '100%',
          padding: isMenuExpanded ? '0.625rem 1rem' : '0.625rem 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMenuExpanded ? 'flex-start' : 'center',
          gap: '0.75rem',
          border: 'none',
          background: expandido ? `${theme.colors.primary}10` : 'transparent',
          color: expandido ? theme.colors.primary : theme.colors.text,
          cursor: 'pointer',
          transition: 'all 0.15s',
          fontSize: '0.875rem',
          fontWeight: expandido ? '500' : '400',
          borderLeft: expandido ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
          textAlign: 'left',
          position: 'relative'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute',
            top: '-6px',
            right: '-8px',
            minWidth: '16px',
            height: '16px',
            padding: '0 3px',
            background: '#ef4444',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            animation: 'badge-pulse 1.5s ease-in-out infinite',
            border: '2px solid #fff',
          }}>
            {total > 9 ? '9+' : total}
          </span>
        </span>
        {isMenuExpanded && (
          <span style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            Notificações
          </span>
        )}
      </button>

      {/* Painel de notificações */}
      {expandido && createPortal(
        <div
          className="painel-alertas-admin no-print"
          style={{
            position: 'fixed',
            bottom: '16px',
            left: isMenuExpanded ? '212px' : '76px',
            zIndex: 9998,
            width: '360px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: '80vh',
            overflowY: 'auto',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff',
            position: 'sticky',
            top: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} />
              <span style={{ fontWeight: '700', fontSize: '14px' }}>
                Atenção — {total} {total === 1 ? 'pendência' : 'pendências'}
              </span>
            </div>
            <button
              onClick={() => setExpandido(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px',
                cursor: 'pointer',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Fechar"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Seção: Dispositivos pendentes */}
          {dispositivos.length > 0 && (
            <div>
              <div style={{
                padding: '8px 16px 4px',
                fontSize: '11px',
                fontWeight: '700',
                color: '#1e40af',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: '#eff6ff',
                borderBottom: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <Smartphone size={13} />
                Dispositivos pendentes ({dispositivos.length})
              </div>
              {dispositivos.map(d => {
                const usuario = d.usuarios;
                const tipo = getTipo(usuario?.tipo_usuario);
                return (
                  <div key={d.id} style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    background: '#f8faff',
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b', marginBottom: '3px' }}>
                        {d.nome}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                        <User size={12} style={{ color: '#64748b' }} />
                        <span style={{ fontSize: '12px', color: '#475569' }}>{usuario?.usuario || '—'}</span>
                        {usuario?.tipo_usuario && (
                          <span style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '700',
                            background: tipo.bg,
                            color: tipo.text,
                          }}>{tipo.label}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => atualizarDispositivo(d.id, 'Autorizado')}
                        disabled={carregando[d.id]}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          padding: '6px 0',
                          background: '#16a34a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '7px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: carregando[d.id] ? 'not-allowed' : 'pointer',
                          opacity: carregando[d.id] ? 0.6 : 1,
                        }}
                      >
                        <CheckCircle size={13} />
                        Autorizar
                      </button>
                      <button
                        onClick={() => atualizarDispositivo(d.id, 'Bloqueado')}
                        disabled={carregando[d.id]}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          padding: '6px 0',
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '7px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: carregando[d.id] ? 'not-allowed' : 'pointer',
                          opacity: carregando[d.id] ? 0.6 : 1,
                        }}
                      >
                        <XCircle size={13} />
                        Bloquear
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Seção: Romaneios impressos editados hoje */}
          {edicoes.length > 0 && (
            <div>
              <div style={{
                padding: '8px 16px 4px',
                fontSize: '11px',
                fontWeight: '700',
                color: '#9a3412',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: '#fff7ed',
                borderBottom: '1px solid #fed7aa',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <FilePenLine size={13} />
                Romaneios impressos editados hoje ({edicoes.length})
              </div>
              {edicoes.map(e => (
                <div key={e.id} style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  background: '#fffaf7',
                }}>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b', marginBottom: '2px' }}>
                    {e.cliente_nome}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Editado por <strong>{e.editado_por}</strong> às {new Date(e.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
