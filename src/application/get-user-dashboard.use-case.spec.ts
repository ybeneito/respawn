import { describe, it, expect, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { GetUserDashboardUseCase } from './get-user-dashboard.use-case';
import { Quest } from '../domain/quest/quest.entity';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { Streak } from '../domain/profile/streak.entity';
import { IQuestRepository } from '../domain/quest/quest.repository';
import { IUserProfileRepository } from '../domain/profile/profile.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';
import { QUEST_REPOSITORY, PROFILE_REPOSITORY, CURRENT_USER } from '../app/core/di-tokens';

const USER_ID = 'u1';
const currentUser: ICurrentUserPort = { getUserId: () => USER_ID };

const quests = [
  new Quest('q1', USER_ID, 'A', 'todo', 'hi', 'work', true, null, new Date()),
  new Quest('q2', USER_ID, 'B', 'done', 'low', 'home', true, new Date(), new Date()),
  new Quest('q3', USER_ID, 'C', 'todo', 'med', 'learn', false, null, new Date()),
];
const profile = new UserProfile(USER_ID, 'cat', null, 'orange', 120, 2, 9, new Streak(5, 5, new Date()), new Date());

const makeQuestRepo = (): IQuestRepository => ({
  findByUser: vi.fn().mockResolvedValue(quests),
  findByIdForUser: vi.fn(),
  save: vi.fn(),
  create: vi.fn(),
});

const makeProfileRepo = (returnedProfile: UserProfile | null): IUserProfileRepository => ({
  findById: vi.fn().mockResolvedValue(returnedProfile),
  save: vi.fn(),
  create: vi.fn(),
  updatePalette: vi.fn(),
  updateOnboardingDone: vi.fn(),
  updateTourDone: vi.fn(),
});

const setup = (returnedProfile: UserProfile | null) => {
  TestBed.configureTestingModule({
    providers: [
      { provide: QUEST_REPOSITORY, useValue: makeQuestRepo() },
      { provide: PROFILE_REPOSITORY, useValue: makeProfileRepo(returnedProfile) },
      { provide: CURRENT_USER, useValue: currentUser },
    ],
  });
  return TestBed.inject(GetUserDashboardUseCase);
};

afterEach(() => TestBed.resetTestingModule());

describe('GetUserDashboardUseCase', () => {
  it('returns the user profile and today quests split into active and done', async () => {
    const useCase = setup(profile);
    const { todayActive, todayDone, userProfile } = await useCase.execute();
    expect(todayActive).toHaveLength(1);
    expect(todayDone).toHaveLength(1);
    expect(userProfile.username).toBe('cat');
  });

  it('throws if profile not found', async () => {
    const useCase = setup(null);
    await expect(useCase.execute()).rejects.toThrow();
  });

  it('excludes non-today quests from active and done lists', async () => {
    const useCase = setup(profile);
    const { todayActive, todayDone } = await useCase.execute();
    expect([...todayActive, ...todayDone].every(quest => quest.today)).toBe(true);
  });
});
