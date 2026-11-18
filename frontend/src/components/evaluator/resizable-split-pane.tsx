/**
 * คอมโพเนนต์ Resizable Split Pane สำหรับหน้าประเมินแบบแบ่งจอ
 * รองรับการลากปรับขนาดความกว้างซ้าย-ขวาอย่างอิสระ, ปุ่มสลับสัดส่วนด่วน (Preset),
 * และโหมด Focus Mode (ขยายฝั่งอ่านประวัติ หรือฝั่งฟอร์มคะแนนเต็มจอ)
 */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical, User, CheckSquare } from 'lucide-react';

interface ResizableSplitPaneProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
  storageKey?: string;
  leftTitle?: string;
  rightTitle?: string;
}

export function ResizableSplitPane({
  leftContent,
  rightContent,
  defaultLeftPercent = 45,
  minLeftPercent = 30,
  maxLeftPercent = 70,
  storageKey = 'sems_evaluator_split_percent',
  leftTitle = 'ข้อมูลผู้สมัคร',
  rightTitle = 'แบบประเมินคะแนน',
}: ResizableSplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPercent, setLeftPercent] = useState<number>(defaultLeftPercent);
  const [isDragging, setIsDragging] = useState(false);
  const [mobileTab, setMobileTab] = useState<'left' | 'right'>('right');

  // โหลดค่าที่เคยบันทึกไว้ใน LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= minLeftPercent && parsed <= maxLeftPercent) {
          void Promise.resolve().then(() => setLeftPercent(parsed));
        }
      }
    } catch {
      // ignore storage access error
    }
  }, [storageKey, minLeftPercent, maxLeftPercent]);

  // ฟังก์ชันบันทึกค่าลง LocalStorage
  const savePercent = useCallback(
    (val: number) => {
      try {
        localStorage.setItem(storageKey, String(val));
      } catch {
        // ignore
      }
    },
    [storageKey],
  );

  // เริ่มลากปรับขนาด
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // จับตำแหน่งขณะลาก
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const newPercent = (relativeX / rect.width) * 100;
      const clamped = Math.min(Math.max(newPercent, minLeftPercent), maxLeftPercent);
      setLeftPercent(Math.round(clamped * 10) / 10);
    };

    const handleMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handlePointerMove(e.touches[0].clientX);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setLeftPercent((current) => {
        savePercent(current);
        return current;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handlePointerUp);

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, minLeftPercent, maxLeftPercent, savePercent]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Mobile/Tablet Adaptive Tabs (< lg เท่านั้น บน Desktop จะตัดออกเพื่อประหยัดพื้นที่ 100%) */}
      <div className="flex lg:hidden items-center p-1 bg-muted/80 rounded-xl border border-border w-full mb-2 shrink-0 select-none">
        <button
          type="button"
          onClick={() => setMobileTab('left')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-medium transition cursor-pointer text-xs ${
            mobileTab === 'left'
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{leftTitle}</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('right')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-medium transition cursor-pointer text-xs ${
            mobileTab === 'right'
              ? 'bg-card text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5 text-primary" />
          <span>{rightTitle}</span>
        </button>
      </div>

      {/* Main Split Container */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch relative"
      >
        {/* Left Column: Applicant Profile */}
        <div
          style={{
            flexBasis: `${leftPercent}%`,
          }}
          className={`h-full min-h-0 overflow-y-auto custom-scrollbar transition-[flex-basis] ${
            isDragging ? 'transition-none' : 'duration-150 ease-out'
          } ${mobileTab === 'left' ? 'block' : 'hidden lg:block'} lg:pr-1.5`}
        >
          {leftContent}
        </div>

        {/* Draggable Divider (Desktop Split Mode only) */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(leftPercent)}
          tabIndex={0}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDoubleClick={() => {
            setLeftPercent(defaultLeftPercent);
            savePercent(defaultLeftPercent);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setLeftPercent((p) => Math.max(p - 2, minLeftPercent));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              setLeftPercent((p) => Math.min(p + 2, maxLeftPercent));
            }
          }}
          className="hidden lg:flex w-2.5 hover:w-2.5 cursor-col-resize items-center justify-center group shrink-0 relative z-10 -mx-0.5"
          title="ลากเพื่อปรับขนาดความกว้าง หรือดับเบิ้ลคลิกเพื่อรีเซ็ต"
        >
          <div
            className={`w-1 h-full rounded-full transition-colors ${
              isDragging
                ? 'bg-primary'
                : 'bg-border/60 group-hover:bg-primary/70'
            }`}
          />
          <div
            className={`absolute p-1 rounded-md bg-card border border-border shadow-xs transition-opacity ${
              isDragging
                ? 'opacity-100 ring-2 ring-primary/30'
                : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Right Column: Score Form */}
        <div
          style={{
            flexBasis: `${100 - leftPercent}%`,
          }}
          className={`h-full min-h-0 flex flex-col transition-[flex-basis] ${
            isDragging ? 'transition-none' : 'duration-150 ease-out'
          } ${mobileTab === 'right' ? 'flex' : 'hidden lg:flex'} lg:pl-1.5`}
        >
          {rightContent}
        </div>
      </div>
    </div>
  );
}
