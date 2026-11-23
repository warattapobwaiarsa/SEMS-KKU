"use client";

import { Menu } from "lucide-react";
import type { UserProfile } from "@/types/navigation";

interface AppHeaderProps {
  user?: UserProfile;
  onMenuToggle?: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  return (
    <header className="md:hidden h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30 select-none shadow-xs shrink-0">
      <button
        type="button"
        onClick={onMenuToggle}
        className="p-2 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
        aria-label="เปิดเมนูนำทาง"
      >
        <Menu className="w-5 h-5" aria-hidden="true" />
      </button>

      <span className="font-bold text-base text-slate-900 tracking-tight">SEMS</span>

      <div className="w-9" aria-hidden="true" />
    </header>
  );
}
