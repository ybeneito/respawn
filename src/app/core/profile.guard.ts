import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GetUserProfileUseCase } from '../../application/get-user-profile.use-case';

export const profileGuard: CanActivateFn = async () => {
  const getProfile = inject(GetUserProfileUseCase);
  const router = inject(Router);

  try {
    const profile = await getProfile.execute();
    if (!profile?.onboardingDone) return router.createUrlTree(['/onboarding']);
    return true;
  } catch {
    return true;
  }
};
