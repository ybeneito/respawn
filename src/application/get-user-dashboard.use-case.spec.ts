import { describe, it, expect, vi } from 'vitest';
import { GetUserDashboardUseCase } from './get-user-dashboard.use-case';
import { Quest } from '../domain/quest/quest.entity';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { Streak } from '../domain/profile/streak.entity';
import { ICurrentUserPort } from '../domain/auth/current-user.port';

const USER_ID = 'u1';
const currentUser: ICurrentUserPort = { getUserId: () => USER_ID };

const quests = [
  new Quest('q1', USER_ID, 'A', 'todo', 'hi', 'work', true, null, new Date()),
  new Quest('q2', USER_ID, 'B', 'done', 'low', 'home', true, new Date(), new Date()),
  new Quest('q3', USER_ID, 'C', 'todo', 'med', 'learn', false, null, new Date()),
];
const profile = new UserProfile(USER_ID, 'cat', null, 'orange', 120, 2, 9, new Streak(5, 5, new Date()), new Date());

const questRepo = { findByUser: vi.fn().mockResolvedValue(quests), findByIdForUser: vi.fn(), save: vi.fn(), create: vi.fn() };

describe('GetUserDashboardUseCase', () => {
  it('returns the user profile and today quests split into active and done', async () => {
    const profileRepo = { findById: vi.fn().mockResolvedValue(profile), save: vi.fn(), create: vi.fn(), updatePalette: vi.fn() };
    const useCase = new GetUserDashboardUseCase(questRepo, profileRepo, currentUser);
    const { todayActive, todayDone, userProfile } = await useCase.execute();
    expect(todayActive).toHaveLength(1);
    expect(todayDone).toHaveLength(1);
    expect(userProfile.username).toBe('cat');
  });

  it('throws if profile not found', async () => {
    const profileRepo = { findById: vi.fn().mockResolvedValue(null), save: vi.fn(), create: vi.fn(), updatePalette: vi.fn() };
    const useCase = new GetUserDashboardUseCase(questRepo, profileRepo, currentUser);

    await expect(useCase.execute()).rejects.toThrow();
  });

  it('excludes non-today quests from active and done lists', async () => {
    const profileRepo = { findById: vi.fn().mockResolvedValue(profile), save: vi.fn(), create: vi.fn(), updatePalette: vi.fn() };
    const useCase = new GetUserDashboardUseCase(questRepo, profileRepo, currentUser);
    const { todayActive, todayDone } = await useCase.execute();

    expect([...todayActive, ...todayDone].every(quest => quest.today)).toBe(true);
  });
});
