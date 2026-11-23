'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, Calendar, Layers, Power } from 'lucide-react';
import { ScholarshipTypeStatusBadge } from './scholarship-type-status-badge';
import { Button } from '@/components/ui/button';

interface ScholarshipTypeHeroHeaderProps {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
  roundsCount?: number;
  subCriteriaCount?: number;
  onToggleActive?: () => void;
  isToggling?: boolean;
}

export function ScholarshipTypeHeroHeader({
  id,
  name,
  description,
  roundsCount = 0,
  subCriteriaCount = 0,
}: ScholarshipTypeHeroHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/70 pb-6">
      {/* Top back link */}
      <div>
        <Link
          href="/admin/scholarship-types"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition hover:-translate-x-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>กลับสู่รายการประเภททุน</span>
        </Link>
      </div>

      {/* Main hero banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Award className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {name}
              </h1>
            </div>

            {description ? (
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                ไม่มีคำอธิบายหรือวัตถุประสงค์ระบุไว้
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground font-medium">
              <span className="inline-flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-lg border border-border/50">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>เกณฑ์ประเมิน {subCriteriaCount} ข้อ</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-lg border border-border/50">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>ใช้งานในรอบทุน {roundsCount} รอบ</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
