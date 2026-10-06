import { PlaceholderPage } from "@/components/layout";

export default function ReportsPage() {
  return (
    <PlaceholderPage
      specId="SPEC: P1"
      role="Admin"
      title="รายงาน"
      subtitle="ส่งออกรายงานสรุปผลการประเมินและรายงานการจัดสรรทุนในรูปแบบไฟล์ Excel (.xlsx)"
      description="ระบบส่งออกรายงานสรุปผลการประเมิน (รอบ Closed) และรายงานผลการจัดสรรทุน (ผลจัดสรร Finalized) โดยบังคับตั้งรหัสผ่านสำหรับเปิดไฟล์ทุกครั้งเพื่อความปลอดภัยของข้อมูลตาม Scope 1.3.2.11, 1.3.2.12 และ FR-EXP-01 ถึง FR-EXP-09"
      relatedLinks={[
        { label: "การจัดสรรทุน", href: "/admin/scholarship-allocation" },
        { label: "ผลการประเมินและอันดับ", href: "/admin/evaluation-results" },
      ]}
    />
  );
}
