'use client';

import React from 'react';
import { PlayCircle, FileEdit, Archive } from 'lucide-react';
import { ScholarshipRoundListItem } from '@/types/rounds';

interface RoundsMetricsBarProps {
  rounds?: ScholarshipRoundListItem[];
  totalRoundsCount?: number;
  counts?: {
    total: number;
    draft: number;
    open: number;
    closed: number;
  };
}

export function RoundsMetricsBar({ rounds = [], counts }: RoundsMetricsBarProps) {
  const openCount = counts ? counts.open : rounds.filter((r) => r.status === 'OPEN').length;
  const draftCount = counts ? counts.draft : rounds.filter((r) => r.status === 'DRAFT').length;
  const closedCount = counts ? counts.closed : rounds.filter((r) => r.status === 'CLOSED').length;

  const metrics = [
    {
      id: 'active',
      title: 'กำลังเปิดประเมิน',
      count: openCount,
      unit: 'รอบ',
      description: 'กรรมการเข้าตรวจและให้คะแนนได้',
      badge: 'Active Now',
      icon: PlayCircle,
      theme: {
        bg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
        border: 'border-emerald-200/80 dark:border-emerald-800/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
        iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      },
    },
    {
      id: 'draft',
      title: 'รอบแบบร่าง',
      count: draftCount,
      unit: 'รอบ',
      description: 'รอเชื่อมเกณฑ์หรือนำเข้าผู้สมัคร',
      badge: 'Pending Setup',
      icon: FileEdit,
      theme: {
        bg: 'bg-amber-50/70 dark:bg-amber-950/20',
        border: 'border-amber-200/80 dark:border-amber-800/40',
        text: 'text-amber-700 dark:text-amber-300',
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
        iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      },
    },
    {
      id: 'closed',
      title: 'ปิดรอบการประเมิน',
      count: closedCount,
      unit: 'รอบ',
      description: 'ประเมินเสร็จสิ้น / จัดสรรงบประมาณ',
      badge: 'Completed',
      icon: Archive,
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
            className={`relative overflow-hidden rounded-2xl border p-4.5 transition-all hover:shadow-md hover:-translate-y-0.5 ${m.theme.bg} ${m.theme.border}`}
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

            <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
              <span className="text-muted-foreground/90 truncate mr-2 text-xs">
                {m.description}
              </span>
              <span className={`px-2 py-0.5 rounded-full font-mono text-xs font-semibold shrink-0 ${m.theme.badgeBg}`}>
                {m.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
