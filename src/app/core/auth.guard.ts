import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_SESSION } from './di-tokens';

export const authGuard: CanActivateFn = () => {
  const authSession = inject(AUTH_SESSION);
  const router = inject(Router);
  if (authSession.isAuthenticated()) return true;
  return router.createUrlTree(['/auth']);
};
