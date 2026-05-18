import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseAuthService } from '../../infrastructure/auth/supabase-auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(SupabaseAuthService);
  const router = inject(Router);
  if (auth.session()) return true;
  return router.createUrlTree(['/auth']);
};
