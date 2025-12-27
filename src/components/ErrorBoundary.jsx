import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Ignorar erros conhecidos do HMR com portals
    if (error?.message?.includes('removeChild') ||
        error?.message?.includes('The node to be removed is not a child')) {
      console.warn('Ignorando erro conhecido do HMR:', error);
      return { hasError: false };
    }

    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Ignorar erros conhecidos do HMR
    if (error?.message?.includes('removeChild') ||
        error?.message?.includes('The node to be removed is not a child')) {
      return;
    }

    console.error('ErrorBoundary capturou erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center max-w-md p-8">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Algo deu errado</h2>
            <p className="text-slate-600 mb-6">
              {this.state.error?.message || 'Ocorreu um erro inesperado'}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-[#457bba] hover:bg-[#3a6ba0]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar Página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
