import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Quest, QuestRarity, RARITY_META } from '../../../domain/quest/quest.entity';

const DIAMOND_CHARS: Record<QuestRarity, string> = Object.fromEntries(
  (Object.entries(RARITY_META) as [QuestRarity, typeof RARITY_META[QuestRarity]][])
    .map(([rarity, meta]) => [rarity, '◆'.repeat(meta.diamonds)])
) as Record<QuestRarity, string>;

@Component({
  selector: 'app-quest-row',
  templateUrl: './quest-row.component.html',
  styleUrl: './quest-row.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
})
export class QuestRowComponent {
  readonly quest = input.required<Quest>();
  readonly completed = output<string>();

  readonly rarityMeta = RARITY_META;
  readonly diamondChars = DIAMOND_CHARS;
}
