import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { GetUserDashboardUseCase } from '../../../application/get-user-dashboard.use-case';
import { CompleteQuestUseCase } from '../../../application/complete-quest.use-case';
import { Quest } from '../../../domain/quest/quest.entity';
import { QuestRowComponent } from './quest-row.component';
import { CreateQuestModalComponent } from './create-quest-modal/create-quest-modal.component';

type Filter = 'all' | 'today' | 'active' | 'done';

@Component({
  selector: 'app-quests',
  templateUrl: './quests.component.html',
  styleUrl: './quests.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestRowComponent, CreateQuestModalComponent, TranslocoPipe],
})
export class QuestsComponent implements OnInit {
  private readonly dashboardUseCase = inject(GetUserDashboardUseCase);
  private readonly completeUseCase = inject(CompleteQuestUseCase);
  private readonly transloco = inject(TranslocoService);
  private readonly inFlightQuestIds = new Set<string>();

  readonly quests = signal<Quest[]>([]);
  readonly filter = signal<Filter>('all');
  readonly showModal = signal(false);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly completeError = signal<string | null>(null);
  readonly filterOptions = ['all', 'today', 'active', 'done'] as const;

  readonly filtered = computed(() => {
    const allQuests = this.quests();
    switch (this.filter()) {
      case 'today':  return allQuests.filter(quest => quest.today);
      case 'active': return allQuests.filter(quest => quest.status !== 'done');
      case 'done':   return allQuests.filter(quest => quest.status === 'done');
      default:       return allQuests;
    }
  });

  async ngOnInit() {
    try {
      const { allQuests } = await this.dashboardUseCase.execute();
      this.quests.set(allQuests);
    } catch {
      this.errorMessage.set(this.transloco.translate('quests.loadError'));
    } finally {
      this.loading.set(false);
    }
  }

  async onQuestCompleted(questId: string) {
    if (this.inFlightQuestIds.has(questId)) return;
    this.inFlightQuestIds.add(questId);
    this.completeError.set(null);
    try {
      const result = await this.completeUseCase.execute(questId, new Date());
      this.quests.update(list =>
        list.map(quest => quest.id === questId ? result.quest : quest)
      );
    } catch {
      this.completeError.set(this.transloco.translate('quests.completeError'));
    } finally {
      this.inFlightQuestIds.delete(questId);
    }
  }

  onQuestCreated(quest: Quest) {
    this.quests.update(list => [quest, ...list]);
    this.showModal.set(false);
  }
}
