import { describe, it, expect, vi } from 'vitest';
import { MarkTourDoneUseCase } from './mark-tour-done.use-case';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { Streak } from '../domain/profile/streak.entity';
import { IUserProfileRepository } from '../domain/profile/profile.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';

const USER_ID = 'u1';
const currentUser: ICurrentUserPort = { getUserId: () => USER_ID };

const makeProfile = (tourDone = false) =>
  new UserProfile(USER_ID, 'pixelcat', null, 'orange', 0, 1, 9, new Streak(0, 0, null), new Date(), false, tourDone);

const makeProfileRepo = (profile: UserProfile | null) => ({
  findById: vi.fn().mockResolvedValue(profile),
  save: vi.fn(),
  create: vi.fn(),
  updatePalette: vi.fn(),
  updateOnboardingDone: vi.fn(),
  updateTourDone: vi.fn().mockResolvedValue(undefined),
} satisfies IUserProfileRepository);

describe('MarkTourDoneUseCase', () => {
  it('calls updateTourDone with the current user id', async () => {
    const profileRepo = makeProfileRepo(makeProfile());
    const useCase = new MarkTourDoneUseCase(profileRepo, currentUser);

    await useCase.execute();

    expect(profileRepo.updateTourDone).toHaveBeenCalledWith(USER_ID);
  });

  it('returns the profile with tourDone applied via the domain method', async () => {
    const profile = makeProfile(false);
    const profileRepo = makeProfileRepo(profile);
    const useCase = new MarkTourDoneUseCase(profileRepo, currentUser);

    const result = await useCase.execute();

    expect(result.tourDone).toBe(true);
    expect(result.userId).toBe(USER_ID);
    expect(profileRepo.findById).toHaveBeenCalledTimes(1);
  });

  it('does not call updateTourDone when profile is not found', async () => {
    const profileRepo = makeProfileRepo(null);
    const useCase = new MarkTourDoneUseCase(profileRepo, currentUser);

    await expect(useCase.execute()).rejects.toThrow(USER_ID);
    expect(profileRepo.updateTourDone).not.toHaveBeenCalled();
  });
});
