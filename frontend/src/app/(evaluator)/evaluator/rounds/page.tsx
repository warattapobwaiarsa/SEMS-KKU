import { PlaceholderPage } from "@/components/layout";

export default function EvaluatorRoundsPage() {
  return (
    <PlaceholderPage
      title="รอบทุนที่เปิดประเมิน"
      subtitle="เลือกรอบทุนและผู้สมัครที่เปิดให้ทำการประเมินคะแนน"
      searchPlaceholder="ค้นหาชื่อรอบทุนการศึกษา..."
      relatedLinks={[
        { label: "ผลการประเมินของฉัน", href: "/evaluator/my-evaluations" },
      ]}
    />
  );
}
