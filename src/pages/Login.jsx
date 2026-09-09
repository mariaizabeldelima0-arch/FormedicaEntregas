import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { theme } from '@/lib/theme';

const urlDefinirSenha = () =>
  `${window.location.origin}${import.meta.env.MODE === 'production' ? '/FormedicaEntregas' : ''}/definir-senha`;

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Estados da tela de redefinição
  const [telaRedefinir, setTelaRedefinir] = useState(false);
  const [usuarioRedefinir, setUsuarioRedefinir] = useState('');
  const [loadingRedefinir, setLoadingRedefinir] = useState(false);
  const [erroRedefinir, setErroRedefinir] = useState('');
  const [emailEnviado, setEmailEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(usuario, senha);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Usuário ou senha inválidos');
    }

    setLoading(false);
  };

  const handleEnviarLinkRedefinicao = async (e) => {
    e.preventDefault();
    setErroRedefinir('');

    if (!usuarioRedefinir.trim()) {
      setErroRedefinir('Digite seu usuário.');
      return;
    }

    setLoadingRedefinir(true);

    const { data, error } = await supabase
      .from('usuarios')
      .select('email')
      .eq('usuario', usuarioRedefinir.trim())
      .eq('ativo', true)
      .maybeSingle();

    if (error || !data?.email) {
      setErroRedefinir('Usuário não encontrado ou sem e-mail cadastrado. Fale com o administrador.');
      setLoadingRedefinir(false);
      return;
    }

    const { error: erroReset } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: urlDefinirSenha()
    });

    if (erroReset) {
      setErroRedefinir('Erro ao enviar o link. Tente novamente.');
      setLoadingRedefinir(false);
      return;
    }

    setEmailEnviado(true);
    setLoadingRedefinir(false);
  };

  const voltarLogin = () => {
    setTelaRedefinir(false);
    setUsuarioRedefinir('');
    setErroRedefinir('');
    setEmailEnviado(false);
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
    opacity: disabled ? 0.7 : 1,
    marginBottom: '0.75rem'
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
          <p style={{ color: theme.colors.textLight }}>
            {telaRedefinir ? 'Redefinição de senha' : 'Entre com suas credenciais'}
          </p>
        </div>

        {/* Tela de Login */}
        {!telaRedefinir && (
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
              <label style={labelStyle}>Usuário</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Digite seu usuário"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                required
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={btnPrimary(loading)}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { setTelaRedefinir(true); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.colors.textLight,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Esqueceu sua senha?
              </button>
            </div>
          </form>
        )}

        {/* Tela de Redefinição */}
        {telaRedefinir && (
          <>
            {erroRedefinir && (
              <div style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {erroRedefinir}
              </div>
            )}

            {/* Digitar usuário e enviar link de redefinição por e-mail */}
            {!emailEnviado && (
              <form onSubmit={handleEnviarLinkRedefinicao}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Digite seu usuário</label>
                  <input
                    type="text"
                    value={usuarioRedefinir}
                    onChange={(e) => setUsuarioRedefinir(e.target.value)}
                    placeholder="Seu usuário de acesso"
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingRedefinir}
                  style={btnPrimary(loadingRedefinir)}
                >
                  {loadingRedefinir ? 'Enviando...' : 'Enviar link por e-mail'}
                </button>
              </form>
            )}

            {emailEnviado && (
              <div style={{
                background: '#dcfce7',
                border: '1px solid #86efac',
                borderRadius: '0.5rem',
                padding: '0.875rem',
                fontSize: '0.875rem',
                color: '#166534',
                textAlign: 'center'
              }}>
                Enviamos um link para o e-mail cadastrado. Abra-o para definir sua nova senha.
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={voltarLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.colors.textLight,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Voltar ao login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
