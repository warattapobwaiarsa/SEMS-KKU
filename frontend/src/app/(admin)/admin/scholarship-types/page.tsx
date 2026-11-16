'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ScholarshipTypeListItem } from '@/types/scholarship-type';
import { CriteriaDetail } from '@/types/criteria';
import {
  fetchScholarshipTypes,
  createScholarshipType,
  updateScholarshipType,
  toggleScholarshipTypeActive,
} from '@/services/scholarship-types.service';
import { fetchCriteriaList } from '@/services/criteria.service';
import { PageHeader, Pagination, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import {
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Power,
  PowerOff,
  BookOpen,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useDebounce } from '@/lib/use-debounce';

export default function ScholarshipTypesPage() {
  const [types, setTypes] = useState<ScholarshipTypeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Criteria options for defaultCriteria dropdown
  const [criteriaOptions, setCriteriaOptions] = useState<CriteriaDetail[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ScholarshipTypeListItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDefaultCriteriaId, setFormDefaultCriteriaId] = useState<number | undefined>(undefined);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchScholarshipTypes({
        page,
        limit: 10,
        search: debouncedSearch.trim() || undefined,
        activeOnly: activeFilter === 'active' ? true : undefined,
      });
      setTypes(res.data);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดประเภททุน';
      setError(msg);
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, activeFilter]);

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, [loadData]);

  // Load criteria options for modal
  useEffect(() => {
    async function loadCriteria() {
      try {
        const res = await fetchCriteriaList({ limit: 100 });
        setCriteriaOptions(res.data);
      } catch (err) {
        console.warn('Could not load criteria options:', err);
      }
    }
    void loadCriteria();
  }, []);

  const openCreateModal = () => {
    setEditingType(null);
    setFormName('');
    setFormDescription('');
    setFormDefaultCriteriaId(undefined);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (type: ScholarshipTypeListItem) => {
    setEditingType(type);
    setFormName(type.name);
    setFormDescription(type.description || '');
    setFormDefaultCriteriaId(type.defaultCriteriaId || undefined);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('กรุณาระบุชื่อประเภททุน');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (editingType) {
        await updateScholarshipType(editingType.id, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          defaultCriteriaId: formDefaultCriteriaId || null,
        });
      } else {
        await createScholarshipType({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          defaultCriteriaId: formDefaultCriteriaId,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleActive = async (type: ScholarshipTypeListItem) => {
    const actionText = type.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน';
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการ${actionText}ประเภททุน "${type.name}"?`)) {
      return;
    }

    try {
      await toggleScholarshipTypeActive(type.id, !type.isActive);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Standard Page Header */}
      <PageHeader
        moduleBadge="การจัดการประเภททุนการศึกษา"
        moduleBadgeIcon={Award}
        title="ประเภททุนการศึกษา"
        description="จำแนกประเภททุนและกำหนดเกณฑ์การประเมินเริ่มต้นให้ตรงตามวัตถุประสงค์ของแต่ละทุน (เช่น ทุนขาดแคลน, ทุนเรียนดี, ทุนกิจกรรม)"
        action={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            สร้างประเภททุนใหม่
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อหรือคำอธิบายประเภททุน..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44 py-2.5 px-3 text-sm bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="active">เปิดใช้งานเท่านั้น</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Table / List View */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>กำลังโหลดข้อมูลประเภททุน...</span>
          </div>
        ) : types.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Layers className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">ไม่พบข้อมูลประเภททุนการศึกษา</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {searchTerm
                ? 'ไม่พบประเภททุนที่ตรงกับคำค้นหา ลองค้นหาด้วยคำอื่น'
                : 'เริ่มต้นสร้างประเภททุนแรกเพื่อใช้จัดหมวดหมู่รอบทุนและกำหนดเกณฑ์เริ่มต้น'}
            </p>
            {!searchTerm && (
              <button
                onClick={openCreateModal}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> สร้างประเภททุนใหม่
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border/80 text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-5">ชื่อประเภททุน</th>
                  <th className="py-3.5 px-5">วัตถุประสงค์ / คำอธิบาย</th>
                  <th className="py-3.5 px-5">เกณฑ์ประเมินเริ่มต้น (Default Criteria)</th>
                  <th className="py-3.5 px-5 text-center">รอบที่ใช้</th>
                  <th className="py-3.5 px-5 text-center">สถานะ</th>
                  <th className="py-3.5 px-5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {types.map((type) => (
                  <tr key={type.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-5 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary shrink-0" />
                        <span>{type.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-muted-foreground max-w-xs truncate">
                      {type.description || <span className="text-muted-foreground/50 italic">ไม่ได้ระบุ</span>}
                    </td>
                    <td className="py-4 px-5">
                      {type.defaultCriteriaName ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          <BookOpen className="h-3 w-3" />
                          {type.defaultCriteriaName}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">ไม่ได้กำหนดเกณฑ์เริ่มต้น</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {type.roundsCount} รอบ
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      {type.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                          <CheckCircle2 className="h-3 w-3" /> เปิดใช้งาน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                          ปิดการใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(type)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(type)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            type.isActive
                              ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                              : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={type.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                        >
                          {type.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-border/80">
            <Pagination
              currentPage={page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Info Notice about Rules */}
      <div className="flex items-start gap-2.5 p-3.5 bg-muted/40 border border-border rounded-xl text-xs text-muted-foreground">
        <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <div>
          <span className="font-semibold text-foreground">ข้อกำหนดระบบประเภททุน (Scope 1.3): </span>
          ระบบไม่รองรับการลบประเภททุน (สามารถปิดการใช้งานได้เท่านั้น) และการเปลี่ยนเกณฑ์เริ่มต้นของประเภททุนจะมีผลกับรอบทุนที่สร้างใหม่หลังจากนั้นเท่านั้น โดยไม่กระทบรอบทุนที่สร้างไว้แล้ว
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <form onSubmit={handleFormSubmit}>
          <ModalHeader
            title={editingType ? 'แก้ไขประเภททุนการศึกษา' : 'สร้างประเภททุนการศึกษาใหม่'}
            subtitle={
              editingType
                ? 'ปรับปรุงรายละเอียดหรือเปลี่ยนเกณฑ์เริ่มต้นของประเภททุน'
                : 'กำหนดชื่อ คำอธิบายวัตถุประสงค์ และเลือกเกณฑ์การประเมินเริ่มต้น'
            }
          />

          <ModalBody className="flex flex-col gap-4">
            {formError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs">
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                ชื่อประเภททุน <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="เช่น ทุนขาดแคลนทุนทรัพย์, ทุนเรียนดี, ทุนกิจกรรมเด่น"
                className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                วัตถุประสงค์ / คำอธิบาย <span className="text-muted-foreground font-normal">(ไม่บังคับ)</span>
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="อธิบายวัตถุประสงค์และกลุ่มเป้าหมายของทุนประเภทนี้..."
                rows={3}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                เกณฑ์การประเมินเริ่มต้น (Default Criteria) <span className="text-muted-foreground font-normal">(ไม่บังคับ)</span>
              </label>
              <select
                value={formDefaultCriteriaId || ''}
                onChange={(e) => setFormDefaultCriteriaId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition"
              >
                <option value="">-- ไม่กำหนดเกณฑ์เริ่มต้น --</option>
                {criteriaOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                เมื่อสร้างรอบทุนใหม่ในประเภทนี้ ระบบจะเลือกเกณฑ์นี้ให้อัตโนมัติ
              </p>
            </div>
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={formSubmitting}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {formSubmitting ? 'กำลังบันทึก...' : editingType ? 'บันทึกการแก้ไข' : 'สร้างประเภททุน'}
            </button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
