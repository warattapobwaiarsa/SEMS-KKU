import { PlaceholderPage } from "@/components/layout";

export default function ScholarshipAllocationPage() {
  return (
    <PlaceholderPage
      title="การจัดสรรทุน"
      subtitle="กำหนดงบประมาณรวมและบันทึกผลการจัดสรรทุนการศึกษา"
      actionButtonLabel="กำหนดยอดงบประมาณ"
      searchPlaceholder="ค้นหาด้วยรหัสนักศึกษา หรือสถานะการได้รับทุน..."
      relatedLinks={[
        { label: "ผลการประเมินและอันดับ", href: "/admin/evaluation-results" },
        { label: "รายงาน", href: "/admin/reports" },
      ]}
    />
  );
}
