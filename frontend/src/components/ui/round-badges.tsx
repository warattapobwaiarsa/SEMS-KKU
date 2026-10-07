'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ChevronDown, ExternalLink, Layers } from 'lucide-react';
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
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!rounds || rounds.length === 0) {
    return <span className="text-xs text-muted-foreground italic">ยังไม่มีรอบทุนที่ใช้งาน</span>;
  }

  const visibleRounds = rounds.slice(0, maxVisible);
  const remainingCount = rounds.length - maxVisible;

  // If in compact mode (e.g. mobile card summary)
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

  // Desktop / Table View
  return (
    <div className="relative inline-flex items-center flex-wrap gap-1.5" ref={popoverRef}>
      {visibleRounds.map((r) => {
        const style = statusStyles[r.status] || statusStyles.DRAFT;
        return (
          <span
            key={r.id}
            title={`${r.name} (${style.label})`}
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border shadow-2xs font-medium ${style.border} ${style.bg} ${style.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
            <span className="truncate max-w-[150px]">{r.name}</span>
          </span>
        );
      })}

      {remainingCount > 0 && (
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-border bg-muted/70 hover:bg-muted text-foreground font-semibold hover:border-primary/40 transition cursor-pointer"
          >
            <span>+{remainingCount} รอบ</span>
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute left-0 mt-2 z-50 w-72 rounded-2xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  รอบทุนที่ใช้เกณฑ์นี้ ({rounds.length})
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">ทั้งหมด</span>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {rounds.map((r) => {
                  const style = statusStyles[r.status] || statusStyles.DRAFT;
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
                    >
                      <div className="truncate pr-2">
                        <div className="font-medium text-foreground truncate">{r.name}</div>
                        <div className="text-[10px] text-muted-foreground">รหัสรอบ #{r.id}</div>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
