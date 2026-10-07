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
  Edit, 
  ExternalLink
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
      const msg = err instanceof Error ? err.message : 'Error fetching criteria';
      console.warn('API error, falling back to initial view:', msg);
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
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              Admin Module
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            เกณฑ์การประเมิน
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            กำหนดชุดเกณฑ์และสัดส่วนคะแนนสำหรับการประเมินทุนการศึกษา (ผลรวมคะแนน 100 คะแนน)
          </p>
        </div>

        <Link
          href="/admin/evaluation-criteria/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Plus className="h-4 w-4" />
          สร้างชุดเกณฑ์ใหม่
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border rounded-xl p-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อชุดเกณฑ์ หรือหัวข้อเกณฑ์ย่อย..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </form>
        <button
          onClick={() => { setPage(1); void loadCriteria(searchTerm); }}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-muted text-foreground hover:bg-muted/80 rounded-lg transition"
        >
          ค้นหา
        </button>
      </div>

      {/* Main Table / Content List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-sm text-muted-foreground">กำลังโหลดรายการเกณฑ์...</p>
          </div>
        ) : criteriaList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileCheck2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">ยังไม่มีชุดเกณฑ์การประเมิน</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              เริ่มต้นสร้างเกณฑ์การประเมินชุดแรกเพื่อนำไปผูกกับรอบทุนการศึกษา
            </p>
            <div className="mt-6">
              <Link
                href="/admin/evaluation-criteria/create"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                สร้างชุดเกณฑ์
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                <tr>
                  <th className="py-3 px-4">ชื่อชุดเกณฑ์</th>
                  <th className="py-3 px-4 text-center">คะแนนรวม</th>
                  <th className="py-3 px-4 text-center">จำนวนเกณฑ์ย่อย</th>
                  <th className="py-3 px-4">รอบทุนที่นำไปใช้</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {criteriaList.map((criteria) => (
                  <tr key={criteria.id} className="hover:bg-muted/20 transition">
                    <td className="py-4 px-4 font-medium text-foreground">
                      <div className="flex flex-col">
                        <span>{criteria.name}</span>
                        <span className="text-xs text-muted-foreground">
                          รหัส: CRT-{criteria.id.toString().padStart(4, '0')}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-xs">
                        {criteria.totalScore} คะแนน
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-muted-foreground font-mono">
                      {criteria.subCriteria.length} ข้อ
                    </td>
                    <td className="py-4 px-4">
                      {criteria.usedByRounds && criteria.usedByRounds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {criteria.usedByRounds.map((r) => (
                            <span
                              key={r.id}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                                r.status === 'OPEN'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                  : r.status === 'CLOSED'
                                  ? 'border-slate-300 bg-slate-50 text-slate-700'
                                  : 'border-amber-300 bg-amber-50 text-amber-700'
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
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          <Lock className="h-3 w-3" />
                          ล็อก (ใช้งานในรอบแล้ว)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <Unlock className="h-3 w-3" />
                          แก้ไขได้
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {criteria.isLocked ? (
                        <Link
                          href={`/admin/evaluation-criteria/${criteria.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          ดูรายละเอียด
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/evaluation-criteria/${criteria.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          แก้ไข
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
