"use client";

import { useEffect, useState } from "react";
import { Users, Check } from "lucide-react";
import {
  MOCK_EVALUATORS,
  getEvaluatorId,
  setEvaluatorId,
  MockEvaluatorProfile,
} from "@/lib/mock-evaluator";

export function EvaluatorSwitcher() {
  const [currentId, setCurrentId] = useState<string>("2");
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentId(getEvaluatorId());

    const handleEvaluatorChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail?.id) {
        setCurrentId(customEvent.detail.id);
      }
    };

    window.addEventListener("sems_evaluator_changed", handleEvaluatorChanged);
    return () => {
      window.removeEventListener("sems_evaluator_changed", handleEvaluatorChanged);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  const currentProfile =
    MOCK_EVALUATORS.find((ev) => ev.id === currentId) || {
      id: currentId,
      name: `กรรมการ ID ${currentId}`,
      email: "",
    };

  const handleSelect = (evaluator: MockEvaluatorProfile) => {
    if (evaluator.id === currentId) {
      setIsOpen(false);
      return;
    }
    setEvaluatorId(evaluator.id);
    setCurrentId(evaluator.id);
    setIsOpen(false);
    // Reload page to re-fetch all queries with the new X-User-Id header
    window.location.reload();
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50/80 hover:bg-amber-100/90 text-amber-900 text-xs font-medium shadow-xs transition-colors"
        title="สลับบัญชีกรรมการทดสอบ (Multi-Evaluator Simulation)"
      >
        <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span className="hidden sm:inline text-amber-700">สลับผู้ประเมิน:</span>
        <span className="font-semibold text-amber-950 truncate max-w-[120px] sm:max-w-[160px]">
          {currentProfile.name.replace(/^(ศ\.|ผศ\.|รศ\.)ดร\.\s*/, "")}
        </span>
        <span className="px-1.5 py-0.2 bg-amber-200/80 text-amber-800 rounded text-[10px] font-bold">
          ID: {currentProfile.id}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 text-slate-800">
            <div className="px-3 py-1.5 border-b border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                สลับตัวตนกรรมการ (ทดสอบค่าเฉลี่ย)
              </p>
            </div>
            <div className="py-1">
              {MOCK_EVALUATORS.map((ev) => {
                const isSelected = ev.id === currentId;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => handleSelect(ev)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      isSelected ? "bg-amber-50/60 font-semibold text-amber-900" : "text-slate-700"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="leading-tight">{ev.name}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{ev.email}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
