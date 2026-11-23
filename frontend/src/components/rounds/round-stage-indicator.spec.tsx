import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RoundStageIndicator } from './round-stage-indicator';

describe('RoundStageIndicator Component', () => {
  it('renders correctly for DRAFT status', () => {
    render(<RoundStageIndicator status="DRAFT" />);
    expect(screen.getByText('แบบร่าง')).toBeInTheDocument();
    expect(screen.getByLabelText('ขั้นตอน: 1/3')).toBeInTheDocument();
  });

  it('renders correctly for OPEN status', () => {
    render(<RoundStageIndicator status="OPEN" />);
    expect(screen.getByText('เปิดรับประเมิน')).toBeInTheDocument();
    expect(screen.getByLabelText('ขั้นตอน: 2/3')).toBeInTheDocument();
  });

  it('renders correctly for CLOSED status', () => {
    render(<RoundStageIndicator status="CLOSED" />);
    expect(screen.getByText('ปิดรอบแล้ว')).toBeInTheDocument();
    expect(screen.getByLabelText('ขั้นตอน: 3/3')).toBeInTheDocument();
  });
});
