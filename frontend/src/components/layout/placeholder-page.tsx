import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

interface PlaceholderPageProps {
  specId: string;
  title: string;
  subtitle: string;
  description: string;
  role: "Admin" | "Evaluator";
  relatedLinks?: { label: string; href: string }[];
}

export function PlaceholderPage({
  specId,
  title,
  subtitle,
  description,
  role,
  relatedLinks,
}: PlaceholderPageProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Spec & Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-semibold">
            {specId}
          </span>
          <span className="text-slate-500">SEMS Enterprise Architecture</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Role Scope: <strong className="text-slate-700 font-medium">{role}</strong></span>
        </div>
      </div>

      {/* Page Title & Action Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>

      {/* Main Structural Container */}
      <div className="border border-slate-200 rounded-lg bg-white p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-md bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              โครงสร้างหน้าจอพร้อมสำหรับการพัฒนาฟังก์ชัน
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {relatedLinks && relatedLinks.length > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-500 block mb-2">
              เมนูหรือหน้าจอที่เกี่ยวข้อง:
            </span>
            <div className="flex flex-wrap gap-2">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md bg-white hover:bg-blue-50/70 hover:text-blue-700 hover:border-blue-300 transition-colors"
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
