import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RoundsMetricsBar } from './rounds-metrics-bar';
import { ScholarshipRoundListItem } from '@/types/rounds';

const mockRounds: ScholarshipRoundListItem[] = [
  {
    id: 1,
    name: 'ทุนเรียนดี',
    academicYear: 2569,
    semester: 1,
    status: 'OPEN',
    applicantCount: 25,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'ทุนช่วยเหลือนักศึกษา',
    academicYear: 2569,
    semester: 1,
    status: 'DRAFT',
    applicantCount: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'ทุนวิจัย',
    academicYear: 2568,
    semester: 2,
    status: 'CLOSED',
    applicantCount: 15,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('RoundsMetricsBar Component', () => {
  it('renders 3 status metric cards correctly with accurate counts', () => {
    render(<RoundsMetricsBar rounds={mockRounds} totalRoundsCount={3} />);

    // Check titles
    expect(screen.getByText('กำลังเปิดประเมิน')).toBeInTheDocument();
    expect(screen.getByText('รอบแบบร่าง')).toBeInTheDocument();
    expect(screen.getByText('ปิดรอบการประเมิน')).toBeInTheDocument();
    expect(screen.queryByText('ผู้สมัครในระบบ')).not.toBeInTheDocument();

    // Check counts: 1 OPEN, 1 DRAFT, 1 CLOSED
    expect(screen.getAllByText('1')).toHaveLength(3);
  });
});
