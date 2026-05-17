import { describe, it, expect } from 'vitest';
import { Quest } from './quest.entity';

describe('Quest', () => {
  const base = () => new Quest('q1', 'u1', 'Ship the redesign', 'todo', 'urg', 'work', true, null, new Date());

  it('complete() returns done quest with epic XP', () => {
    const { quest, xpEarned } = base().complete();
    expect(quest.status).toBe('done');
    expect(quest.completedAt).toBeInstanceOf(Date);
    expect(xpEarned).toBe(80);
  });

  it('complete() returns 5 XP for common rarity', () => {
    const q = new Quest('q2', 'u1', 'Quick task', 'todo', 'low', 'home', true, null, new Date());
    const { xpEarned } = q.complete();
    expect(xpEarned).toBe(5);
  });

  it('complete() applies streak bonus', () => {
    const { xpEarned } = base().complete(10); // 10-day streak → +100% cap
    expect(xpEarned).toBe(160); // 80 + 100% = 160
  });

  it('complete() caps streak bonus at 100%', () => {
    const { xpEarned } = base().complete(20); // streak > 10, still capped
    expect(xpEarned).toBe(160);
  });
});
