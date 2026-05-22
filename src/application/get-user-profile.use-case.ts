import { Injectable, inject } from '@angular/core';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { IUserProfileRepository } from '../domain/profile/profile.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';
import { PROFILE_REPOSITORY, CURRENT_USER } from '../app/core/di-tokens';

@Injectable({ providedIn: 'root' })
export class GetUserProfileUseCase {
  private readonly profileRepo = inject<IUserProfileRepository>(PROFILE_REPOSITORY);
  private readonly currentUser = inject<ICurrentUserPort>(CURRENT_USER);

  execute(): Promise<UserProfile | null> {
    return this.profileRepo.findById(this.currentUser.getUserId());
  }
}
