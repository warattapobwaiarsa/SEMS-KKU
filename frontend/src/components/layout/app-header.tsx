"use client";

import { useRouter } from "next/navigation";
import { Menu, LogOut, User } from "lucide-react";
import type { UserProfile } from "@/types/navigation";

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
    <header className="h-16 bg-[#FFFFFF] border-b border-[#9CA3AF] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Hamburger Button (for small screens) + Header Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-sm border border-[#9CA3AF] hover:bg-[#F3F4F6] text-[#374151] transition-colors"
          aria-label="เปิดเมนูนำทาง"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="hidden sm:flex items-center gap-2 truncate text-sm">
          <span className="font-semibold text-[#212B3A]">
            ระบบบริหารจัดการการประเมินทุนการศึกษา
          </span>
          <span className="text-[#9CA3AF]">|</span>
          <span className="text-[#585F6A] text-xs">
            คณะวิศวกรรมศาสตร์ มหาวิทยาลัยขอนแก่น
          </span>
        </div>
      </div>

      {/* Right: User Information & Actions (Strictly NO notifications per Scope 1.3.5) */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#F3F4F6] border border-[#9CA3AF] flex items-center justify-center text-[#374151]">
            <User className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-sm font-medium text-[#212B3A] leading-tight">
              {user.name}
            </span>
            {user.expiresAt && isEvaluator && (
              <span className="text-[11px] text-[#6B7280]">
                หมดอายุ: {user.expiresAt}
              </span>
            )}
          </div>
          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
              isEvaluator
                ? "border-[#374151] bg-[#374151] text-[#FFFFFF]"
                : "border-[#75777D] bg-[#F3F4F6] text-[#212B3A]"
            }`}
          >
            {isEvaluator ? "Evaluator" : "Admin"}
          </span>
        </div>

        <div className="h-5 w-px bg-[#E5E7EB]" aria-hidden="true" />

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#585F6A] hover:text-[#BA1A1A] hover:border-[#BA1A1A] border border-[#9CA3AF] rounded-sm bg-[#FFFFFF] hover:bg-[#FFF5F5] transition-colors"
          title="ออกจากระบบ"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
}
