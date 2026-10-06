import { PlaceholderPage } from "@/components/layout";

export default function ScholarshipRoundsPage() {
  return (
    <PlaceholderPage
      specId="SPEC: R1"
      role="Admin"
      title="รอบทุนการศึกษา"
      subtitle="จัดการ กำหนดเกณฑ์ และควบคุมวงจรรอบทุนการศึกษา (Draft → Open → Closed)"
      description="แผงควบคุมรอบการให้ทุนการศึกษา แสดงสถานะรอบทุน การเชื่อมโยงเกณฑ์ประเมิน ตรวจสอบความพร้อมก่อนเปิดรอบ (Open) และรับทราบรายชื่อก่อนปิดรอบ (Closed) ตาม Scope 1.3.2.3, 1.3.2.7 และ FR-RND-01 ถึง FR-RND-13"
      relatedLinks={[
        { label: "เกณฑ์การประเมิน", href: "/admin/evaluation-criteria" },
        { label: "นำเข้าผู้สมัคร", href: "/admin/applicants" },
        { label: "ผลการประเมินและอันดับ", href: "/admin/evaluation-results" },
      ]}
    />
  );
}
