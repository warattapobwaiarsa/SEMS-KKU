import { PlaceholderPage } from "@/components/layout";

export default function ApplicantsPage() {
  return (
    <PlaceholderPage
      specId="SPEC: A1"
      role="Admin"
      title="ผู้สมัคร"
      subtitle="นำเข้าข้อมูลผู้สมัครผ่านไฟล์ Excel (.xlsx) และตรวจสอบรายชื่อผู้สมัครในรอบทุน"
      description="ระบบนำเข้าข้อมูลผู้สมัครเฉพาะรอบ Draft พร้อมหน้าจอ Preview ตรวจสอบความถูกต้องรายแถว และตารางรายชื่อผู้สมัครแบบ Read-only (ไม่แสดงเลขบัตรประชาชน โทรศัพท์ และอีเมลตามหลัก PDPA) ตาม Scope 1.3.2.5, 1.3.2.6 และ FR-IMP-01 ถึง FR-IMP-17"
      relatedLinks={[
        { label: "รอบทุนการศึกษา", href: "/admin/scholarship-rounds" },
        { label: "ผลการประเมินและอันดับ", href: "/admin/evaluation-results" },
      ]}
    />
  );
}
