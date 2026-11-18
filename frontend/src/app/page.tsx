import Link from "next/link";
import { ArrowRight, ShieldCheck, UserCheck, GraduationCap, Sparkles, Building, Lock } from "lucide-react";
import { SYSTEM_CONFIG } from "@/config/navigation";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-blue-700 to-blue-900 text-white flex items-center justify-center font-bold text-xl shadow-xs border border-blue-800/40">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-xl text-slate-900 tracking-tight">
                {SYSTEM_CONFIG.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-orange-50 text-orange-800 border border-orange-200">
                KKU EN
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {SYSTEM_CONFIG.fullName}
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 hidden sm:block">
          <span className="font-semibold text-slate-800">{SYSTEM_CONFIG.faculty}</span>
          <p>{SYSTEM_CONFIG.university}</p>
        </div>
      </header>

      {/* Main Choice Cards */}
      <main className="max-w-5xl mx-auto w-full my-8 sm:my-12 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ระบบบริหารจัดการการประเมินและการจัดสรรทุนการศึกษา</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            เข้าสู่ระบบตามบทบาทการทำงาน
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            เลือกระบบปฏิบัติการตามสิทธิ์การใช้งานเพื่อเริ่มต้นจัดการรอบทุน หรือประเมินผู้สมัคร
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Admin Card */}
          <div className="border border-slate-200 bg-white p-6 sm:p-8 rounded-2xl shadow-xs hover:shadow-md hover:border-slate-400 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border border-slate-200 bg-slate-100 text-slate-800">
                  Admin Workspace
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  ผู้ดูแลระบบ (Admin)
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  จัดการบัญชีผู้ใช้งาน, ควบคุมวงจรรอบทุน (Draft ➔ Open ➔ Closed), กำหนดชุดเกณฑ์การประเมิน, นำเข้าข้อมูลผู้สมัคร, ตรวจสอบคะแนนเฉลี่ย, และบริหารการจัดสรรงบประมาณ
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <span>จัดการข้อมูลหลัก, วงจรรอบทุน และชุดเกณฑ์การประเมิน</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <span>ตรวจสอบผลคะแนน Tie-breaker และจัดสรรงบประมาณสด</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <span>ส่งออกรายงาน Excel เข้ารหัสผ่านตามมาตรฐาน PDPA</span>
                </li>
              </ul>
            </div>
            <Link
              href="/admin/scholarship-rounds"
              className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-xs group-hover:-translate-y-px"
            >
              <span>เข้าสู่ระบบผู้ดูแล</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Evaluator Card */}
          <div className="border border-slate-200 bg-white p-6 sm:p-8 rounded-2xl shadow-xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <UserCheck className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                  Evaluator Workspace
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  ผู้ประเมิน (Evaluator)
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  ตรวจสอบรายชื่อผู้สมัครที่เปิดให้ประเมิน, ตรวจเอกสารและประวัติผู้สมัครผ่าน Split-Screen, บันทึกคะแนนร่างอัตโนมัติ (Auto-save), และตรวจสอบผลการประเมินของตนเอง
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>ห้องตรวจประเมินแบบ Resizable Split-Screen พร้อม Focus Mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>แถบสลับผู้สมัครต่อเนื่อง (Sequential Navigation) ป้องกันข้อมูลหลุด</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>ระบบบันทึกร่างอัตโนมัติทุก 3 วินาที (Cloud Auto-Save)</span>
                </li>
              </ul>
            </div>
            <Link
              href="/evaluator/rounds"
              className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-xs group-hover:-translate-y-px"
            >
              <span>เข้าสู่ระบบผู้ประเมิน</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* System Badges / Standards */}
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-4 pt-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>ISO/IEC 29110 & 25010 Standards</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>PDPA Compliant (AES-256 Data Masking)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
            <Building className="w-3.5 h-3.5 text-orange-600" />
            <span>KKU Single Sign-On Ready</span>
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
        <p>ระบบบริหารจัดการการประเมินทุนการศึกษา (SEMS-KKU) — คณะวิศวกรรมศาสตร์ มหาวิทยาลัยขอนแก่น</p>
      </footer>
    </div>
  );
}
