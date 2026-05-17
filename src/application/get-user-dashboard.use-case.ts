import { Quest } from '../domain/quest/quest.entity';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { IQuestRepository } from '../domain/quest/quest.repository';
import { IUserProfileRepository } from '../domain/profile/profile.repository';

export interface DashboardData {
  userProfile: UserProfile;
  todayActive: Quest[];
  todayDone: Quest[];
  allQuests: Quest[];
}

export class GetUserDashboardUseCase {
  constructor(
    private readonly questRepo: IQuestRepository,
    private readonly profileRepo: IUserProfileRepository,
  ) {}

  async execute(userId: string): Promise<DashboardData> {
    const [allQuests, userProfile] = await Promise.all([
      this.questRepo.findByUser(userId),
      this.profileRepo.findById(userId),
    ]);
    if (!userProfile) throw new Error(`Profile ${userId} not found`);
    const todayQuests = allQuests.filter(quest => quest.today);
    return {
      userProfile,
      todayActive: todayQuests.filter(quest => quest.status !== 'done'),
      todayDone: todayQuests.filter(quest => quest.status === 'done'),
      allQuests,
    };
  }
}
