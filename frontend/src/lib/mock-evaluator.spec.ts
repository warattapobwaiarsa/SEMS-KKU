import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getEvaluatorId,
  setEvaluatorId,
  getCurrentEvaluatorProfile,
  EVALUATOR_STORAGE_KEY,
  MOCK_EVALUATORS,
  getAdminId,
  setAdminId,
  getCurrentAdminProfile,
  ADMIN_STORAGE_KEY,
  MOCK_ADMINS,
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

  it('should return fallback Admin ID "1" when localStorage is empty and env is unset', () => {
    const id = getAdminId();
    expect(id).toBe('1');
  });

  it('setAdminId should update localStorage and dispatch custom event', () => {
    const eventSpy = vi.fn();
    window.addEventListener('sems_admin_changed', eventSpy);

    setAdminId('1');

    expect(localStorage.getItem(ADMIN_STORAGE_KEY)).toBe('1');
    expect(eventSpy).toHaveBeenCalledTimes(1);
  });

  it('getCurrentAdminProfile should return correct profile for known admin', () => {
    setAdminId('1');
    const profile = getCurrentAdminProfile();

    expect(profile.id).toBe('1');
    expect(profile.name).toBe(MOCK_ADMINS[0].name);
    expect(profile.email).toBe('admin@kku.ac.th');
  });
});

