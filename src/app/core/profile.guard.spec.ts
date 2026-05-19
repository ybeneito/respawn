import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { profileGuard } from './profile.guard';
import { PROFILE_REPOSITORY, CURRENT_USER } from './di-tokens';
import { UserProfile } from '../../domain/profile/user-profile.entity';
import { Streak } from '../../domain/profile/streak.entity';

const makeProfile = (onboardingDone: boolean) =>
  new UserProfile('u1', 'pixelcat', null, 'orange', 0, 1, 9, new Streak(0, 0, null), new Date(), onboardingDone);

describe('profileGuard', () => {
  let mockProfileRepo: { findById: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockProfileRepo = { findById: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: CURRENT_USER, useValue: { isAuthenticated: () => true, getUserId: () => 'u1' } },
        { provide: PROFILE_REPOSITORY, useValue: mockProfileRepo },
      ],
    });
  });

  it('allows navigation when onboarding_done is true', async () => {
    mockProfileRepo.findById.mockResolvedValue(makeProfile(true));
    const result = await TestBed.runInInjectionContext(
      () => profileGuard({} as never, {} as never),
    );
    expect(result).toBe(true);
  });

  it('redirects to /onboarding when onboarding_done is false', async () => {
    mockProfileRepo.findById.mockResolvedValue(makeProfile(false));
    const router = TestBed.inject(Router);
    const result = await TestBed.runInInjectionContext(
      () => profileGuard({} as never, {} as never),
    );
    expect(result).toEqual(router.createUrlTree(['/onboarding']));
  });

  it('redirects to /onboarding when profile is null', async () => {
    mockProfileRepo.findById.mockResolvedValue(null);
    const router = TestBed.inject(Router);
    const result = await TestBed.runInInjectionContext(
      () => profileGuard({} as never, {} as never),
    );
    expect(result).toEqual(router.createUrlTree(['/onboarding']));
  });

  it('allows navigation when profile repo throws (fail open)', async () => {
    mockProfileRepo.findById.mockRejectedValue(new Error('DB error'));
    const result = await TestBed.runInInjectionContext(
      () => profileGuard({} as never, {} as never),
    );
    expect(result).toBe(true);
  });
});
