import { InjectionToken } from '@angular/core';
import { IQuestRepository } from '../../domain/quest/quest.repository';
import { IUserProfileRepository } from '../../domain/profile/profile.repository';
import { ICurrentUserPort } from '../../domain/auth/current-user.port';
import { IAuthSessionPort } from '../../domain/auth/auth-session.port';

export const QUEST_REPOSITORY = new InjectionToken<IQuestRepository>('QuestRepository');
export const PROFILE_REPOSITORY = new InjectionToken<IUserProfileRepository>('ProfileRepository');
export const CURRENT_USER = new InjectionToken<ICurrentUserPort>('CurrentUser');
export const AUTH_SESSION = new InjectionToken<IAuthSessionPort>('AuthSession');
