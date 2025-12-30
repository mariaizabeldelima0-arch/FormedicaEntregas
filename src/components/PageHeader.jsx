import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * PageHeader - Componente de cabeçalho padronizado para todas as páginas
 *
 * @param {string} title - Título principal da página
 * @param {string} subtitle - Subtítulo/descrição da página (opcional)
 * @param {boolean} showBack - Mostrar botão voltar (default: true)
 * @param {function} onBack - Função customizada para o botão voltar (opcional)
 * @param {ReactNode} actions - Componentes de ação para o lado direito (opcional)
 * @param {ReactNode} children - Conteúdo adicional abaixo do título (opcional)
 */
export default function PageHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  actions,
  children
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header principal */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {showBack && (
              <button
                onClick={handleBack}
                className="flex-shrink-0 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-slate-600 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Ações à direita */}
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* Conteúdo adicional (tabs, filtros, etc) */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
