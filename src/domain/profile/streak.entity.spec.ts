import { describe, it, expect } from 'vitest';
import { Streak } from './streak.entity';

const day = (offset: number) => {
  const d = new Date('2026-05-17');
  d.setDate(d.getDate() + offset);
  return d;
};

describe('Streak', () => {
  it('initializes streak to 1 with no prior activity', () => {
    const streak = new Streak(0, 0, null);
    const { streak: next, broken } = streak.evaluate(day(0));
    expect(next.current).toBe(1);
    expect(broken).toBe(false);
  });

  it('increments when last activity was yesterday', () => {
    const streak = new Streak(5, 5, day(-1));
    const { streak: next, broken } = streak.evaluate(day(0));
    expect(next.current).toBe(6);
    expect(next.longest).toBe(6);
    expect(broken).toBe(false);
  });

  it('does not change if already evaluated today', () => {
    const streak = new Streak(5, 5, day(0));
    const { streak: next, broken } = streak.evaluate(day(0));
    expect(next.current).toBe(5);
    expect(broken).toBe(false);
  });

  it('resets to 1 and signals broken when gap is more than 1 day', () => {
    const streak = new Streak(5, 5, day(-3));
    const { streak: next, broken } = streak.evaluate(day(0));
    expect(next.current).toBe(1);
    expect(next.longest).toBe(5);
    expect(broken).toBe(true);
  });
});
