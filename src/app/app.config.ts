import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { QUEST_REPOSITORY, PROFILE_REPOSITORY, CURRENT_USER } from './core/di-tokens';
import { SupabaseQuestRepository } from '../infrastructure/supabase/supabase-quest.repository';
import { SupabaseProfileRepository } from '../infrastructure/supabase/supabase-profile.repository';
import { SupabaseAuthService } from '../infrastructure/auth/supabase-auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: QUEST_REPOSITORY, useClass: SupabaseQuestRepository },
    { provide: PROFILE_REPOSITORY, useClass: SupabaseProfileRepository },
    { provide: CURRENT_USER, useExisting: SupabaseAuthService },
  ],
};
