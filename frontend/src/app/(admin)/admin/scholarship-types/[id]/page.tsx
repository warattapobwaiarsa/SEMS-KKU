'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ScholarshipTypeDetail } from '@/types/scholarship-type';
import {
  fetchScholarshipTypeById,
} from '@/services/scholarship-types.service';
import {
  ScholarshipTypeHeroHeader,
} from '@/components/scholarship-types';
import {
  Button,
  Badge,
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
} from '@/components/ui';
import {
  Layers,
  Calendar,
  PlusCircle,
  CheckCircle2,
  FileText,
  Target,
  Award,
} from 'lucide-react';

export default function ScholarshipTypeDetailPage() {
  const params = useParams();
  const id = Number(params?.id);

  const [typeDetail, setTypeDetail] = useState<ScholarshipTypeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id || isNaN(id)) {
      setError('รหัสประเภททุนไม่ถูกต้อง');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetchScholarshipTypeById(id);
      setTypeDetail(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลประเภททุน';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
        <div className="p-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
          <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดข้อมูลประเภททุน...</p>
        </div>
      </div>
    );
  }

  if (error || !typeDetail) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
        <Alert variant="destructive">
          {error || 'ไม่พบข้อมูลประเภททุนที่ต้องการ'}
        </Alert>
        <div>
          <Link href="/admin/scholarship-types">
            <Button variant="outline">กลับสู่หน้ารายการประเภททุน</Button>
          </Link>
        </div>
      </div>
    );
  }

  const subCriteria = typeDetail.defaultCriteria?.subCriteria || [];
  const scoredCount = subCriteria.filter((s) => s.type === 'SCORED').length;
  const textCount = subCriteria.filter((s) => s.type === 'TEXT').length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* Hero Header */}
      <ScholarshipTypeHeroHeader
        id={typeDetail.id}
        name={typeDetail.name}
        description={typeDetail.description}
        roundsCount={typeDetail.roundsCount}
        subCriteriaCount={subCriteria.length}
      />

      {/* Criteria Table Container */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs w-full flex flex-col justify-between">
        <div className="p-5 pb-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-base sm:text-lg text-foreground">
                เกณฑ์การประเมินเริ่มต้น (Default Evaluation Criteria)
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              ชุดเกณฑ์นี้จะถูกนำไปใช้เป็นค่าเริ่มต้นเมื่อมีการสร้างรอบทุนการศึกษาใหม่สำหรับประเภทนี้
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs">
              ทั้งหมด {subCriteria.length} ข้อ
            </Badge>
            <Badge variant="secondary" className="text-xs">
              มีคะแนน {scoredCount} ข้อ
            </Badge>
            {textCount > 0 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                ข้อความ {textCount} ข้อ
              </Badge>
            )}
          </div>
        </div>

        {subCriteria.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={Layers}
              title="ยังไม่มีเกณฑ์การประเมิน"
              description="ประเภททุนนี้ยังไม่มีชุดเกณฑ์การประเมินเริ่มต้นผูกไว้"
            />
          </div>
        ) : (
          <Table className="w-full text-left text-sm table-fixed min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">หัวข้อเกณฑ์ย่อย</TableHead>
                <TableHead className="w-1/4 text-center">ชนิดเกณฑ์</TableHead>
                <TableHead className="w-1/4 text-center">คะแนนเต็ม</TableHead>
                <TableHead className="w-1/4 text-center">การบันทึกความเห็น</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subCriteria.map((item, index) => (
                <TableRow key={item.id || index} className="group">
                  <TableCell className="w-1/4 font-medium">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-muted text-xs font-mono font-bold text-muted-foreground shrink-0">
                        {index + 1}
                      </span>
                      <span className="font-semibold text-foreground text-sm truncate" title={item.title}>
                        {item.title}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="w-1/4 text-center">
                    {item.type === 'SCORED' ? (
                      <Badge
                        variant="secondary"
                        className="inline-flex items-center gap-1 text-xs font-medium"
                      >
                        <Target className="h-3 w-3 text-primary" />
                        <span>มีคะแนน (SCORED)</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
                      >
                        <FileText className="h-3 w-3" />
                        <span>ข้อความ (TEXT)</span>
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="w-1/4 text-center">
                    {item.type === 'SCORED' && item.maxScore != null ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground px-2.5 py-1 rounded-lg bg-muted/60 border border-border/40">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        {item.maxScore} คะแนน
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell className="w-1/4 text-center">
                    {item.allowComment ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>อนุญาตให้ระบุ</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">ไม่อนุญาต</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Rounds Usage Card */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs w-full">
        <div className="p-5 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base sm:text-lg text-foreground">
              การนำไปใช้งานในรอบทุนการศึกษา
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            ประเภททุนนี้ถูกนำไปผูกและใช้งานในรอบทุนการศึกษาทั้งหมด {typeDetail.roundsCount} รอบ
          </p>
        </div>
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            สามารถนำประเภททุนนี้ไปเลือกใช้งานในการสร้างรอบทุนการศึกษาใหม่ได้ทันที
          </div>

          <Link href="/admin/scholarship-rounds/create" className="shrink-0 w-full sm:w-auto">
            <Button size="sm" className="gap-2 w-full sm:w-auto">
              <PlusCircle className="h-4 w-4" />
              <span>ไปสร้างรอบทุนด้วยประเภทนี้</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
