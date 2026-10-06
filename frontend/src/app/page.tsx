import Link from "next/link";
import { ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { SYSTEM_CONFIG } from "@/config/navigation";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#374151] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[#9CA3AF]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-[#374151] text-[#FFFFFF] flex items-center justify-center font-bold text-xl border border-[#374151]">
            S
          </div>
          <div>
            <h1 className="font-bold text-xl text-[#212B3A] tracking-tight">
              {SYSTEM_CONFIG.name}
            </h1>
            <p className="text-xs text-[#585F6A]">
              {SYSTEM_CONFIG.fullName}
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-[#6B7280]">
          <span className="font-medium text-[#374151]">{SYSTEM_CONFIG.faculty}</span>
          <p>{SYSTEM_CONFIG.university}</p>
        </div>
      </header>

      {/* Main Choice Cards */}
      <main className="max-w-5xl mx-auto w-full my-12 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-medium border border-[#9CA3AF] bg-[#FFFFFF] text-[#585F6A]">
            FRAMEWORK: NEXT.JS 16 APP ROUTER
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#212B3A]">
            เลือกระบบปฏิบัติการตามบทบาท
          </h2>
          <p className="text-sm text-[#585F6A]">
            ทดสอบการทำงานของโครงสร้าง Layout, แถบเมนู Sidebar และเส้นทางปฏิบัติงานของทั้ง 2 บทบาท
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Admin Card */}
          <div className="border border-[#9CA3AF] bg-[#FFFFFF] p-6 sm:p-8 rounded-sm flex flex-col justify-between hover:border-[#374151] transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-[#F3F4F6] border border-[#9CA3AF] rounded-sm text-[#374151]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border border-[#75777D] bg-[#F3F4F6] text-[#212B3A]">
                  Admin Role
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#212B3A]">
                  ผู้ดูแลระบบ (Admin)
                </h3>
                <p className="text-xs text-[#585F6A] mt-1">
                  จัดการบัญชีผู้ใช้, รอบทุน (Draft/Open/Closed), เกณฑ์ 100 คะแนน, นำเข้า Excel, ตรวจสอบคะแนนเฉลี่ย, และการจัดสรรงบประมาณ
                </p>
              </div>
              <ul className="text-xs text-[#585F6A] space-y-1.5 pt-2 border-t border-[#E5E7EB]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#374151]" />
                  <span>7 เมนูหลักครอบคลุมกระบวนการทั้งวงจร</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#374151]" />
                  <span>ไม่มีเมนู Audit Log ในระบบ (ตาม Scope 1.3.5)</span>
                </li>
              </ul>
            </div>
            <Link
              href="/admin/scholarship-rounds"
              className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#374151] hover:bg-[#212B3A] text-[#FFFFFF] text-sm font-medium rounded-sm border border-[#374151] transition-colors"
            >
              <span>เข้าสู่แผงควบคุม Admin</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Evaluator Card */}
          <div className="border border-[#9CA3AF] bg-[#FFFFFF] p-6 sm:p-8 rounded-sm flex flex-col justify-between hover:border-[#374151] transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-[#F3F4F6] border border-[#9CA3AF] rounded-sm text-[#374151]">
                  <UserCheck className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border border-[#374151] bg-[#374151] text-[#FFFFFF]">
                  Evaluator Role
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#212B3A]">
                  ผู้ประเมิน (Evaluator)
                </h3>
                <p className="text-xs text-[#585F6A] mt-1">
                  เลือกประเมินผู้สมัครในรอบสถานะ Open, บันทึกคะแนนเกณฑ์ย่อยพร้อม Auto-save, และย้อนดูผลการประเมินของตนเอง (FR-EVL-14)
                </p>
              </div>
              <ul className="text-xs text-[#585F6A] space-y-1.5 pt-2 border-t border-[#E5E7EB]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#374151]" />
                  <span>2 เมนูหลัก: รอบเปิดประเมิน และ ผลประเมินของฉัน</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#374151]" />
                  <span>เข้าถึงข้อมูลเฉพาะรอบ Open และผลของตนเอง</span>
                </li>
              </ul>
            </div>
            <Link
              href="/evaluator/rounds"
              className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#FFFFFF] hover:bg-[#F3F4F6] text-[#374151] text-sm font-medium rounded-sm border border-[#9CA3AF] transition-colors"
            >
              <span>เข้าสู่พื้นที่ประเมิน Evaluator</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-6 border-t border-[#9CA3AF] text-center text-xs text-[#6B7280]">
        <p>SEMS-KKU — สอดคล้องตามมาตรฐาน ISO/IEC 29110, ISO/IEC 25010 และ PDPA</p>
      </footer>
    </div>
  );
}
