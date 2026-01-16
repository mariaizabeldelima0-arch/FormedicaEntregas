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
import Usuarios from '@/pages/Usuarios';

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

// Componente para proteger rotas por tipo de usuário
function MotoboyRoute({ children }) {
  const { userType } = useAuth();

  // Motoboys só podem acessar /painel-motoboys
  if (userType === 'motoboy') {
    return <Navigate to="/painel-motoboys" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, userType } = useAuth();

  // Redirecionar motoboys para sua página específica
  const getDefaultRoute = () => {
    if (userType === 'motoboy') return '/painel-motoboys';
    return '/';
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={getDefaultRoute()} /> : <Login />}
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
                <Route path="/" element={userType === 'motoboy' ? <Navigate to="/painel-motoboys" replace /> : <EntregasMoto />} />
                <Route path="/sedex" element={<MotoboyRoute><SedexDisktenha /></MotoboyRoute>} />
                <Route path="/sedex-detalhes" element={<MotoboyRoute><DetalheSedexDisktenha /></MotoboyRoute>} />
                <Route path="/novo-romaneio" element={<MotoboyRoute><NovoRomaneio /></MotoboyRoute>} />
                <Route path="/editar-romaneio" element={<MotoboyRoute><EditarRomaneio /></MotoboyRoute>} />
                <Route path="/detalhes-romaneio" element={<MotoboyRoute><DetalhesRomaneio /></MotoboyRoute>} />
                <Route path="/clientes" element={<MotoboyRoute><Clientes /></MotoboyRoute>} />
                <Route path="/historico-clientes" element={<MotoboyRoute><div style={{padding: '2rem'}}>Histórico - Em construção</div></MotoboyRoute>} />
                <Route path="/relatorios" element={<MotoboyRoute><Relatorios /></MotoboyRoute>} />
                <Route path="/receitas" element={<MotoboyRoute><Receitas /></MotoboyRoute>} />
                <Route path="/pagamentos" element={<MotoboyRoute><Pagamentos /></MotoboyRoute>} />
                <Route path="/planilha-diaria" element={<MotoboyRoute><PlanilhaDiaria /></MotoboyRoute>} />
                <Route path="/painel-motoboys" element={<PainelMotoboys />} />
                <Route path="/dispositivos" element={<MotoboyRoute><Dispositivos /></MotoboyRoute>} />
                <Route path="/romaneios-do-dia" element={<MotoboyRoute><RomaneiosDoDia /></MotoboyRoute>} />
                <Route path="/usuarios" element={<MotoboyRoute><Usuarios /></MotoboyRoute>} />
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
          <BrowserRouter basename={import.meta.env.MODE === 'production' ? '/FormedicaEntregas' : '/'}>
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