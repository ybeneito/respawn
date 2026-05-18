export type QuestRarity = 'low' | 'med' | 'hi' | 'urg';
export type QuestStatus = 'todo' | 'in_progress' | 'done';
export type QuestTag = 'work' | 'health' | 'learn' | 'home' | 'side-quest';

export interface RarityMeta {
  xp: number;
  diamonds: number;
  label: string;
}

export const RARITY_META: Record<QuestRarity, RarityMeta> = {
  low: { xp: 5,  diamonds: 1, label: 'COMMON'   },
  med: { xp: 15, diamonds: 2, label: 'UNCOMMON'  },
  hi:  { xp: 35, diamonds: 3, label: 'RARE'      },
  urg: { xp: 80, diamonds: 4, label: 'EPIC'      },
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
    const base = RARITY_META[this.rarity].xp;
    const bonus = Math.min(streakDays * 0.1, 1.0);
    const xpEarned = Math.round(base * (1 + bonus));
    return {
      quest: new Quest(this.id, this.ownerId, this.title, 'done', this.rarity, this.tag, this.today, new Date(), this.createdAt),
      xpEarned,
    };
  }
}
