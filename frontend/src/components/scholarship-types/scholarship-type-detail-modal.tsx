'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Award,
  Calendar,
  CheckCircle2,
  Layers,
  Sliders,
  Target,
  FileText,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
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
import { fetchScholarshipTypeById } from '@/services/scholarship-types.service';
import { ScholarshipTypeDetail } from '@/types/scholarship-type';

export interface ScholarshipTypeDetailModalProps {
  isOpen: boolean;
  typeId: number | null;
  typeName?: string;
  onClose: () => void;
}

export function ScholarshipTypeDetailModal({
  isOpen,
  typeId,
  typeName,
  onClose,
}: ScholarshipTypeDetailModalProps) {
  const [detail, setDetail] = useState<ScholarshipTypeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!typeId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchScholarshipTypeById(typeId);
      setDetail(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดรายละเอียดประเภททุน';
      setError(msg);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [typeId]);

  useEffect(() => {
    if (isOpen && typeId) {
      void loadDetail();
    } else {
      setDetail(null);
      setError(null);
    }
  }, [isOpen, typeId, loadDetail]);

  const subCriteria = detail?.defaultCriteria?.subCriteria || [];
  const scoredCount = subCriteria.filter((s) => s.type === 'SCORED').length;
  const textCount = subCriteria.filter((s) => s.type === 'TEXT').length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalHeader
        title={typeName || detail?.name || 'รายละเอียดประเภททุน'}
        subtitle="รายละเอียดประเภททุนและเกณฑ์การประเมินเริ่มต้น"
        icon={Sliders}
        iconClassName="text-primary bg-primary/10 border-primary/20"
        onClose={onClose}
      />

      <ModalBody className="space-y-5 p-6">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">กำลังโหลดรายละเอียดประเภททุน...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive" title="ไม่สามารถโหลดข้อมูลประเภททุนได้">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
              <p className="text-xs text-destructive/90">{error}</p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void loadDetail()}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                className="shrink-0"
              >
                ลองใหม่อีกครั้ง
              </Button>
            </div>
          </Alert>
        ) : detail ? (
          <>
            {/* Overview Metadata Bar */}
            <div className="bg-muted/30 border border-border/70 rounded-2xl p-4.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">ชื่อประเภททุน</span>
                  <h4 className="font-bold text-base text-foreground mt-0.5">{detail.name}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground px-2.5 py-1 rounded-lg bg-card border border-border/60">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    ใช้งานในรอบทุน {detail.roundsCount} รอบ
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block mb-0.5">คำอธิบาย</span>
                  <p className="text-foreground font-medium">
                    {detail.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">ชุดเกณฑ์เริ่มต้น</span>
                  {detail.defaultCriteria ? (
                    <span className="text-foreground font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{detail.defaultCriteria.name}</span>
                    </span>
                  ) : (
                    <span className="text-amber-700 italic">ยังไม่ได้ผูกเกณฑ์</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-Criteria Section */}
            <div className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-2xs">
              <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h4 className="font-bold text-sm text-foreground">
                    เกณฑ์การประเมินเริ่มต้น (Default Evaluation Criteria)
                  </h4>
                </div>
                <div className="flex items-center gap-2">
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
                <div className="p-8 text-center">
                  <EmptyState
                    icon={Layers}
                    title="ยังไม่มีเกณฑ์การประเมิน"
                    description="ประเภททุนนี้ยังไม่มีเกณฑ์การประเมินเริ่มต้นผูกไว้"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="table-fixed min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 text-center">ลำดับ</TableHead>
                        <TableHead className="w-2/5">หัวข้อเกณฑ์ย่อย</TableHead>
                        <TableHead className="text-center">ชนิดเกณฑ์</TableHead>
                        <TableHead className="text-center">คะแนนเต็ม</TableHead>
                        <TableHead className="text-center">ความเห็น</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subCriteria.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell className="text-center font-mono font-bold text-xs text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium text-sm text-foreground">
                            <span className="block truncate" title={item.title}>
                              {item.title}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.type === 'SCORED' ? (
                              <Badge
                                variant="secondary"
                                className="inline-flex items-center gap-1 text-xs font-medium"
                              >
                                <Target className="h-3 w-3 text-primary" />
                                <span>มีคะแนน</span>
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
                              >
                                <FileText className="h-3 w-3" />
                                <span>ข้อความ</span>
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.type === 'SCORED' && item.maxScore != null ? (
                              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground px-2 py-0.5 rounded-lg bg-muted/60 border border-border/40">
                                <Award className="h-3.5 w-3.5 text-primary" />
                                {item.maxScore} คะแนน
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.allowComment ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>อนุญาต</span>
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">ไม่อนุญาต</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </ModalBody>

      <ModalFooter className="flex items-center justify-between">
        <Button variant="outline" onClick={onClose} size="sm">
          ปิด
        </Button>
        {typeId && (
          <Link href={`/admin/scholarship-types/${typeId}`}>
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              ดูหน้ารายละเอียดเต็ม
            </Button>
          </Link>
        )}
      </ModalFooter>
    </Modal>
  );
}

export default ScholarshipTypeDetailModal;

