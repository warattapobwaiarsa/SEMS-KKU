import type { ReactNode } from "react";
import type { Metadata } from "next";
import { RoleLayoutShell } from "@/components/layout";
import { EVALUATOR_NAV_ITEMS, MOCK_EVALUATOR_USER } from "@/config/navigation";

export const metadata: Metadata = {
  title: "SEMS - ระบบผู้ประเมิน (Evaluator)",
  description: "พื้นที่ปฏิบัติงานสำหรับผู้ประเมินทุนการศึกษา SEMS-KKU",
};

export default function EvaluatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RoleLayoutShell items={EVALUATOR_NAV_ITEMS} user={MOCK_EVALUATOR_USER}>
      {children}
    </RoleLayoutShell>
  );
}
