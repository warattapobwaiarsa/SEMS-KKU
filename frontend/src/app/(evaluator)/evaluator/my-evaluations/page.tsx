import { PlaceholderPage } from "@/components/layout";

export default function MyEvaluationsPage() {
  return (
    <PlaceholderPage
      specId="SPEC: V24"
      role="Evaluator"
      title="ผลการประเมินของฉัน"
      subtitle="ตรวจสอบประวัติการประเมิน คะแนน และความคิดเห็นที่ตนเองได้บันทึกไว้"
      description="หน้าจอแสดงประวัติผลการประเมินของผู้ประเมินเอง ทั้งสถานะแบบร่าง (Draft) และสถานะยืนยันส่งแล้ว (Submitted) สำหรับรอบที่ Open และ Closed ในรูปแบบดูอย่างเดียว (Read-only) โดยไม่เห็นผลของผู้ประเมินท่านอื่น ตามข้อกำหนด FRS ข้อ FR-EVL-14 (คำตัดสิน E8)"
      relatedLinks={[
        { label: "รอบทุนที่เปิดประเมิน", href: "/evaluator/rounds" },
      ]}
    />
  );
}
