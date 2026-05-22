import { describe, it, expect, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CompleteOnboardingUseCase } from './complete-onboarding.use-case';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { Streak } from '../domain/profile/streak.entity';
import { IUserProfileRepository } from '../domain/profile/profile.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';
import { PROFILE_REPOSITORY, CURRENT_USER } from '../app/core/di-tokens';

const USER_ID = 'u1';
const currentUser: ICurrentUserPort = { getUserId: () => USER_ID };

const makeProfile = () =>
  new UserProfile(USER_ID, 'pixelcat', null, 'orange', 0, 1, 9, new Streak(0, 0, null), new Date());

const makeProfileRepo = (profile: UserProfile | null): IUserProfileRepository => ({
  findById: vi.fn().mockResolvedValue(profile),
  save: vi.fn(),
  create: vi.fn(),
  updatePalette: vi.fn().mockResolvedValue(undefined),
  updateOnboardingDone: vi.fn().mockResolvedValue(undefined),
  updateTourDone: vi.fn(),
});

const setup = (profile: UserProfile | null) => {
  const profileRepo = makeProfileRepo(profile);
  TestBed.configureTestingModule({
    providers: [
      { provide: PROFILE_REPOSITORY, useValue: profileRepo },
      { provide: CURRENT_USER, useValue: currentUser },
    ],
  });
  return { useCase: TestBed.inject(CompleteOnboardingUseCase), profileRepo };
};

afterEach(() => {
  TestBed.resetTestingModule();
  vi.useRealTimers();
});

describe('CompleteOnboardingUseCase', () => {
  it('calls updatePalette with the selected palette', async () => {
    const { useCase, profileRepo } = setup(makeProfile());

    await useCase.execute('slate');

    expect(profileRepo.updatePalette).toHaveBeenCalledWith(USER_ID, 'slate');
  });

  it('calls updateOnboardingDone with the current user id', async () => {
    const { useCase, profileRepo } = setup(makeProfile());

    await useCase.execute('orange');

    expect(profileRepo.updateOnboardingDone).toHaveBeenCalledWith(USER_ID);
  });

  it('returns the profile with onboardingDone applied via the domain method', async () => {
    const { useCase } = setup(makeProfile());

    const result = await useCase.execute('orange');

    expect(result.onboardingDone).toBe(true);
    expect(result.userId).toBe(USER_ID);
  });

  it('retries findById until the profile is available', async () => {
    vi.useFakeTimers();
    const profile = makeProfile();
    const profileRepo = makeProfileRepo(null);
    (profileRepo.findById as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(profile);
    TestBed.configureTestingModule({
      providers: [
        { provide: PROFILE_REPOSITORY, useValue: profileRepo },
        { provide: CURRENT_USER, useValue: currentUser },
      ],
    });
    const useCase = TestBed.inject(CompleteOnboardingUseCase);

    const promise = useCase.execute('orange');
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(profileRepo.findById).toHaveBeenCalledTimes(3);
    expect(result.onboardingDone).toBe(true);
  });

  it('throws after max retries when profile never appears', async () => {
    vi.useFakeTimers();
    const profileRepo = makeProfileRepo(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: PROFILE_REPOSITORY, useValue: profileRepo },
        { provide: CURRENT_USER, useValue: currentUser },
      ],
    });
    const useCase = TestBed.inject(CompleteOnboardingUseCase);

    const promise = useCase.execute('orange');
    promise.catch(() => {});
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('Profile not ready');
  });

  it('does not call updatePalette when profile never appears', async () => {
    vi.useFakeTimers();
    const profileRepo = makeProfileRepo(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: PROFILE_REPOSITORY, useValue: profileRepo },
        { provide: CURRENT_USER, useValue: currentUser },
      ],
    });
    const useCase = TestBed.inject(CompleteOnboardingUseCase);

    const promise = useCase.execute('orange');
    promise.catch(() => {});
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow();
    expect(profileRepo.updatePalette).not.toHaveBeenCalled();
  });
});
