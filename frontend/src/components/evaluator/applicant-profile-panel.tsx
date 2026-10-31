/**
 * แผงข้อมูลผู้สมัคร (ฝั่งซ้ายของหน้าประเมิน — อ่านอย่างเดียว) [FR-APP-03] [BR-APP-04]
 * - ค่าว่าง/ null แสดงเป็น "-" [FR-APP-04]
 * - ลิงก์แผนที่ แสดงเป็นลิงก์เฉพาะเมื่อขึ้นต้นด้วย http:// หรือ https:// [FR-APP-05]
 * - ไม่แสดงเลขบัตรประชาชน / โทรศัพท์ / อีเมล (PDPA Compliance)
 */
'use client';

import React from 'react';
import type { EvaluatorApplicantDetail } from '@/types/evaluation';
import {
  User,
  Home,
  Users,
  DollarSign,
  MapPin,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface ApplicantProfilePanelProps {
  detail: EvaluatorApplicantDetail;
}

// ค่าช่องว่าง -> แสดง "-" [FR-APP-04]
function displayValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === '') {
    return '-';
  }
  return value;
}

// ช่องข้อมูลย่อย (label ด้านบน ค่าด้านล่าง)
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground break-words">{value}</span>
    </div>
  );
}

export function ApplicantProfilePanel({ detail }: ApplicantProfilePanelProps) {
  const fullName = `${detail.titlePrefix}${detail.firstName} ${detail.lastName}`.trim();
  const info = detail.supportingInfo;
  const mapUrl = info?.accommodationMapUrl ?? '';
  const mapUrlIsSafe = mapUrl.startsWith('http://') || mapUrl.startsWith('https://');

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header Card: ข้อมูลผู้สมัครและการศึกษา */}
      <div className="p-4 sm:p-5 bg-card border border-border/80 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">{fullName}</h3>
              <p className="text-xs sm:text-sm font-mono text-muted-foreground mt-0.5">
                รหัสนักศึกษา: {detail.studentCode}
              </p>
            </div>
          </div>
          {typeof detail.gpa === 'number' && (
            <div className="text-right shrink-0">
              <span className="block text-xs text-muted-foreground font-medium">GPAX</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-mono font-bold text-sm">
                {detail.gpa.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <InfoField label="คณะ" value={displayValue(detail.faculty)} />
          <InfoField label="สาขาวิชา" value={displayValue(detail.major)} />
          <InfoField label="ชั้นปีที่" value={detail.studyYear ? `ชั้นปีที่ ${detail.studyYear}` : '-'} />
          <InfoField label="วันที่ยื่นคำขอ" value={displayValue(info?.applicationDate)} />
        </div>
      </div>

      {/* 2. Card: ข้อมูลที่พักอาศัยและค่าใช้จ่าย */}
      <div className="p-4 sm:p-5 bg-card border border-border/80 rounded-2xl shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Home className="w-4 h-4 text-primary" />
            ข้อมูลที่อยู่อาศัยและค่าใช้จ่าย
          </h4>
          {mapUrl && mapUrlIsSafe && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>ดูแผนที่ที่พัก</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <InfoField label="ที่อยู่อาศัย / ลักษณะที่พัก" value={displayValue(info?.accommodation)} />
          <InfoField label="ค่าเช่าที่อยู่อาศัย" value={displayValue(info?.rent)} />
          <InfoField label="ค่าใช้จ่ายส่วนตัว" value={displayValue(info?.personalExpense)} />
          <InfoField label="ค่าอุปกรณ์การเรียน" value={displayValue(info?.studyEquipmentCost)} />
          <InfoField label="อุปกรณ์อิเล็กทรอนิกส์" value={displayValue(info?.electronicDevices)} />
          <InfoField label="รายได้เสริมของนักศึกษา" value={displayValue(info?.sideIncome)} />
        </div>
      </div>

      {/* 3. Card: ข้อมูลครอบครัวและผู้ปกครอง */}
      <div className="p-4 sm:p-5 bg-card border border-border/80 rounded-2xl shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
          <Users className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-bold text-foreground">ข้อมูลครอบครัวและผู้ปกครอง</h4>
        </div>

        {/* ข้อมูลบิดา */}
        <div className="space-y-2 bg-muted/20 p-3 rounded-xl border border-border/40">
          <span className="text-xs font-bold text-foreground block">ข้อมูลบิดา</span>
          <div className="grid grid-cols-2 gap-2.5">
            <InfoField label="สถานะบิดา" value={displayValue(info?.fatherStatus)} />
            <InfoField label="อายุบิดา" value={info?.fatherAge ? `${info.fatherAge} ปี` : '-'} />
            <InfoField label="อาชีพบิดา" value={displayValue(info?.fatherOccupation)} />
            <InfoField label="รายได้บิดา" value={displayValue(info?.fatherIncome)} />
          </div>
        </div>

        {/* ข้อมูลมารดา */}
        <div className="space-y-2 bg-muted/20 p-3 rounded-xl border border-border/40">
          <span className="text-xs font-bold text-foreground block">ข้อมูลมารดา</span>
          <div className="grid grid-cols-2 gap-2.5">
            <InfoField label="สถานะมารดา" value={displayValue(info?.motherStatus)} />
            <InfoField label="อายุมารดา" value={info?.motherAge ? `${info.motherAge} ปี` : '-'} />
            <InfoField label="อาชีพมารดา" value={displayValue(info?.motherOccupation)} />
            <InfoField label="รายได้มารดา" value={displayValue(info?.motherIncome)} />
          </div>
        </div>

        {/* ผู้ปกครองและพี่น้อง */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          <InfoField label="สถานะผู้ปกครอง" value={displayValue(info?.parentsStatus)} />
          <InfoField label="ผู้อุปการะค่าเล่าเรียน" value={displayValue(info?.tuitionPayer)} />
          <InfoField label="ความเกี่ยวข้องกับผู้ปกครอง" value={displayValue(info?.guardianRelation)} />
          <InfoField label="อาชีพ / รายได้ผู้ปกครอง" value={`${displayValue(info?.guardianOccupation)} (${displayValue(info?.guardianIncome)})`} />
          <InfoField label="พี่น้อง (ทำงาน / ไม่ทำงาน)" value={`${displayValue(info?.siblingsWorking)} / ${displayValue(info?.siblingsNotWorking)} คน`} />
          <InfoField label="พี่น้องกำลังศึกษา" value={displayValue(info?.siblingsStudying)} />
        </div>
      </div>

      {/* 4. Card: ประวัติทุนการศึกษาและภาระหนี้สิน */}
      <div className="p-4 sm:p-5 bg-card border border-border/80 rounded-2xl shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <h4 className="text-sm font-bold text-foreground">ทุนการศึกษาและเงินกู้ยืม</h4>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <InfoField label="เงินกู้ยืมเพื่อการศึกษา (กยศ.)" value={displayValue(info?.studentLoan)} />
          <InfoField label="ประวัติทุนการศึกษาที่เคยได้รับ" value={displayValue(info?.previousScholarships)} />
        </div>
      </div>

      {/* PDPA Privacy Note */}
      <div className="flex items-start gap-2 p-3 bg-muted/30 border border-border/50 rounded-xl text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>
          <strong>การคุ้มครองข้อมูลส่วนบุคคล (PDPA):</strong> ระบบแสดงเฉพาะข้อมูลที่จำเป็นต่อการประเมินความจำเป็นทางการเงิน ไม่เปิดเผยเลขบัตรประชาชน เบอร์โทรศัพท์ และอีเมลส่วนบุคคล
        </span>
      </div>
    </div>
  );
}
