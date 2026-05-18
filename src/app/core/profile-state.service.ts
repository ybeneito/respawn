import { Injectable, signal } from '@angular/core';
import { UserProfile } from '../../domain/profile/user-profile.entity';

@Injectable({ providedIn: 'root' })
export class ProfileStateService {
  readonly profile = signal<UserProfile | null>(null);
}
