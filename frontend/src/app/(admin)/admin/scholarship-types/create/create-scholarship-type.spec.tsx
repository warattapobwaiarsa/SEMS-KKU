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

  it('renders all sections and criteria mode options', async () => {
    render(<CreateScholarshipTypePage />);

    expect(screen.getByText('สร้างประเภททุนการศึกษาใหม่')).toBeInTheDocument();
    expect(screen.getByText('1. ข้อมูลทั่วไปของประเภททุน')).toBeInTheDocument();
    expect(screen.getByText('2. เกณฑ์การประเมินเริ่มต้น (Default Criteria)')).toBeInTheDocument();

    // Mode options
    expect(screen.getByText('เลือกจากเกณฑ์ที่มีในระบบ')).toBeInTheDocument();
    expect(screen.getByText('สร้างเกณฑ์ใหม่สำหรับประเภทนี้')).toBeInTheDocument();
    expect(screen.getByText('ยังไม่กำหนดเกณฑ์ในตอนนี้')).toBeInTheDocument();

    // Wait for criteria to load
    await waitFor(() => {
      expect(screen.getByText(/พรีวิวเกณฑ์: เกณฑ์มาตรฐานทุนเรียนดีเด่น/)).toBeInTheDocument();
    });
  });

  it('shows error if type name is empty on submission', async () => {
    render(<CreateScholarshipTypePage />);

    const submitBtn = screen.getByRole('button', { name: /สร้างประเภททุนการศึกษา/ });
    fireEvent.click(submitBtn);

    expect(screen.getByText('กรุณาระบุชื่อประเภททุนการศึกษา')).toBeInTheDocument();
  });

  it('submits successfully with existing criteria mode', async () => {
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

  it('allows switching to new criteria mode and applies templates', async () => {
    render(<CreateScholarshipTypePage />);

    const newModeRadio = screen.getByDisplayValue('NEW');
    fireEvent.click(newModeRadio);

    // Preset buttons should be present
    expect(screen.getByText(/ทุนขาดแคลนทุนทรัพย์/)).toBeInTheDocument();
    expect(screen.getByText(/ทุนเรียนดีเด่น/)).toBeInTheDocument();
    expect(screen.getByText(/ทุนกิจกรรมจิตอาสา/)).toBeInTheDocument();
    expect(screen.getByText(/คะแนนรวมข้อเดียว/)).toBeInTheDocument();

    // Click single score preset
    const singlePresetBtn = screen.getByText('คะแนนรวมข้อเดียว (100 คะแนน)');
    fireEvent.click(singlePresetBtn);

    // Check that CriteriaBuilder reflects the preset
    expect(screen.getByDisplayValue('คะแนนการพิจารณารวมของคณะกรรมการ')).toBeInTheDocument();
  });

  it('submits successfully with new criteria mode', async () => {
    const createSpy = vi.spyOn(scholarshipTypesService, 'createScholarshipType').mockResolvedValue({
      success: true,
      statusCode: 201,
      data: {
        id: 2,
        name: 'ทุนผู้นำกิจกรรม',
        description: undefined,
        isActive: true,
        roundsCount: 0,
        defaultCriteriaId: 105,
        defaultCriteria: {
          id: 105,
          name: 'เกณฑ์มาตรฐาน ทุนผู้นำกิจกรรม',
        },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    });

    render(<CreateScholarshipTypePage />);

    const nameInput = screen.getByPlaceholderText(/เช่น ทุนเรียนดีเด่น/);
    fireEvent.change(nameInput, { target: { value: 'ทุนผู้นำกิจกรรม' } });

    const newModeRadio = screen.getByDisplayValue('NEW');
    fireEvent.click(newModeRadio);

    const submitBtn = screen.getByRole('button', { name: /สร้างประเภททุนการศึกษา/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ทุนผู้นำกิจกรรม',
          criteria: expect.objectContaining({
            targetScore: 100,
            subCriteria: expect.any(Array),
          }),
        }),
      );
    });
  });

  it('submits successfully with none mode (no criteria)', async () => {
    const createSpy = vi.spyOn(scholarshipTypesService, 'createScholarshipType').mockResolvedValue({
      success: true,
      statusCode: 201,
      data: {
        id: 3,
        name: 'ทุนทั่วไป',
        description: undefined,
        isActive: true,
        roundsCount: 0,
        defaultCriteriaId: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    });

    render(<CreateScholarshipTypePage />);

    const nameInput = screen.getByPlaceholderText(/เช่น ทุนเรียนดีเด่น/);
    fireEvent.change(nameInput, { target: { value: 'ทุนทั่วไป' } });

    const noneModeRadio = screen.getByDisplayValue('NONE');
    fireEvent.click(noneModeRadio);

    const submitBtn = screen.getByRole('button', { name: /สร้างประเภททุนการศึกษา/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        name: 'ทุนทั่วไป',
        description: undefined,
      });
    });
  });
});
