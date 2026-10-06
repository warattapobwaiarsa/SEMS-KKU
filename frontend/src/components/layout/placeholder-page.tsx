import Link from "next/link";
import { Search, Filter, Plus, Inbox, ArrowRight } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  actionButtonLabel?: string;
  searchPlaceholder?: string;
  relatedLinks?: { label: string; href: string }[];
}

export function PlaceholderPage({
  title,
  subtitle,
  actionButtonLabel,
  searchPlaceholder = "ค้นหาข้อมูลในตาราง...",
  relatedLinks,
}: PlaceholderPageProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Title & Action Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>

        {actionButtonLabel && (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{actionButtonLabel}</span>
          </button>
        )}
      </div>

      {/* Enterprise Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            readOnly
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-4 h-4 text-slate-500" />
            <span>ตัวกรอง</span>
          </button>
        </div>
      </div>

      {/* Main Content Area (Clean Enterprise Empty State Container) */}
      <div className="bg-white border border-slate-200 rounded-lg p-12 sm:p-16 shadow-xs text-center flex flex-col items-center justify-center min-h-[380px]">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          ยังไม่พบข้อมูลในระบบ
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          ระบบพร้อมสำหรับการเชื่อมต่อข้อมูล เมื่อมีการบันทึกหรือนำเข้าข้อมูล รายการจะแสดงผลที่นี่
        </p>

        {relatedLinks && relatedLinks.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100 w-full max-w-md">
            <span className="text-xs font-medium text-slate-400 block mb-2.5">
              เมนูที่เกี่ยวข้อง:
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md bg-slate-50 hover:bg-white hover:text-blue-600 hover:border-blue-300 transition-colors"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
