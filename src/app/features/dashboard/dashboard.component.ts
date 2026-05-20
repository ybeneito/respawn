import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { QUEST_REPOSITORY, PROFILE_REPOSITORY, CURRENT_USER } from '../../core/di-tokens';
import { GetUserDashboardUseCase, DashboardData } from '../../../application/get-user-dashboard.use-case';
import { CompleteQuestUseCase } from '../../../application/complete-quest.use-case';
import { ProfileStateService } from '../../core/profile-state.service';
import { CreateQuestModalComponent } from '../quests/create-quest-modal/create-quest-modal.component';
import { QuestRowComponent } from '../quests/quest-row.component';
import { XpBarComponent } from '../../shared/xp-bar/xp-bar.component';
import { XpToastComponent } from './xp-toast.component';
import { LevelUpComponent } from './level-up.component';
import { Quest } from '../../../domain/quest/quest.entity';
import { TourOverlayComponent } from '../onboarding/tour-overlay/tour-overlay.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestRowComponent, CreateQuestModalComponent, XpBarComponent, XpToastComponent, LevelUpComponent, TranslocoPipe, TourOverlayComponent],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly questRepo = inject(QUEST_REPOSITORY);
  private readonly profileRepo = inject(PROFILE_REPOSITORY);
  private readonly currentUser = inject(CURRENT_USER);
  private readonly profileState = inject(ProfileStateService);
  private readonly transloco = inject(TranslocoService);
  private readonly dashboardUseCase = new GetUserDashboardUseCase(this.questRepo, this.profileRepo, this.currentUser);
  private readonly completeUseCase = new CompleteQuestUseCase(this.questRepo, this.profileRepo, this.currentUser);
  private readonly inFlightQuestIds = new Set<string>();
  private readonly pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
  private xpToastTimerId: ReturnType<typeof setTimeout> | null = null;

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly completeError = signal<string | null>(null);
  readonly data = signal<DashboardData | null>(null);
  readonly showModal = signal(false);
  readonly xpEarned = signal(0);
  readonly showLevelUp = signal(false);
  readonly showXpToast = signal(false);
  readonly newLevel = signal<number | null>(null);

  readonly profile = computed(() => this.data()?.userProfile ?? null);
  readonly sessionXpDelta = signal(0);

  readonly questCreatedCount = computed(() =>
    (this.data()?.todayActive.length ?? 0) + (this.data()?.todayDone.length ?? 0),
  );
  readonly questCompletedCount = computed(() => this.data()?.todayDone.length ?? 0);
  readonly showTour = computed(() => this.profile() !== null && !this.profile()!.tourDone);

  readonly xpForNextLevel = computed(() => {
    const prof = this.profile();
    if (!prof) return 0;
    return prof.xpForNextLevel;
  });

  async ngOnInit() {
    try {
      const dashboard = await this.dashboardUseCase.execute();
      this.data.set(dashboard);
      this.profileState.profile.set(dashboard.userProfile);
    } catch {
      this.errorMessage.set(this.transloco.translate('dashboard.loadError'));
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
      this.sessionXpDelta.update(delta => delta + result.xpEarned);
      if (this.xpToastTimerId !== null) clearTimeout(this.xpToastTimerId);
      this.showXpToast.set(true);
      this.xpToastTimerId = setTimeout(() => {
        this.showXpToast.set(false);
        this.xpToastTimerId = null;
      }, 1200);
      if (result.levelUp) {
        this.newLevel.set(result.newLevel ?? null);
        const levelUpTimer = setTimeout(() => this.showLevelUp.set(true), 400);
        this.pendingTimeouts.push(levelUpTimer);
      }
      this.profileState.profile.set(result.profile);
      this.data.update(prev => prev ? ({
        ...prev,
        userProfile: result.profile,
        todayActive: prev.todayActive.filter(quest => quest.id !== questId),
        todayDone: [...prev.todayDone, result.quest],
      }) : prev);
    } catch {
      this.completeError.set(this.transloco.translate('dashboard.completeError'));
    } finally {
      this.inFlightQuestIds.delete(questId);
    }
  }

  ngOnDestroy() {
    if (this.xpToastTimerId !== null) clearTimeout(this.xpToastTimerId);
    this.pendingTimeouts.forEach(clearTimeout);
  }

  onQuestCreated(quest: Quest) {
    this.data.update(prev =>
      prev
        ? { ...prev, todayActive: [quest, ...prev.todayActive], allQuests: [quest, ...prev.allQuests] }
        : prev,
    );
    this.showModal.set(false);
  }

  async onTourCompleted(): Promise<void> {
    try {
      await this.profileRepo.updateTourDone(this.currentUser.getUserId());
      this.data.update(prev =>
        prev ? { ...prev, userProfile: prev.userProfile.withTourDone() } : prev,
      );
      this.profileState.profile.update(prof => prof?.withTourDone() ?? prof);
    } catch {
      this.completeError.set(this.transloco.translate('dashboard.completeError'));
    }
  }
}
