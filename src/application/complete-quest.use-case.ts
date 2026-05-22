import { Injectable, inject } from '@angular/core';
import { Quest } from '../domain/quest/quest.entity';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { Streak } from '../domain/profile/streak.entity';
import { IQuestRepository } from '../domain/quest/quest.repository';
import { IUserProfileRepository } from '../domain/profile/profile.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';
import { QUEST_REPOSITORY, PROFILE_REPOSITORY, CURRENT_USER } from '../app/core/di-tokens';

export interface CompleteQuestResult {
  quest: Quest;
  xpEarned: number;
  levelUp: boolean;
  newLevel: number;
  streak: Streak;
  livesLost: boolean;
  profile: UserProfile;
}

@Injectable({ providedIn: 'root' })
export class CompleteQuestUseCase {
  private readonly questRepo = inject<IQuestRepository>(QUEST_REPOSITORY);
  private readonly profileRepo = inject<IUserProfileRepository>(PROFILE_REPOSITORY);
  private readonly currentUser = inject<ICurrentUserPort>(CURRENT_USER);

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
