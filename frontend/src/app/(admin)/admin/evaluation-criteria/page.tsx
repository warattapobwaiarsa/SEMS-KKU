'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CriteriaDetail } from '@/types/criteria';
import { fetchCriteriaList } from '@/services/criteria.service';
import { 
  FileCheck2, 
  Plus, 
  Search, 
  Lock, 
  Unlock, 
  Calendar, 
  Edit3, 
  Eye,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function EvaluationCriteriaPage() {
  const [criteriaList, setCriteriaList] = useState<CriteriaDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const loadCriteria = useCallback(async (querySearch?: string) => {
    try {
      setLoading(true);
      const res = await fetchCriteriaList({
        page,
        limit: 10,
        search: querySearch !== undefined ? querySearch : searchTerm,
      });
      setCriteriaList(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      console.warn('API connection:', msg);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    let ignore = false;
    const fetchAsync = async () => {
      try {
        setLoading(true);
        const res = await fetchCriteriaList({ page, limit: 10, search: searchTerm });
        if (!ignore) {
          setCriteriaList(res.data);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error';
        console.warn('Failed to load:', msg);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    void fetchAsync();
    return () => {
      ignore = true;
    };
  }, [page, searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadCriteria(searchTerm);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              การจัดการข้อมูลหลัก
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            เกณฑ์การประเมินทุน
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            กำหนดชุดเกณฑ์และสัดส่วนคะแนนสำหรับการประเมินทุนการศึกษา (ผลรวมทุกชุดเกณฑ์ต้องเท่ากับ 100 คะแนน)
          </p>
        </div>

        <Link
          href="/admin/evaluation-criteria/create"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          สร้างชุดเกณฑ์ใหม่
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อชุดเกณฑ์ หรือหัวข้อเกณฑ์การประเมิน..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </form>
        <button
          onClick={() => { setPage(1); void loadCriteria(searchTerm); }}
          className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium bg-muted hover:bg-muted/80 text-foreground rounded-xl transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          ค้นหา
        </button>
      </div>

      {/* Main Table / Content List */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดข้อมูลชุดเกณฑ์...</p>
          </div>
        ) : criteriaList.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/60">
              <FileCheck2 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">ยังไม่มีชุดเกณฑ์การประเมิน</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
              เริ่มต้นสร้างชุดเกณฑ์การประเมินชุดแรกเพื่อนำไปผูกกับรอบทุนการศึกษา
            </p>
            <div className="mt-6">
              <Link
                href="/admin/evaluation-criteria/create"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                สร้างชุดเกณฑ์ชุดแรก
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3.5 px-5">ชื่อชุดเกณฑ์</th>
                  <th className="py-3.5 px-4 text-center">คะแนนเต็ม</th>
                  <th className="py-3.5 px-4 text-center">จำนวนเกณฑ์ย่อย</th>
                  <th className="py-3.5 px-5">รอบทุนที่นำไปใช้</th>
                  <th className="py-3.5 px-4 text-center">สถานะการแก้ไข</th>
                  <th className="py-3.5 px-5 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {criteriaList.map((criteria) => (
                  <tr key={criteria.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="py-4 px-5 font-medium text-foreground">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {criteria.name}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono mt-0.5">
                          ชุดเกณฑ์ที่ #{criteria.id}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs shadow-2xs">
                        <CheckCircle2 className="h-3 w-3" />
                        {criteria.totalScore} คะแนน
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-muted-foreground font-mono text-xs font-semibold">
                      {criteria.subCriteria.length} ข้อ
                    </td>
                    <td className="py-4 px-5">
                      {criteria.usedByRounds && criteria.usedByRounds.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {criteria.usedByRounds.map((r) => (
                            <span
                              key={r.id}
                              className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border shadow-2xs ${
                                r.status === 'OPEN'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                  : r.status === 'CLOSED'
                                  ? 'border-slate-300 bg-slate-50 text-slate-700'
                                  : 'border-amber-300 bg-amber-50 text-amber-800'
                              }`}
                            >
                              <Calendar className="h-3 w-3" />
                              {r.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">ยังไม่มีรอบทุนที่ใช้งาน</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {criteria.isLocked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
                          <Lock className="h-3 w-3 text-slate-500" />
                          ล็อก (เปิดประเมินแล้ว)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                          <Unlock className="h-3 w-3 text-blue-600" />
                          แก้ไขได้
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      {criteria.isLocked ? (
                        <Link
                          href={`/admin/evaluation-criteria/${criteria.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          ดูรายละเอียด
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/evaluation-criteria/${criteria.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-foreground px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary transition hover:scale-[1.02] active:scale-[0.98] shadow-2xs"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          แก้ไขเกณฑ์
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
