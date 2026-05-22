import { Injectable, inject } from '@angular/core';
import { Quest } from '../domain/quest/quest.entity';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { IQuestRepository } from '../domain/quest/quest.repository';
import { IUserProfileRepository } from '../domain/profile/profile.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';
import { QUEST_REPOSITORY, PROFILE_REPOSITORY, CURRENT_USER } from '../app/core/di-tokens';

export interface DashboardData {
  userProfile: UserProfile;
  todayActive: Quest[];
  todayDone: Quest[];
  allQuests: Quest[];
}

@Injectable({ providedIn: 'root' })
export class GetUserDashboardUseCase {
  private readonly questRepo = inject<IQuestRepository>(QUEST_REPOSITORY);
  private readonly profileRepo = inject<IUserProfileRepository>(PROFILE_REPOSITORY);
  private readonly currentUser = inject<ICurrentUserPort>(CURRENT_USER);

  async execute(): Promise<DashboardData> {
    const userId = this.currentUser.getUserId();

    const [allQuests, userProfile] = await Promise.all([
      this.questRepo.findByUser(userId),
      this.profileRepo.findById(userId),
    ]);
    if (!userProfile) throw new Error(`Profile ${userId} not found.`);

    const todayQuests = allQuests.filter(quest => quest.today);
    return {
      userProfile,
      todayActive: todayQuests.filter(quest => quest.status !== 'done'),
      todayDone: todayQuests.filter(quest => quest.status === 'done'),
      allQuests,
    };
  }
}
