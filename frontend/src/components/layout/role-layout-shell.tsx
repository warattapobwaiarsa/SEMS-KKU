"use client";

import { useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { NavItemConfig, UserProfile } from "@/types/navigation";
import {
  MOCK_ADMINS,
  MOCK_EVALUATORS,
  getAdminId,
  getEvaluatorId,
} from "@/lib/mock-evaluator";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { MobileSidebar } from "./mobile-sidebar";

const subscribeEvaluator = (onStoreChange: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("sems_evaluator_changed", onStoreChange);
  return () => {
    window.removeEventListener("sems_evaluator_changed", onStoreChange);
  };
};

const subscribeAdmin = (onStoreChange: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("sems_admin_changed", onStoreChange);
  return () => {
    window.removeEventListener("sems_admin_changed", onStoreChange);
  };
};

const subscribeEmpty = () => () => {};

interface RoleLayoutShellProps {
  items: NavItemConfig[];
  user: UserProfile;
  children: ReactNode;
  mainClassName?: string;
}

export function RoleLayoutShell({
  items,
  user,
  children,
  mainClassName,
}: RoleLayoutShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const mounted = useSyncExternalStore(subscribeEmpty, () => true, () => false);

  const activeEvaluatorId = useSyncExternalStore(
    subscribeEvaluator,
    () => getEvaluatorId(),
    () => null,
  );

  const activeAdminId = useSyncExternalStore(
    subscribeAdmin,
    () => getAdminId(),
    () => null,
  );

  let activeUser = user;
  if (mounted) {
    if (user.role === "evaluator" && activeEvaluatorId) {
      const profile = MOCK_EVALUATORS.find((ev) => ev.id === activeEvaluatorId);
      if (profile) {
        activeUser = {
          ...user,
          id: profile.id,
          name: profile.name,
          email: profile.email,
          department: profile.department || user.department,
        };
      }
    } else if (user.role === "admin" && activeAdminId) {
      const profile = MOCK_ADMINS.find((ad) => ad.id === activeAdminId);
      if (profile) {
        activeUser = {
          ...user,
          id: profile.id,
          name: profile.name,
          email: profile.email,
          department: profile.department || user.department,
        };
      }
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/60 text-slate-800">
      {/* Desktop & Tablet Sidebar (Persistent - Toggleable between 260px and 68px) */}
      <AppSidebar
        items={items}
        role={activeUser.role}
        user={activeUser}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        className="hidden md:flex"
      />

      {/* Mobile Drawer (< 768px) */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        items={items}
        role={activeUser.role}
        user={activeUser}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <AppHeader
          user={activeUser}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        {/* Dynamic Route Content */}
        <main
          className={`flex-1 min-h-0 overflow-y-auto bg-slate-50/50 flex flex-col ${
            mainClassName ?? "p-3 sm:p-4 lg:p-6"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
