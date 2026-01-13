import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import Login from '@/pages/Login';
import EntregasMoto from '@/pages/EntregasMoto';
import NovoRomaneio from '@/pages/NovoRomaneio';
import EditarRomaneio from '@/pages/EditarRomaneio';
import DetalhesRomaneio from '@/pages/DetalhesRomaneio';
import Clientes from '@/pages/Clientes';
import SedexDisktenha from '@/pages/SedexDisktenha';
import DetalheSedexDisktenha from '@/pages/DetalheSedexDisktenha';
import Relatorios from '@/pages/Relatorios';
import Receitas from '@/pages/Receitas';
import Pagamentos from '@/pages/Pagamentos';
import PlanilhaDiaria from '@/pages/PlanilhaDiaria';
import PainelMotoboys from '@/pages/PainelMotoboys';
import Dispositivos from '@/pages/Dispositivos';
import RomaneiosDoDia from '@/pages/RomaneiosDoDia';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

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
      {/* Rota de impressão SEM Layout */}
      <Route
        path="/imprimir-romaneio"
        element={
          <PrivateRoute>
            <DetalhesRomaneio printMode={true} />
          </PrivateRoute>
        }
      />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<EntregasMoto />} />
                <Route path="/sedex" element={<SedexDisktenha />} />
                <Route path="/sedex-detalhes" element={<DetalheSedexDisktenha />} />
                <Route path="/novo-romaneio" element={<NovoRomaneio />} />
                <Route path="/editar-romaneio" element={<EditarRomaneio />} />
                <Route path="/detalhes-romaneio" element={<DetalhesRomaneio />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/historico-clientes" element={<div style={{padding: '2rem'}}>Histórico - Em construção</div>} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/receitas" element={<Receitas />} />
                <Route path="/pagamentos" element={<Pagamentos />} />
                <Route path="/planilha-diaria" element={<PlanilhaDiaria />} />
                <Route path="/painel-motoboys" element={<PainelMotoboys />} />
                <Route path="/dispositivos" element={<Dispositivos />} />
                <Route path="/romaneios-do-dia" element={<RomaneiosDoDia />} />
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;