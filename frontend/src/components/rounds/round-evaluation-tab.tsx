'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Trophy,
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Layers,
} from 'lucide-react';
import { fetchRoundEvaluationResults } from '@/services/evaluation-results.service';
import type { RoundEvaluationResultsData } from '@/types/evaluation-results';
import { ApplicantScoreDetailModal } from '@/components/evaluation-results/applicant-score-detail-modal';
import { Select } from '@/components/ui';

interface RoundEvaluationTabProps {
  roundId: number;
  roundStatus: string;
  targetScore: number;
}

export function RoundEvaluationTab({
  roundId,
  roundStatus,
  targetScore = 100,
}: RoundEvaluationTabProps) {
  const [data, setData] = useState<RoundEvaluationResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [, startTransition] = useTransition();

  // Modal
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadResults = useCallback(async () => {
    if (roundStatus === 'DRAFT') {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetchRoundEvaluationResults(roundId, {
        limit: 100,
        search: searchTerm || undefined,
        faculty: facultyFilter || undefined,
      });
      setData(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถโหลดผลการประเมินได้';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [roundId, roundStatus, searchTerm, facultyFilter]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  const handleViewDetail = (applicantId: number) => {
    setSelectedApplicantId(applicantId);
    setModalOpen(true);
  };

  if (roundStatus === 'DRAFT') {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-8 text-center space-y-3 shadow-xs">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
          <Info className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-foreground">รอบทุนยังไม่เปิดรับการประเมิน</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          รอบทุนนี้อยู่ในสถานะ <strong>ฉบับร่าง (DRAFT)</strong> การจัดอันดับและคะแนนเฉลี่ยจะเริ่มประมวลผลเมื่อผู้ดูแลระบบเปิดรับประเมิน (Open Round)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stat Capsules */}
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">ผู้สมัครทั้งหมด</span>
            <span className="text-2xl font-black font-mono text-foreground mt-1 block">
              {data.summary.totalApplicants}{' '}
              <span className="text-xs font-normal text-muted-foreground">คน</span>
            </span>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">ได้รับการประเมินแล้ว</span>
            <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1 block">
              {data.summary.evaluatedApplicants}{' '}
              <span className="text-xs font-normal text-muted-foreground">คน</span>
            </span>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">รอการประเมิน</span>
            <span className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400 mt-1 block">
              {data.summary.pendingApplicants}{' '}
              <span className="text-xs font-normal text-muted-foreground">คน</span>
            </span>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider block">ผลประเมินที่ส่งแล้ว (Submitted)</span>
            <span className="text-2xl font-black font-mono text-primary mt-1 block">
              {data.summary.totalEvaluations}{' '}
              <span className="text-xs font-normal text-muted-foreground">ครั้ง</span>
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา..."
            value={searchTerm}
            onChange={(e) => {
              const val = e.target.value;
              startTransition(() => setSearchTerm(val));
            }}
            className="w-full pl-9.5 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        <div className="w-full sm:w-60">
          <Select
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
          >
            <option value="">ทุกคณะ / วิทยาลัย</option>
            <option value="คณะวิศวกรรมศาสตร์">คณะวิศวกรรมศาสตร์</option>
            <option value="คณะวิทยาศาสตร์">คณะวิทยาศาสตร์</option>
            <option value="คณะเกษตรศาสตร์">คณะเกษตรศาสตร์</option>
            <option value="คณะแพทยศาสตร์">คณะแพทยศาสตร์</option>
            <option value="คณะพยาบาลศาสตร์">คณะพยาบาลศาสตร์</option>
            <option value="คณะมนุษยศาสตร์และสังคมศาสตร์">คณะมนุษยศาสตร์และสังคมศาสตร์</option>
            <option value="คณะศึกษาศาสตร์">คณะศึกษาศาสตร์</option>
          </Select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">กำลังประมวลผลคะแนนและอันดับ...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <Users className="w-8 h-8 mx-auto opacity-50" />
            <p className="text-sm">ไม่พบข้อมูลผลการประเมินตามเงื่อนไขที่เลือก</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground">
                  <th className="py-3 px-4 w-16 text-center">อันดับ</th>
                  <th className="py-3 px-4">ผู้สมัคร</th>
                  <th className="py-3 px-4">คณะ / สาขาวิชา</th>
                  <th className="py-3 px-4 text-center">ชั้นปี / GPA</th>
                  <th className="py-3 px-4 text-center">ผู้ประเมิน</th>
                  <th className="py-3 px-4 text-right">คะแนนเฉลี่ย</th>
                  <th className="py-3 px-4 text-center w-28">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.items.map((item) => (
                  <tr key={item.applicantId} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-mono font-bold text-xs ${
                        item.rank === 1
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : item.rank === 2
                          ? 'bg-slate-200 text-slate-800 border border-slate-300'
                          : item.rank === 3
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-foreground block">
                        {item.titlePrefix}{item.firstName} {item.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {item.studentCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-foreground block">{item.faculty}</span>
                      <span className="text-xs text-muted-foreground">{item.major}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-foreground block">ปี <span className="font-mono">{item.studyYear}</span></span>
                      <span className="text-xs text-muted-foreground"><span className="font-mono">GPA {item.gpa.toFixed(2)}</span></span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-muted text-foreground border border-border/80">
                        <span className="font-mono font-medium">{item.submittedCount}</span> ท่าน
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div>
                        <span className="font-mono font-bold text-base text-foreground">
                          {item.finalScore.display}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          / {data.round.criteria?.targetScore || targetScore}
                        </span>
                      </div>
                      <div className="w-20 ml-auto h-1.5 bg-muted rounded-full overflow-hidden mt-1 flex">
                        <div
                          style={{
                            width: `${Math.min(
                              (item.finalScore.average / (data.round.criteria?.targetScore || targetScore)) * 100,
                              100,
                            )}%`,
                          }}
                          className="h-full bg-primary rounded-full transition-all"
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleViewDetail(item.applicantId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-foreground hover:text-primary transition shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูคะแนน</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Score Detail */}
      <ApplicantScoreDetailModal
        applicantId={selectedApplicantId}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedApplicantId(null);
        }}
      />
    </div>
  );
}
