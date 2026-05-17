import { describe, it, expect, vi } from 'vitest';
import { CompleteQuestUseCase } from './complete-quest.use-case';
import { Quest } from '../domain/quest/quest.entity';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { Streak } from '../domain/profile/streak.entity';
import { IQuestRepository } from '../domain/quest/quest.repository';
import { IUserProfileRepository } from '../domain/profile/profile.repository';

const makeQuest = () => new Quest('q1', 'u1', 'Test', 'todo', 'hi', 'work', true, null, new Date());
const makeProfile = () => new UserProfile('u1', 'cat', null, 'orange', 0, 1, 9, new Streak(3, 3, new Date(Date.now() - 86_400_000)), new Date());

const makeRepos = (quest: Quest, profile: UserProfile) => ({
  questRepo: {
    findById: vi.fn().mockResolvedValue(quest),
    save: vi.fn().mockImplementation(async (q: Quest) => q),
    findByUser: vi.fn(),
    create: vi.fn(),
  } satisfies IQuestRepository,
  profileRepo: {
    findById: vi.fn().mockResolvedValue(profile),
    save: vi.fn().mockImplementation(async (p: UserProfile) => p),
    create: vi.fn(),
  } satisfies IUserProfileRepository,
});

describe('CompleteQuestUseCase', () => {
  it('returns the completed quest with XP earned and incremented streak', async () => {
    const { questRepo, profileRepo } = makeRepos(makeQuest(), makeProfile());
    const useCase = new CompleteQuestUseCase(questRepo, profileRepo);
    const result = await useCase.execute('q1', 'u1', new Date());

    expect(result.quest.status).toBe('done');
    expect(result.xpEarned).toBeGreaterThan(0);
    expect(result.streak.current).toBe(4);
    expect(result.levelUp).toBe(false);
  });

  it('triggers level up when XP threshold is crossed', async () => {
    const richProfile = new UserProfile('u1', 'cat', null, 'orange', 90, 1, 9, new Streak(0, 0, null), new Date());
    const urgQuest = new Quest('q1', 'u1', 'Big task', 'todo', 'urg', 'work', true, null, new Date());
    const { questRepo, profileRepo } = makeRepos(urgQuest, richProfile);
    const useCase = new CompleteQuestUseCase(questRepo, profileRepo);
    const result = await useCase.execute('q1', 'u1', new Date());

    expect(result.levelUp).toBe(true);
    expect(result.newLevel).toBe(2);
  });
});
