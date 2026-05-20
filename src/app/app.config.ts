import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';
import { routes } from './app.routes';
import { QUEST_REPOSITORY, PROFILE_REPOSITORY, CURRENT_USER, AUTH_SESSION } from './core/di-tokens';
import { SupabaseQuestRepository } from '../infrastructure/supabase/supabase-quest.repository';
import { SupabaseProfileRepository } from '../infrastructure/supabase/supabase-profile.repository';
import { SupabaseAuthService } from '../infrastructure/auth/supabase-auth.service';
import { TranslocoHttpLoader } from './core/transloco-loader';
import { LANG_STORAGE_KEY } from './core/constants';

const SUPPORTED_LANGS = ['en', 'fr'] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];

function getInitialLang(): SupportedLang {
  try {
    const browserLang = navigator.language?.slice(0, 2).toLowerCase() as SupportedLang;
    if (SUPPORTED_LANGS.includes(browserLang)) return browserLang;
  } catch {
    // navigator indisponible
  }
  return 'en';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'fr'],
        defaultLang: getInitialLang(),
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    { provide: QUEST_REPOSITORY, useClass: SupabaseQuestRepository },
    { provide: PROFILE_REPOSITORY, useClass: SupabaseProfileRepository },
    { provide: CURRENT_USER, useExisting: SupabaseAuthService },
    { provide: AUTH_SESSION, useExisting: SupabaseAuthService },
  ],
};
