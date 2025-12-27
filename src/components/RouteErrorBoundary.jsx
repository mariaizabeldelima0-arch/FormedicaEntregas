import React from 'react';
import { useLocation } from 'react-router-dom';

class RouteErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Se for o erro conhecido do HMR, não bloquear
    if (
      error?.message?.includes('removeChild') ||
      error?.message?.includes('The node to be removed is not a child')
    ) {
      console.warn('🟡 [ErrorBoundary] Erro do HMR capturado e ignorado');
      // NÃO setar hasError, deixar o componente continuar renderizando
      return { hasError: false };
    }

    // Para outros erros, mostrar erro
    console.error('🔴 [ErrorBoundary] Erro capturado:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Apenas log, não fazer nada que bloqueie
    if (
      !error?.message?.includes('removeChild') &&
      !error?.message?.includes('The node to be removed is not a child')
    ) {
      console.error('🔴 [ErrorBoundary] componentDidCatch:', error, errorInfo);
    }
  }

  render() {
    // Mesmo com erro, apenas renderizar os children
    // O erro já foi logado, não precisamos bloquear a UI
    return this.props.children;
  }
}

// Wrapper que reseta o error boundary quando a rota muda
export default function RouteErrorBoundary({ children }) {
  const location = useLocation();

  // Usar location.pathname como key força remount quando muda de rota
  return (
    <RouteErrorBoundaryClass key={location.pathname}>
      {children}
    </RouteErrorBoundaryClass>
  );
}
