import type { NavItemConfig, UserProfile } from "@/types/navigation";

export const SYSTEM_CONFIG = {
  name: "SEMS",
  fullName: "ระบบบริหารจัดการการประเมินทุนการศึกษา",
  faculty: "คณะวิศวกรรมศาสตร์",
  university: "มหาวิทยาลัยขอนแก่น",
  version: "v1.0",
} as const;

export const ADMIN_NAV_ITEMS: NavItemConfig[] = [
  // กระบวนการดำเนินงานรอบทุน (Operations Pipeline)
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
    title: "ผลการประเมิน",
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
  {
    title: "รายงานและสถิติ",
    href: "/admin/reports",
    iconName: "BarChart3",
    description: "ส่งออกรายงานสรุปผลและรายงานการจัดสรรทุนพร้อมรหัสผ่าน",
    group: "การดำเนินงาน (Operations)",
  },
  // การตั้งค่าระบบและเกณฑ์ (Settings & Master Data)
  {
    title: "ประเภททุนการศึกษา",
    href: "/admin/scholarship-types",
    iconName: "Award",
    description: "จัดการประเภททุนการศึกษาและตั้งค่าเกณฑ์เริ่มต้น",
    group: "การตั้งค่าระบบ (Settings)",
  },
  {
    title: "เกณฑ์การประเมิน",
    href: "/admin/evaluation-criteria",
    iconName: "CheckSquare",
    description: "กำหนดชุดเกณฑ์และเกณฑ์ย่อยรวม 100 คะแนน",
    group: "การตั้งค่าระบบ (Settings)",
  },
  {
    title: "ผู้ใช้งานและสิทธิ์",
    href: "/admin/users",
    iconName: "Users",
    description: "จัดการบัญชีผู้ใช้งานและกำหนดอายุบัญชีผู้ประเมิน",
    group: "การตั้งค่าระบบ (Settings)",
  },
];

export const EVALUATOR_NAV_ITEMS: NavItemConfig[] = [
  {
    title: "รอบทุนที่เปิดประเมิน",
    href: "/evaluator/rounds",
    iconName: "ClipboardList",
    description: "รายชื่อรอบทุนสถานะ Open และการบันทึกประเมินคะแนน",
    group: "การประเมินทุน (Evaluation)",
  },
  {
    title: "ผลการประเมินของฉัน",
    href: "/evaluator/my-evaluations",
    iconName: "History",
    description: "ตรวจสอบประวัติผลการประเมินที่ส่งแล้วและฉบับร่าง",
    group: "การประเมินทุน (Evaluation)",
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
