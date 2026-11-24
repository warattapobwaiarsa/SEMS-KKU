import { PlaceholderPage } from "@/components/layout";

export default function ReportsPage() {
  return (
    <PlaceholderPage
      title="รายงานและส่งออกข้อมูล"
      subtitle="ส่งออกรายงานสรุปผลการประเมินและรายงานการจัดสรรทุนการศึกษา"
      actionButtonLabel="ส่งออกรายงาน"
      searchPlaceholder="ค้นหาชื่อรอบทุนการศึกษา..."
      relatedLinks={[
        { label: "การจัดสรรทุน", href: "/admin/scholarship-allocation" },
        { label: "ผลการประเมิน", href: "/admin/evaluation-results" },
      ]}
    />
  );
}
