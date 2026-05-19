import { describe, it, expect, vi } from 'vitest';
import { CompleteQuestUseCase } from './complete-quest.use-case';
import { Quest } from '../domain/quest/quest.entity';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { Streak } from '../domain/profile/streak.entity';
import { IQuestRepository } from '../domain/quest/quest.repository';
import { IUserProfileRepository } from '../domain/profile/profile.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';

const USER_ID = 'u1';
const currentUser: ICurrentUserPort = { getUserId: () => USER_ID };

const makeQuest = () => new Quest('q1', USER_ID, 'Test', 'todo', 'hi', 'work', true, null, new Date());
const makeProfile = () => new UserProfile(USER_ID, 'cat', null, 'orange', 0, 1, 9, new Streak(3, 3, new Date(Date.now() - 86_400_000)), new Date());

const makeRepos = (quest: Quest | null, profile: UserProfile | null) => ({
  questRepo: {
    findByIdForUser: vi.fn().mockResolvedValue(quest),
    save: vi.fn().mockImplementation(async (q: Quest) => q),
    findByUser: vi.fn(),
    create: vi.fn(),
  } satisfies IQuestRepository,
  profileRepo: {
    findById: vi.fn().mockResolvedValue(profile),
    save: vi.fn().mockImplementation(async (p: UserProfile) => p),
    create: vi.fn(),
    updatePalette: vi.fn(),
    updateOnboardingDone: vi.fn(),
  } satisfies IUserProfileRepository,
});

describe('CompleteQuestUseCase', () => {
  it('returns the completed quest with XP earned and incremented streak', async () => {
    const { questRepo, profileRepo } = makeRepos(makeQuest(), makeProfile());
    const useCase = new CompleteQuestUseCase(questRepo, profileRepo, currentUser);
    const result = await useCase.execute('q1', new Date());

    expect(result.quest.status).toBe('done');
    expect(result.xpEarned).toBeGreaterThan(0);
    expect(result.streak.current).toBe(4);
    expect(result.levelUp).toBe(false);
  });

  it('triggers level up when XP threshold is crossed', async () => {
    const richProfile = new UserProfile(USER_ID, 'cat', null, 'orange', 90, 1, 9, new Streak(0, 0, null), new Date());
    const urgQuest = new Quest('q1', USER_ID, 'Big task', 'todo', 'urg', 'work', true, null, new Date());
    const { questRepo, profileRepo } = makeRepos(urgQuest, richProfile);
    const useCase = new CompleteQuestUseCase(questRepo, profileRepo, currentUser);
    const result = await useCase.execute('q1', new Date());

    expect(result.levelUp).toBe(true);
    expect(result.newLevel).toBe(2);
  });

  it('throws if the quest is already done', async () => {
    const doneQuest = new Quest('q1', USER_ID, 'Test', 'done', 'hi', 'work', true, new Date(), new Date());
    const { questRepo, profileRepo } = makeRepos(doneQuest, makeProfile());
    const useCase = new CompleteQuestUseCase(questRepo, profileRepo, currentUser);

    await expect(useCase.execute('q1', new Date())).rejects.toThrow('already completed');
  });

  it('throws if quest not found', async () => {
    const { questRepo, profileRepo } = makeRepos(null, makeProfile());
    const useCase = new CompleteQuestUseCase(questRepo, profileRepo, currentUser);

    await expect(useCase.execute('q1', new Date())).rejects.toThrow('not found');
  });

  it('throws if profile not found', async () => {
    const { questRepo, profileRepo } = makeRepos(makeQuest(), null);
    const useCase = new CompleteQuestUseCase(questRepo, profileRepo, currentUser);

    await expect(useCase.execute('q1', new Date())).rejects.toThrow('not found');
  });

  it('loses a life when streak is broken', async () => {
    const brokenStreakProfile = new UserProfile(
      USER_ID, 'cat', null, 'orange', 0, 1, 9,
      new Streak(3, 3, new Date(Date.now() - 2 * 86_400_000)),
      new Date(),
    );
    const { questRepo, profileRepo } = makeRepos(makeQuest(), brokenStreakProfile);
    const useCase = new CompleteQuestUseCase(questRepo, profileRepo, currentUser);
    const result = await useCase.execute('q1', new Date());

    expect(result.livesLost).toBe(true);
    expect(result.profile.lives).toBe(8);
  });
});
