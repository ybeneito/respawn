import { describe, it, expect } from 'vitest';
import { UserProfile } from './user-profile.entity';
import { Streak } from './streak.entity';

const makeProfile = (xp = 0, level = 1, lives = 9) =>
  new UserProfile('u1', 'pixelcat', null, 'orange', xp, level, lives, new Streak(0, 0, null), new Date());

describe('UserProfile', () => {
  it('applyXP adds XP without triggering level up', () => {
    const { profile, levelUp } = makeProfile(50).applyXP(30);
    expect(profile.xp).toBe(80);
    expect(profile.level).toBe(1);
    expect(levelUp).toBe(false);
  });

  it('applyXP triggers level up when crossing the threshold', () => {
    const { profile, levelUp } = makeProfile(90).applyXP(15);
    expect(profile.xp).toBe(105);
    expect(profile.level).toBe(2); // level 2 threshold = 100 XP
    expect(levelUp).toBe(true);
  });

  it('applyXP decrements a life when streak is broken', () => {
    const { profile } = makeProfile(0, 1, 9).applyXP(5, true);
    expect(profile.lives).toBe(8);
  });

  it('stageForLevel returns the correct stage for each level boundary', () => {
    expect(makeProfile().stageForLevel(1)).toBe('kitten');
    expect(makeProfile().stageForLevel(4)).toBe('stray');
    expect(makeProfile().stageForLevel(8)).toBe('ninja');
    expect(makeProfile().stageForLevel(13)).toBe('samurai');
    expect(makeProfile().stageForLevel(19)).toBe('arcane');
    expect(makeProfile().stageForLevel(26)).toBe('legendary');
  });
});
