"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { NavItemConfig, UserRole } from "@/types/navigation";
import { AppSidebar } from "./app-sidebar";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItemConfig[];
  role: UserRole;
}

export function MobileSidebar({
  isOpen,
  onClose,
  items,
  role,
}: MobileSidebarProps) {
  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" aria-modal="true" role="dialog">
      {/* Backdrop overlay with blur */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel with smooth slide-in */}
      <div className="fixed inset-y-0 left-0 w-[270px] max-w-[85vw] bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 ease-out">
        <div className="absolute top-3.5 right-3.5 z-20">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors active:scale-95"
            aria-label="ปิดเมนู"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <AppSidebar
          items={items}
          role={role}
          isCollapsed={false}
          onItemClick={onClose}
          className="w-full border-r-0"
        />
      </div>
    </div>
  );
}
