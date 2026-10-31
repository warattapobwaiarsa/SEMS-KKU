/**
 * ป้ายสถานะการบันทึก (มุมขวาของฟอร์มประเมิน)
 * แสดงว่ากำลังบันทึกอัตโนมัติ / บันทึกแล้ว / บันทึกไม่สำเร็จ
 * [FR-EVL-08] (auto-save ทุก 3 วินาทีหลังหยุดพิมพ์)
 */
'use client';

import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

// สถานะการบันทึกที่หน้าจอส่งมาให้แสดง
export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  /** เวลาที่บันทึกสำเร็จล่าสุด (รูปแบบ "14:30") */
  savedAt: string | null;
}

export function SaveStatusIndicator({ status, savedAt }: SaveStatusIndicatorProps) {
  // ยังไม่มีอะไรแก้ไข -> ไม่แสดงอะไร
  if (status === 'idle') {
    return null;
  }

  // กำลังพิมพ์ (รอ auto-save) หรือกำลังส่งบันทึก -> แสดงไอคอนหมุนบันทึกอัตโนมัติ
  if (status === 'dirty' || status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-medium text-blue-700 shadow-2xs animate-pulse">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
        <span>กำลังบันทึกอัตโนมัติ...</span>
      </span>
    );
  }

  // บันทึกอัตโนมัติสำเร็จแล้ว
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-medium text-emerald-700 shadow-2xs transition-all">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>บันทึกอัตโนมัติแล้ว{savedAt ? ` (${savedAt})` : ''}</span>
      </span>
    );
  }

  // บันทึกไม่สำเร็จ (มีข้อผิดพลาด)
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-xs font-medium text-rose-700 shadow-2xs">
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>บันทึกไม่สำเร็จ</span>
      </span>
    );
  }

  return null;
}
