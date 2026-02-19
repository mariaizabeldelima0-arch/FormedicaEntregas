import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function BannerTrocarSenha() {
  const { trocarSenha } = useAuth();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarNova, setMostrarNova] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    setErro('');

    if (!novaSenha || !confirmarSenha) {
      setErro('Preencha os dois campos.');
      return;
    }
    if (novaSenha.length < 4) {
      setErro('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setSalvando(true);
    const { success, error } = await trocarSenha(novaSenha);
    setSalvando(false);

    if (!success) {
      setErro('Erro ao salvar senha. Tente novamente.');
      console.error(error);
    }
    // Se success=true, deveTrocarSenha vira false no contexto e o banner some automaticamente
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '420px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)',
          padding: '24px',
          textAlign: 'center',
          color: '#fff'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <Lock size={28} />
          </div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
            Defina sua nova senha
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.85 }}>
            Por segurança, você precisa criar uma senha pessoal antes de continuar.
          </p>
        </div>

        {/* Corpo */}
        <div style={{ padding: '24px' }}>
          {/* Nova senha */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Nova senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={mostrarNova ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSalvar()}
              />
              <button
                type="button"
                onClick={() => setMostrarNova(!mostrarNova)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: 0,
                  display: 'flex'
                }}
              >
                {mostrarNova ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmar senha */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Confirmar nova senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={mostrarConfirmar ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a senha"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSalvar()}
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: 0,
                  display: 'flex'
                }}
              >
                {mostrarConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {erro}
            </div>
          )}

          {/* Botão */}
          <button
            onClick={handleSalvar}
            disabled={salvando}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #457bba 0%, #890d5d 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: salvando ? 'not-allowed' : 'pointer',
              opacity: salvando ? 0.7 : 1
            }}
          >
            {salvando ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </div>
      </div>
    </div>
  );
}
