import { describe, it, expect } from 'vitest';
import { Streak } from './streak.entity';

const day = (offset: number) => {
  const d = new Date('2026-05-17');
  d.setDate(d.getDate() + offset);
  return d;
};

describe('Streak', () => {
  it('initialise le streak à 1 si aucune activité précédente', () => {
    const streak = new Streak(0, 0, null);
    const { streak: next, broken } = streak.evaluate(day(0));
    expect(next.current).toBe(1);
    expect(broken).toBe(false);
  });

  it('incrémente si activité hier', () => {
    const streak = new Streak(5, 5, day(-1));
    const { streak: next, broken } = streak.evaluate(day(0));
    expect(next.current).toBe(6);
    expect(next.longest).toBe(6);
    expect(broken).toBe(false);
  });

  it('ne change pas si déjà évalué aujourd\'hui', () => {
    const streak = new Streak(5, 5, day(0));
    const { streak: next, broken } = streak.evaluate(day(0));
    expect(next.current).toBe(5);
    expect(broken).toBe(false);
  });

  it('remet à 1 si gap > 1 jour et signale broken', () => {
    const streak = new Streak(5, 5, day(-3));
    const { streak: next, broken } = streak.evaluate(day(0));
    expect(next.current).toBe(1);
    expect(next.longest).toBe(5);
    expect(broken).toBe(true);
  });
});
