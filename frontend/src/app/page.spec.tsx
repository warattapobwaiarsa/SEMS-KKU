import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HomePage from './page';
import * as mockEvaluatorModule from '@/lib/mock-evaluator';

// Mock next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('HomePage Component (Option 1: Dual-Card Embedded Dropdowns)', () => {
  beforeEach(() => {
    localStorage.clear();
    pushMock.mockClear();
    vi.restoreAllMocks();
  });

  it('renders system title, KKU EN badge, and main heading', () => {
    render(<HomePage />);

    expect(screen.getByText('SEMS')).toBeInTheDocument();
    expect(screen.getByText('KKU EN')).toBeInTheDocument();
    expect(screen.getByText('เข้าสู่ระบบตามบทบาทการทำงาน')).toBeInTheDocument();
    expect(screen.getByText('ผู้ดูแลระบบ (Admin)')).toBeInTheDocument();
    expect(screen.getByText('ผู้ประเมิน (Evaluator)')).toBeInTheDocument();
  });

  it('renders dropdowns with account choices for Admin and Evaluator', () => {
    render(<HomePage />);

    const adminSelect = screen.getByLabelText('เลือกบัญชีผู้ดูแลระบบ:');
    const evaluatorSelect = screen.getByLabelText('เลือกบัญชีกรรมการผู้ประเมิน:');

    expect(adminSelect).toBeInTheDocument();
    expect(evaluatorSelect).toBeInTheDocument();

    // Check options present
    expect(screen.getAllByText(/นายอนุชา ผู้ดูแล/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/ศ.ดร. กรรมการ ประเมินทุน 1/).length).toBeGreaterThanOrEqual(1);
  });

  it('handles selecting different evaluator and logs in to /evaluator/rounds', () => {
    const setEvaluatorSpy = vi.spyOn(mockEvaluatorModule, 'setEvaluatorId');

    render(<HomePage />);

    const evaluatorSelect = screen.getByLabelText('เลือกบัญชีกรรมการผู้ประเมิน:');
    fireEvent.change(evaluatorSelect, { target: { value: '3' } });

    // Preview should update with evaluator 2
    expect(screen.getAllByText(/ผศ.ดร. กรรมการ ประเมินทุน 2/).length).toBeGreaterThanOrEqual(1);

    // Click Evaluator login button
    const evaluatorLoginBtn = screen.getByRole('button', { name: /เข้าสู่ระบบผู้ประเมิน/ });
    fireEvent.click(evaluatorLoginBtn);

    expect(setEvaluatorSpy).toHaveBeenCalledWith('3');
    expect(pushMock).toHaveBeenCalledWith('/evaluator/rounds');
  });

  it('handles Admin login and navigates to /admin/scholarship-rounds', () => {
    const setAdminSpy = vi.spyOn(mockEvaluatorModule, 'setAdminId');

    render(<HomePage />);

    const adminLoginBtn = screen.getByRole('button', { name: /เข้าสู่ระบบผู้ดูแล/ });
    fireEvent.click(adminLoginBtn);

    expect(setAdminSpy).toHaveBeenCalledWith('1');
    expect(pushMock).toHaveBeenCalledWith('/admin/scholarship-rounds');
  });
});
