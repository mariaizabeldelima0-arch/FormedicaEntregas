import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

// Gerar fingerprint único do dispositivo/navegador
const gerarFingerprint = () => {
  const navegador = navigator.userAgent;
  const plataforma = navigator.platform;
  const idioma = navigator.language;
  const tela = `${screen.width}x${screen.height}x${screen.colorDepth}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Criar uma string única combinando as informações
  const dados = `${navegador}|${plataforma}|${idioma}|${tela}|${timezone}`;

  // Gerar um hash simples da string
  let hash = 0;
  for (let i = 0; i < dados.length; i++) {
    const char = dados.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16).toUpperCase();
};

// Obter nome do dispositivo/navegador
const obterNomeDispositivo = () => {
  const ua = navigator.userAgent;
  let navegador = 'Navegador Desconhecido';
  let dispositivo = 'Desktop';

  // Detectar navegador
  if (ua.includes('Chrome') && !ua.includes('Edg')) navegador = 'Chrome';
  else if (ua.includes('Firefox')) navegador = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) navegador = 'Safari';
  else if (ua.includes('Edg')) navegador = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) navegador = 'Opera';

  // Detectar dispositivo
  if (ua.includes('iPhone')) dispositivo = 'iPhone';
  else if (ua.includes('iPad')) dispositivo = 'iPad';
  else if (ua.includes('Android')) {
    if (ua.includes('Mobile')) dispositivo = 'Android Mobile';
    else dispositivo = 'Android Tablet';
  } else if (ua.includes('Windows')) dispositivo = 'Windows';
  else if (ua.includes('Mac')) dispositivo = 'Mac';
  else if (ua.includes('Linux')) dispositivo = 'Linux';

  return `${navegador} - ${dispositivo}`;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null); // 'admin', 'atendente', 'motoboy'

  useEffect(() => {
    // Usar sessionStorage para manter sessão durante atualização,
    // mas exigir login ao fechar e abrir o navegador
    try {
      const storedUser = sessionStorage.getItem('formedica_user');
      const storedType = sessionStorage.getItem('formedica_user_type');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setUserType(storedType);
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (usuarioLogin, senhaDigitada) => {
    try {
      const fingerprint = gerarFingerprint();
      const nomeDispositivo = obterNomeDispositivo();

      // 1. Verificar credenciais na tabela usuarios
      const { data: usuarioData, error: erroUsuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', usuarioLogin)
        .eq('senha', senhaDigitada)
        .eq('ativo', true)
        .maybeSingle();

      if (erroUsuario) {
        console.error('Erro ao buscar usuário:', erroUsuario);
        return { success: false, error: 'Erro ao conectar' };
      }

      if (!usuarioData) {
        return { success: false, error: 'Usuário ou senha inválidos' };
      }

      // 2. Verificar dispositivo para este usuário + fingerprint
      const { data: dispositivo, error: erroDisp } = await supabase
        .from('dispositivos')
        .select('*')
        .eq('usuario_id', usuarioData.id)
        .eq('impressao_digital', fingerprint)
        .maybeSingle();

      if (erroDisp) {
        console.error('Erro ao buscar dispositivo:', erroDisp);
        return { success: false, error: 'Erro ao verificar dispositivo' };
      }

      // 3. Se não existe registro para este dispositivo, criar
      if (!dispositivo) {
        const isAdmin = usuarioData.tipo_usuario === 'admin';

        const { error: erroCriar } = await supabase
          .from('dispositivos')
          .insert({
            usuario_id: usuarioData.id,
            nome: nomeDispositivo,
            impressao_digital: fingerprint,
            status: isAdmin ? 'Autorizado' : 'Pendente',
            ultimo_acesso: new Date().toISOString()
          });

        if (erroCriar) {
          console.error('Erro ao registrar dispositivo:', erroCriar);
          return { success: false, error: 'Erro ao registrar dispositivo' };
        }

        if (!isAdmin) {
          return {
            success: false,
            error: 'Novo dispositivo/navegador detectado. Aguarde a autorização do administrador.'
          };
        }
        // Admin auto-autorizado, continua para login
      } else {
        // 4. Dispositivo existe, verificar status
        if (dispositivo.status === 'Pendente') {
          return {
            success: false,
            error: 'Este dispositivo está aguardando autorização. Entre em contato com o administrador.'
          };
        }

        if (dispositivo.status === 'Bloqueado') {
          return {
            success: false,
            error: 'Este dispositivo está bloqueado. Entre em contato com o administrador.'
          };
        }
      }

      // 5. Login autorizado — dados vêm da tabela usuarios
      const userData = {
        id: usuarioData.id,
        usuario: usuarioData.usuario,
        tipo_usuario: usuarioData.tipo_usuario,
      };

      setUser(userData);
      sessionStorage.setItem('formedica_user', JSON.stringify(userData));

      setUserType(userData.tipo_usuario || 'atendente');
      sessionStorage.setItem('formedica_user_type', userData.tipo_usuario || 'atendente');

      // Atualizar último acesso do dispositivo
      await supabase
        .from('dispositivos')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('usuario_id', usuarioData.id)
        .eq('impressao_digital', fingerprint);

      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    sessionStorage.removeItem('formedica_user');
    sessionStorage.removeItem('formedica_user_type');
  };

  return (
    <AuthContext.Provider value={{
      user,
      userType,
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};