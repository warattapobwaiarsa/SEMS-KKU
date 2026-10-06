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
  onItemClick?: () => void;
}

export function NavItem({ item, onItemClick }: NavItemProps) {
  const pathname = usePathname();
  const Icon = ICON_MAP[item.iconName] ?? HelpCircle;

  // Active if current path exactly matches or starts with item.href (for sub-routes)
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-sm transition-all duration-150 text-[15px] font-medium ${
        isActive
          ? "bg-[#F3F4F6] text-[#212B3A] font-semibold border-l-4 border-[#374151] pl-2.5 shadow-none"
          : "text-[#585F6A] hover:bg-[#F3F4F6] hover:text-[#1A1C1C] border-l-4 border-transparent"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon
          className={`w-5 h-5 shrink-0 transition-colors ${
            isActive ? "text-[#374151]" : "text-[#75777D] group-hover:text-[#374151]"
          }`}
          aria-hidden="true"
        />
        <span className="truncate">{item.title}</span>
      </div>

      {item.badge && (
        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full border border-[#9CA3AF] bg-[#FFFFFF] text-[#585F6A]">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
