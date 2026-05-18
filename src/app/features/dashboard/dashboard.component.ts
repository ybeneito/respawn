import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { QUEST_REPOSITORY, PROFILE_REPOSITORY, CURRENT_USER } from '../../core/di-tokens';
import { GetUserDashboardUseCase, DashboardData } from '../../../application/get-user-dashboard.use-case';
import { CompleteQuestUseCase } from '../../../application/complete-quest.use-case';
import { CreateQuestModalComponent } from '../quests/create-quest-modal/create-quest-modal.component';
import { QuestRowComponent } from '../quests/quest-row.component';
import { XpBarComponent } from '../../shared/xp-bar/xp-bar.component';
import { Quest } from '../../../domain/quest/quest.entity';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestRowComponent, CreateQuestModalComponent, XpBarComponent],
})
export class DashboardComponent implements OnInit {
  private readonly questRepo = inject(QUEST_REPOSITORY);
  private readonly profileRepo = inject(PROFILE_REPOSITORY);
  private readonly currentUser = inject(CURRENT_USER);
  private readonly dashboardUseCase = new GetUserDashboardUseCase(this.questRepo, this.profileRepo, this.currentUser);
  private readonly completeUseCase = new CompleteQuestUseCase(this.questRepo, this.profileRepo, this.currentUser);
  private readonly inFlightQuestIds = new Set<string>();

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly completeError = signal<string | null>(null);
  readonly data = signal<DashboardData | null>(null);
  readonly showModal = signal(false);
  readonly xpEarned = signal(0);

  readonly profile = computed(() => this.data()?.userProfile ?? null);

  readonly xpForNextLevel = computed(() => {
    const prof = this.profile();
    if (!prof) return 0;
    return prof.xpForCurrentLevel + prof.xpToNextLevel;
  });

  async ngOnInit() {
    try {
      this.data.set(await this.dashboardUseCase.execute());
    } catch {
      this.errorMessage.set('Failed to load dashboard. Please refresh.');
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
      this.xpEarned.set(result.xpEarned);
      if (this.data()) {
        this.data.update(prev => ({
          ...prev!,
          todayActive: prev!.todayActive.filter(quest => quest.id !== questId),
          todayDone: [...prev!.todayDone, result.quest],
        }));
      }
    } catch {
      this.completeError.set('Failed to complete quest. Please try again.');
    } finally {
      this.inFlightQuestIds.delete(questId);
    }
  }

  onQuestCreated(quest: Quest) {
    this.data.update(prev =>
      prev
        ? { ...prev, todayActive: [quest, ...prev.todayActive], allQuests: [quest, ...prev.allQuests] }
        : prev,
    );
    this.showModal.set(false);
  }
}
