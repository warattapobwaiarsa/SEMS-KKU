import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoundHeroHeader } from './round-hero-header';
import { ScholarshipRoundDetail } from '@/types/rounds';

const mockDraftRound: ScholarshipRoundDetail = {
  id: 101,
  name: 'ทุนพัฒนาศักยภาพวิชาการ',
  academicYear: 2569,
  semester: 1,
  status: 'DRAFT',
  applicantCount: 5,
  lastInvalidRowsCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  scholarshipType: {
    id: 1,
    name: 'ทุนให้เปล่า',
  },
};

describe('RoundHeroHeader Component', () => {
  const defaultProps = {
    round: mockDraftRound,
    onOpenCheckClick: vi.fn(),
    onCloseCheckClick: vi.fn(),
    onShowDeleteModal: vi.fn(),
  };

  it('renders back link correctly and does not render h1', () => {
    render(<RoundHeroHeader {...defaultProps} />);

    expect(screen.getByText('กลับสู่หน้ารายการรอบทุนการศึกษา')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('triggers action callbacks in DRAFT status', () => {
    const onShowDeleteModal = vi.fn();
    const onOpenCheckClick = vi.fn();

    render(
      <RoundHeroHeader
        {...defaultProps}
        onShowDeleteModal={onShowDeleteModal}
        onOpenCheckClick={onOpenCheckClick}
      />
    );

    fireEvent.click(screen.getByText('ลบรอบทุน'));
    expect(onShowDeleteModal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('เปิดรอบทุน'));
    expect(onOpenCheckClick).toHaveBeenCalledTimes(1);
  });

  it('renders close round button when status is OPEN', () => {
    const onCloseCheckClick = vi.fn();

    render(
      <RoundHeroHeader
        {...defaultProps}
        round={{ ...mockDraftRound, status: 'OPEN' }}
        onCloseCheckClick={onCloseCheckClick}
      />
    );

    const closeButton = screen.getByText('ปิดรอบการประเมิน');
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);
    expect(onCloseCheckClick).toHaveBeenCalledTimes(1);
  });
});
