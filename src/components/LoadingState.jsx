import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * LoadingState - Componente para estado de carregamento padronizado
 *
 * @param {string} message - Mensagem de carregamento (opcional)
 * @param {string} variant - Tipo: 'default', 'inline', 'fullPage', 'overlay'
 * @param {string} size - Tamanho: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} className - Classes CSS adicionais
 */
export default function LoadingState({
  message,
  variant = 'default',
  size = 'md',
  className
}) {
  // Tamanhos do spinner
  const spinnerSizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  // Tamanhos de texto
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Spinner animado
  const Spinner = () => (
    <Loader2
      className={cn(
        'animate-spin text-blue-500',
        spinnerSizes[size]
      )}
    />
  );

  // Variante inline (horizontal)
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Spinner />
        {message && (
          <span className={cn('text-slate-600', textSizes[size])}>
            {message}
          </span>
        )}
      </div>
    );
  }

  // Variante fullPage (tela inteira)
  if (variant === 'fullPage') {
    return (
      <div className={cn(
        'fixed inset-0 flex items-center justify-center bg-slate-50',
        className
      )}>
        <div className="text-center">
          <Spinner />
          {message && (
            <p className={cn('mt-4 text-slate-600', textSizes[size])}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Variante overlay (sobre conteúdo existente)
  if (variant === 'overlay') {
    return (
      <div className={cn(
        'absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50',
        className
      )}>
        <div className="text-center">
          <Spinner />
          {message && (
            <p className={cn('mt-4 text-slate-600', textSizes[size])}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Variante default (centralizado no container)
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12',
      className
    )}>
      <Spinner />
      {message && (
        <p className={cn('mt-4 text-slate-600', textSizes[size])}>
          {message}
        </p>
      )}
    </div>
  );
}
