import { PlaceholderPage } from "@/components/layout";

export default function EvaluatorRoundsPage() {
  return (
    <PlaceholderPage
      specId="SPEC: V1"
      role="Evaluator"
      title="รอบทุนที่เปิดประเมิน"
      subtitle="แสดงเฉพาะรอบทุนที่มีสถานะเปิดรับการประเมิน (Open) เท่านั้น"
      description="พื้นที่ปฏิบัติงานของผู้ประเมินทุนการศึกษา เลือกดูรายชื่อผู้สมัครที่เปิดให้ประเมิน บันทึกคะแนนตามเกณฑ์ย่อยแบบมีคะแนน พร้อมระบบ Auto-save แบบร่าง (Draft) ตรวจสอบความถูกต้อง และยืนยันส่งผลการประเมิน (Submitted) ตาม Scope 1.3.3.2 ถึง 1.3.3.6 และ FR-EVL-01 ถึง FR-EVL-13"
      relatedLinks={[
        { label: "ผลการประเมินของฉัน", href: "/evaluator/my-evaluations" },
      ]}
    />
  );
}
