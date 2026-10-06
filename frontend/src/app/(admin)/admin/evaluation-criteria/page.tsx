import { PlaceholderPage } from "@/components/layout";

export default function EvaluationCriteriaPage() {
  return (
    <PlaceholderPage
      specId="SPEC: C1"
      role="Admin"
      title="เกณฑ์การประเมิน"
      subtitle="กำหนดชุดเกณฑ์และเกณฑ์ย่อย (แบบมีคะแนนรวม 100 คะแนน และแบบข้อความประกอบการพิจารณา)"
      description="ระบบจัดการเกณฑ์การประเมิน รองรับการสร้างเกณฑ์ย่อยประเภทมีคะแนน (พร้อมกำหนดสิทธิ์ Comment) และประเภทไม่มีคะแนน พร้อมกฎตรวจสอบคะแนนรวม 100 คะแนนเต็มอย่างเข้มงวดตาม Scope 1.3.2.4 และ FR-CRT-01 ถึง FR-CRT-13"
      relatedLinks={[
        { label: "รอบทุนการศึกษา", href: "/admin/scholarship-rounds" },
        { label: "ผลการประเมินและอันดับ", href: "/admin/evaluation-results" },
      ]}
    />
  );
}
