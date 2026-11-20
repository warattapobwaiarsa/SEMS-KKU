import type { NavItemConfig, UserProfile } from "@/types/navigation";

export const SYSTEM_CONFIG = {
  name: "SEMS",
  fullName: "ระบบบริหารจัดการการประเมินทุนการศึกษา",
  faculty: "คณะวิศวกรรมศาสตร์",
  university: "มหาวิทยาลัยขอนแก่น",
  version: "v1.0",
} as const;

export const ADMIN_NAV_ITEMS: NavItemConfig[] = [
  // ศูนย์ปฏิบัติการรอบทุน (Operations)
  {
    title: "รอบทุนการศึกษา",
    href: "/admin/scholarship-rounds",
    iconName: "Calendar",
    description: "สร้างและควบคุมวงจรรอบทุน (Draft / Open / Closed)",
    group: "การดำเนินงาน (Operations)",
  },
  {
    title: "ผู้สมัคร",
    href: "/admin/applicants",
    iconName: "UserCheck",
    description: "นำเข้าข้อมูลผู้สมัครผ่านไฟล์ Excel และดูรายชื่อ",
    group: "การดำเนินงาน (Operations)",
  },
  {
    title: "ผลการประเมินและอันดับ",
    href: "/admin/evaluation-results",
    iconName: "ListOrdered",
    description: "ตรวจสอบคะแนนเฉลี่ยและการจัดอันดับผู้สมัคร",
    group: "การดำเนินงาน (Operations)",
  },
  {
    title: "การจัดสรรทุน",
    href: "/admin/scholarship-allocation",
    iconName: "Banknote",
    description: "กำหนดงบประมาณและบันทึกผลการจัดสรรทุน",
    group: "การดำเนินงาน (Operations)",
  },
  // การตั้งค่าระบบและเกณฑ์ (Settings)
  {
    title: "ประเภททุนและเกณฑ์การประเมิน",
    href: "/admin/scholarship-types",
    iconName: "Award",
    description: "จัดการประเภททุนและกำหนดโครงสร้างเกณฑ์การประเมินเริ่มต้น",
    group: "การตั้งค่าระบบ (Settings)",
  },
  {
    title: "ผู้ใช้งาน",
    href: "/admin/users",
    iconName: "Users",
    description: "จัดการบัญชีผู้ใช้งานและกำหนดอายุบัญชีผู้ประเมิน",
    group: "การตั้งค่าระบบ (Settings)",
  },
  // รายงาน (Reports)
  {
    title: "รายงาน",
    href: "/admin/reports",
    iconName: "BarChart3",
    description: "ส่งออกรายงานสรุปผลและรายงานการจัดสรรทุนพร้อมรหัสผ่าน",
    group: "รายงานและการส่งออก (Reports)",
  },
];

export const EVALUATOR_NAV_ITEMS: NavItemConfig[] = [
  {
    title: "รอบทุนที่เปิดประเมิน",
    href: "/evaluator/rounds",
    iconName: "ClipboardList",
    description: "รายชื่อรอบทุนสถานะ Open และการบันทึกประเมินคะแนน",
  },
  {
    title: "ผลการประเมินของฉัน",
    href: "/evaluator/my-evaluations",
    iconName: "History",
    description: "ตรวจสอบประวัติผลการประเมินที่ส่งแล้วและฉบับร่าง",
  },
];

export const MOCK_ADMIN_USER: UserProfile = {
  id: "ADM-001",
  name: "นายอนุชา ผู้ดูแล",
  email: "anucha@kku.ac.th",
  role: "admin",
  department: "งานบริการการศึกษา",
  faculty: "คณะวิศวกรรมศาสตร์ มหาวิทยาลัยขอนแก่น",
};

export const MOCK_EVALUATOR_USER: UserProfile = {
  id: "EVL-001",
  name: "ผศ.ดร.สมชาย ใจดี",
  email: "somchai@kku.ac.th",
  role: "evaluator",
  department: "สาขาวิศวกรรมคอมพิวเตอร์",
  faculty: "คณะวิศวกรรมศาสตร์ มหาวิทยาลัยขอนแก่น",
  expiresAt: "2569-10-31",
};
