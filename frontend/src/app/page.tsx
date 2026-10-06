import Link from "next/link";
import { ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { SYSTEM_CONFIG } from "@/config/navigation";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            S
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-900 tracking-tight">
              {SYSTEM_CONFIG.name}
            </h1>
            <p className="text-xs text-slate-500">
              {SYSTEM_CONFIG.fullName}
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <span className="font-medium text-slate-800">{SYSTEM_CONFIG.faculty}</span>
          <p>{SYSTEM_CONFIG.university}</p>
        </div>
      </header>

      {/* Main Choice Cards */}
      <main className="max-w-5xl mx-auto w-full my-12 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2.5">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-medium border border-blue-200 bg-blue-50 text-blue-700">
            THEME: MODERN EXECUTIVE SLATE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            เลือกระบบปฏิบัติการตามบทบาท
          </h2>
          <p className="text-sm text-slate-500">
            ทดสอบการทำงานของโครงสร้าง Layout, แถบเมนู Sidebar และเส้นทางปฏิบัติงานของทั้ง 2 บทบาท
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Admin Card */}
          <div className="border border-slate-200 bg-white p-6 sm:p-8 rounded-xl shadow-xs hover:shadow-md hover:border-slate-400 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-800">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border border-slate-200 bg-slate-100 text-slate-800">
                  Admin Portal
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  ผู้ดูแลระบบ (Admin)
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  จัดการบัญชีผู้ใช้, รอบทุน (Draft/Open/Closed), เกณฑ์ 100 คะแนน, นำเข้า Excel, ตรวจสอบคะแนนเฉลี่ย, และการจัดสรรงบประมาณ
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <span>7 เมนูหลักครอบคลุมกระบวนการทั้งวงจร</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <span>ไม่มีเมนู Audit Log ในระบบ (ตาม Scope 1.3.5)</span>
                </li>
              </ul>
            </div>
            <Link
              href="/admin/scholarship-rounds"
              className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-xs"
            >
              <span>เข้าสู่แผงควบคุม Admin</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Evaluator Card */}
          <div className="border border-slate-200 bg-white p-6 sm:p-8 rounded-xl shadow-xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
                  <UserCheck className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                  Evaluator Portal
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  ผู้ประเมิน (Evaluator)
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  เลือกประเมินผู้สมัครในรอบสถานะ Open, บันทึกคะแนนเกณฑ์ย่อยพร้อม Auto-save, และย้อนดูผลการประเมินของตนเอง (FR-EVL-14)
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>2 เมนูหลัก: รอบเปิดประเมิน และ ผลประเมินของฉัน</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>เข้าถึงข้อมูลเฉพาะรอบ Open และผลของตนเอง</span>
                </li>
              </ul>
            </div>
            <Link
              href="/evaluator/rounds"
              className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-xs"
            >
              <span>เข้าสู่พื้นที่ประเมิน Evaluator</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
        <p>SEMS-KKU — สอดคล้องตามมาตรฐาน ISO/IEC 29110, ISO/IEC 25010 และ PDPA</p>
      </footer>
    </div>
  );
}
