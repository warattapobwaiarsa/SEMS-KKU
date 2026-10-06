import { PlaceholderPage } from "@/components/layout";

export default function MyEvaluationsPage() {
  return (
    <PlaceholderPage
      title="ผลการประเมินของฉัน"
      subtitle="ตรวจสอบประวัติและสรุปผลคะแนนการประเมินที่ตนเองได้บันทึกไว้"
      searchPlaceholder="ค้นหาด้วยชื่อผู้สมัคร หรือรหัสนักศึกษา..."
      relatedLinks={[
        { label: "รอบทุนที่เปิดประเมิน", href: "/evaluator/rounds" },
      ]}
    />
  );
}
