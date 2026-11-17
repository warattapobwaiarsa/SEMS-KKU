import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoundLifecycleStepper } from './round-lifecycle-stepper';

describe('RoundLifecycleStepper Component', () => {
  it('should render all 4 steps correctly for a DRAFT round', () => {
    render(<RoundLifecycleStepper roundId={1} status="DRAFT" />);

    expect(screen.getByText(/ร่างรอบทุน \(Draft\)/)).toBeInTheDocument();
    expect(screen.getByText(/เปิดประเมิน \(Open\)/)).toBeInTheDocument();
    expect(screen.getByText(/ปิดรอบ\/สรุปผล \(Closed\)/)).toBeInTheDocument();
    expect(screen.getByText(/จัดสรรทุน \(Allocation\)/)).toBeInTheDocument();

    // Contextual link for Draft
    expect(screen.getByText(/ไปหน้าจัดการรอบและผูกเกณฑ์/)).toBeInTheDocument();
  });

  it('should indicate step 3 and contextual link for CLOSED round', () => {
    render(<RoundLifecycleStepper roundId={2} status="CLOSED" isAllocationFinalized={false} />);

    expect(screen.getByText(/ไปหน้าจัดสรรงบประมาณทุน/)).toBeInTheDocument();
  });

  it('should indicate step 4 and contextual link for Finalized round', () => {
    render(<RoundLifecycleStepper roundId={3} status="CLOSED" isAllocationFinalized={true} />);

    expect(screen.getByText(/ไปศูนย์ออกรายงาน \(PDPA\)/)).toBeInTheDocument();
  });
});
