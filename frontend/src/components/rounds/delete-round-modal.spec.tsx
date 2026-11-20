import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteRoundModal } from './delete-round-modal';
import * as roundsService from '@/services/rounds.service';

vi.mock('@/services/rounds.service', () => ({
  deleteRound: vi.fn(),
}));

describe('DeleteRoundModal Component', () => {
  it('should render modal with round information', () => {
    render(
      <DeleteRoundModal
        isOpen={true}
        roundId={1}
        roundName="ทุนเรียนดี ประจำปี 2569"
        academicYear={2569}
        semester={1}
        applicantCount={5}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByText('ยืนยันการลบรอบทุนการศึกษา')).toBeInTheDocument();
    expect(screen.getByText('ทุนเรียนดี ประจำปี 2569')).toBeInTheDocument();
    expect(screen.getByText(/5 คน/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ยืนยันลบรอบทุน/ })).toBeDisabled();
  });

  it('should enable delete button only when DELETE is typed', () => {
    render(
      <DeleteRoundModal
        isOpen={true}
        roundId={1}
        roundName="ทุนเรียนดี ประจำปี 2569"
        academicYear={2569}
        semester={1}
        applicantCount={0}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText('พิมพ์ DELETE ที่นี่');
    const deleteBtn = screen.getByRole('button', { name: /ยืนยันลบรอบทุน/ });

    expect(deleteBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: 'wrong' } });
    expect(deleteBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: 'delete' } });
    expect(deleteBtn).toBeEnabled();
  });

  it('should call deleteRound and trigger callbacks on confirm', async () => {
    const mockDelete = vi.spyOn(roundsService, 'deleteRound').mockResolvedValue({
      success: true,
      message: 'ลบสำเร็จ',
    });
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <DeleteRoundModal
        isOpen={true}
        roundId={10}
        roundName="ทุนทดสอบ"
        academicYear={2569}
        semester={1}
        applicantCount={0}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    const input = screen.getByPlaceholderText('พิมพ์ DELETE ที่นี่');
    fireEvent.change(input, { target: { value: 'DELETE' } });

    const deleteBtn = screen.getByRole('button', { name: /ยืนยันลบรอบทุน/ });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(10);
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
