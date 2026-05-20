import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
  untracked,
  afterEveryRender,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CatPalette } from '../../../../domain/profile/user-profile.entity';
import { CatSpriteComponent } from '../../../shared/cat-sprite/cat-sprite.component';
import { PixelButtonComponent } from '../../../shared/pixel-button/pixel-button.component';

export type TourStep =
  | 'welcome'
  | 'companion'
  | 'xpStats'
  | 'newQuestBtn'
  | 'modalOpen'
  | 'questRarity'
  | 'questCreated'
  | 'questCompleted'
  | 'done';

export const TOUR_STEPS: readonly TourStep[] = [
  'welcome',
  'companion',
  'xpStats',
  'newQuestBtn',
  'modalOpen',
  'questRarity',
  'questCreated',
  'questCompleted',
  'done',
];

export const STEP_SELECTORS: Record<TourStep, string | null> = {
  welcome: null,
  companion: 'app-companion-rail',
  xpStats: '.stat-blocks',
  newQuestBtn: '.screen-header .pbtn.teal',
  modalOpen: 'app-create-quest-modal .modal',
  questRarity: '.rarity-grid',
  questCreated: 'app-quest-row',
  questCompleted: 'app-xp-bar',
  done: null,
};

export const WAIT_STEPS: ReadonlySet<TourStep> = new Set(['newQuestBtn', 'modalOpen', 'questRarity', 'questCreated']);

@Component({
  selector: 'app-tour-overlay',
  templateUrl: './tour-overlay.component.html',
  styleUrl: './tour-overlay.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CatSpriteComponent, PixelButtonComponent, TranslocoPipe],
})
export class TourOverlayComponent {
  readonly palette = input.required<CatPalette>();
  readonly modalOpen = input(false);
  readonly questCreatedCount = input(0);
  readonly questCompletedCount = input(0);

  readonly tourCompleted = output<void>();

  readonly currentStep = signal<TourStep>('welcome');
  readonly spotlightRect = signal<DOMRect | null>(null);

  readonly stepIndex = computed(() => TOUR_STEPS.indexOf(this.currentStep()) + 1);
  readonly totalSteps = computed(() => TOUR_STEPS.length);
  readonly isWaitStep = computed(() => WAIT_STEPS.has(this.currentStep()));
  readonly i18nKey = computed(() => 'tour.step.' + this.currentStep());
  readonly spotlightStyle = computed(() => {
    const rect = this.spotlightRect();
    if (rect === null) return null;
    const pad = 10;
    return {
      top: (rect.top - pad) + 'px',
      left: (rect.left - pad) + 'px',
      width: (rect.width + pad * 2) + 'px',
      height: (rect.height + pad * 2) + 'px',
    };
  });

  private previousStep: TourStep | null = null;

  constructor() {
    afterEveryRender(() => {
      const step = this.currentStep();

      if (step === 'modalOpen' && document.querySelector('.rarity-grid')) {
        this.previousStep = null;
        this.currentStep.set('questRarity');
        return;
      }

      if (step === this.previousStep) return;
      this.previousStep = step;
      const selector = STEP_SELECTORS[step];
      if (!selector) {
        this.spotlightRect.set(null);
        return;
      }
      this.spotlightRect.set(document.querySelector(selector)?.getBoundingClientRect() ?? null);
    });

    effect(() => {
      const isModalOpen = this.modalOpen();
      const createdCount = this.questCreatedCount();
      const completedCount = this.questCompletedCount();
      const step = this.currentStep();

      if (isModalOpen && step === 'newQuestBtn') {
        untracked(() => this.currentStep.set('modalOpen'));
      } else if (createdCount >= 1 && (step === 'modalOpen' || step === 'questRarity')) {
        untracked(() => this.currentStep.set('questCreated'));
      } else if (completedCount >= 1 && step === 'questCreated') {
        untracked(() => this.currentStep.set('questCompleted'));
      }
    });
  }

  advance(): void {
    const step = this.currentStep();
    if (step === 'done') {
      this.tourCompleted.emit();
    } else {
      const nextIndex = TOUR_STEPS.indexOf(step) + 1;
      if (nextIndex < TOUR_STEPS.length) {
        this.currentStep.set(TOUR_STEPS[nextIndex]);
      }
    }
  }
}
