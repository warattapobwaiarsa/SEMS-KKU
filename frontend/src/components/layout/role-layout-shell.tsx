"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { NavItemConfig, UserProfile } from "@/types/navigation";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { MobileSidebar } from "./mobile-sidebar";

interface RoleLayoutShellProps {
  items: NavItemConfig[];
  user: UserProfile;
  children: ReactNode;
}

export function RoleLayoutShell({
  items,
  user,
  children,
}: RoleLayoutShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/60 text-slate-800">
      {/* Desktop & Tablet Sidebar (Persistent - Toggleable between 260px and 68px) */}
      <AppSidebar
        items={items}
        role={user.role}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        className="hidden md:flex"
      />

      {/* Mobile Drawer (< 768px) */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        items={items}
        role={user.role}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <AppHeader
          user={user}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
