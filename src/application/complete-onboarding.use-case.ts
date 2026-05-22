import { Injectable, inject } from '@angular/core';
import { UserProfile, CatPalette } from '../domain/profile/user-profile.entity';
import { IUserProfileRepository } from '../domain/profile/profile.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';
import { PROFILE_REPOSITORY, CURRENT_USER } from '../app/core/di-tokens';

const MAX_PROFILE_RETRIES = 5;
const RETRY_DELAY_MS = 800;

@Injectable({ providedIn: 'root' })
export class CompleteOnboardingUseCase {
  private readonly profileRepo = inject<IUserProfileRepository>(PROFILE_REPOSITORY);
  private readonly currentUser = inject<ICurrentUserPort>(CURRENT_USER);

  async execute(palette: CatPalette): Promise<UserProfile> {
    const userId = this.currentUser.getUserId();
    const profile = await this.waitForProfile(userId);
    await this.profileRepo.updatePalette(userId, palette);
    await this.profileRepo.updateOnboardingDone(userId);
    return profile.withOnboardingDone();
  }

  private async waitForProfile(userId: string): Promise<UserProfile> {
    for (let attempt = 0; attempt < MAX_PROFILE_RETRIES; attempt++) {
      const profile = await this.profileRepo.findById(userId);
      if (profile) return profile;
      if (attempt < MAX_PROFILE_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
    throw new Error('Profile not ready after signup');
  }
}
