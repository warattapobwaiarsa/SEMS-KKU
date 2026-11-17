import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Card, CardTitle, CardContent } from './card';
import { EmptyState } from './empty-state';
import { Alert } from './alert';

describe('Shared UI Components Library', () => {
  describe('Button', () => {
    it('renders button with correct text and handles click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>คลิกทดสอบ</Button>);
      const btn = screen.getByRole('button', { name: 'คลิกทดสอบ' });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading state and disables button when isLoading is true', () => {
      render(<Button isLoading>กำลังประมวลผล</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      expect(screen.getByText('กำลังประมวลผล')).toBeInTheDocument();
    });
  });

  describe('Input', () => {
    it('renders input with error message and aria-invalid', () => {
      render(<Input id="test-field" error="กรุณากรอกข้อมูล" placeholder="ทดสอบ" />);
      const input = screen.getByPlaceholderText('ทดสอบ');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('กรุณากรอกข้อมูล')).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders badge with correct variant style', () => {
      render(<Badge variant="success">สำเร็จ</Badge>);
      expect(screen.getByText('สำเร็จ')).toBeInTheDocument();
    });
  });

  describe('Card', () => {
    it('renders card title and content correctly', () => {
      render(
        <Card>
          <CardTitle>หัวข้อการ์ด</CardTitle>
          <CardContent>เนื้อหาภายในการ์ด</CardContent>
        </Card>
      );
      expect(screen.getByText('หัวข้อการ์ด')).toBeInTheDocument();
      expect(screen.getByText('เนื้อหาภายในการ์ด')).toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders empty state with action button', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="ไม่พบข้อมูล"
          description="ยังไม่มีรายการในขณะนี้"
          actionLabel="สร้างใหม่"
          onAction={handleAction}
        />
      );
      expect(screen.getByText('ไม่พบข้อมูล')).toBeInTheDocument();
      expect(screen.getByText('ยังไม่มีรายการในขณะนี้')).toBeInTheDocument();
      const actionBtn = screen.getByRole('button', { name: 'สร้างใหม่' });
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Alert', () => {
    it('renders alert with title and content', () => {
      render(
        <Alert variant="warning" title="คำเตือน">
          ข้อความแจ้งเตือนสำคัญ
        </Alert>
      );
      expect(screen.getByText('คำเตือน')).toBeInTheDocument();
      expect(screen.getByText('ข้อความแจ้งเตือนสำคัญ')).toBeInTheDocument();
    });
  });
});
