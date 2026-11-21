'use client';

import React from 'react';
import { Layers, PlayCircle, FileEdit, Archive } from 'lucide-react';

interface RoundStatusFilterTabsProps {
  currentStatus: string;
  onSelectStatus: (status: string) => void;
  counts: {
    total: number;
    draft: number;
    open: number;
    closed: number;
  };
}

export function RoundStatusFilterTabs({
  currentStatus,
  onSelectStatus,
  counts,
}: RoundStatusFilterTabsProps) {
  const tabs = [
    {
      id: '',
      label: 'ทั้งหมด',
      count: counts.total,
      icon: Layers,
      activeColor: 'bg-primary text-primary-foreground shadow-xs',
      badgeColor: 'bg-primary-foreground/20 text-primary-foreground',
    },
    {
      id: 'OPEN',
      label: 'เปิดรับประเมิน',
      count: counts.open,
      icon: PlayCircle,
      activeColor: 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    },
    {
      id: 'DRAFT',
      label: 'แบบร่าง',
      count: counts.draft,
      icon: FileEdit,
      activeColor: 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-600/30',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    },
    {
      id: 'CLOSED',
      label: 'ปิดรอบแล้ว',
      count: counts.closed,
      icon: Archive,
      activeColor: 'bg-slate-700 text-white shadow-xs ring-2 ring-slate-700/30',
      badgeColor: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-muted/50 border border-border/80 rounded-2xl overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = currentStatus === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectStatus(tab.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              isActive
                ? tab.activeColor
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-md font-mono text-[11px] font-bold ${
                isActive ? 'bg-white/20 text-white' : tab.badgeColor
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
