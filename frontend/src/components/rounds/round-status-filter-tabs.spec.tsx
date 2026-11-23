import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoundStatusFilterTabs } from './round-status-filter-tabs';

describe('RoundStatusFilterTabs Component', () => {
  const counts = {
    total: 10,
    open: 3,
    draft: 4,
    closed: 3,
  };

  it('renders all 4 tabs with correct labels and badges', () => {
    const onSelect = vi.fn();
    render(
      <RoundStatusFilterTabs
        currentStatus=""
        onSelectStatus={onSelect}
        counts={counts}
      />,
    );

    expect(screen.getByText('ทั้งหมด')).toBeInTheDocument();
    expect(screen.getByText('เปิดรับประเมิน')).toBeInTheDocument();
    expect(screen.getByText('แบบร่าง')).toBeInTheDocument();
    expect(screen.getByText('ปิดรอบแล้ว')).toBeInTheDocument();

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('calls onSelectStatus with tab id when clicked', () => {
    const onSelect = vi.fn();
    render(
      <RoundStatusFilterTabs
        currentStatus=""
        onSelectStatus={onSelect}
        counts={counts}
      />,
    );

    const openTab = screen.getByText('เปิดรับประเมิน');
    fireEvent.click(openTab);

    expect(onSelect).toHaveBeenCalledWith('OPEN');
  });
});
