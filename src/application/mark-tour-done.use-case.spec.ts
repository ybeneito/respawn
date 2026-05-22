import { describe, it, expect, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MarkTourDoneUseCase } from './mark-tour-done.use-case';
import { UserProfile } from '../domain/profile/user-profile.entity';
import { Streak } from '../domain/profile/streak.entity';
import { IUserProfileRepository } from '../domain/profile/profile.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';
import { PROFILE_REPOSITORY, CURRENT_USER } from '../app/core/di-tokens';

const USER_ID = 'u1';
const currentUser: ICurrentUserPort = { getUserId: () => USER_ID };

const makeProfile = (tourDone = false) =>
  new UserProfile(USER_ID, 'pixelcat', null, 'orange', 0, 1, 9, new Streak(0, 0, null), new Date(), false, tourDone);

const makeProfileRepo = (profile: UserProfile | null): IUserProfileRepository => ({
  findById: vi.fn().mockResolvedValue(profile),
  save: vi.fn(),
  create: vi.fn(),
  updatePalette: vi.fn(),
  updateOnboardingDone: vi.fn(),
  updateTourDone: vi.fn().mockResolvedValue(undefined),
});

const setup = (profile: UserProfile | null) => {
  TestBed.configureTestingModule({
    providers: [
      { provide: PROFILE_REPOSITORY, useValue: makeProfileRepo(profile) },
      { provide: CURRENT_USER, useValue: currentUser },
    ],
  });
  return TestBed.inject(MarkTourDoneUseCase);
};

afterEach(() => TestBed.resetTestingModule());

describe('MarkTourDoneUseCase', () => {
  it('calls updateTourDone with the current user id', async () => {
    const profileRepo = makeProfileRepo(makeProfile());
    TestBed.configureTestingModule({
      providers: [
        { provide: PROFILE_REPOSITORY, useValue: profileRepo },
        { provide: CURRENT_USER, useValue: currentUser },
      ],
    });
    const useCase = TestBed.inject(MarkTourDoneUseCase);

    await useCase.execute();

    expect(profileRepo.updateTourDone).toHaveBeenCalledWith(USER_ID);
  });

  it('returns the profile with tourDone applied via the domain method', async () => {
    const useCase = setup(makeProfile(false));
    const result = await useCase.execute();

    expect(result.tourDone).toBe(true);
    expect(result.userId).toBe(USER_ID);
  });

  it('does not call updateTourDone when profile is not found', async () => {
    const profileRepo = makeProfileRepo(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: PROFILE_REPOSITORY, useValue: profileRepo },
        { provide: CURRENT_USER, useValue: currentUser },
      ],
    });
    const useCase = TestBed.inject(MarkTourDoneUseCase);

    await expect(useCase.execute()).rejects.toThrow(USER_ID);
    expect(profileRepo.updateTourDone).not.toHaveBeenCalled();
  });
});
