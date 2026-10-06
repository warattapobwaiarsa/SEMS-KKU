"use client";

import Link from "next/link";
import { SYSTEM_CONFIG } from "@/config/navigation";
import type { NavItemConfig, UserRole } from "@/types/navigation";
import { NavItem } from "./nav-item";

interface AppSidebarProps {
  items: NavItemConfig[];
  role: UserRole;
  className?: string;
  onItemClick?: () => void;
}

export function AppSidebar({
  items,
  role,
  className = "",
  onItemClick,
}: AppSidebarProps) {
  const roleLabel = role === "admin" ? "ผู้ดูแลระบบ (Admin)" : "ผู้ประเมิน (Evaluator)";

  return (
    <aside
      className={`w-[260px] h-full bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none ${className}`}
      aria-label="เมนูหลัก"
    >
      <div className="flex flex-col min-h-0">
        {/* Brand / Logo Area */}
        <div className="p-4 border-b border-slate-200">
          <Link
            href={role === "admin" ? "/admin/scholarship-rounds" : "/evaluator/rounds"}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs group-hover:bg-blue-700 transition-colors">
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  {SYSTEM_CONFIG.name}
                </span>
                <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 bg-slate-100">
                  {SYSTEM_CONFIG.version}
                </span>
              </div>
            </div>
          </Link>
          <p className="text-xs text-slate-500 mt-2 leading-tight">
            {SYSTEM_CONFIG.fullName}
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>พื้นที่ปฏิบัติงาน:</span>
            <span className="font-medium text-slate-800">{roleLabel}</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav
          className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1"
          aria-label="รายการเมนู"
        >
          {items.map((item) => (
            <NavItem key={item.href} item={item} onItemClick={onItemClick} />
          ))}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/70 space-y-2">
        <div className="text-[12px] text-slate-600 leading-tight">
          <p className="font-medium text-slate-800">{SYSTEM_CONFIG.faculty}</p>
          <p className="text-slate-500">{SYSTEM_CONFIG.university}</p>
        </div>
        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Enterprise Architecture</span>
          <span className="font-mono text-slate-500">KKU-EN</span>
        </div>
      </div>
    </aside>
  );
}
