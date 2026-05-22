import { describe, it, expect, vi } from 'vitest';
import { CompleteOnboardingUseCase } from './complete-onboarding.use-case';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { Streak } from '../domain/profile/streak.entity';
import { IUserProfileRepository } from '../domain/profile/profile.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';

const USER_ID = 'u1';
const currentUser: ICurrentUserPort = { getUserId: () => USER_ID };

const makeProfile = () =>
  new UserProfile(USER_ID, 'pixelcat', null, 'orange', 0, 1, 9, new Streak(0, 0, null), new Date());

const makeProfileRepo = (profile: UserProfile | null) => ({
  findById: vi.fn().mockResolvedValue(profile),
  save: vi.fn(),
  create: vi.fn(),
  updatePalette: vi.fn().mockResolvedValue(undefined),
  updateOnboardingDone: vi.fn().mockResolvedValue(undefined),
  updateTourDone: vi.fn(),
} satisfies IUserProfileRepository);

describe('CompleteOnboardingUseCase', () => {
  it('calls updatePalette with the selected palette', async () => {
    const profileRepo = makeProfileRepo(makeProfile());
    const useCase = new CompleteOnboardingUseCase(profileRepo, currentUser, 0);

    await useCase.execute('slate');

    expect(profileRepo.updatePalette).toHaveBeenCalledWith(USER_ID, 'slate');
  });

  it('calls updateOnboardingDone with the current user id', async () => {
    const profileRepo = makeProfileRepo(makeProfile());
    const useCase = new CompleteOnboardingUseCase(profileRepo, currentUser, 0);

    await useCase.execute('orange');

    expect(profileRepo.updateOnboardingDone).toHaveBeenCalledWith(USER_ID);
  });

  it('returns the profile with onboardingDone applied via the domain method', async () => {
    const profileRepo = makeProfileRepo(makeProfile());
    const useCase = new CompleteOnboardingUseCase(profileRepo, currentUser, 0);

    const result = await useCase.execute('orange');

    expect(result.onboardingDone).toBe(true);
    expect(result.userId).toBe(USER_ID);
  });

  it('retries findById until the profile is available', async () => {
    const profile = makeProfile();
    const profileRepo = makeProfileRepo(null);
    profileRepo.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(profile);
    const useCase = new CompleteOnboardingUseCase(profileRepo, currentUser, 0);

    const result = await useCase.execute('orange');

    expect(profileRepo.findById).toHaveBeenCalledTimes(3);
    expect(result.onboardingDone).toBe(true);
  });

  it('throws after max retries when profile never appears', async () => {
    const profileRepo = makeProfileRepo(null);
    const useCase = new CompleteOnboardingUseCase(profileRepo, currentUser, 0);

    await expect(useCase.execute('orange')).rejects.toThrow('Profile not ready');
  });

  it('does not call updatePalette when profile never appears', async () => {
    const profileRepo = makeProfileRepo(null);
    const useCase = new CompleteOnboardingUseCase(profileRepo, currentUser, 0);

    await expect(useCase.execute('orange')).rejects.toThrow();
    expect(profileRepo.updatePalette).not.toHaveBeenCalled();
  });
});
