import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateScholarshipTypePage from './page';
import * as scholarshipTypesService from '@/services/scholarship-types.service';
import * as criteriaService from '@/services/criteria.service';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockCriteriaList = [
  {
    id: 101,
    name: 'เกณฑ์มาตรฐานทุนเรียนดีเด่น',
    targetScore: 100,
    totalScore: 100,
    isLocked: false,
    usedByRounds: [],
    subCriteria: [
      { id: 1, sortOrder: 1, title: 'ผลการเรียนเฉลี่ย', type: 'SCORED' as const, maxScore: 50, allowComment: true },
      { id: 2, sortOrder: 2, title: 'ความประพฤติ', type: 'SCORED' as const, maxScore: 50, allowComment: true },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 102,
    name: 'เกณฑ์มาตรฐานทุนขัดสน',
    targetScore: 100,
    totalScore: 100,
    isLocked: false,
    usedByRounds: [],
    subCriteria: [
      { id: 3, sortOrder: 1, title: 'รายได้ครอบครัว', type: 'SCORED' as const, maxScore: 60, allowComment: true },
      { id: 4, sortOrder: 2, title: 'ภาระหนี้สิน', type: 'SCORED' as const, maxScore: 40, allowComment: true },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('CreateScholarshipTypePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(criteriaService, 'fetchCriteriaList').mockResolvedValue({
      success: true,
      statusCode: 200,
      data: mockCriteriaList,
    });
  });

  it('renders general info section and criteria selection section', async () => {
    render(<CreateScholarshipTypePage />);

    expect(screen.getByText('สร้างประเภททุนการศึกษาใหม่')).toBeInTheDocument();
    expect(screen.getByText('1. ข้อมูลทั่วไปของประเภททุน')).toBeInTheDocument();
    expect(screen.getByText('2. ผูกเกณฑ์การประเมินเริ่มต้น (Default Criteria)')).toBeInTheDocument();
    expect(screen.getByLabelText(/เลือกชุดเกณฑ์การประเมิน/)).toBeInTheDocument();

    // Wait for criteria to load and render preview
    await waitFor(() => {
      expect(screen.getByText(/พรีวิวเกณฑ์ที่ผูก: เกณฑ์มาตรฐานทุนเรียนดีเด่น/)).toBeInTheDocument();
    });
  });

  it('shows error if type name is empty on submission', async () => {
    render(<CreateScholarshipTypePage />);

    const submitBtn = screen.getByRole('button', { name: /สร้างประเภททุนการศึกษา/ });
    fireEvent.click(submitBtn);

    expect(screen.getByText('กรุณาระบุชื่อประเภททุนการศึกษา')).toBeInTheDocument();
  });

  it('submits successfully with selected criteria and displays success view', async () => {
    const createSpy = vi.spyOn(scholarshipTypesService, 'createScholarshipType').mockResolvedValue({
      success: true,
      statusCode: 201,
      data: {
        id: 1,
        name: 'ทุนวิจัยระดับปริญญาตรี',
        description: 'ทุนสนับสนุนการทำวิจัย',
        isActive: true,
        roundsCount: 0,
        defaultCriteriaId: 101,
        defaultCriteria: {
          id: 101,
          name: 'เกณฑ์มาตรฐานทุนเรียนดีเด่น',
        },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    });

    render(<CreateScholarshipTypePage />);

    // Wait for criteria list to load
    await waitFor(() => {
      expect(criteriaService.fetchCriteriaList).toHaveBeenCalled();
    });

    const nameInput = screen.getByPlaceholderText(/เช่น ทุนเรียนดีเด่น/);
    fireEvent.change(nameInput, { target: { value: 'ทุนวิจัยระดับปริญญาตรี' } });

    const descInput = screen.getByPlaceholderText(/อธิบายวัตถุประสงค์/);
    fireEvent.change(descInput, { target: { value: 'ทุนสนับสนุนการทำวิจัย' } });

    const submitBtn = screen.getByRole('button', { name: /สร้างประเภททุนการศึกษา/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        name: 'ทุนวิจัยระดับปริญญาตรี',
        description: 'ทุนสนับสนุนการทำวิจัย',
        defaultCriteriaId: 101,
      });
    });

    // Check success view
    await waitFor(() => {
      expect(screen.getByText(/สร้างประเภททุน “ทุนวิจัยระดับปริญญาตรี” เรียบร้อยแล้ว/)).toBeInTheDocument();
      expect(screen.getByText(/เกณฑ์มาตรฐานทุนเรียนดีเด่น/)).toBeInTheDocument();
    });
  });

  it('updates preview when a different criteria is selected from dropdown', async () => {
    render(<CreateScholarshipTypePage />);

    await waitFor(() => {
      expect(screen.getByText(/พรีวิวเกณฑ์ที่ผูก: เกณฑ์มาตรฐานทุนเรียนดีเด่น/)).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/เลือกชุดเกณฑ์การประเมิน/);
    fireEvent.change(select, { target: { value: '102' } });

    await waitFor(() => {
      expect(screen.getByText(/พรีวิวเกณฑ์ที่ผูก: เกณฑ์มาตรฐานทุนขัดสน/)).toBeInTheDocument();
    });
  });
});
