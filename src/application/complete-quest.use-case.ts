import { Quest } from '../domain/quest/quest.entity';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { Streak } from '../domain/profile/streak.entity';
import { IQuestRepository } from '../domain/quest/quest.repository';
import { IUserProfileRepository } from '../domain/profile/profile.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';

export interface CompleteQuestResult {
  quest: Quest;
  xpEarned: number;
  levelUp: boolean;
  newLevel: number;
  streak: Streak;
  livesLost: boolean;
  profile: UserProfile;
}

export class CompleteQuestUseCase {
  constructor(
    private readonly questRepo: IQuestRepository,
    private readonly profileRepo: IUserProfileRepository,
    private readonly currentUser: ICurrentUserPort,
  ) {}

  async execute(questId: string, today: Date): Promise<CompleteQuestResult> {
    const userId = this.currentUser.getUserId();

    const quest = await this.questRepo.findByIdForUser(questId, userId);
    if (!quest) throw new Error(`Quest ${questId} not found.`);
    if (quest.status === 'done') throw new Error(`Quest ${questId} is already completed.`);

    const profile = await this.profileRepo.findById(userId);
    if (!profile) throw new Error(`Profile ${userId} not found.`);

    const { streak: newStreak, broken } = profile.streak.evaluate(today);
    const { quest: completedQuest, xpEarned } = quest.complete(newStreak.current);

    const { profile: finalProfile, levelUp } = profile.withStreak(newStreak).applyXP(xpEarned, broken);

    await this.questRepo.save(completedQuest);
    await this.profileRepo.save(finalProfile);

    return {
      quest: completedQuest,
      xpEarned,
      levelUp,
      newLevel: finalProfile.level,
      streak: newStreak,
      livesLost: broken,
      profile: finalProfile,
    };
  }
}
