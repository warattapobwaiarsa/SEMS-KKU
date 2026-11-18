import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SequentialNavigationBar } from './sequential-navigation-bar';
import type { EvaluatorApplicant } from '@/types/evaluation';

const mockApplicants: EvaluatorApplicant[] = [
  {
    id: 101,
    roundId: 1,
    legacySeq: 1,
    studentCode: '643040111-1',
    titlePrefix: 'นาย',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    faculty: 'วิศวกรรมศาสตร์',
    major: 'วิศวกรรมคอมพิวเตอร์',
    studyYear: 3,
    gpa: 3.5,
    submittedCount: 2,
    myStatus: 'SUBMITTED',
    canStart: false,
  },
  {
    id: 102,
    roundId: 1,
    legacySeq: 2,
    studentCode: '643040222-2',
    titlePrefix: 'นางสาว',
    firstName: 'สมหญิง',
    lastName: 'รักเรียน',
    faculty: 'วิศวกรรมศาสตร์',
    major: 'วิศวกรรมคอมพิวเตอร์',
    studyYear: 2,
    gpa: 3.8,
    submittedCount: 1,
    myStatus: 'DRAFT',
    canStart: true,
  },
  {
    id: 103,
    roundId: 1,
    legacySeq: 3,
    studentCode: '643040333-3',
    titlePrefix: 'นาย',
    firstName: 'กิตติ',
    lastName: 'มีสุข',
    faculty: 'วิศวกรรมศาสตร์',
    major: 'วิศวกรรมโยธา',
    studyYear: 4,
    gpa: 3.1,
    submittedCount: 0,
    myStatus: 'NOT_STARTED',
    canStart: true,
  },
];

describe('SequentialNavigationBar Component', () => {
  it('should render position and applicant info correctly', () => {
    const onNavigate = vi.fn().mockResolvedValue(true);
    render(
      <SequentialNavigationBar
        roundId={1}
        currentApplicantId={102}
        applicants={mockApplicants}
        onNavigate={onNavigate}
      />,
    );

    // Current is #2 of 3
    expect(screen.getByText(/คนที่/)).toHaveTextContent('คนที่ 2 / 3');

    // Previous is สมชาย
    expect(screen.getByText('สมชาย')).toBeInTheDocument();

    // Next is กิตติ
    expect(screen.getByText('กิตติ')).toBeInTheDocument();
  });

  it('should call onNavigate with target ID when clicking Next', async () => {
    const onNavigate = vi.fn().mockResolvedValue(true);
    render(
      <SequentialNavigationBar
        roundId={1}
        currentApplicantId={102}
        applicants={mockApplicants}
        onNavigate={onNavigate}
      />,
    );

    const nextBtn = screen.getByText('กิตติ').closest('button');
    expect(nextBtn).toBeInTheDocument();
    if (nextBtn) fireEvent.click(nextBtn);

    expect(onNavigate).toHaveBeenCalledWith(103);
  });

  it('should disable Previous button on first applicant', () => {
    const onNavigate = vi.fn().mockResolvedValue(true);
    render(
      <SequentialNavigationBar
        roundId={1}
        currentApplicantId={101}
        applicants={mockApplicants}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText('คนแรกสุด')).toBeInTheDocument();
  });
});
