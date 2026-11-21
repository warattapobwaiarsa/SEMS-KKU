'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ScholarshipTypeDetail } from '@/types/scholarship-type';
import { fetchScholarshipTypeById } from '@/services/scholarship-types.service';
import {
  Button,
  Badge,
  Alert,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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
  FileText,
  Target,
  Award,
  ArrowLeft,
  Sliders,
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
      {/* Top back navigation link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
        <Link
          href="/admin/scholarship-types"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition hover:-translate-x-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>กลับสู่หน้ารายการประเภททุน</span>
        </Link>
      </div>

      {/* Card 1: ข้อมูลทั่วไปของประเภททุนการศึกษา */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            ข้อมูลทั่วไปของประเภททุนการศึกษา
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">ชื่อประเภททุน</span>
            <span className="font-bold text-foreground text-sm mt-1 block">{typeDetail.name}</span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">คำอธิบายและวัตถุประสงค์</span>
            <span className="font-medium text-foreground text-sm mt-1 block">
              {typeDetail.description || 'ไม่มีคำอธิบายหรือวัตถุประสงค์ระบุไว้'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">ชุดเกณฑ์การประเมินเริ่มต้น</span>
            <span className="font-bold text-foreground text-sm mt-1 block">
              {typeDetail.defaultCriteria?.name || 'ไม่มีชุดเกณฑ์เริ่มต้น'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">สถานะประเภททุน</span>
            <div className="mt-1">
              {typeDetail.isActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  เปิดใช้งาน
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                  ปิดใช้งาน
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">การนำไปใช้งานในรอบทุน</span>
            <span className="font-bold font-mono text-foreground text-sm mt-1 block">
              {typeDetail.roundsCount} รอบ
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground font-medium block">วันที่สร้าง</span>
            <span className="font-semibold text-foreground text-sm mt-1 block">
              {typeDetail.createdAt
                ? new Date(typeDetail.createdAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '-'}
            </span>
          </div>
        </div>
      </Card>

      {/* Card 2: เกณฑ์การประเมิน */}
      <Card className="overflow-hidden w-full flex flex-col justify-between">
        <CardHeader className="p-5 pb-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <CardTitle className="font-bold text-base sm:text-lg text-foreground">
                เกณฑ์การประเมิน
              </CardTitle>
            </div>
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
        </CardHeader>

        <CardContent className="p-0">
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
                  <TableHead className="w-1/5 text-center">ลำดับ</TableHead>
                  <TableHead className="w-1/5">หัวข้อเกณฑ์ย่อย</TableHead>
                  <TableHead className="w-1/5 text-center">ชนิดเกณฑ์</TableHead>
                  <TableHead className="w-1/5 text-center">คะแนนเต็ม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subCriteria.map((item, index) => (
                  <TableRow key={item.id || index} className="group">
                    <TableCell className="w-1/5 text-center font-mono font-bold text-xs text-muted-foreground">
                      {index + 1}
                    </TableCell>

                    <TableCell className="w-1/5 font-medium">
                      <span className="font-semibold text-foreground text-sm truncate block" title={item.title}>
                        {item.title}
                      </span>
                    </TableCell>

                    <TableCell className="w-1/5 text-center">
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

                    <TableCell className="w-1/5 text-center">
                      {item.type === 'SCORED' && item.maxScore != null ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground px-2.5 py-1 rounded-lg bg-muted/60 border border-border/40">
                          <Award className="h-3.5 w-3.5 text-primary" />
                          {item.maxScore} คะแนน
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
