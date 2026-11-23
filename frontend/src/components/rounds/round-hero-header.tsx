'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Play, 
  PowerOff, 
  Trash2, 
  ArrowLeft,
} from 'lucide-react';
import { ScholarshipRoundDetail } from '@/types/rounds';
import { Button } from '@/components/ui';

export interface RoundHeroHeaderProps {
  round: ScholarshipRoundDetail;
  isDraftRoundReady?: boolean;
  hasBasicInfo?: boolean;
  hasApplicants?: boolean;
  isCriteriaScoreValid?: boolean;
  criteriaTotalScore?: number;
  targetScore?: number;
  onOpenEditModal?: () => void;
  onOpenCheckClick: () => void;
  onCloseCheckClick: () => void;
  onShowDeleteModal: () => void;
  onShowImportModal?: () => void;
  onTabChange?: (tab: 'setup' | 'evaluation' | 'allocation' | 'reports') => void;
}

export function RoundHeroHeader({
  round,
  onOpenCheckClick,
  onCloseCheckClick,
  onShowDeleteModal,
}: RoundHeroHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-5">
      <Link
        href="/admin/scholarship-rounds"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition hover:-translate-x-0.5"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>กลับสู่หน้ารายการรอบทุนการศึกษา</span>
      </Link>

      <div className="flex items-center gap-2">
        {round.status === 'DRAFT' && (
          <>
            <Button
              type="button"
              variant="destructive"
              onClick={onShowDeleteModal}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              ลบรอบทุน
            </Button>
            <Button
              type="button"
              onClick={onOpenCheckClick}
              leftIcon={<Play className="h-4 w-4 fill-current" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              เปิดรอบทุน
            </Button>
          </>
        )}

        {round.status === 'OPEN' && (
          <Button
            type="button"
            variant="destructive"
            onClick={onCloseCheckClick}
            leftIcon={<PowerOff className="h-4 w-4" />}
          >
            ปิดรอบการประเมิน
          </Button>
        )}
      </div>
    </div>
  );
}
