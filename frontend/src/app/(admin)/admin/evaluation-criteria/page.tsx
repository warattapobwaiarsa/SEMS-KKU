import { PlaceholderPage } from "@/components/layout";

export default function EvaluationCriteriaPage() {
  return (
    <PlaceholderPage
      title="เกณฑ์การประเมิน"
      subtitle="กำหนดชุดเกณฑ์และสัดส่วนคะแนนสำหรับการประเมินทุนการศึกษา"
      actionButtonLabel="สร้างชุดเกณฑ์"
      searchPlaceholder="ค้นหาชื่อชุดเกณฑ์การประเมิน..."
      relatedLinks={[
        { label: "รอบทุนการศึกษา", href: "/admin/scholarship-rounds" },
      ]}
    />
  );
}
