import { describe, it, expect, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CompleteQuestUseCase } from './complete-quest.use-case';
import { Quest } from '../domain/quest/quest.entity';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { Streak } from '../domain/profile/streak.entity';
import { IQuestRepository } from '../domain/quest/quest.repository';
import { IUserProfileRepository } from '../domain/profile/profile.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';
import { QUEST_REPOSITORY, PROFILE_REPOSITORY, CURRENT_USER } from '../app/core/di-tokens';

const USER_ID = 'u1';
const currentUser: ICurrentUserPort = { getUserId: () => USER_ID };

const makeQuest = () => new Quest('q1', USER_ID, 'Test', 'todo', 'hi', 'work', true, null, new Date());
const makeProfile = () => new UserProfile(USER_ID, 'cat', null, 'orange', 0, 1, 9, new Streak(3, 3, new Date(Date.now() - 86_400_000)), new Date());

const makeRepos = (quest: Quest | null, profile: UserProfile | null) => ({
  questRepo: {
    findByIdForUser: vi.fn().mockResolvedValue(quest),
    save: vi.fn().mockImplementation(async (questArg: Quest) => questArg),
    findByUser: vi.fn(),
    create: vi.fn(),
  } satisfies IQuestRepository,
  profileRepo: {
    findById: vi.fn().mockResolvedValue(profile),
    save: vi.fn().mockImplementation(async (profileArg: UserProfile) => profileArg),
    create: vi.fn(),
    updatePalette: vi.fn(),
    updateOnboardingDone: vi.fn(),
    updateTourDone: vi.fn(),
  } satisfies IUserProfileRepository,
});

const setup = (quest: Quest | null, profile: UserProfile | null) => {
  const { questRepo, profileRepo } = makeRepos(quest, profile);
  TestBed.configureTestingModule({
    providers: [
      { provide: QUEST_REPOSITORY, useValue: questRepo },
      { provide: PROFILE_REPOSITORY, useValue: profileRepo },
      { provide: CURRENT_USER, useValue: currentUser },
    ],
  });
  return TestBed.inject(CompleteQuestUseCase);
};

afterEach(() => TestBed.resetTestingModule());

describe('CompleteQuestUseCase', () => {
  it('returns the completed quest with XP earned and incremented streak', async () => {
    const useCase = setup(makeQuest(), makeProfile());
    const result = await useCase.execute('q1', new Date());

    expect(result.quest.status).toBe('done');
    expect(result.xpEarned).toBeGreaterThan(0);
    expect(result.streak.current).toBe(4);
    expect(result.levelUp).toBe(false);
  });

  it('triggers level up when XP threshold is crossed', async () => {
    const richProfile = new UserProfile(USER_ID, 'cat', null, 'orange', 90, 1, 9, new Streak(0, 0, null), new Date());
    const urgQuest = new Quest('q1', USER_ID, 'Big task', 'todo', 'urg', 'work', true, null, new Date());
    const useCase = setup(urgQuest, richProfile);
    const result = await useCase.execute('q1', new Date());

    expect(result.levelUp).toBe(true);
    expect(result.newLevel).toBe(2);
  });

  it('throws if the quest is already done', async () => {
    const doneQuest = new Quest('q1', USER_ID, 'Test', 'done', 'hi', 'work', true, new Date(), new Date());
    const useCase = setup(doneQuest, makeProfile());

    await expect(useCase.execute('q1', new Date())).rejects.toThrow('already completed');
  });

  it('throws if quest not found', async () => {
    const useCase = setup(null, makeProfile());
    await expect(useCase.execute('q1', new Date())).rejects.toThrow('not found');
  });

  it('throws if profile not found', async () => {
    const useCase = setup(makeQuest(), null);
    await expect(useCase.execute('q1', new Date())).rejects.toThrow('not found');
  });

  it('loses a life when streak is broken', async () => {
    const brokenStreakProfile = new UserProfile(
      USER_ID, 'cat', null, 'orange', 0, 1, 9,
      new Streak(3, 3, new Date(Date.now() - 2 * 86_400_000)),
      new Date(),
    );
    const useCase = setup(makeQuest(), brokenStreakProfile);
    const result = await useCase.execute('q1', new Date());

    expect(result.livesLost).toBe(true);
    expect(result.profile.lives).toBe(8);
  });
});
