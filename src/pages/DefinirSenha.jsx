import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { theme } from '@/lib/theme';

export default function DefinirSenha() {
  const [verificando, setVerificando] = useState(true);
  const [sessaoValida, setSessaoValida] = useState(false);
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // O link do e-mail (convite ou redefinição) já deixa uma sessão temporária
    // pronta assim que a página carrega — só confirmamos que ela existe.
    supabase.auth.getSession().then(({ data }) => {
      setSessaoValida(!!data.session);
      setVerificando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setSessaoValida(true);
        setVerificando(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (senha.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setError('As senhas não são iguais.');
      return;
    }

    setLoading(true);

    const { error: erroSenha } = await supabase.auth.updateUser({ password: senha });

    if (erroSenha) {
      setError('Não foi possível definir a senha. O link pode ter expirado — peça um novo.');
      setLoading(false);
      return;
    }

    // Limpa a flag de troca obrigatória, se existir, e encerra a sessão temporária
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
      await supabase
        .from('usuarios')
        .update({ deve_trocar_senha: false })
        .eq('auth_id', authData.user.id);
    }

    await supabase.auth.signOut();
    setSucesso(true);
    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '0.5rem',
    fontSize: '1rem',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    color: theme.colors.text,
    fontWeight: '500'
  };

  const btnPrimary = (disabled) => ({
    width: '100%',
    padding: '0.75rem',
    background: theme.colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: theme.colors.primary,
            marginBottom: '0.5rem'
          }}>
            Formédica Entregas
          </h1>
          <p style={{ color: theme.colors.textLight }}>Definir senha</p>
        </div>

        {verificando && (
          <p style={{ textAlign: 'center', color: theme.colors.textLight }}>Verificando link...</p>
        )}

        {!verificando && !sessaoValida && !sucesso && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '0.875rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            Este link é inválido ou já expirou. Peça um novo link ao administrador
            ou use a opção "Esqueceu sua senha?" na tela de login.
          </div>
        )}

        {!verificando && sessaoValida && !sucesso && (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Nova senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Pelo menos 6 caracteres"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Confirmar nova senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Digite a senha novamente"
                required
                style={inputStyle}
              />
            </div>

            <button type="submit" disabled={loading} style={btnPrimary(loading)}>
              {loading ? 'Salvando...' : 'Definir senha'}
            </button>
          </form>
        )}

        {sucesso && (
          <div>
            <div style={{
              background: '#dcfce7',
              color: '#166534',
              padding: '0.875rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              Senha definida com sucesso!
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={btnPrimary(false)}
            >
              Ir para o login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
