'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
  className?: string;
  preventCloseOnBackdrop?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
  '4xl': 'max-w-5xl',
  full: 'max-w-[95vw]',
};

let activeModalsCount = 0;

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
  className,
  preventCloseOnBackdrop = false,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll using global stack counter to handle nested modals
  useEffect(() => {
    if (!isOpen) return;
    activeModalsCount++;
    document.body.style.overflow = 'hidden';
    return () => {
      activeModalsCount = Math.max(0, activeModalsCount - 1);
      if (activeModalsCount === 0) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (!preventCloseOnBackdrop && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          'bg-white text-foreground border border-slate-200 rounded-2xl shadow-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 ring-1 ring-slate-900/10',
          sizeClasses[size],
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export interface ModalHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
}

export function ModalHeader({
  title,
  subtitle,
  icon: Icon,
  iconClassName = 'text-primary',
  onClose,
  children,
  className,
}: ModalHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 px-6 py-5 border-b border-border/80 bg-muted/20', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn('p-2 rounded-xl bg-primary/10 border border-primary/20 shrink-0', iconClassName)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer shrink-0"
            title="ปิดหน้าต่าง"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {children}
    </div>
  );
}

export interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto p-6 space-y-4', className)}>
      {children}
    </div>
  );
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('px-6 py-4 border-t border-border/80 bg-muted/20 flex items-center justify-end gap-3', className)}>
      {children}
    </div>
  );
}
