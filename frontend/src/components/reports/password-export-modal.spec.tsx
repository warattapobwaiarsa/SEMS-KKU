import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasswordExportModal } from './password-export-modal';

describe('PasswordExportModal Component', () => {
  it('should render modal with title and inputs', () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(
      <PasswordExportModal
        isOpen={true}
        onClose={vi.fn()}
        onExport={onExport}
        reportTitle="รายงานสรุปผลการประเมิน"
        reportCode="REPORT_01"
      />,
    );

    expect(screen.getByText(/ตั้งรหัสผ่านไฟล์ Excel/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/กรอกรหัสผ่านสำหรับเปิดไฟล์/)).toBeInTheDocument();
  });

  it('should show error when passwords do not match', async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(
      <PasswordExportModal
        isOpen={true}
        onClose={vi.fn()}
        onExport={onExport}
        reportTitle="รายงานสรุปผลการประเมิน"
        reportCode="REPORT_01"
      />,
    );

    const pwdInput = screen.getByLabelText(/รหัสผ่านสำหรับเปิดไฟล์/);
    const confirmInput = screen.getByLabelText(/ยืนยันรหัสผ่านอีกครั้ง/);
    const submitBtn = screen.getByRole('button', { name: /ดาวน์โหลดรายงาน/ });

    fireEvent.change(pwdInput, { target: { value: 'Pass123456!' } });
    fireEvent.change(confirmInput, { target: { value: 'Mismatch999!' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน')).toBeInTheDocument();
    expect(onExport).not.toHaveBeenCalled();
  });

  it('should call onExport when valid passwords are provided', async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(
      <PasswordExportModal
        isOpen={true}
        onClose={vi.fn()}
        onExport={onExport}
        reportTitle="รายงานสรุปผลการประเมิน"
        reportCode="REPORT_01"
      />,
    );

    const pwdInput = screen.getByLabelText(/รหัสผ่านสำหรับเปิดไฟล์/);
    const confirmInput = screen.getByLabelText(/ยืนยันรหัสผ่านอีกครั้ง/);
    const submitBtn = screen.getByRole('button', { name: /ดาวน์โหลดรายงาน/ });

    fireEvent.change(pwdInput, { target: { value: 'ValidPass123!' } });
    fireEvent.change(confirmInput, { target: { value: 'ValidPass123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onExport).toHaveBeenCalledWith('ValidPass123!');
    });
  });
});
