"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { SYSTEM_CONFIG } from "@/config/navigation";
import {
  MOCK_ADMINS,
  MOCK_EVALUATORS,
  getAdminId,
  setAdminId,
  getEvaluatorId,
  setEvaluatorId,
} from "@/lib/mock-evaluator";

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

export default function HomePage() {
  const router = useRouter();
  const mounted = useSyncExternalStore(subscribeEmpty, () => true, () => false);

  const storedAdminId = useSyncExternalStore(
    subscribeAdmin,
    () => getAdminId(),
    () => "1",
  );

  const storedEvaluatorId = useSyncExternalStore(
    subscribeEvaluator,
    () => getEvaluatorId(),
    () => "2",
  );

  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<string | null>(null);

  const activeAdminId = selectedAdminId ?? (mounted ? storedAdminId : "1");
  const activeEvaluatorId = selectedEvaluatorId ?? (mounted ? storedEvaluatorId : "2");

  const currentAdmin =
    MOCK_ADMINS.find((ad) => ad.id === activeAdminId) || MOCK_ADMINS[0];

  const currentEvaluator =
    MOCK_EVALUATORS.find((ev) => ev.id === activeEvaluatorId) ||
    MOCK_EVALUATORS[0];

  const handleAdminLogin = () => {
    setAdminId(activeAdminId);
    router.push("/admin/scholarship-rounds");
  };

  const handleEvaluatorLogin = () => {
    setEvaluatorId(activeEvaluatorId);
    router.push("/evaluator/rounds");
  };

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
            <p className="text-xs text-slate-500 hidden sm:block">
              {SYSTEM_CONFIG.fullName}
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 hidden sm:block">
          <span className="font-semibold text-slate-800">
            {SYSTEM_CONFIG.faculty}
          </span>
          <p>{SYSTEM_CONFIG.university}</p>
        </div>
      </header>

      {/* Main Choice Cards */}
      <main className="max-w-5xl mx-auto w-full my-6 sm:my-10 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            เข้าสู่ระบบตามบทบาทการทำงาน
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            โปรดเลือกตัวตนหรือบทบาทที่ต้องการเข้าใช้งานระบบเพื่อเริ่มปฏิบัติงาน
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Admin Card */}
          <div className="border border-slate-200 bg-white p-6 sm:p-7 rounded-2xl shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group">
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
                <p className="text-xs text-slate-500 mt-1">
                  จัดการรอบทุน, นำเข้าผู้สมัคร, กำหนดเกณฑ์ และจัดสรรงบประมาณ
                </p>
              </div>

              {/* Admin Dropdown Selection */}
              <div className="pt-2">
                <label
                  htmlFor="admin-account-select"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  เลือกบัญชีผู้ดูแลระบบ:
                </label>
                <div className="relative">
                  <select
                    id="admin-account-select"
                    value={activeAdminId}
                    onChange={(e) => setSelectedAdminId(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all appearance-none pr-8 cursor-pointer font-medium"
                  >
                    {MOCK_ADMINS.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name} ({admin.email})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Selected Admin Info Preview */}
                <div className="mt-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-slate-900 block truncate">
                      {currentAdmin.name}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {currentAdmin.email} • ID: {currentAdmin.id}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-800 shrink-0">
                    FULL ACCESS
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdminLogin}
              className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer group-hover:-translate-y-px"
            >
              <span>เข้าสู่ระบบผู้ดูแล</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Evaluator Card */}
          <div className="border border-blue-200 bg-white p-6 sm:p-7 rounded-2xl shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
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
                <p className="text-xs text-slate-500 mt-1">
                  ประเมินคะแนนผู้สมัครรายบุคคลอิสระ บันทึกแบบร่าง และส่งผลสรุป
                </p>
              </div>

              {/* Evaluator Dropdown Selection */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="evaluator-account-select"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    เลือกบัญชีกรรมการผู้ประเมิน:
                  </label>
                </div>

                <div className="relative">
                  <select
                    id="evaluator-account-select"
                    value={activeEvaluatorId}
                    onChange={(e) => setSelectedEvaluatorId(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-blue-50/50 border border-blue-300 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all appearance-none pr-8 cursor-pointer font-medium"
                  >
                    {MOCK_EVALUATORS.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} ({ev.department || ev.email})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-blue-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Selected Evaluator Info Preview */}
                <div className="mt-2.5 p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-blue-950 block truncate">
                      {currentEvaluator.name}
                    </span>
                    <span className="text-[11px] text-blue-700 truncate block">
                      {currentEvaluator.email} • ID: {currentEvaluator.id}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-200/80 text-blue-800 shrink-0 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-700" />
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEvaluatorLogin}
              className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer group-hover:-translate-y-px"
            >
              <span>เข้าสู่ระบบผู้ประเมิน</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-xs text-slate-500">
        <p>
          ระบบบริหารจัดการการประเมินทุนการศึกษา (SEMS) - คณะวิศวกรรมศาสตร์
          มหาวิทยาลัยขอนแก่น
        </p>
        <span className="text-[11px] text-slate-400 font-mono">
          KKU SSO Roadmap [FR-AUTH-01]
        </span>
      </footer>
    </div>
  );
}
