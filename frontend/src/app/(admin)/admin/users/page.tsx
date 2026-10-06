import { PlaceholderPage } from "@/components/layout";

export default function UsersPage() {
  return (
    <PlaceholderPage
      specId="SPEC: U1"
      role="Admin"
      title="ผู้ใช้งาน"
      subtitle="จัดการบัญชีผู้ใช้งาน สิทธิ์บทบาท (Admin / Evaluator) และกำหนดอายุการใช้งานบัญชีผู้ประเมิน"
      description="หน้ารายการผู้ใช้งาน (Users List) รองรับการค้นหา กรองสถานะ และเพิ่ม/แก้ไขผู้ใช้งาน โดยไม่มีฟังก์ชันลบบัญชีตามข้อกำหนดขอบเขตระบบ (Scope 1.3.2.2 และ FR-USR-01 ถึง FR-USR-15)"
      relatedLinks={[
        { label: "รอบทุนการศึกษา", href: "/admin/scholarship-rounds" },
        { label: "เกณฑ์การประเมิน", href: "/admin/evaluation-criteria" },
      ]}
    />
  );
}
