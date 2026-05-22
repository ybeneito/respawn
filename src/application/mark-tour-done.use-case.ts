import { UserProfile } from '../domain/profile/user-profile.entity';
import { IUserProfileRepository } from '../domain/profile/profile.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';

export class MarkTourDoneUseCase {
  constructor(
    private readonly profileRepo: IUserProfileRepository,
    private readonly currentUser: ICurrentUserPort,
  ) {}

  async execute(): Promise<UserProfile> {
    const userId = this.currentUser.getUserId();
    const profile = await this.profileRepo.findById(userId);
    if (!profile) throw new Error(`Profile ${userId} not found.`);
    await this.profileRepo.updateTourDone(userId);
    return profile.withTourDone();
  }
}
