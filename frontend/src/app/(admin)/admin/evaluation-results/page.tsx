import { PlaceholderPage } from "@/components/layout";

export default function EvaluationResultsPage() {
  return (
    <PlaceholderPage
      title="ผลการประเมินและอันดับ"
      subtitle="ตรวจสอบคะแนนเฉลี่ยและการจัดอันดับผู้สมัครแบบเรียลไทม์"
      searchPlaceholder="ค้นหาด้วยรหัสนักศึกษา หรือชื่อ-นามสกุล..."
      relatedLinks={[
        { label: "การจัดสรรทุน", href: "/admin/scholarship-allocation" },
        { label: "รายงาน", href: "/admin/reports" },
      ]}
    />
  );
}
