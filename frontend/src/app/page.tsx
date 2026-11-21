import Link from "next/link";
import { ArrowRight, ShieldCheck, UserCheck, GraduationCap} from "lucide-react";
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
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            เข้าสู่ระบบตามบทบาทการทำงาน
          </h2>          
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
              </div>              
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
              </div>              
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
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
        <p>ระบบบริหารจัดการการประเมินทุนการศึกษา - คณะวิศวกรรมศาสตร์ มหาวิทยาลัยขอนแก่น</p>
      </footer>
    </div>
  );
}