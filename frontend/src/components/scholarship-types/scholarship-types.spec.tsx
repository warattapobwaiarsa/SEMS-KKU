import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  ScholarshipTypesMetricsBar,
  ScholarshipTypeStatusBadge,
  ScholarshipTypeStepper,
  CriteriaBuilder,
  ScholarshipTypeHeroHeader,
  ScholarshipTypeStatusFilterTabs,
  DeleteScholarshipTypeModal,
} from './index';
import { ScholarshipTypeListItem, NestedSubCriteriaItem } from '@/types/scholarship-type';

const mockTypes: ScholarshipTypeListItem[] = [
  {
    id: 1,
    name: 'ทุนเรียนดีเด่น',
    description: 'สำหรับนักศึกษาผลการเรียนยอดเยี่ยม',
    isActive: true,
    roundsCount: 3,
    subCriteriaCount: 4,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'ทุนขาดแคลนทุนทรัพย์',
    description: 'สำหรับนักศึกษาที่ต้องการความช่วยเหลือทางการเงิน',
    isActive: false,
    roundsCount: 1,
    subCriteriaCount: 3,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('ScholarshipTypes UI Components', () => {
  describe('ScholarshipTypesMetricsBar', () => {
    it('renders total, active, and inactive counts correctly', () => {
      render(<ScholarshipTypesMetricsBar types={mockTypes} />);
      expect(screen.getByText('ประเภททุนทั้งหมด')).toBeInTheDocument();
      expect(screen.getByText('เปิดใช้งานอยู่')).toBeInTheDocument();
      expect(screen.getByText('ปิดการใช้งาน')).toBeInTheDocument();

      // Total count: 2
      expect(screen.getByText('2')).toBeInTheDocument();
      // Active count: 1, Inactive count: 1
      const ones = screen.getAllByText('1');
      expect(ones.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ScholarshipTypeStatusFilterTabs', () => {
    it('renders all 3 status tabs with badges and handles click', () => {
      const onSelect = vi.fn();
      render(
        <ScholarshipTypeStatusFilterTabs
          currentStatus="all"
          onSelectStatus={onSelect}
          counts={{ total: 5, active: 3, inactive: 2 }}
        />
      );

      expect(screen.getByText('ทั้งหมด')).toBeInTheDocument();
      expect(screen.getByText('เปิดใช้งาน')).toBeInTheDocument();
      expect(screen.getByText('ปิดการใช้งาน')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();

      fireEvent.click(screen.getByText('เปิดใช้งาน'));
      expect(onSelect).toHaveBeenCalledWith('active');
    });
  });

  describe('ScholarshipTypeStatusBadge', () => {
    it('renders active badge with green style when isActive is true', () => {
      render(<ScholarshipTypeStatusBadge isActive={true} />);
      expect(screen.getByText('เปิดใช้งาน')).toBeInTheDocument();
    });

    it('renders inactive badge when isActive is false', () => {
      render(<ScholarshipTypeStatusBadge isActive={false} />);
      expect(screen.getByText('ปิดการใช้งาน')).toBeInTheDocument();
    });
  });

  describe('ScholarshipTypeStepper', () => {
    it('highlights current step correctly', () => {
      render(<ScholarshipTypeStepper currentStep={2} />);
      expect(screen.getByText('ขั้นตอนที่ 1')).toBeInTheDocument();
      expect(screen.getByText('ขั้นตอนที่ 2')).toBeInTheDocument();
      expect(screen.getByText('ขั้นตอนที่ 3')).toBeInTheDocument();
      expect(screen.getByText('กำลังดำเนินการ')).toBeInTheDocument();
    });
  });

  describe('CriteriaBuilder', () => {
    const mockItems: NestedSubCriteriaItem[] = [
      { title: 'ผลการเรียน', type: 'SCORED', allowComment: true, sortOrder: 1 },
      { title: 'ความประพฤติ', type: 'TEXT', allowComment: true, sortOrder: 2 },
    ];

    it('renders criteria rows and add button', () => {
      const onItemsChange = vi.fn();
      const onNameChange = vi.fn();

      render(
        <CriteriaBuilder
          scholarshipTypeName="ทุนเรียนดี"
          criteriaName="เกณฑ์สำหรับทุนเรียนดี"
          onCriteriaNameChange={onNameChange}
          subCriteria={mockItems}
          onSubCriteriaChange={onItemsChange}
        />
      );

      expect(screen.getByDisplayValue('ผลการเรียน')).toBeInTheDocument();
      expect(screen.getByDisplayValue('ความประพฤติ')).toBeInTheDocument();
      expect(screen.getByText('เพิ่มหัวข้อเกณฑ์ย่อยใหม่')).toBeInTheDocument();

      // Click add button
      fireEvent.click(screen.getByText('เพิ่มหัวข้อเกณฑ์ย่อยใหม่'));
      expect(onItemsChange).toHaveBeenCalled();
    });
  });

  describe('ScholarshipTypeHeroHeader', () => {
    it('renders title, description and stats', () => {
      render(
        <ScholarshipTypeHeroHeader
          id={1}
          name="ทุนเรียนดีเด่น"
          description="สำหรับผู้เรียนดี"
          roundsCount={3}
          subCriteriaCount={4}
        />
      );

      expect(screen.getByText('ทุนเรียนดีเด่น')).toBeInTheDocument();
      expect(screen.getByText('สำหรับผู้เรียนดี')).toBeInTheDocument();
      expect(screen.getByText('เกณฑ์ประเมิน 4 ข้อ')).toBeInTheDocument();
      expect(screen.getByText('ใช้งานในรอบทุน 3 รอบ')).toBeInTheDocument();
    });
  });

  describe('DeleteScholarshipTypeModal', () => {
    it('renders modal with type name and confirmation input', () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      render(
        <DeleteScholarshipTypeModal
          isOpen={true}
          typeId={1}
          typeName="ทุนเรียนดีเด่น"
          roundsCount={2}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      expect(screen.getAllByText('ยืนยันการลบประเภททุน').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('ทุนเรียนดีเด่น')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('พิมพ์ DELETE ที่นี่')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ยืนยันการลบประเภททุน/i })).toBeDisabled();
    });
  });
});
