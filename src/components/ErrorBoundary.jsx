import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Ignorar erros de removeChild - são erros conhecidos do HMR/Radix UI
    if (
      error?.message?.includes('removeChild') ||
      error?.message?.includes('The node to be removed is not a child')
    ) {
      console.warn('⚠️ [ErrorBoundary] Erro de removeChild capturado e ignorado:', error.message);
      // NÃO setar hasError - deixar renderizar normalmente
      return { hasError: false };
    }

    // Para outros erros, logar mas também não bloquear
    console.error('🔴 [ErrorBoundary] Erro capturado:', error);
    // Mesmo para outros erros, não bloquear a UI
    return { hasError: false };
  }

  componentDidCatch(error, errorInfo) {
    // Apenas log para debug
    if (
      !error?.message?.includes('removeChild') &&
      !error?.message?.includes('The node to be removed is not a child')
    ) {
      console.error('🔴 [ErrorBoundary] Detalhes:', error, errorInfo);
    }
  }

  render() {
    // Sempre renderizar os children, mesmo com erro
    return this.props.children;
  }
}

export default ErrorBoundary;
