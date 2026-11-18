import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubmitConfirmModal } from './submit-confirm-modal';
import type { MyEvaluationItem } from '@/types/evaluation';
import type { ScoreFormValues } from './score-input-row';

const mockItems: MyEvaluationItem[] = [
  {
    subCriteriaId: 1,
    subCriteria: {
      id: 1,
      title: 'ความขาดแคลนทุนทรัพย์',
      type: 'SCORED',
      maxScore: 50,
      sortOrder: 1,
      allowComment: true,
    },
    score: 40,
    comment: 'ครอบครัวรายได้น้อย',
    textValue: null,
  },
  {
    subCriteriaId: 2,
    subCriteria: {
      id: 2,
      title: 'ผลการเรียนและความประพฤติ',
      type: 'SCORED',
      maxScore: 50,
      sortOrder: 2,
      allowComment: true,
    },
    score: 45,
    comment: '',
    textValue: null,
  },
];

describe('SubmitConfirmModal Component', () => {
  it('renders applicant information and score correctly when fully filled', () => {
    const values: ScoreFormValues = {
      1: { score: '40', comment: 'ครอบครัวรายได้น้อย', textValue: '' },
      2: { score: '45', comment: '', textValue: '' },
    };

    render(
      <SubmitConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        applicantName="นายสมชาย ใจดี"
        studentCode="643020001-1"
        faculty="วิทยาศาสตร์"
        totalScore={85}
        maxTotal={100}
        submitting={false}
        items={mockItems}
        values={values}
      />,
    );

    expect(screen.getByText('นายสมชาย ใจดี')).toBeInTheDocument();
    expect(screen.getByText('643020001-1')).toBeInTheDocument();
    expect(screen.getByText('คณะวิทยาศาสตร์')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText(/กรอกคะแนนครบถ้วนทุกข้อแล้ว/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /ยืนยันส่งผลการประเมิน/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('warns only about unfilled items and disables submit button', () => {
    // ข้อ 2 ยังไม่ได้กรอก (score เป็นค่าว่าง '')
    const valuesWithUnfilled: ScoreFormValues = {
      1: { score: '40', comment: '', textValue: '' },
      2: { score: '', comment: '', textValue: '' },
    };

    render(
      <SubmitConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        applicantName="นายสมชาย ใจดี"
        studentCode="643020001-1"
        totalScore={40}
        maxTotal={100}
        submitting={false}
        items={mockItems}
        values={valuesWithUnfilled}
      />,
    );

    // ต้องพบคำเตือนเฉพาะเกณฑ์ที่ยังไม่ได้กรอก
    expect(screen.getByText(/พบเกณฑ์ที่ยังไม่ได้กรอกคะแนน 1 ข้อ/i)).toBeInTheDocument();
    expect(screen.getByText('ยังไม่ได้กรอก')).toBeInTheDocument();

    // ปุ่มกดยืนยันต้องถูก disabled
    const submitBtn = screen.getByRole('button', { name: /ยืนยันส่งผลการประเมิน/i });
    expect(submitBtn).toBeDisabled();
  });

  it('triggers onConfirm when submit button is clicked', () => {
    const onConfirmMock = vi.fn();
    const values: ScoreFormValues = {
      1: { score: '40', comment: '', textValue: '' },
      2: { score: '45', comment: '', textValue: '' },
    };

    render(
      <SubmitConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirmMock}
        applicantName="นายสมชาย ใจดี"
        studentCode="643020001-1"
        totalScore={85}
        maxTotal={100}
        submitting={false}
        items={mockItems}
        values={values}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /ยืนยันส่งผลการประเมิน/i });
    fireEvent.click(submitBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });
});
