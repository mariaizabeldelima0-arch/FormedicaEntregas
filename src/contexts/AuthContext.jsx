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

  const login = async (cpf, senha) => {
    try {
      // Buscar usuário no Supabase pela tabela de usuários
      // Por enquanto, vamos simular o login
      const userData = {
        cpf,
        nome: 'Usuário Teste',
        id: '1'
      };
      
      setUser(userData);
      localStorage.setItem('formedica_user', JSON.stringify(userData));
      
      // Determinar tipo de usuário (por enquanto, admin para teste)
      setUserType('admin');
      localStorage.setItem('formedica_user_type', 'admin');
      
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