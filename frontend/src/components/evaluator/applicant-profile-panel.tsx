/**
 * แผงข้อมูลผู้สมัคร (ฝั่งซ้ายของหน้าประเมิน — อ่านอย่างเดียว) [FR-APP-03] [BR-APP-04]
 * - ค่าว่าง/ null แสดงเป็น "-" [FR-APP-04]
 * - ลิงก์แผนที่ แสดงเป็นลิงก์เฉพาะเมื่อขึ้นต้นด้วย http:// หรือ https:// [FR-APP-05]
 * - ไม่แสดงเลขบัตรประชาชน / โทรศัพท์ / อีเมล (backend ไม่ส่งมาอยู่แล้ว)
 */
'use client';

import React from 'react';
import type {
  ApplicantSupportingInfo,
  EvaluatorApplicantDetail,
} from '@/types/evaluation';

interface ApplicantProfilePanelProps {
  detail: EvaluatorApplicantDetail;
}

// รายชื่อฟิลด์ supportingInfo เป็นภาษาไทย (ตามลำดับที่อ่านง่าย)
const SUPPORTING_LABELS: Array<{
  key: keyof ApplicantSupportingInfo;
  label: string;
}> = [
  { key: 'applicationDate', label: 'วันที่ยื่นคำขอ' },
  { key: 'accommodation', label: 'ที่อยู่อาศัย/ค่าที่พัก' },
  { key: 'rent', label: 'ค่าเช่าที่อยู่อาศัย' },
  { key: 'personalExpense', label: 'ค่าใช้จ่ายส่วนตัว' },
  { key: 'studyEquipmentCost', label: 'ค่าอุปกรณ์การเรียน' },
  { key: 'electronicDevices', label: 'อุปกรณ์อิเล็กทรอนิกส์' },
  { key: 'sideIncome', label: 'รายได้เสริม' },
  { key: 'fatherStatus', label: 'สถานะบิดา' },
  { key: 'fatherAge', label: 'อายุบิดา' },
  { key: 'fatherOccupation', label: 'อาชีพบิดา' },
  { key: 'fatherIncome', label: 'รายได้บิดา' },
  { key: 'motherStatus', label: 'สถานะมารดา' },
  { key: 'motherAge', label: 'อายุมารดา' },
  { key: 'motherOccupation', label: 'อาชีพมารดา' },
  { key: 'motherIncome', label: 'รายได้มารดา' },
  { key: 'parentsStatus', label: 'สถานะผู้ปกครอง' },
  { key: 'tuitionPayer', label: 'ผู้อุปการะค่าเล่าเรียน' },
  { key: 'guardianRelation', label: 'ความเกี่ยวข้องกับผู้ปกครอง' },
  { key: 'guardianOccupation', label: 'อาชีพผู้ปกครอง' },
  { key: 'guardianIncome', label: 'รายได้ผู้ปกครอง' },
  { key: 'siblingsWorking', label: 'พี่น้องทำงาน' },
  { key: 'siblingsNotWorking', label: 'พี่น้องไม่ทำงาน' },
  { key: 'siblingsStudying', label: 'พี่น้องกำลังศึกษา' },
  { key: 'studentLoan', label: 'เงินกู้ กยศ.' },
  { key: 'previousScholarships', label: 'เคยรับทุนมาก่อน' },
];

// ค่าช่องว่าง -> แสดง "-" [FR-APP-04]
function displayValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === '') {
    return '-';
  }
  return value;
}

// ช่องข้อมูลเล็ก ๆ 1 ช่อง (label อยู่บน ค่าอยู่ล่าง)
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-slate-700">{label}</span>
      <span className="text-base font-medium text-slate-900 break-words">{value}</span>
    </div>
  );
}

export function ApplicantProfilePanel({ detail }: ApplicantProfilePanelProps) {
  const fullName = `${detail.titlePrefix}${detail.firstName} ${detail.lastName}`.trim();
  const info = detail.supportingInfo;
  const mapUrl = info?.accommodationMapUrl ?? '';
  // ลิงก์แผนที่: ต้องขึ้นต้นด้วย http:// หรือ https:// เท่านั้นถึงจะกดได้ [FR-APP-05]
  const mapUrlIsSafe = mapUrl.startsWith('http://') || mapUrl.startsWith('https://');

  return (
    <div className="flex flex-col gap-4">
      {/* หัวแผง */}
      <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900">
        ข้อมูลผู้สมัครและประวัติการศึกษา (อ่านอย่างเดียว)
      </div>

      {/* ข้อมูลหลัก */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-bold text-slate-900">{fullName}</span>
          <span className="text-sm font-mono text-slate-700">{detail.studentCode}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="คณะ" value={displayValue(detail.faculty)} />
          <Field label="สาขาวิชา" value={displayValue(detail.major)} />
          <Field label="ชั้นปีที่" value={String(detail.studyYear || '-')} />
          <Field
            label="คะแนนสะสมเฉลี่ย (GPAX)"
            value={typeof detail.gpa === 'number' ? detail.gpa.toFixed(2) : '-'}
          />
        </div>
      </div>

      {/* ลิงก์แผนที่ (ถ้ามี) [FR-APP-05] */}
      {mapUrl && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col gap-1">
          <span className="text-sm text-slate-700">ลิงก์แผนที่ที่อยู่อาศัย</span>
          {mapUrlIsSafe ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-700 underline break-all hover:text-blue-900"
            >
              {mapUrl}
            </a>
          ) : (
            <span className="text-sm text-slate-700 break-all">{mapUrl}</span>
          )}
        </div>
      )}

      {/* ข้อมูลประกอบทั้งหมด (ค่าว่างแสดง "-") [FR-APP-04] */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl">
        <span className="text-base font-bold text-slate-900">ข้อมูลประกอบการพิจารณา</span>
        {info === null ? (
          <p className="mt-2 text-sm text-slate-700">-</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            {SUPPORTING_LABELS.map(({ key, label }) => (
              <Field key={key} label={label} value={displayValue(info[key])} />
            ))}
          </div>
        )}
      </div>

      {/* หมายเหตุด้านความเป็นส่วนตัว */}
      <p className="text-sm text-slate-600 border-l-2 border-slate-300 pl-3 py-1">
        หน้านี้แสดงเฉพาะข้อมูลที่จำเป็นต่อการประเมิน ไม่รวมเลขบัตรประชาชน โทรศัพท์ และอีเมล
      </p>
    </div>
  );
}
