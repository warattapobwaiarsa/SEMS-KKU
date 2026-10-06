import { PlaceholderPage } from "@/components/layout";

export default function ScholarshipRoundsPage() {
  return (
    <PlaceholderPage
      title="รอบทุนการศึกษา"
      subtitle="จัดการและติดตามสถานะรอบการให้ทุนการศึกษาของคณะ"
      actionButtonLabel="สร้างรอบทุน"
      searchPlaceholder="ค้นหาชื่อรอบทุนการศึกษา..."
      relatedLinks={[
        { label: "เกณฑ์การประเมิน", href: "/admin/evaluation-criteria" },
        { label: "ผู้สมัคร", href: "/admin/applicants" },
      ]}
    />
  );
}
