import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { QUEST_REPOSITORY, PROFILE_REPOSITORY, CURRENT_USER } from '../../core/di-tokens';
import { GetUserDashboardUseCase } from '../../../application/get-user-dashboard.use-case';
import { CompleteQuestUseCase, CompleteQuestResult } from '../../../application/complete-quest.use-case';
import { Quest } from '../../../domain/quest/quest.entity';
import { QuestRowComponent } from './quest-row.component';
import { CreateQuestModalComponent } from './create-quest-modal/create-quest-modal.component';

type Filter = 'all' | 'today' | 'active' | 'done';

@Component({
  selector: 'app-quests',
  templateUrl: './quests.component.html',
  styleUrl: './quests.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestRowComponent, CreateQuestModalComponent],
})
export class QuestsComponent implements OnInit {
  private readonly questRepo = inject(QUEST_REPOSITORY);
  private readonly profileRepo = inject(PROFILE_REPOSITORY);
  private readonly currentUser = inject(CURRENT_USER);
  private readonly dashboardUseCase = new GetUserDashboardUseCase(this.questRepo, this.profileRepo, this.currentUser);
  private readonly completeUseCase = new CompleteQuestUseCase(this.questRepo, this.profileRepo, this.currentUser);

  readonly quests = signal<Quest[]>([]);
  readonly filter = signal<Filter>('all');
  readonly showModal = signal(false);
  readonly lastResult = signal<CompleteQuestResult | null>(null);

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
    const { allQuests } = await this.dashboardUseCase.execute();
    this.quests.set(allQuests);
  }

  async onQuestCompleted(questId: string) {
    const result = await this.completeUseCase.execute(questId, new Date());
    this.lastResult.set(result);
    this.quests.update(list =>
      list.map(quest => quest.id === questId ? result.quest : quest)
    );
  }

  onQuestCreated(quest: Quest) {
    this.quests.update(list => [quest, ...list]);
    this.showModal.set(false);
  }
}
