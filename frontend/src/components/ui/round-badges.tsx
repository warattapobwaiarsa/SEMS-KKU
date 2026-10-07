'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Calendar, ChevronDown, ExternalLink, Layers, X, ShieldAlert, Sparkles } from 'lucide-react';
import { RoundUsageItem } from '@/types/criteria';

interface RoundBadgesProps {
  rounds?: RoundUsageItem[];
  maxVisible?: number;
  compact?: boolean;
}

const statusStyles: Record<string, { border: string; bg: string; text: string; dot: string; label: string }> = {
  OPEN: {
    border: 'border-emerald-300 dark:border-emerald-800',
    bg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    text: 'text-emerald-800 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    label: 'เปิดรับสมัคร',
  },
  CLOSED: {
    border: 'border-slate-300 dark:border-slate-700',
    bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-400',
    label: 'ปิดรับสมัคร',
  },
  DRAFT: {
    border: 'border-amber-300 dark:border-amber-800',
    bg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    text: 'text-amber-800 dark:text-amber-300',
    dot: 'bg-amber-500',
    label: 'ฉบับร่าง',
  },
};

export function RoundBadges({ rounds = [], maxVisible = 2, compact = false }: RoundBadgesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: 'bottom' | 'top' }>({
    top: 0,
    left: 0,
    placement: 'bottom',
  });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position precisely using trigger bounding client rect
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = 320;
    const popoverWidth = 320;
    const margin = 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = spaceBelow < popoverHeight && rect.top > popoverHeight ? 'top' : 'bottom';

    let top = placement === 'bottom' ? rect.bottom + margin : rect.top - popoverHeight - margin;
    
    // Prevent top boundary overflow
    if (top < margin) {
      top = margin;
    }

    // Horizontal positioning: align with trigger left, but guard viewport boundaries
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - popoverWidth - margin);
    }

    setCoords({ top, left, placement });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!rounds || rounds.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 italic py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
        ยังไม่มีรอบทุนที่ใช้งาน
      </span>
    );
  }

  const visibleRounds = rounds.slice(0, maxVisible);
  const remainingCount = rounds.length - maxVisible;

  // Mobile / Compact Card View
  if (compact) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Layers className="h-3.5 w-3.5 text-primary" />
            นำไปใช้ใน <span className="font-bold text-foreground">{rounds.length}</span> รอบทุน
          </span>
          {rounds.length > 1 && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 py-0.5 px-2 rounded-md hover:bg-primary/5 transition cursor-pointer"
            >
              {isOpen ? 'ย่อลง' : 'แสดงทั้งหมด'}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {isOpen ? (
          <div className="mt-1 flex flex-col gap-1.5 p-2 rounded-xl bg-muted/40 border border-border/60 animate-in fade-in-0 duration-150">
            {rounds.map((r) => {
              const style = statusStyles[r.status] || statusStyles.DRAFT;
              return (
                <div key={r.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-background border border-border/40">
                  <div className="truncate pr-2">
                    <span className="font-semibold text-foreground block truncate">{r.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">รอบ #{r.id}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-medium ${style.border} ${style.bg}`}>
                    {style.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {visibleRounds.map((r) => {
              const style = statusStyles[r.status] || statusStyles.DRAFT;
              return (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-border bg-background text-foreground shadow-2xs font-medium"
                >
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
                  <span className="truncate max-w-[150px]">{r.name}</span>
                </span>
              );
            })}
            {remainingCount > 0 && (
              <span className="inline-flex items-center text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground font-mono font-bold border border-border/60">
                +{remainingCount}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop Table Cell View: Progressive Disclosure with Portal Popover
  return (
    <div className="inline-flex items-center flex-wrap gap-1.5">
      {visibleRounds.map((r) => {
        const style = statusStyles[r.status] || statusStyles.DRAFT;
        return (
          <span
            key={r.id}
            title={`${r.name} (${style.label})`}
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border shadow-2xs font-medium ${style.border} ${style.bg}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
            <span className="truncate max-w-[160px]">{r.name}</span>
          </span>
        );
      })}

      {remainingCount > 0 && (
        <>
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            onClick={() => setIsOpen(!isOpen)}
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-semibold transition cursor-pointer select-none ${
              isOpen
                ? 'border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
                : 'border-border bg-muted/80 hover:bg-muted text-foreground hover:border-primary/50'
            }`}
          >
            <span>+{remainingCount} รอบ</span>
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Escape table overflow clipping via React 19 createPortal */}
          {isOpen && mounted && typeof document !== 'undefined' && createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-label="รอบทุนที่นำเกณฑ์นี้ไปใช้"
              style={{
                position: 'fixed',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: '320px',
                zIndex: 9999,
              }}
              className={`rounded-2xl border border-border/90 bg-card p-3.5 shadow-2xl backdrop-blur-md animate-spring-pop ${
                coords.placement === 'top' ? 'origin-bottom' : 'origin-top'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground leading-tight">
                      รอบทุนที่ใช้เกณฑ์นี้
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      ผูกอยู่ทั้งหมด <span className="font-semibold text-foreground">{rounds.length}</span> รอบทุน
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                  title="ปิดหน้าต่าง"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Rounds List */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs overscroll-contain">
                {rounds.map((r) => {
                  const style = statusStyles[r.status] || statusStyles.DRAFT;
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-muted/40 hover:bg-muted/70 border border-transparent hover:border-border/60 transition-colors"
                    >
                      <div className="truncate pr-2.5">
                        <div className="font-semibold text-foreground truncate" title={r.name}>
                          {r.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          รหัสรอบ #{r.id}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-medium ${style.border} ${style.bg}`}
                      >
                        {style.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Footer hint */}
              <div className="mt-2.5 pt-2 border-t border-border/40 text-[10px] text-muted-foreground/80 text-center flex items-center justify-center gap-1">
                <span>กด Esc หรือคลิกข้างนอกเพื่อปิด</span>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
}
