"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Calendar,
  CheckSquare,
  UserCheck,
  ListOrdered,
  Banknote,
  BarChart3,
  ClipboardList,
  History,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { NavItemConfig } from "@/types/navigation";

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  Calendar,
  CheckSquare,
  UserCheck,
  ListOrdered,
  Banknote,
  BarChart3,
  ClipboardList,
  History,
};

interface NavItemProps {
  item: NavItemConfig;
  isCollapsed?: boolean;
  onItemClick?: () => void;
}

export function NavItem({ item, isCollapsed = false, onItemClick }: NavItemProps) {
  const pathname = usePathname();
  const Icon = ICON_MAP[item.iconName] ?? HelpCircle;

  // Active if current path exactly matches or starts with item.href (for sub-routes)
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  if (isCollapsed) {
    return (
      <Link
        href={item.href}
        onClick={onItemClick}
        title={item.title}
        aria-label={item.title}
        className={`group relative flex items-center justify-center w-11 h-11 mx-auto rounded-lg transition-all duration-150 active:scale-95 ${
          isActive
            ? "bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-500/20"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        }`}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon
          className={`w-5 h-5 shrink-0 transition-colors ${
            isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
          }`}
          aria-hidden="true"
        />
        {isActive && (
          <span
            className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full"
            aria-hidden="true"
          />
        )}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={`group flex items-center justify-between gap-3 px-3 py-2.5 min-h-[44px] rounded-md transition-all duration-150 text-[14.5px] font-medium active:scale-[0.98] ${
        isActive
          ? "bg-blue-50/90 text-blue-700 font-semibold border-l-4 border-blue-600 pl-2.5 shadow-xs"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent pl-3"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon
          className={`w-5 h-5 shrink-0 transition-colors ${
            isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
          }`}
          aria-hidden="true"
        />
        <span className="truncate">{item.title}</span>
      </div>

      {item.badge && (
        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-600 font-mono">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
