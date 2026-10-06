import { PlaceholderPage } from "@/components/layout";

export default function EvaluationResultsPage() {
  return (
    <PlaceholderPage
      specId="SPEC: E1"
      role="Admin"
      title="ผลการประเมินและอันดับ"
      subtitle="ตรวจสอบผลการประเมิน คะแนนเฉลี่ย และการจัดอันดับผู้สมัครแบบ Realtime"
      description="ระบบคำนวณคะแนนเฉลี่ยจากผลการประเมินที่ส่งแล้ว (Submitted) พร้อมกลไก Tie-breaker จัดอันดับจากรหัสนักศึกษาน้อยไปมาก และระบบดูรายละเอียดคะแนนรายเกณฑ์ย่อยของผู้ประเมินแต่ละท่านตาม Scope 1.3.2.8 และ FR-SCR-01 ถึง FR-SCR-06"
      relatedLinks={[
        { label: "การจัดสรรทุน", href: "/admin/scholarship-allocation" },
        { label: "รายงานสรุปผล", href: "/admin/reports" },
      ]}
    />
  );
}
