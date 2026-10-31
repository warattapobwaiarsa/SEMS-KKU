"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SYSTEM_CONFIG } from "@/config/navigation";
import type { NavItemConfig, UserRole } from "@/types/navigation";
import { NavItem } from "./nav-item";

interface AppSidebarProps {
  items: NavItemConfig[];
  role: UserRole;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onItemClick?: () => void;
}

export function AppSidebar({
  items,
  role,
  className = "",
  isCollapsed = false,
  onToggleCollapse,
  onItemClick,
}: AppSidebarProps) {
  const homeHref = role === "admin" ? "/admin/scholarship-rounds" : "/evaluator/rounds";

  return (
    <aside
      className={`h-full bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none transition-[width] duration-200 ease-in-out ${
        isCollapsed ? "w-[68px]" : "w-[260px]"
      } ${className}`}
      aria-label="เมนูหลัก"
    >
      <div className="flex flex-col min-h-0">
        {/* Brand / Logo Area */}
        <div
          className={`border-b border-slate-200 flex items-center ${
            isCollapsed ? "p-3 justify-center flex-col gap-2" : "p-4 justify-between"
          }`}
        >
          <Link
            href={homeHref}
            className={`flex items-center gap-3 group ${isCollapsed ? "justify-center" : "min-w-0"}`}
            title={isCollapsed ? `${SYSTEM_CONFIG.name} - ${SYSTEM_CONFIG.fullName}` : undefined}
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs group-hover:bg-blue-700 transition-colors shrink-0">
              S
            </div>
            {!isCollapsed && (
              <div className="min-w-0 truncate">
                <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">
                  {SYSTEM_CONFIG.name}
                </span>
                <span className="text-xs text-slate-500 truncate block">
                  {SYSTEM_CONFIG.fullName}
                </span>
              </div>
            )}
          </Link>

          {/* Collapse/Expand Toggle Button (for desktop/tablet) */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${
                isCollapsed ? "w-8 h-8 flex items-center justify-center mt-1" : "shrink-0"
              }`}
              title={isCollapsed ? "ขยายเมนู (Expand)" : "ย่อเมนู (Collapse)"}
              aria-label={isCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav
          className={`flex-1 overflow-y-auto py-3 space-y-1.5 ${
            isCollapsed ? "px-2" : "px-3"
          }`}
          aria-label="รายการเมนู"
        >
          {items.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isCollapsed={isCollapsed}
              onItemClick={onItemClick}
            />
          ))}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div
        className={`border-t border-slate-200 bg-slate-50/50 ${
          isCollapsed ? "p-3 text-center" : "p-4"
        }`}
      >
        {isCollapsed ? (
          <span
            className="text-[11px] font-bold text-slate-400 font-mono"
            title={`${SYSTEM_CONFIG.faculty} ${SYSTEM_CONFIG.university}`}
          >
            EN
          </span>
        ) : (
          <div className="text-xs text-slate-500 leading-relaxed truncate">
            <p className="font-medium text-slate-700 truncate">{SYSTEM_CONFIG.faculty}</p>
            <p className="truncate">{SYSTEM_CONFIG.university}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
