import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StatusBadge - Componente de badge de status padronizado
 *
 * @param {string} variant - Tipo de status: 'success', 'warning', 'error', 'info', 'default'
 * @param {string} size - Tamanho: 'sm', 'md', 'lg' (default: 'md')
 * @param {ReactNode} icon - Ícone customizado (opcional)
 * @param {boolean} showIcon - Mostrar ícone padrão (default: true)
 * @param {string} className - Classes CSS adicionais
 * @param {ReactNode} children - Texto do badge
 */
export default function StatusBadge({
  variant = 'default',
  size = 'md',
  icon,
  showIcon = true,
  className,
  children
}) {
  // Variantes de cor
  const variants = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  // Tamanhos
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  // Tamanhos de ícone
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  // Ícones padrão por variante
  const defaultIcons = {
    success: CheckCircle,
    warning: Clock,
    error: XCircle,
    info: Info,
    default: AlertCircle,
  };

  const IconComponent = icon || (showIcon ? defaultIcons[variant] : null);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {IconComponent && (
        typeof IconComponent === 'function' ? (
          <IconComponent className={iconSizes[size]} />
        ) : (
          IconComponent
        )
      )}
      {children}
    </span>
  );
}

// Exports para uso direto com variantes
export const SuccessBadge = ({ children, ...props }) => (
  <StatusBadge variant="success" {...props}>{children}</StatusBadge>
);

export const WarningBadge = ({ children, ...props }) => (
  <StatusBadge variant="warning" {...props}>{children}</StatusBadge>
);

export const ErrorBadge = ({ children, ...props }) => (
  <StatusBadge variant="error" {...props}>{children}</StatusBadge>
);

export const InfoBadge = ({ children, ...props }) => (
  <StatusBadge variant="info" {...props}>{children}</StatusBadge>
);
