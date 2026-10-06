import { PlaceholderPage } from "@/components/layout";

export default function ApplicantsPage() {
  return (
    <PlaceholderPage
      title="ผู้สมัคร"
      subtitle="ตรวจสอบรายชื่อและนำเข้าข้อมูลผู้สมัครทุนการศึกษา"
      actionButtonLabel="นำเข้าไฟล์ Excel"
      searchPlaceholder="ค้นหาด้วยรหัสนักศึกษา หรือชื่อ-นามสกุล..."
      relatedLinks={[
        { label: "รอบทุนการศึกษา", href: "/admin/scholarship-rounds" },
        { label: "ผลการประเมินและอันดับ", href: "/admin/evaluation-results" },
      ]}
    />
  );
}
