import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Archive, 
  Lock, 
  Unlock, 
  AlertCircle,
  LucideIcon 
} from 'lucide-react';

export type StatusVariant = 
  | 'draft' 
  | 'open' 
  | 'closed' 
  | 'locked' 
  | 'unlocked' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
  icon?: LucideIcon;
  className?: string;
}

const variantStyles: Record<StatusVariant, { container: string; defaultIcon: LucideIcon; iconClass: string }> = {
  open: {
    container: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    defaultIcon: CheckCircle2,
    iconClass: 'text-emerald-600',
  },
  success: {
    container: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    defaultIcon: CheckCircle2,
    iconClass: 'text-emerald-600',
  },
  draft: {
    container: 'bg-amber-50 text-amber-800 border-amber-300',
    defaultIcon: Clock,
    iconClass: 'text-amber-600',
  },
  warning: {
    container: 'bg-amber-50 text-amber-800 border-amber-300',
    defaultIcon: AlertCircle,
    iconClass: 'text-amber-600',
  },
  closed: {
    container: 'bg-slate-100 text-slate-700 border-slate-300',
    defaultIcon: Archive,
    iconClass: 'text-slate-500',
  },
  locked: {
    container: 'bg-slate-100 text-slate-700 border-slate-300',
    defaultIcon: Lock,
    iconClass: 'text-slate-500',
  },
  unlocked: {
    container: 'bg-blue-50 text-blue-700 border-blue-200',
    defaultIcon: Unlock,
    iconClass: 'text-blue-600',
  },
  danger: {
    container: 'bg-rose-50 text-rose-700 border-rose-300',
    defaultIcon: AlertCircle,
    iconClass: 'text-rose-600',
  },
  neutral: {
    container: 'bg-muted text-muted-foreground border-border',
    defaultIcon: Clock,
    iconClass: 'text-muted-foreground',
  },
};

export function StatusBadge({ label, variant, icon, className = '' }: StatusBadgeProps) {
  const config = variantStyles[variant] || variantStyles.neutral;
  const IconComponent = icon || config.defaultIcon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-2xs ${config.container} ${className}`}
    >
      <IconComponent className={`h-3.5 w-3.5 ${config.iconClass}`} />
      <span>{label}</span>
    </span>
  );
}
