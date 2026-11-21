import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  ScholarshipTypesMetricsBar,
  ScholarshipTypeStatusBadge,
  CriteriaBuilder,
  ScholarshipTypeHeroHeader,
  ScholarshipTypeStatusFilterTabs,
  DeleteScholarshipTypeModal,
  ScholarshipTypeDetailModal,
} from './index';
import { ScholarshipTypeListItem, NestedSubCriteriaItem } from '@/types/scholarship-type';

vi.mock('@/services/scholarship-types.service', () => ({
  fetchScholarshipTypeById: vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: 1,
      name: 'ทุนเรียนดีเด่น',
      description: 'สำหรับนักศึกษาผลการเรียนยอดเยี่ยม',
      isActive: true,
      roundsCount: 3,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      defaultCriteria: {
        id: 10,
        name: 'เกณฑ์ทุนเรียนดี',
        subCriteria: [
          {
            id: 101,
            title: 'ผลการเรียนเฉลี่ยสะสม',
            type: 'SCORED',
            maxScore: 50,
            allowComment: true,
            sortOrder: 1,
          },
          {
            id: 102,
            title: 'ข้อเสนอแนะของอาจารย์ที่ปรึกษา',
            type: 'TEXT',
            maxScore: null,
            allowComment: false,
            sortOrder: 2,
          },
        ],
      },
    },
  }),
}));

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
          targetScore={100}
          onTargetScoreChange={vi.fn()}
          subCriteria={mockItems}
          onSubCriteriaChange={onItemsChange}
        />
      );

      expect(screen.getByDisplayValue('ผลการเรียน')).toBeInTheDocument();
      expect(screen.getByDisplayValue('ความประพฤติ')).toBeInTheDocument();
      expect(screen.getAllByText('เพิ่มข้อแบบมีคะแนน')[0]).toBeInTheDocument();

      // Click add button
      fireEvent.click(screen.getAllByText('เพิ่มข้อแบบมีคะแนน')[0]);
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

  describe('ScholarshipTypeDetailModal', () => {
    it('renders detail modal with criteria table and allows closing', async () => {
      const onClose = vi.fn();
      render(
        <ScholarshipTypeDetailModal
          isOpen={true}
          typeId={1}
          typeName="ทุนเรียนดีเด่น"
          onClose={onClose}
        />
      );

      // Check header and content
      expect(screen.getAllByText('ทุนเรียนดีเด่น').length).toBeGreaterThanOrEqual(1);
      expect(await screen.findByText('ผลการเรียนเฉลี่ยสะสม')).toBeInTheDocument();
      expect(screen.getByText('ข้อเสนอแนะของอาจารย์ที่ปรึกษา')).toBeInTheDocument();
      expect(screen.getByText('50 คะแนน')).toBeInTheDocument();
      expect(screen.getByText('ใช้งานในรอบทุน 3 รอบ')).toBeInTheDocument();

      // Click close button
      const closeButtons = screen.getAllByRole('button', { name: /ปิด/i });
      fireEvent.click(closeButtons[0]);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
