import { PlaceholderPage } from "@/components/layout";

export default function UsersPage() {
  return (
    <PlaceholderPage
      title="ผู้ใช้งาน"
      subtitle="จัดการรายชื่อและสิทธิ์การเข้าถึงของผู้ดูแลระบบและผู้ประเมิน"
      actionButtonLabel="เพิ่มผู้ใช้งาน"
      searchPlaceholder="ค้นหาด้วยชื่อผู้ใช้ หรืออีเมล..."
      relatedLinks={[
        { label: "รอบทุนการศึกษา", href: "/admin/scholarship-rounds" },
      ]}
    />
  );
}
