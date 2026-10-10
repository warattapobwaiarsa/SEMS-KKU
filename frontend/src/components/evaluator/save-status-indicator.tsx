/**
 * ป้ายสถานะการบันทึก (มุมขวาของฟอร์มประเมิน)
 * แสดงว่ากำลังบันทึกอัตโนมัติ / บันทึกแล้ว / บันทึกไม่สำเร็จ
 * [FR-EVL-08] (auto-save ทุก 3 วินาทีหลังหยุดพิมพ์)
 */
'use client';

import React from 'react';

// สถานะการบันทึกที่หน้าจอส่งมาให้แสดง
export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  /** เวลาที่บันทึกสำเร็จล่าสุด (รูปแบบ "14:30") */
  savedAt: string | null;
}

export function SaveStatusIndicator({ status, savedAt }: SaveStatusIndicatorProps) {
  // ยังไม่มีอะไรแก้ไข -> ไม่ต้องแสดงอะไร
  if (status === 'idle') {
    return null;
  }

  // กำลังบันทึก...
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-blue-600">
        <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        กำลังบันทึก...
      </span>
    );
  }

  // บันทึกอัตโนมัติแล้ว (พร้อมเวลาล่าสุด)
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
        ✓ บันทึกอัตโนมัติแล้ว{savedAt ? ` ${savedAt}` : ''}
      </span>
    );
  }

  // บันทึกไม่สำเร็จ (มีข้อผิดพลาด)
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-rose-600">
        ✗ บันทึกไม่สำเร็จ
      </span>
    );
  }

  // มีการแก้ไขแต่ยังไม่ถึงเวลา auto-save
  return <span className="text-xs text-amber-600">มีการแก้ไขที่ยังไม่ได้บันทึก</span>;
}
