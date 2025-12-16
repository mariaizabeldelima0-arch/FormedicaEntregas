import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/lib/theme';

export default function Login() {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(cpf, senha);
    
    if (result.success) {
      navigate('/');
    } else {
      setError('CPF ou senha inválidos');
    }
    
    setLoading(false);
  };

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
            Entre com suas credenciais
          </p>
        </div>

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
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              color: theme.colors.text,
              fontWeight: '500'
            }}>
              CPF
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              color: theme.colors.text,
              fontWeight: '500'
            }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}