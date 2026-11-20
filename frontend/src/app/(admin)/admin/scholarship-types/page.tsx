'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ScholarshipTypeListItem } from '@/types/scholarship-type';
import { CriteriaDetail } from '@/types/criteria';
import {
  fetchScholarshipTypes,
  fetchScholarshipTypeById,
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
  CheckCircle2,
  AlertCircle,
  Edit2,
  Power,
  PowerOff,
  BookOpen,
  Calendar,
  Layers,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { useDebounce } from '@/lib/use-debounce';

interface SubCriteriaFormItem {
  id?: number;
  title: string;
  type: 'SCORED' | 'TEXT';
  allowComment: boolean;
}

const DEFAULT_SUB_CRITERIA: SubCriteriaFormItem[] = [
  { title: 'ผลการเรียนและความรู้ทางวิชาการ', type: 'SCORED', allowComment: false },
  { title: 'ความประพฤติและวินัยนักศึกษา', type: 'SCORED', allowComment: false },
  { title: 'ความคิดเห็นและข้อเสนอแนะเพิ่มเติม', type: 'TEXT', allowComment: false },
];

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

  // Criteria options for existing criteria dropdown
  const [criteriaOptions, setCriteriaOptions] = useState<CriteriaDetail[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ScholarshipTypeListItem | null>(null);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [criteriaMode, setCriteriaMode] = useState<'create' | 'existing'>('create');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDefaultCriteriaId, setFormDefaultCriteriaId] = useState<number | undefined>(undefined);
  const [subCriteriaList, setSubCriteriaList] = useState<SubCriteriaFormItem[]>(DEFAULT_SUB_CRITERIA);
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

  // Load criteria options
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
    setModalStep(1);
    setCriteriaMode('create');
    setSubCriteriaList([...DEFAULT_SUB_CRITERIA]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (type: ScholarshipTypeListItem) => {
    setEditingType(type);
    setFormName(type.name);
    setFormDescription(type.description || '');
    setFormDefaultCriteriaId(type.defaultCriteriaId || undefined);
    setModalStep(1);
    setCriteriaMode(type.defaultCriteriaId ? 'existing' : 'create');
    setFormError(null);
    setIsModalOpen(true);

    if (type.defaultCriteriaId) {
      try {
        const res = await fetchScholarshipTypeById(type.id);
        if (res.data?.defaultCriteria?.subCriteria && res.data.defaultCriteria.subCriteria.length > 0) {
          setSubCriteriaList(
            res.data.defaultCriteria.subCriteria.map((s) => ({
              id: s.id,
              title: s.title,
              type: s.type as 'SCORED' | 'TEXT',
              allowComment: s.allowComment ?? false,
            })),
          );
          setCriteriaMode('create');
        }
      } catch (e) {
        console.warn('Could not load detailed subcriteria:', e);
      }
    }
  };

  const handleNextStep = () => {
    if (!formName.trim()) {
      setFormError('กรุณาระบุชื่อประเภททุน');
      return;
    }
    setFormError(null);
    setModalStep(2);
  };

  const handleAddSubCriteria = () => {
    setSubCriteriaList((prev) => [
      ...prev,
      {
        title: '',
        type: 'SCORED',
        allowComment: false,
      },
    ]);
  };

  const handleRemoveSubCriteria = (idx: number) => {
    if (subCriteriaList.length <= 1) {
      setFormError('ต้องมีเกณฑ์ย่อยอย่างน้อย 1 ข้อ');
      return;
    }
    setSubCriteriaList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateSubCriteria = (
    idx: number,
    field: keyof SubCriteriaFormItem,
    value: unknown,
  ) => {
    setSubCriteriaList((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalStep === 1) {
      handleNextStep();
      return;
    }

    if (!formName.trim()) {
      setFormError('กรุณาระบุชื่อประเภททุน');
      setModalStep(1);
      return;
    }

    if (criteriaMode === 'create') {
      const emptyItem = subCriteriaList.find((s) => !s.title.trim());
      if (emptyItem) {
        setFormError('กรุณาระบุชื่อหัวข้อเกณฑ์ย่อยให้ครบทุกข้อ');
        return;
      }

      const scoredItems = subCriteriaList.filter((s) => s.type === 'SCORED');
      if (scoredItems.length === 0) {
        setFormError('เกณฑ์ต้องมีเกณฑ์ย่อยแบบมีคะแนน (SCORED) อย่างน้อย 1 ข้อ');
        return;
      }
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const criteriaPayload =
        criteriaMode === 'create'
          ? {
              name: `เกณฑ์สำหรับ${formName.trim()}`,
              subCriteria: subCriteriaList.map((s, idx) => ({
                id: s.id,
                title: s.title.trim(),
                type: s.type,
                allowComment: s.allowComment,
                sortOrder: idx + 1,
              })),
            }
          : undefined;

      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        defaultCriteriaId: criteriaMode === 'existing' ? (formDefaultCriteriaId || undefined) : undefined,
        criteria: criteriaPayload,
      };

      if (editingType) {
        await updateScholarshipType(editingType.id, payload);
      } else {
        await createScholarshipType(payload);
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
        title="ประเภททุนและเกณฑ์การประเมิน"
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
            placeholder="ค้นหาชื่อประเภททุน หรือคำอธิบาย..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
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
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{type.defaultCriteriaName}</span>
                          {type.subCriteriaCount !== undefined && type.subCriteriaCount > 0 && (
                            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-md bg-primary/20 font-mono">
                              {type.subCriteriaCount} ข้อ
                            </span>
                          )}
                        </div>
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
                          title="แก้ไขข้อมูลและเกณฑ์"
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

      {/* 2-Step Create / Edit Modal Wizard */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        <form onSubmit={handleFormSubmit}>
          <ModalHeader
            title={editingType ? 'แก้ไขประเภททุนและเกณฑ์การประเมิน' : 'สร้างประเภททุนและเกณฑ์การประเมิน'}
            subtitle={
              modalStep === 1
                ? 'ขั้นตอนที่ 1 จาก 2: ข้อมูลทั่วไปของประเภททุนการศึกษา'
                : 'ขั้นตอนที่ 2 จาก 2: กำหนดโครงสร้างเกณฑ์การประเมินเริ่มต้น'
            }
          />

          <ModalBody className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto pr-1">
            {/* Step Indicator */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <button
                type="button"
                onClick={() => setModalStep(1)}
                className={`flex items-center gap-2 text-xs font-semibold cursor-pointer transition ${
                  modalStep === 1 ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    modalStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  1
                </span>
                <span>ข้อมูลประเภททุน</span>
              </button>

              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />

              <button
                type="button"
                onClick={handleNextStep}
                className={`flex items-center gap-2 text-xs font-semibold cursor-pointer transition ${
                  modalStep === 2 ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    modalStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  2
                </span>
                <span>เกณฑ์การประเมิน</span>
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {modalStep === 1 ? (
              /* Step 1: ประเภททุน */
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    ชื่อประเภททุน <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="เช่น ทุนขาดแคลนทุนทรัพย์, ทุนเรียนดี, ทุนกิจกรรมเด่น"
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
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
                    rows={4}
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none"
                  />
                </div>
              </div>
            ) : (
              /* Step 2: เกณฑ์ประเมิน */
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 p-3 bg-muted/40 border border-border/80 rounded-xl">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="criteriaMode"
                      value="create"
                      checked={criteriaMode === 'create'}
                      onChange={() => setCriteriaMode('create')}
                      className="text-primary focus:ring-primary"
                    />
                    <span>สร้างเกณฑ์ใหม่สำหรับทุนนี้</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="criteriaMode"
                      value="existing"
                      checked={criteriaMode === 'existing'}
                      onChange={() => setCriteriaMode('existing')}
                      className="text-primary focus:ring-primary"
                    />
                    <span>เลือกจากเกณฑ์ที่มีอยู่เดิม</span>
                  </label>
                </div>

                {criteriaMode === 'existing' ? (
                  <div className="flex flex-col gap-2 pt-2">
                    <label className="text-xs font-semibold text-foreground">
                      เลือกชุดเกณฑ์การประเมินเริ่มต้น
                    </label>
                    <select
                      value={formDefaultCriteriaId || ''}
                      onChange={(e) => setFormDefaultCriteriaId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition"
                    >
                      <option value="">-- ไม่กำหนดเกณฑ์เริ่มต้น --</option>
                      {criteriaOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      เมื่อสร้างรอบทุนใหม่ในประเภทนี้ ระบบจะเลือกเกณฑ์ที่กำหนดนี้ให้อัตโนมัติ
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          รายการเกณฑ์ย่อย (ไม่มีเพดาน MaxScore และไม่จำกัดผลรวม 100)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSubCriteria}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> เพิ่มหัวข้อเกณฑ์ย่อย
                      </button>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {subCriteriaList.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 p-3 rounded-xl bg-card border border-border/80 shadow-2xs"
                        >
                          <span className="w-5 text-center text-xs font-bold text-muted-foreground font-mono">
                            {idx + 1}.
                          </span>

                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateSubCriteria(idx, 'title', e.target.value)}
                            placeholder="ระบุชื่อหัวข้อเกณฑ์ย่อย..."
                            className="flex-1 w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            required
                          />

                          <select
                            value={item.type}
                            onChange={(e) =>
                              handleUpdateSubCriteria(idx, 'type', e.target.value as 'SCORED' | 'TEXT')
                            }
                            className="w-full sm:w-36 px-2.5 py-1.5 text-xs font-medium bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                          >
                            <option value="SCORED">มีคะแนน (SCORED)</option>
                            <option value="TEXT">ข้อความ (TEXT)</option>
                          </select>

                          {item.type === 'SCORED' && (
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                checked={item.allowComment}
                                onChange={(e) => handleUpdateSubCriteria(idx, 'allowComment', e.target.checked)}
                                className="rounded text-primary focus:ring-primary"
                              />
                              <span>อนุญาต Comment</span>
                            </label>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveSubCriteria(idx)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition cursor-pointer shrink-0"
                            title="ลบหัวข้อนี้"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            {modalStep === 2 ? (
              <>
                <button
                  type="button"
                  onClick={() => setModalStep(1)}
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'กำลังบันทึก...' : editingType ? 'บันทึกการแก้ไข' : 'ยืนยันและสร้างประเภททุน'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-1 px-5 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 shadow-xs transition cursor-pointer"
                >
                  <span>ถัดไป: กำหนดเกณฑ์</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
