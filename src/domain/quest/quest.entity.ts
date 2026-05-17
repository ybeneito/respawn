export type QuestRarity = 'low' | 'med' | 'hi' | 'urg';
export type QuestStatus = 'todo' | 'in_progress' | 'done';
export type QuestTag = 'work' | 'health' | 'learn' | 'home' | 'side-quest';

const XP_BY_RARITY: Record<QuestRarity, number> = {
  low: 5,
  med: 15,
  hi: 35,
  urg: 80,
};

export class Quest {
  constructor(
    readonly id: string,
    readonly ownerId: string,
    readonly title: string,
    readonly status: QuestStatus,
    readonly rarity: QuestRarity,
    readonly tag: QuestTag,
    readonly today: boolean,
    readonly completedAt: Date | null,
    readonly createdAt: Date,
  ) {}

  complete(streakDays = 0): { quest: Quest; xpEarned: number } {
    const base = XP_BY_RARITY[this.rarity];
    const bonus = Math.min(streakDays * 0.1, 1.0);
    const xpEarned = Math.round(base * (1 + bonus));
    return {
      quest: new Quest(this.id, this.ownerId, this.title, 'done', this.rarity, this.tag, this.today, new Date(), this.createdAt),
      xpEarned,
    };
  }
}
