'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Calendar, ChevronDown, ExternalLink, Layers, X } from 'lucide-react';
import { RoundUsageItem } from '@/types/criteria';

interface RoundBadgesProps {
  rounds?: RoundUsageItem[];
  maxVisible?: number;
  compact?: boolean;
}

const statusStyles: Record<string, { border: string; bg: string; text: string; dot: string; label: string }> = {
  OPEN: {
    border: 'border-emerald-300',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    label: 'เปิดรับสมัคร',
  },
  CLOSED: {
    border: 'border-slate-300',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    label: 'ปิดรับสมัคร',
  },
  DRAFT: {
    border: 'border-amber-300',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
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

  // Mark client mounted for createPortal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position when popover opens or window scrolls/resizes
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = 280; // Estimated max height
    const popoverWidth = 300;

    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = spaceBelow < popoverHeight && rect.top > popoverHeight ? 'top' : 'bottom';

    let top = placement === 'bottom' ? rect.bottom + 6 : rect.top - popoverHeight - 6;
    // Align left with boundary guard
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - popoverWidth - 16);
    }

    setCoords({ top, left, placement });
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

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
    return <span className="text-xs text-muted-foreground italic">ยังไม่มีรอบทุนที่ใช้งาน</span>;
  }

  const visibleRounds = rounds.slice(0, maxVisible);
  const remainingCount = rounds.length - maxVisible;

  // Mobile / Compact Card View
  if (compact) {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            ใช้งานใน <span className="font-semibold text-primary">{rounds.length}</span> รอบทุน
          </span>
          {rounds.length > 1 && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
            >
              {isOpen ? 'ซ่อน' : 'ดูทั้งหมด'}
              <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {isOpen ? (
          <div className="mt-1 flex flex-col gap-1.5 p-2 rounded-xl bg-background/80 border border-border/60">
            {rounds.map((r) => {
              const style = statusStyles[r.status] || statusStyles.DRAFT;
              return (
                <div key={r.id} className="flex items-center justify-between text-xs py-1 px-1.5 border-b border-border/30 last:border-0">
                  <span className="truncate pr-2 font-medium text-foreground">{r.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-medium ${style.border} ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {visibleRounds.map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-border bg-background text-foreground"
              >
                <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="truncate max-w-[140px]">{r.name}</span>
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono font-medium">
                +{remainingCount}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop / Table View with createPortal to escape table overflow clipping
  return (
    <div className="inline-flex items-center flex-wrap gap-1.5">
      {visibleRounds.map((r) => {
        const style = statusStyles[r.status] || statusStyles.DRAFT;
        return (
          <span
            key={r.id}
            title={`${r.name} (${style.label})`}
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border shadow-2xs font-medium ${style.border} ${style.bg} ${style.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
            <span className="truncate max-w-[140px]">{r.name}</span>
          </span>
        );
      })}

      {remainingCount > 0 && (
        <>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-semibold transition cursor-pointer ${
              isOpen
                ? 'border-primary bg-primary/10 text-primary shadow-xs'
                : 'border-border bg-muted/70 hover:bg-muted text-foreground hover:border-primary/40'
            }`}
          >
            <span>+{remainingCount} รอบ</span>
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Render Popover into document.body via Portal to prevent table clipping */}
          {isOpen && mounted && typeof document !== 'undefined' && createPortal(
            <div
              ref={popoverRef}
              style={{
                position: 'fixed',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: '300px',
                zIndex: 9999,
              }}
              className="rounded-2xl border border-border/90 bg-card p-3 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-md bg-primary/10 text-primary">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      รอบทุนที่ใช้เกณฑ์นี้
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ทั้งหมด {rounds.length} รอบ
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                  title="ปิด"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 text-xs scrollbar-thin">
                {rounds.map((r) => {
                  const style = statusStyles[r.status] || statusStyles.DRAFT;
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-muted/40 hover:bg-muted/70 border border-transparent hover:border-border/60 transition-all"
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-foreground truncate" title={r.name}>
                          {r.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          รหัสรอบ #{r.id}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-medium ${style.border} ${style.bg} ${style.text}`}
                      >
                        {style.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
}
