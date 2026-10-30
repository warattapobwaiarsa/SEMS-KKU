import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './status-badge';

describe('StatusBadge Component', () => {
  it('should render label text properly', () => {
    render(<StatusBadge label="เปิดรับประเมิน" variant="open" />);
    expect(screen.getByText('เปิดรับประเมิน')).toBeInTheDocument();
  });

  it('should apply styles matching variant', () => {
    const { container } = render(<StatusBadge label="ฉบับร่าง" variant="draft" />);
    const span = container.querySelector('span');
    expect(span).toHaveClass('bg-amber-50');
    expect(span).toHaveClass('text-amber-800');
  });

  it('should fallback to neutral variant when unknown variant is supplied', () => {
    // @ts-expect-error testing invalid variant fallback
    const { container } = render(<StatusBadge label="ไม่ระบุ" variant="unknown_variant" />);
    const span = container.querySelector('span');
    expect(span).toHaveClass('bg-muted');
  });
});
