import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null); // 'admin', 'atendente', 'motoboy'

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const storedUser = localStorage.getItem('formedica_user');
      const storedType = localStorage.getItem('formedica_user_type');
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setUserType(storedType);
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (usuarioLogin, senhaDigitada) => {
    try {
      // Buscar usuário na tabela de dispositivos
      const { data: usuarios, error } = await supabase
        .from('dispositivos')
        .select('*')
        .eq('usuario', usuarioLogin)
        .eq('senha', senhaDigitada)
        .limit(1);

      if (error) {
        console.error('Erro ao buscar usuário:', error);
        return { success: false, error: 'Erro ao conectar' };
      }

      if (!usuarios || usuarios.length === 0) {
        return { success: false, error: 'Usuário ou senha inválidos' };
      }

      const usuario = usuarios[0];

      // Verificar se o usuário está autorizado
      if (usuario.status !== 'Autorizado') {
        return { success: false, error: 'Usuário aguardando autorização. Entre em contato com o administrador.' };
      }

      const userData = {
        id: usuario.id,
        usuario: usuario.usuario,
        nome: usuario.nome,
        tipo_usuario: usuario.tipo_usuario,
        nome_motoboy: usuario.nome_motoboy,
        nome_atendente: usuario.nome_atendente
      };

      setUser(userData);
      localStorage.setItem('formedica_user', JSON.stringify(userData));

      setUserType(usuario.tipo_usuario || 'atendente');
      localStorage.setItem('formedica_user_type', usuario.tipo_usuario || 'atendente');

      // Atualizar último acesso
      await supabase
        .from('dispositivos')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('id', usuario.id);

      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    localStorage.removeItem('formedica_user');
    localStorage.removeItem('formedica_user_type');
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