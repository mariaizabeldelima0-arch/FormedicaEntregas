import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import EntregasMoto from '@/pages/EntregasMoto';
import NovoRomaneio from '@/pages/NovoRomaneio';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #457bba',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" /> : <Login />} 
      />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<EntregasMoto />} />
                <Route path="/sedex" element={<div style={{padding: '2rem'}}>Sedex/Disktenha - Em construção</div>} />
                <Route path="/novo-romaneio" element={<NovoRomaneio />} />
                <Route path="/clientes" element={<div style={{padding: '2rem'}}>Clientes - Em construção</div>} />
                <Route path="/historico-clientes" element={<div style={{padding: '2rem'}}>Histórico - Em construção</div>} />
                <Route path="/relatorios" element={<div style={{padding: '2rem'}}>Relatórios - Em construção</div>} />
                <Route path="/receitas" element={<div style={{padding: '2rem'}}>Receitas - Em construção</div>} />
                <Route path="/pagamentos" element={<div style={{padding: '2rem'}}>Pagamentos - Em construção</div>} />
                <Route path="/planilha-diaria" element={<div style={{padding: '2rem'}}>Planilha Diária - Em construção</div>} />
                <Route path="/painel-motoboys" element={<div style={{padding: '2rem'}}>Painel Motoboys - Em construção</div>} />
                <Route path="/dispositivos" element={<div style={{padding: '2rem'}}>Dispositivos - Em construção</div>} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" richColors />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          }
        `}</style>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;