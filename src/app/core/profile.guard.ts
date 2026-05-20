import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PROFILE_REPOSITORY, CURRENT_USER } from './di-tokens';

export const profileGuard: CanActivateFn = async () => {
  const profileRepo = inject(PROFILE_REPOSITORY);
  const currentUser = inject(CURRENT_USER);
  const router = inject(Router);

  try {
    const profile = await profileRepo.findById(currentUser.getUserId());
    if (profile === null) return router.createUrlTree(['/onboarding']);
    return true;
  } catch {
    return true;
  }
};
