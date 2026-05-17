import { InjectionToken } from '@angular/core';
import { IQuestRepository } from '../../domain/quest/quest.repository';
import { IUserProfileRepository } from '../../domain/profile/profile.repository';

export const QUEST_REPOSITORY = new InjectionToken<IQuestRepository>('QuestRepository');
export const PROFILE_REPOSITORY = new InjectionToken<IUserProfileRepository>('ProfileRepository');
