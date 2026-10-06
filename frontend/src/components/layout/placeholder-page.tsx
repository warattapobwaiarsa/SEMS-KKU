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
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded border border-[#374151] bg-[#F3F4F6] text-[#374151] font-bold">
            {specId}
          </span>
          <span className="text-[#6B7280]">SEMS Wireframe Architecture</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span>Role Scope: {role}</span>
        </div>
      </div>

      {/* Page Title & Action Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#212B3A] tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-[#585F6A] mt-1">{subtitle}</p>
        </div>
      </div>

      {/* Main Structural Container */}
      <div className="border border-[#9CA3AF] rounded-sm bg-[#FFFFFF] p-6 sm:p-8 space-y-4 shadow-none">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-sm bg-[#F3F4F6] border border-[#9CA3AF] text-[#374151]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#212B3A]">
              โครงสร้างหน้าจอพร้อมสำหรับการพัฒนาฟังก์ชัน
            </h2>
            <p className="text-sm text-[#585F6A] mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {relatedLinks && relatedLinks.length > 0 && (
          <div className="pt-4 mt-4 border-t border-[#E5E7EB]">
            <span className="text-xs font-medium text-[#6B7280] block mb-2">
              เมนูหรือหน้าจอที่เกี่ยวข้อง:
            </span>
            <div className="flex flex-wrap gap-2">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#374151] border border-[#9CA3AF] rounded-sm bg-[#FFFFFF] hover:bg-[#F3F4F6] transition-colors"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-3 h-3 text-[#75777D]" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
