import { Streak } from './streak.entity';

export type CatPalette = 'orange' | 'black' | 'slate' | 'white' | 'brown' | 'siamese' | 'calico' | 'void';
export type CatStage = 'kitten' | 'stray' | 'ninja' | 'samurai' | 'arcane' | 'legendary';

const LEVEL_XP_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 100, 3: 250, 4: 500, 5: 1_000,
};

function xpForLevel(level: number): number {
  return LEVEL_XP_THRESHOLDS[level] ?? level * level * 40;
}

function computeLevel(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export class UserProfile {
  constructor(
    readonly userId: string,
    readonly username: string,
    readonly avatarUrl: string | null,
    readonly palette: CatPalette,
    readonly xp: number,
    readonly level: number,
    readonly lives: number,
    readonly streak: Streak,
    readonly createdAt: Date,
    readonly onboardingDone: boolean = false,
    readonly tourDone: boolean = false,
  ) {}

  applyXP(amount: number, streakBroken = false): { profile: UserProfile; levelUp: boolean } {
    const newXp = this.xp + amount;
    const newLevel = computeLevel(newXp);
    const newLives = streakBroken ? Math.max(0, this.lives - 1) : this.lives;
    const levelUp = newLevel > this.level;
    return {
      profile: new UserProfile(
        this.userId, this.username, this.avatarUrl, this.palette,
        newXp, newLevel, newLives, this.streak, this.createdAt, this.onboardingDone, this.tourDone,
      ),
      levelUp,
    };
  }

  stageForLevel(level: number): CatStage {
    if (level >= 26) return 'legendary';
    if (level >= 19) return 'arcane';
    if (level >= 13) return 'samurai';
    if (level >= 8) return 'ninja';
    if (level >= 4) return 'stray';
    return 'kitten';
  }

  get stage(): CatStage {
    return this.stageForLevel(this.level);
  }

  get xpToNextLevel(): number {
    return xpForLevel(this.level + 1) - this.xp;
  }

  get xpForCurrentLevel(): number {
    return xpForLevel(this.level);
  }

  get xpForNextLevel(): number {
    return this.xp + this.xpToNextLevel;
  }

  withStreak(streak: Streak): UserProfile {
    return new UserProfile(
      this.userId, this.username, this.avatarUrl, this.palette,
      this.xp, this.level, this.lives, streak, this.createdAt, this.onboardingDone, this.tourDone,
    );
  }

  withTourDone(): UserProfile {
    return new UserProfile(
      this.userId, this.username, this.avatarUrl, this.palette,
      this.xp, this.level, this.lives, this.streak, this.createdAt,
      this.onboardingDone, true,
    );
  }
}
