import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getEvaluatorId,
  setEvaluatorId,
  getCurrentEvaluatorProfile,
  EVALUATOR_STORAGE_KEY,
  MOCK_EVALUATORS,
} from './mock-evaluator';

describe('mock-evaluator utility', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should return fallback ID "2" when localStorage is empty and env is unset', () => {
    const id = getEvaluatorId();
    expect(id).toBe('2');
  });

  it('should retrieve evaluator ID from localStorage when set', () => {
    localStorage.setItem(EVALUATOR_STORAGE_KEY, '3');
    expect(getEvaluatorId()).toBe('3');
  });

  it('setEvaluatorId should update localStorage and dispatch custom event', () => {
    const eventSpy = vi.fn();
    window.addEventListener('sems_evaluator_changed', eventSpy);

    setEvaluatorId('4');

    expect(localStorage.getItem(EVALUATOR_STORAGE_KEY)).toBe('4');
    expect(eventSpy).toHaveBeenCalledTimes(1);
  });

  it('getCurrentEvaluatorProfile should return correct profile for known evaluator', () => {
    setEvaluatorId('3');
    const profile = getCurrentEvaluatorProfile();

    expect(profile.id).toBe('3');
    expect(profile.name).toBe(MOCK_EVALUATORS[1].name);
    expect(profile.email).toBe('evaluator2@kku.ac.th');
  });

  it('getCurrentEvaluatorProfile should generate fallback profile for unknown ID', () => {
    setEvaluatorId('99');
    const profile = getCurrentEvaluatorProfile();

    expect(profile.id).toBe('99');
    expect(profile.name).toContain('ID: 99');
    expect(profile.email).toBe('evaluator99@kku.ac.th');
  });
});
