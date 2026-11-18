/**
 * ป้ายสถานะการบันทึกอัตโนมัติ (มุมขวาของฟอร์มประเมิน)
 * ปรับปรุงดีไซน์เป็น Cloud Indicator แบบนุ่มนวล ไม่ดึงสมาธิสายตา
 * [FR-EVL-08] (auto-save ทุก 3 วินาทีหลังหยุดพิมพ์)
 */
'use client';

import React from 'react';
import { Loader2, CloudCheck, AlertCircle, CloudUpload } from 'lucide-react';

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

  // กำลังพิมพ์ (dirty) -> รอ auto-save
  if (status === 'dirty') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600 transition-all select-none"
        title="มีการเปลี่ยนแปลงที่รอการบันทึกอัตโนมัติ"
      >
        <CloudUpload className="w-3.5 h-3.5 text-slate-500 animate-pulse shrink-0" />
        <span className="hidden sm:inline">รอการบันทึก...</span>
      </span>
    );
  }

  // กำลังส่งบันทึก (saving)
  if (status === 'saving') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-medium text-blue-700 shadow-2xs select-none"
        title="กำลังบันทึกข้อมูลแบบร่างอัตโนมัติ..."
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
        <span>กำลังบันทึกอัตโนมัติ...</span>
      </span>
    );
  }

  // บันทึกอัตโนมัติสำเร็จแล้ว
  if (status === 'saved') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-medium text-emerald-700 shadow-2xs transition-all select-none"
        title={savedAt ? `บันทึกร่างเมื่อ ${savedAt}` : 'บันทึกอัตโนมัติเรียบร้อยแล้ว'}
      >
        <CloudCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>
          บันทึกร่างแล้ว
          {savedAt && (
            <span className="font-mono text-xs text-emerald-600/80 ml-1">
              ({savedAt})
            </span>
          )}
        </span>
      </span>
    );
  }

  // บันทึกไม่สำเร็จ (มีข้อผิดพลาด)
  if (status === 'error') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-xs font-medium text-rose-700 shadow-2xs select-none"
        title="เกิดข้อผิดพลาดในการบันทึกอัตโนมัติ กรุณากดปุ่มบันทึกร่างทันทีอีกครั้ง"
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>บันทึกไม่สำเร็จ</span>
      </span>
    );
  }

  return null;
}
