import React from 'react';
import { cn } from '@/lib/utils';

/**
 * EmptyState - Componente para estado vazio padronizado
 *
 * @param {ReactNode} icon - Ícone do lucide-react
 * @param {string} title - Título principal
 * @param {string} description - Descrição/mensagem explicativa
 * @param {ReactNode} action - Botão ou ação sugerida (opcional)
 * @param {string} variant - Estilo: 'default', 'compact' (default: 'default')
 * @param {string} className - Classes CSS adicionais
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  className
}) {
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        isCompact ? 'py-8' : 'py-12',
        className
      )}
    >
      {/* Ícone */}
      {Icon && (
        <div className={cn(
          'text-slate-300 mb-4',
          isCompact ? 'w-12 h-12' : 'w-16 h-16'
        )}>
          <Icon className="w-full h-full" />
        </div>
      )}

      {/* Título */}
      <h3 className={cn(
        'font-bold text-slate-700 mb-2',
        isCompact ? 'text-base' : 'text-lg'
      )}>
        {title}
      </h3>

      {/* Descrição */}
      {description && (
        <p className={cn(
          'text-slate-500 max-w-md',
          isCompact ? 'text-xs' : 'text-sm'
        )}>
          {description}
        </p>
      )}

      {/* Ação */}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}
