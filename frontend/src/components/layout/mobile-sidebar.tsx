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
    <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 left-0 w-[260px] max-w-[85vw] bg-[#FFFFFF] shadow-xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        <div className="absolute top-3 right-3 z-20">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-sm border border-[#9CA3AF] text-[#585F6A] hover:text-[#1A1C1C] hover:bg-[#F3F4F6] transition-colors"
            aria-label="ปิดเมนู"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <AppSidebar
          items={items}
          role={role}
          onItemClick={onClose}
          className="w-full border-r-0"
        />
      </div>
    </div>
  );
}
