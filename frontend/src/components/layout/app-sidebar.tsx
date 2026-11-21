"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, LogOut } from "lucide-react";
import { SYSTEM_CONFIG } from "@/config/navigation";
import type { NavItemConfig, UserRole, UserProfile } from "@/types/navigation";
import { EvaluatorSwitcher } from "@/components/evaluator/evaluator-switcher";
import { NavItem } from "./nav-item";

interface AppSidebarProps {
  items: NavItemConfig[];
  role: UserRole;
  user?: UserProfile;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onItemClick?: () => void;
  onLogout?: () => void;
}

export function AppSidebar({
  items,
  role,
  user,
  className = "",
  isCollapsed = false,
  onToggleCollapse,
  onItemClick,
  onLogout,
}: AppSidebarProps) {
  const router = useRouter();
  const homeHref = role === "admin" ? "/admin/scholarship-rounds" : "/evaluator/rounds";

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    if (confirm("คุณต้องการออกจากระบบหรือไม่?")) {
      router.push("/");
    }
  };

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
            title={SYSTEM_CONFIG.name}
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs group-hover:bg-blue-700 transition-colors shrink-0">
              S
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">
                  {SYSTEM_CONFIG.name}
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
          {items.map((item, index) => {
            const prevItem = items[index - 1];
            const isNewGroup = item.group && (!prevItem || prevItem.group !== item.group);

            return (
              <React.Fragment key={item.href}>
                {isNewGroup && (
                  <div
                    className={`${
                      index > 0 ? "pt-3.5 mt-2 border-t border-slate-100" : "pt-1"
                    } ${isCollapsed ? "px-1 text-center" : "px-3 mb-1.5"}`}
                  >
                    {!isCollapsed && (
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {item.group}
                      </span>
                    )}
                  </div>
                )}
                <NavItem
                  item={item}
                  isCollapsed={isCollapsed}
                  onItemClick={onItemClick}
                />
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer with User Profile and Logout */}
      <div
        className={`border-t border-slate-200 bg-slate-50/60 ${
          isCollapsed ? "p-2.5 flex justify-center" : "p-3"
        }`}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
            title={`ออกจากระบบ (${user?.name || "ผู้ใช้งาน"})`}
            aria-label="ออกจากระบบ"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : (
          <div className="space-y-2">
            {role === "evaluator" && (
              <div className="flex items-center justify-between gap-2 pb-1">
                <span className="text-[11px] font-medium text-slate-500">สลับบัญชี:</span>
                <EvaluatorSwitcher />
              </div>
            )}
            <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
              <div className="min-w-0 flex-1 truncate">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                  {user?.name || "ผู้ใช้งาน"}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`inline-block px-1.5 py-0.2 text-[10px] font-medium rounded border ${
                      role === "evaluator"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-100 text-slate-700"
                    }`}
                  >
                    {role === "evaluator" ? "Evaluator" : "Admin"}
                  </span>
                  {user?.expiresAt && role === "evaluator" && (
                    <span className="text-[10px] text-slate-400 truncate">
                      {user.expiresAt}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0"
                title="ออกจากระบบ"
                aria-label="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
