'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  page?: number;
  currentPage?: number;
  totalPages: number;
  total?: number;
  limit?: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

export function Pagination({
  page: propPage,
  currentPage,
  totalPages,
  total = 0,
  limit = 10,
  onPageChange,
  disabled = false,
  className,
}: PaginationProps) {
  const page = propPage ?? currentPage ?? 1;

  if (total === 0 || totalPages <= 1) {
    // Show total info even on single page if there are items
    if (total > 0) {
      return (
        <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-muted/30 border-t border-border/80 text-xs text-muted-foreground", className)}>
          <div>
            แสดงทั้งหมด <span className="font-semibold text-foreground font-mono">{total}</span> รายการ
          </div>
          <div className="font-mono text-muted-foreground/80">
            หน้า 1 จาก 1
          </div>
        </div>
      );
    }
    return null;
  }

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const delta = 1; // Number of pages to show around current page
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    // Deduplicate in case totalPages is small
    return Array.from(new Set(rangeWithDots));
  };

  const pages = getPageNumbers();

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-muted/30 border-t border-border/80 text-xs text-muted-foreground", className)}>
      {/* Item Range Info */}
      <div className="text-center sm:text-left select-none">
        แสดงรายการที่{' '}
        <span className="font-semibold text-foreground font-mono">
          {startItem.toLocaleString()}
        </span>
        {' - '}
        <span className="font-semibold text-foreground font-mono">
          {endItem.toLocaleString()}
        </span>{' '}
        จากทั้งหมด{' '}
        <span className="font-semibold text-foreground font-mono">
          {total.toLocaleString()}
        </span>{' '}
        รายการ
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 select-none">
        {/* First Page (Desktop) */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={disabled || page <= 1}
          title="หน้าแรก"
          className="hidden sm:inline-flex p-1.5 rounded-lg border border-border/80 bg-background text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          title="หน้าก่อนหน้า"
          className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 rounded-xl border border-border/80 bg-background text-foreground hover:bg-muted active:bg-muted/80 disabled:opacity-30 disabled:pointer-events-none btn-interactive font-medium cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">ก่อนหน้า</span>
        </button>

        {/* Mobile Page Indicator */}
        <span className="sm:hidden px-3.5 py-1.5 font-mono text-xs font-semibold bg-background border border-border/80 rounded-xl text-foreground">
          {page} / {totalPages}
        </span>

        {/* Numbered Buttons (Desktop/Tablet) */}
        <div className="hidden sm:flex items-center gap-1 mx-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-muted-foreground font-mono"
                >
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isCurrent = pageNum === page;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange(pageNum)}
                disabled={disabled}
                aria-current={isCurrent ? 'page' : undefined}
                className={`min-w-9 h-9 px-2 rounded-xl text-xs font-mono font-semibold btn-interactive cursor-pointer ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/25'
                    : 'bg-background border border-border/80 text-foreground hover:bg-muted'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          title="หน้าถัดไป"
          className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 rounded-xl border border-border/80 bg-background text-foreground hover:bg-muted active:bg-muted/80 disabled:opacity-30 disabled:pointer-events-none btn-interactive font-medium cursor-pointer"
        >
          <span className="hidden sm:inline">ถัดไป</span>
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last Page (Desktop) */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={disabled || page >= totalPages}
          title="หน้าสุดท้าย"
          className="hidden sm:inline-flex items-center justify-center min-w-[36px] h-[36px] p-2 rounded-xl border border-border/80 bg-background text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none btn-interactive cursor-pointer"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
