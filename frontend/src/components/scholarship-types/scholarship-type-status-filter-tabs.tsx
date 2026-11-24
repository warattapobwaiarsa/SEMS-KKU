'use client';

import React from 'react';
import { Layers, CheckCircle2, PauseCircle } from 'lucide-react';

export type ScholarshipTypeStatusFilter = 'all' | 'active' | 'inactive';

interface ScholarshipTypeStatusFilterTabsProps {
  currentStatus: ScholarshipTypeStatusFilter;
  onSelectStatus: (status: ScholarshipTypeStatusFilter) => void;
  counts: {
    total: number;
    active: number;
    inactive: number;
  };
}

export function ScholarshipTypeStatusFilterTabs({
  currentStatus,
  onSelectStatus,
  counts,
}: ScholarshipTypeStatusFilterTabsProps) {
  const tabs = [
    {
      id: 'all' as const,
      label: 'ทั้งหมด',
      count: counts.total,
      icon: Layers,
      activeColor: 'bg-primary text-primary-foreground shadow-xs',
      badgeColor: 'bg-primary-foreground/20 text-primary-foreground',
    },
    {
      id: 'active' as const,
      label: 'เปิดใช้งาน',
      count: counts.active,
      icon: CheckCircle2,
      activeColor: 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    },
    {
      id: 'inactive' as const,
      label: 'ปิดการใช้งาน',
      count: counts.inactive,
      icon: PauseCircle,
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
              className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-bold ${
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
