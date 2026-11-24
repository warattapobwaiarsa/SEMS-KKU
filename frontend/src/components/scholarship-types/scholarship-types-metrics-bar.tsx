'use client';

import React from 'react';
import { Award, CheckCircle2, PauseCircle } from 'lucide-react';
import { ScholarshipTypeListItem } from '@/types/scholarship-type';

interface ScholarshipTypesMetricsBarProps {
  types?: ScholarshipTypeListItem[];
  counts?: {
    total: number;
    active: number;
    inactive: number;
  };
}

export function ScholarshipTypesMetricsBar({ types = [], counts }: ScholarshipTypesMetricsBarProps) {
  const totalCount = counts ? counts.total : types.length;
  const activeCount = counts ? counts.active : types.filter((t) => t.isActive).length;
  const inactiveCount = counts ? counts.inactive : types.filter((t) => !t.isActive).length;

  const metrics = [
    {
      id: 'total',
      title: 'ประเภททุนทั้งหมด',
      count: totalCount,
      unit: 'ประเภท',
      description: 'ประเภททุนการศึกษาที่กำหนดไว้ในระบบ',
      badge: 'All Types',
      icon: Award,
      theme: {
        bg: 'bg-primary/5 dark:bg-primary/10',
        border: 'border-primary/20 dark:border-primary/30',
        text: 'text-primary dark:text-primary-foreground',
        badgeBg: 'bg-primary/10 text-primary dark:bg-primary/20',
        iconBg: 'bg-primary/15 text-primary',
      },
    },
    {
      id: 'active',
      title: 'เปิดใช้งานอยู่',
      count: activeCount,
      unit: 'ประเภท',
      description: 'พร้อมเลือกใช้งานในรอบทุนการศึกษา',
      badge: 'Active',
      icon: CheckCircle2,
      theme: {
        bg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
        border: 'border-emerald-200/80 dark:border-emerald-800/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
        iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      },
    },
    {
      id: 'inactive',
      title: 'ปิดการใช้งาน',
      count: inactiveCount,
      unit: 'ประเภท',
      description: 'พักการใช้งานชั่วคราว',
      badge: 'Inactive',
      icon: PauseCircle,
      theme: {
        bg: 'bg-slate-50/90 dark:bg-slate-900/40',
        border: 'border-slate-200/80 dark:border-slate-800/60',
        text: 'text-slate-700 dark:text-slate-300',
        badgeBg: 'bg-slate-200/70 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
        iconBg: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.id}
            className={`rounded-2xl border p-4.5 transition-all hover:shadow-md hover:-translate-y-0.5 ${m.theme.bg} ${m.theme.border}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-muted-foreground">
                  {m.title}
                </span>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${m.theme.text}`}>
                    {m.count}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {m.unit}
                  </span>
                </div>
              </div>
              <div className={`p-2.5 rounded-xl ${m.theme.iconBg} shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
              <p className="text-xs text-muted-foreground truncate mr-2">
                {m.description}
              </p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${m.theme.badgeBg}`}>
                {m.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
