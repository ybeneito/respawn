import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-xp-bar',
  templateUrl: './xp-bar.component.html',
  styleUrl: './xp-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpBarComponent {
  readonly currentXp = input.required<number>();
  readonly xpForCurrentLevel = input.required<number>();
  readonly xpForNextLevel = input.required<number>();

  readonly fillPercent = computed(() => {
    const range = this.xpForNextLevel() - this.xpForCurrentLevel();
    if (range <= 0) return 0;
    const progress = this.currentXp() - this.xpForCurrentLevel();
    return Math.min(100, Math.max(0, (progress / range) * 100));
  });
}
