import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { QUEST_REPOSITORY, PROFILE_REPOSITORY } from './core/di-tokens';
import { SupabaseQuestRepository } from '../infrastructure/supabase/supabase-quest.repository';
import { SupabaseProfileRepository } from '../infrastructure/supabase/supabase-profile.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: QUEST_REPOSITORY, useClass: SupabaseQuestRepository },
    { provide: PROFILE_REPOSITORY, useClass: SupabaseProfileRepository },
  ],
};
