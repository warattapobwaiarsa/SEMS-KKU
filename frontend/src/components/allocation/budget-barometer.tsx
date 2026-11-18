/**
 * แผงมาตรวัดงบประมาณแบบเรียลไทม์ (Interactive Budget Barometer)
 * แสดง 4 การ์ดสรุปตัวเลข พร้อมแถบความคืบหน้างบประมาณ
 * แจ้งเตือนสีแดงทันทีเมื่อยอดจัดสรรเกินเพดานงบประมาณรวม
 */
'use client';

import React from 'react';
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Users,
  Coins,
  ArrowUpRight,
} from 'lucide-react';

interface BudgetBarometerProps {
  totalBudget: number;
  allocatedAmount: number;
  remainingBudget: number;
  recipientsCount: number;
}

export function BudgetBarometer({
  totalBudget,
  allocatedAmount,
  remainingBudget,
  recipientsCount,
}: BudgetBarometerProps) {
  const isOverBudget = remainingBudget < 0;
  const isExactBudget = remainingBudget === 0 && totalBudget > 0;
  const usagePercent =
    totalBudget > 0 ? Math.min((allocatedAmount / totalBudget) * 100, 100) : 0;
  const actualPercent =
    totalBudget > 0 ? (allocatedAmount / totalBudget) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* 4 Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: งบประมาณรวม */}
        <div className="bg-card border border-border/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              งบประมาณรวม
            </span>
            <div className="p-1.5 rounded-lg bg-muted text-muted-foreground">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
              {totalBudget.toLocaleString()} <span className="text-sm font-sans font-normal text-muted-foreground">บาท</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              งบประมาณที่กำหนดสำหรับรอบนี้
            </p>
          </div>
        </div>

        {/* Card 2: ยอดที่จัดสรรแล้ว */}
        <div className="bg-card border border-border/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              ยอดที่จัดสรรแล้ว
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-primary">
              {allocatedAmount.toLocaleString()} <span className="text-sm font-sans font-normal text-muted-foreground">บาท</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              คำนวณสดจากรายการที่เลือก ({actualPercent.toFixed(1)}%)
            </p>
          </div>
        </div>

        {/* Card 3: งบคงเหลือ */}
        <div
          className={`border rounded-2xl p-4 shadow-2xs flex flex-col justify-between transition-colors ${
            isOverBudget
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
              : isExactBudget
              ? 'bg-amber-50/70 border-amber-300'
              : 'bg-card border-border/90'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isOverBudget
                  ? 'text-rose-700'
                  : isExactBudget
                  ? 'text-amber-800'
                  : 'text-muted-foreground'
              }`}
            >
              งบคงเหลือสุทธิ
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                isOverBudget
                  ? 'bg-rose-100 text-rose-700'
                  : isExactBudget
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {isOverBudget ? (
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono ${
                isOverBudget
                  ? 'text-rose-700'
                  : isExactBudget
                  ? 'text-amber-800'
                  : 'text-emerald-700'
              }`}
            >
              {remainingBudget.toLocaleString()} <span className="text-sm font-sans font-normal text-muted-foreground">บาท</span>
            </div>
            <p
              className={`text-xs mt-1 ${
                isOverBudget
                  ? 'text-rose-600 font-semibold'
                  : 'text-muted-foreground'
              }`}
            >
              {isOverBudget
                ? `⚠ เกินเพดานงบประมาณ ${Math.abs(remainingBudget).toLocaleString()} บาท!`
                : isExactBudget
                ? '✓ จัดสรรพอดียอดงบประมาณ 100%'
                : 'พร้อมสำหรับการจัดสรรเพิ่มเติม'}
            </p>
          </div>
        </div>

        {/* Card 4: จำนวนผู้ได้รับทุน */}
        <div className="bg-card border border-border/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              จำนวนผู้ได้รับทุน
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
              {recipientsCount} <span className="text-sm font-sans font-normal text-muted-foreground">คน</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ผู้สมัครที่ได้รับอนุมัติทุนในรอบนี้
            </p>
          </div>
        </div>
      </div>

      {/* Visual Dynamic Progress Bar */}
      {totalBudget > 0 && (
        <div className="bg-card border border-border/80 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-muted-foreground">สัดส่วนการใช้งบประมาณ:</span>
            <span
              className={`font-mono font-bold ${
                isOverBudget ? 'text-rose-600' : 'text-primary'
              }`}
            >
              {actualPercent.toFixed(1)}% {isOverBudget && '(งบเกิน)'}
            </span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
            <div
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
              className={`h-full transition-all duration-300 ${
                isOverBudget
                  ? 'bg-rose-500'
                  : isExactBudget
                  ? 'bg-amber-500'
                  : 'bg-primary'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
