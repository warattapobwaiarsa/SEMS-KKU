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
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs group-hover:bg-blue-700 transition-colors">
              S
            </div>
            <div className="min-w-0">
              <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">
                {SYSTEM_CONFIG.name}
              </span>
              <span className="text-xs text-slate-500 truncate block">
                {SYSTEM_CONFIG.fullName}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation List */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
          aria-label="รายการเมนู"
        >
          {items.map((item) => (
            <NavItem key={item.href} item={item} onItemClick={onItemClick} />
          ))}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="text-xs text-slate-500 leading-relaxed">
          <p className="font-medium text-slate-700">{SYSTEM_CONFIG.faculty}</p>
          <p>{SYSTEM_CONFIG.university}</p>
        </div>
      </div>
    </aside>
  );
}
