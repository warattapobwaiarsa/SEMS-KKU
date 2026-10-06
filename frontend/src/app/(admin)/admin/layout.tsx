import type { ReactNode } from "react";
import type { Metadata } from "next";
import { RoleLayoutShell } from "@/components/layout";
import { ADMIN_NAV_ITEMS, MOCK_ADMIN_USER } from "@/config/navigation";

export const metadata: Metadata = {
  title: "SEMS - ระบบผู้ดูแลระบบ (Admin)",
  description: "พื้นที่ปฏิบัติงานสำหรับผู้ดูแลระบบ SEMS-KKU",
};

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RoleLayoutShell items={ADMIN_NAV_ITEMS} user={MOCK_ADMIN_USER}>
      {children}
    </RoleLayoutShell>
  );
}
