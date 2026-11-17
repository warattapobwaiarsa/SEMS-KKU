import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'destructive';
  title?: string;
  onClose?: () => void;
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  onClose,
  ...props
}: AlertProps) {
  const variantStyles = {
    info: 'bg-sky-50 text-sky-800 border-sky-200/80 [&>svg]:text-sky-600',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 [&>svg]:text-emerald-600',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80 [&>svg]:text-amber-600',
    destructive: 'bg-red-50 text-red-800 border-red-200/80 [&>svg]:text-red-600',
  };

  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    destructive: AlertCircle,
  };

  const IconComponent = icons[variant];

  return (
    <div
      role="alert"
      className={cn(
        'relative flex w-full items-start gap-3.5 rounded-2xl border p-4 text-sm shadow-2xs leading-relaxed',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <IconComponent className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <h5 className="font-semibold text-sm mb-0.5 leading-snug">{title}</h5>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 text-inherit opacity-70 hover:opacity-100 hover:bg-black/5 transition"
          aria-label="ปิดการแจ้งเตือน"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
