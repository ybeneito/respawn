import { describe, it, expect, vi } from 'vitest';
import { GetUserDashboardUseCase } from './get-user-dashboard.use-case';
import { Quest } from '../domain/quest/quest.entity';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { Streak } from '../domain/profile/streak.entity';

const quests = [
  new Quest('q1', 'u1', 'A', 'todo', 'hi', 'work', true, null, new Date()),
  new Quest('q2', 'u1', 'B', 'done', 'low', 'home', true, new Date(), new Date()),
  new Quest('q3', 'u1', 'C', 'todo', 'med', 'learn', false, null, new Date()),
];
const profile = new UserProfile('u1', 'cat', null, 'orange', 120, 2, 9, new Streak(5, 5, new Date()), new Date());

const questRepo = { findByUser: vi.fn().mockResolvedValue(quests), findById: vi.fn(), save: vi.fn(), create: vi.fn() };
const profileRepo = { findById: vi.fn().mockResolvedValue(profile), save: vi.fn(), create: vi.fn() };

describe('GetUserDashboardUseCase', () => {
  it('returns the user profile and today quests split into active and done', async () => {
    const useCase = new GetUserDashboardUseCase(questRepo, profileRepo);
    const { todayActive, todayDone, userProfile } = await useCase.execute('u1');
    expect(todayActive).toHaveLength(1);
    expect(todayDone).toHaveLength(1);
    expect(userProfile.username).toBe('cat');
  });
});
