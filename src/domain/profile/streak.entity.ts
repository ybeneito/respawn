export class Streak {
  constructor(
    readonly current: number,
    readonly longest: number,
    readonly lastActivityDate: Date | null,
  ) {}

  evaluate(today: Date): { streak: Streak; broken: boolean } {
    if (!this.lastActivityDate) {
      return { streak: new Streak(1, Math.max(1, this.longest), today), broken: false };
    }
    const daysSince = this.daysBetween(this.lastActivityDate, today);
    if (daysSince === 0) {
      return { streak: this, broken: false };
    }
    if (daysSince === 1) {
      const next = this.current + 1;
      return { streak: new Streak(next, Math.max(next, this.longest), today), broken: false };
    }
    return { streak: new Streak(1, this.longest, today), broken: true };
  }

  private daysBetween(a: Date, b: Date): number {
    const msPerDay = 86_400_000;
    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((utcB - utcA) / msPerDay);
  }
}
