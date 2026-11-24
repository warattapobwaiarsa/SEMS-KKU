'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  Alert,
} from '@/components/ui';
import { Plus, Sparkles } from 'lucide-react';
import { createScholarshipType } from '@/services/scholarship-types.service';
import {
  ScholarshipTypeDetail,
  NestedSubCriteriaItem,
} from '@/types/scholarship-type';

interface QuickCreateScholarshipTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdType: ScholarshipTypeDetail) => void;
}

type TemplateType = 'need' | 'merit' | 'activity' | 'single';

export function QuickCreateScholarshipTypeModal({
  isOpen,
  onClose,
  onSuccess,
}: QuickCreateScholarshipTypeModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<TemplateType>('need');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getTemplateItems = (tpl: TemplateType): NestedSubCriteriaItem[] => {
    switch (tpl) {
      case 'need':
        return [
          { sortOrder: 1, title: 'รายได้เฉลี่ยต่อครอบครัวต่อปี', type: 'SCORED', maxScore: 40, allowComment: true },
          { sortOrder: 2, title: 'ภาระหนี้สินและจำนวนพี่น้องที่กำลังศึกษา', type: 'SCORED', maxScore: 30, allowComment: true },
          { sortOrder: 3, title: 'สภาพที่พักอาศัยและความจำเป็นเร่งด่วน', type: 'SCORED', maxScore: 30, allowComment: true },
          { sortOrder: 4, title: 'ความคิดเห็นเพิ่มเติมของคณะกรรมการ', type: 'TEXT', maxScore: null, allowComment: false },
        ];
      case 'merit':
        return [
          { sortOrder: 1, title: 'ผลการเรียนเฉลี่ยสะสม (GPAX)', type: 'SCORED', maxScore: 50, allowComment: false },
          { sortOrder: 2, title: 'รางวัลหรือผลงานทางวิชาการ', type: 'SCORED', maxScore: 30, allowComment: true },
          { sortOrder: 3, title: 'การนำเสนอผลงานและปฏิภาณไหวพริบ', type: 'SCORED', maxScore: 20, allowComment: true },
          { sortOrder: 4, title: 'ข้อคิดเห็นของอาจารย์ที่ปรึกษา', type: 'TEXT', maxScore: null, allowComment: false },
        ];
      case 'activity':
        return [
          { sortOrder: 1, title: 'ประวัติการเป็นผู้นำองค์กรนักศึกษาหรือสโมสร', type: 'SCORED', maxScore: 40, allowComment: true },
          { sortOrder: 2, title: 'ชั่วโมงจิตอาสาและการบำเพ็ญประโยชน์', type: 'SCORED', maxScore: 40, allowComment: true },
          { sortOrder: 3, title: 'การสัมภาษณ์ทัศนคติและมนุษยสัมพันธ์', type: 'SCORED', maxScore: 20, allowComment: true },
          { sortOrder: 4, title: 'แฟ้มสะสมผลงาน (Portfolio) ข้อคิดเห็น', type: 'TEXT', maxScore: null, allowComment: false },
        ];
      case 'single':
      default:
        return [
          { sortOrder: 1, title: 'คะแนนการพิจารณารวมของคณะกรรมการ', type: 'SCORED', maxScore: 100, allowComment: true },
          { sortOrder: 2, title: 'ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติม', type: 'TEXT', maxScore: null, allowComment: false },
        ];
    }
  };

  const handleReset = () => {
    setName('');
    setDescription('');
    setTemplate('need');
    setErrorMessage(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('กรุณาระบุชื่อประเภททุนการศึกษา');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const subCriteria = getTemplateItems(template);
      const payload = {
        name: trimmedName,
        description: description.trim() || undefined,
        criteria: {
          name: `เกณฑ์มาตรฐาน ${trimmedName}`,
          targetScore: 100,
          subCriteria,
        },
      };

      const res = await createScholarshipType(payload);
      if (res && res.data) {
        onSuccess(res.data);
        handleClose();
      } else {
        throw new Error('ไม่ได้รับข้อมูลตอบกลับจากการสร้างประเภททุน');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างประเภททุน';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader
          title="สร้างประเภททุนการศึกษาใหม่แบบด่วน"
          subtitle="สร้างประเภททุนพร้อมกำหนดเกณฑ์การประเมินเริ่มต้นในหน้าต่างเดียว"
        />

        <ModalBody className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <p className="text-xs">{errorMessage}</p>
            </Alert>
          )}

          <div className="space-y-1.5">
            <label htmlFor="quick-type-name" className="text-xs font-semibold text-foreground flex items-center gap-1">
              ชื่อประเภททุนการศึกษา <span className="text-destructive">*</span>
            </label>
            <Input
              id="quick-type-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="เช่น ทุนช่วยเหลือนักศึกษาขาดแคลนทุนทรัพย์, ทุนเรียนดีเด่น"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quick-type-desc" className="text-xs font-semibold text-foreground flex items-center gap-1">
              คำอธิบายวัตถุประสงค์ <span className="text-muted-foreground font-normal">(ไม่บังคับ)</span>
            </label>
            <textarea
              id="quick-type-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุวัตถุประสงค์หรือกลุ่มเป้าหมายของทุนโดยย่อ..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quick-type-template" className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>ชุดเกณฑ์มาตรฐานเริ่มต้น (Default Rubric Template)</span>
            </label>
            <Select
              id="quick-type-template"
              value={template}
              onChange={(e) => setTemplate(e.target.value as TemplateType)}
            >
              <option value="need">เกณฑ์ทุนขาดแคลนมาตรฐาน (รายได้ 40 / หนี้สิน 30 / ที่พัก 30 = 100 คะแนน)</option>
              <option value="merit">เกณฑ์ทุนเรียนดีเด่น (GPAX 50 / ผลงาน 30 / นำเสนอ 20 = 100 คะแนน)</option>
              <option value="activity">เกณฑ์ทุนกิจกรรมและผู้นำ (ผู้นำ 40 / จิตอาสา 40 / สัมภาษณ์ 20 = 100 คะแนน)</option>
              <option value="single">เกณฑ์พิจารณารวมแบบองค์รวม (คะแนนรวมของกรรมการ 100 คะแนนเต็ม)</option>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              ระบบจะสร้างประเภททุนพร้อมผูกเกณฑ์แม่แบบ 100 คะแนนเต็มให้อัตโนมัติ สามารถนำไปปรับแต่งเฉพาะรอบได้ภายหลัง
            </p>
          </div>
        </ModalBody>

        <ModalFooter className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={handleClose}>
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            {submitting ? 'กำลังบันทึก...' : 'สร้างและเลือกใช้ทันที'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
