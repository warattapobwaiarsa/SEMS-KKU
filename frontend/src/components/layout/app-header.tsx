"use client";

import { useRouter } from "next/navigation";
import { Menu, LogOut, User } from "lucide-react";
import type { UserProfile } from "@/types/navigation";
import { EvaluatorSwitcher } from "@/components/evaluator/evaluator-switcher";

interface AppHeaderProps {
  user: UserProfile;
  onMenuToggle?: () => void;
}

export function AppHeader({ user, onMenuToggle }: AppHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    // In actual auth, call logout endpoint and clear session
    if (confirm("คุณต้องการออกจากระบบหรือไม่?")) {
      router.push("/");
    }
  };

  const isEvaluator = user.role === "evaluator";

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-xs">
      {/* Left: Hamburger Button (for small screens) + Header Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
          aria-label="เปิดเมนูนำทาง"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="hidden sm:flex items-center gap-2 truncate text-sm">
          <span className="font-semibold text-slate-900">
            ระบบบริหารจัดการการประเมินทุนการศึกษา
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 text-xs">
            คณะวิศวกรรมศาสตร์ มหาวิทยาลัยขอนแก่น
          </span>
        </div>
      </div>

      {/* Right: User Information & Actions (Strictly NO notifications per Scope 1.3.5) */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {isEvaluator && <EvaluatorSwitcher />}

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <User className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-sm font-medium text-slate-900 leading-tight">
              {user.name}
            </span>
            {user.expiresAt && isEvaluator && (
              <span className="text-[11px] text-slate-500">
                หมดอายุ: {user.expiresAt}
              </span>
            )}
          </div>
          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
              isEvaluator
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-300 bg-slate-100 text-slate-800"
            }`}
          >
            {isEvaluator ? "Evaluator" : "Admin"}
          </span>
        </div>

        <div className="h-5 w-px bg-slate-200" aria-hidden="true" />

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:border-red-300 border border-slate-200 rounded-md bg-white hover:bg-red-50/50 transition-colors"
          title="ออกจากระบบ"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
}
