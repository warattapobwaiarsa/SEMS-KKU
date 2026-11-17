/**
 * หน้าต่างกำหนดยอดงบประมาณรวมของรอบทุน (Set / Edit Budget Modal)
 * [Scope 1.3.2.9]
 */
'use client';

import React, { useState } from 'react';
import { Wallet, X, AlertCircle } from 'lucide-react';

interface SetBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (budget: number) => Promise<void>;
  currentBudget?: number;
  isEditing?: boolean;
}

export function SetBudgetModal({
  isOpen,
  onClose,
  onConfirm,
  currentBudget = 0,
  isEditing = false,
}: SetBudgetModalProps) {
  const [budgetStr, setBudgetStr] = useState<string>(
    currentBudget > 0 ? currentBudget.toLocaleString() : '',
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '').trim();
    if (raw === '') {
      setBudgetStr('');
      setError(null);
      return;
    }
    const num = parseFloat(raw);
    if (!isNaN(num) && num >= 0) {
      setBudgetStr(num.toLocaleString());
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = budgetStr.replace(/,/g, '').trim();
    const num = parseFloat(raw);

    if (isNaN(num) || num <= 0) {
      setError('กรุณาระบุยอดงบประมาณที่มากกว่า 0 บาท');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(num);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถบันทึกยอดงบประมาณได้');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-spring-pop">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-foreground">
              {isEditing ? 'แก้ไขยอดงบประมาณรวม' : 'กำหนดยอดงบประมาณรวม'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              ยอดงบประมาณรวมประจำรอบ (บาท) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={budgetStr}
                onChange={handleInputChange}
                placeholder="เช่น 500,000"
                className="w-full px-3.5 py-2.5 text-base font-mono font-bold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                บาท
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              * ตามระเบียบข้อกำหนด งบประมาณรวมสามารถแก้ไขได้เฉพาะเมื่อยอดจัดสรรยังเป็น 0 บาทเท่านั้น
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-border bg-background hover:bg-muted text-foreground transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-2xs disabled:opacity-50"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกงบประมาณ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
