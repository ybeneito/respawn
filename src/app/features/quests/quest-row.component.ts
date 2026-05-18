import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Quest } from '../../../domain/quest/quest.entity';

@Component({
  selector: 'app-quest-row',
  templateUrl: './quest-row.component.html',
  styleUrl: './quest-row.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestRowComponent {
  readonly quest = input.required<Quest>();
  readonly completed = output<string>(); // emits quest.id

  readonly RARITY_LABEL: Record<string, string> = {
    low: 'COMMON', med: 'UNCOMMON', hi: 'RARE', urg: 'EPIC',
  };
  readonly XP_BY_RARITY: Record<string, number> = { low: 5, med: 15, hi: 35, urg: 80 };
  readonly DIAMONDS: Record<string, string> = { low: '◆', med: '◆◆', hi: '◆◆◆', urg: '◆◆◆◆' };
}
