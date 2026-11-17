import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetBarometer } from './budget-barometer';

describe('BudgetBarometer Component', () => {
  it('should render 4 summary metrics accurately', () => {
    render(
      <BudgetBarometer
        totalBudget={500000}
        allocatedAmount={300000}
        remainingBudget={200000}
        recipientsCount={6}
      />,
    );

    expect(screen.getByText('500,000')).toBeInTheDocument();
    expect(screen.getByText('300,000')).toBeInTheDocument();
    expect(screen.getByText('200,000')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('should show over-budget warning when remaining budget is negative', () => {
    render(
      <BudgetBarometer
        totalBudget={500000}
        allocatedAmount={550000}
        remainingBudget={-50000}
        recipientsCount={11}
      />,
    );

    expect(screen.getByText(/-50,000/)).toBeInTheDocument();
    expect(screen.getByText(/เกินเพดานงบประมาณ/)).toBeInTheDocument();
  });
});
