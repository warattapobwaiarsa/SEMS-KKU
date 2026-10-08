'use client';

import React, { useState, useRef, useEffect, ReactNode, SelectHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: ReactNode;
  icon?: LucideIcon;
}

export interface CustomSelectProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
  align?: 'left' | 'right';
  width?: string;
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'เลือกรายการ...',
  icon: LeadingIcon,
  className,
  disabled = false,
  align = 'left',
  width,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placement: 'bottom' | 'top' }>({
    top: 0,
    left: 0,
    width: 200,
    placement: 'bottom',
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(options.length * 48 + 20, 320);
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = spaceBelow < dropdownHeight && rect.top > dropdownHeight ? 'top' : 'bottom';

    const calculatedLeft = align === 'right' ? rect.right - (width ? parseInt(width) : rect.width) : rect.left;

    setCoords({
      top: placement === 'bottom' ? rect.bottom + 6 : rect.top - 6,
      left: Math.max(12, Math.min(calculatedLeft, window.innerWidth - rect.width - 12)),
      width: width ? parseInt(width) : Math.max(rect.width, 220),
      placement,
    });
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  // Close on click outside & window resize
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, options.length]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'h-10 px-3.5 py-2 inline-flex items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-background text-sm font-medium text-foreground transition-all select-none shadow-2xs cursor-pointer',
          'hover:border-primary/60 hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          disabled && 'opacity-50 cursor-not-allowed bg-muted/20 border-border/50',
          isOpen && 'border-primary ring-2 ring-primary/20 bg-muted/20',
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {LeadingIcon && <LeadingIcon className="h-4 w-4 text-muted-foreground shrink-0" />}
          {selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          )}
          {selectedOption?.badge}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180 text-primary',
          )}
        />
      </button>

      {/* Floating Dropdown Listbox with createPortal */}
      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          role="listbox"
          style={{
            position: 'fixed',
            top: coords.placement === 'top' ? 'auto' : `${coords.top}px`,
            bottom: coords.placement === 'top' ? `${window.innerHeight - coords.top}px` : 'auto',
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 9999,
          }}
          className={cn(
            'max-h-72 overflow-y-auto rounded-2xl border border-border/90 bg-card p-1.5 shadow-2xl backdrop-blur-md animate-spring-pop ring-1 ring-slate-900/10',
            coords.placement === 'top' ? 'origin-bottom' : 'origin-top',
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            const OptionIcon = option.icon;
            return (
              <div
                key={String(option.value)}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors select-none',
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-foreground hover:bg-muted/70',
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {OptionIcon && <OptionIcon className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  <div className="truncate">
                    <span className="truncate block">{option.label}</span>
                    {option.sublabel && (
                      <span className="text-[11px] text-muted-foreground block truncate">{option.sublabel}</span>
                    )}
                  </div>
                  {option.badge}
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}

export interface NativeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  icon?: LucideIcon;
  wrapperClassName?: string;
}

export function Select({
  icon: Icon,
  className,
  wrapperClassName,
  children,
  ...props
}: NativeSelectProps) {
  return (
    <div className={cn('relative inline-flex items-center w-full', wrapperClassName)}>
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none shrink-0" />
      )}
      <select
        className={cn(
          'w-full h-10 pr-9 text-sm bg-background border border-border/80 rounded-xl text-foreground font-medium transition cursor-pointer appearance-none shadow-2xs',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          Icon ? 'pl-10' : 'pl-3.5',
          props.disabled && 'opacity-50 cursor-not-allowed bg-muted/30',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none shrink-0" />
    </div>
  );
}
