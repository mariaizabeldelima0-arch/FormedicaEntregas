import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Bell, KeyRound, Smartphone, CheckCircle, XCircle, ChevronDown, ChevronUp, User } from 'lucide-react';

export default function BannerAlertasAdmin() {
  const [codigos, setCodigos] = useState([]);
  const [dispositivos, setDispositivos] = useState([]);
  const [expandido, setExpandido] = useState(true);
  const [carregando, setCarregando] = useState({});
  const canalRef = useRef(null);

  const fetchDados = useCallback(async () => {
    const [resCodigos, resDispositivos] = await Promise.all([
      supabase
        .from('usuarios')
        .select('id, usuario, tipo_usuario, codigo_redefinicao')
        .not('codigo_redefinicao', 'is', null)
        .eq('ativo', true)
        .order('usuario'),
      supabase
        .from('dispositivos')
        .select('id, nome, usuario_id, ultimo_acesso, usuarios(usuario, tipo_usuario)')
        .eq('status', 'Pendente')
        .order('ultimo_acesso', { ascending: false })
    ]);

    setCodigos(resCodigos.data || []);
    setDispositivos(resDispositivos.data || []);
  }, []);

  useEffect(() => {
    fetchDados();

    const canal = supabase
      .channel('admin-alertas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, fetchDados)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispositivos' }, fetchDados)
      .subscribe();

    canalRef.current = canal;

    return () => {
      supabase.removeChannel(canal);
    };
  }, [fetchDados]);

  // Auto-expandir quando aparecem novos itens
  const totalAnterior = useRef(0);
  const total = codigos.length + dispositivos.length;
  useEffect(() => {
    if (total > totalAnterior.current) {
      setExpandido(true);
    }
    totalAnterior.current = total;
  }, [total]);

  const setCarregandoItem = (id, valor) => {
    setCarregando(prev => ({ ...prev, [id]: valor }));
  };

  const cancelarCodigo = async (id) => {
    setCarregandoItem(id, true);
    await supabase.from('usuarios').update({ codigo_redefinicao: null }).eq('id', id);
    setCarregandoItem(id, false);
    fetchDados();
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
        @media print { .banner-alertas-admin { display: none !important; } }
        @keyframes badge-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>

      <div
        className="banner-alertas-admin no-print"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
          maxWidth: '380px',
          width: 'calc(100vw - 48px)',
        }}
      >
        {/* Painel expandido */}
        {expandido && (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            overflow: 'hidden',
            width: '100%',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff',
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
                title="Minimizar"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Seção: Códigos de recuperação */}
            {codigos.length > 0 && (
              <div>
                <div style={{
                  padding: '8px 16px 4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#92400e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: '#fffbeb',
                  borderBottom: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <KeyRound size={13} />
                  Códigos de recuperação ({codigos.length})
                </div>
                {codigos.map(u => {
                  const tipo = getTipo(u.tipo_usuario);
                  return (
                    <div key={u.id} style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      background: '#fffcf0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <User size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>{u.usuario}</span>
                        <span style={{
                          padding: '1px 7px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: tipo.bg,
                          color: tipo.text,
                        }}>{tipo.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#fef3c7',
                          border: '1px solid #fcd34d',
                          borderRadius: '8px',
                          padding: '4px 10px',
                        }}>
                          <KeyRound size={13} style={{ color: '#d97706' }} />
                          <span style={{
                            fontFamily: 'monospace',
                            letterSpacing: '0.2em',
                            fontSize: '16px',
                            fontWeight: '800',
                            color: '#92400e',
                          }}>{u.codigo_redefinicao}</span>
                        </div>
                        <button
                          onClick={() => cancelarCodigo(u.id)}
                          disabled={carregando[u.id]}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '7px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: carregando[u.id] ? 'not-allowed' : 'pointer',
                            opacity: carregando[u.id] ? 0.6 : 1,
                            flexShrink: 0,
                          }}
                        >
                          <XCircle size={13} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
          </div>
        )}

        {/* Botão flutuante (minimizado) */}
        <button
          onClick={() => setExpandido(v => !v)}
          title={expandido ? 'Minimizar alertas' : `${total} ${total === 1 ? 'pendência' : 'pendências'}`}
          style={{
            position: 'relative',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(69,123,186,0.5)',
            flexShrink: 0,
          }}
        >
          {expandido ? <ChevronDown size={22} /> : <Bell size={22} />}
          {!expandido && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '20px',
              height: '20px',
              background: '#ef4444',
              borderRadius: '50%',
              fontSize: '11px',
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
          )}
        </button>
      </div>
    </>
  );
}
