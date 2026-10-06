import { PlaceholderPage } from "@/components/layout";

export default function ScholarshipAllocationPage() {
  return (
    <PlaceholderPage
      specId="SPEC: G1"
      role="Admin"
      title="การจัดสรรทุน"
      subtitle="กำหนดงบประมาณรวม บันทึกผลการจัดสรรทุนรายบุคคล และยืนยันผลการจัดสรร (Finalized)"
      description="ระบบบริหารงบประมาณทุนการศึกษาสำหรับรอบ Closed กำหนดจำนวนเงินรายบุคคล ตรวจสอบยอดเงินไม่เกินงบประมาณรวม คุมวงจรสถานะ Editing ↔ Finalized และหน้ารายละเอียดดูเลขบัตรประชาชนแบบ Masked พร้อมบันทึก Log ตาม Scope 1.3.2.9, 1.3.2.10 และ FR-ALC-01 ถึง FR-ALC-14"
      relatedLinks={[
        { label: "ผลการประเมินและอันดับ", href: "/admin/evaluation-results" },
        { label: "รายงานผลการจัดสรร", href: "/admin/reports" },
      ]}
    />
  );
}
