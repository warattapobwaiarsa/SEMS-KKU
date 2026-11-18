/**
 * หน้าต่างตั้งรหัสผ่านสำหรับไฟล์ Excel ที่ส่งออก (Secure Password Export Modal)
 * สอดคล้องกับ Scope 1.3.2.11, 1.3.2.12, PDPA และ Wireframe p5 (560px)
 */
'use client';

import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Download,
  X,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface PasswordExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (password: string) => Promise<void>;
  reportTitle: string;
  reportCode: string;
}

export function PasswordExportModal({
  isOpen,
  onClose,
  onExport,
  reportTitle,
  reportCode,
}: PasswordExportModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // คำนวณความแข็งแกร่งของรหัสผ่าน (Password Strength 0-4)
  const calculateStrength = (pwd: string): { score: number; label: string; textClass: string } => {
    if (!pwd) return { score: 0, label: 'ยังไม่ได้ระบุ', textClass: 'text-muted-foreground' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) || /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: 'ง่ายเกินไป', textClass: 'text-rose-600' };
    if (score === 2) return { score: 2, label: 'ปานกลาง', textClass: 'text-amber-600' };
    if (score === 3) return { score: 3, label: 'ค่อนข้างปลอดภัย', textClass: 'text-blue-600' };
    return { score: 4, label: 'ปลอดภัยสูง (แนะนำ)', textClass: 'text-emerald-600' };
  };

  const strength = calculateStrength(password);

  // สร้างรหัสผ่านสุ่มปลอดภัย
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setConfirmPassword(res);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('กรุณาระบุรหัสผ่านสำหรับเปิดไฟล์');
      return;
    }
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onExport(password);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างไฟล์รายงาน');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-[560px] overflow-hidden animate-spring-pop">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground leading-snug">
                ตั้งรหัสผ่านไฟล์ Excel (.xlsx)
              </h3>
              <p className="text-xs text-muted-foreground">
                {reportCode} • {reportTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Input 1: รหัสผ่าน */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="file-password"
                className="text-xs font-semibold text-foreground"
              >
                รหัสผ่านสำหรับเปิดไฟล์ <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                <span>สุ่มรหัสผ่านปลอดภัย</span>
              </button>
            </div>
            <div className="relative">
              <input
                id="file-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="กรอกรหัสผ่านสำหรับเปิดไฟล์..."
                className="w-full pl-3.5 pr-10 py-2.5 text-sm font-mono bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">ระดับความปลอดภัย:</span>
                <span className={`font-semibold ${strength.textClass}`}>
                  {strength.label} ({strength.score}/4)
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                <div
                  className={`rounded-full transition-colors ${
                    strength.score >= 1 ? 'bg-primary' : 'bg-muted'
                  }`}
                />
                <div
                  className={`rounded-full transition-colors ${
                    strength.score >= 2 ? 'bg-primary' : 'bg-muted'
                  }`}
                />
                <div
                  className={`rounded-full transition-colors ${
                    strength.score >= 3 ? 'bg-primary' : 'bg-muted'
                  }`}
                />
                <div
                  className={`rounded-full transition-colors ${
                    strength.score >= 4 ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Input 2: ยืนยันรหัสผ่าน */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirm-password"
              className="text-xs font-semibold text-foreground block"
            >
              ยืนยันรหัสผ่านอีกครั้ง <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                placeholder="กรอกรหัสผ่านเดียวกันอีกครั้ง..."
                className="w-full pl-3.5 pr-10 py-2.5 text-sm font-mono bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Notice Box */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">การรักษาความปลอดภัยข้อมูลส่วนบุคคล (PDPA):</p>
              <p className="text-xs text-blue-800 mt-0.5">
                ไฟล์ Excel ที่ดาวน์โหลดจะได้รับการเข้ารหัสผ่าน กรุณาจดจำรหัสผ่านนี้เพื่อใช้เปิดไฟล์ หรือแจ้งให้ผู้มีสิทธิ์ใช้งานทราบ
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{submitting ? 'กำลังส่งออกไฟล์...' : 'ดาวน์โหลดรายงาน (.xlsx)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
