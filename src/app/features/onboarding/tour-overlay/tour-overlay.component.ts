import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
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
  | 'questCreated'
  | 'questCompleted'
  | 'done';

export const TOUR_STEPS: readonly TourStep[] = [
  'welcome',
  'companion',
  'xpStats',
  'newQuestBtn',
  'modalOpen',
  'questCreated',
  'questCompleted',
  'done',
];

export const STEP_SELECTORS: Record<TourStep, string | null> = {
  welcome: null,
  companion: 'app-companion-rail',
  xpStats: '.stat-blocks',
  newQuestBtn: '.screen-header .pbtn.teal',
  modalOpen: 'app-create-quest-modal',
  questCreated: 'app-quest-row',
  questCompleted: 'app-quest-row',
  done: null,
};

export const WAIT_STEPS: ReadonlySet<TourStep> = new Set([
  'modalOpen',
  'questCreated',
  'questCompleted',
]);

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

  readonly openModal = output<void>();
  readonly tourCompleted = output<void>();

  readonly currentStep = signal<TourStep>('welcome');
  readonly spotlightRect = signal<DOMRect | null>(null);

  readonly stepIndex = computed(() => TOUR_STEPS.indexOf(this.currentStep()) + 1);
  readonly isWaitStep = computed(() => WAIT_STEPS.has(this.currentStep()));
  readonly i18nKey = computed(() => 'tour.step.' + this.currentStep());
  readonly spotlightStyle = computed(() => {
    const rect = this.spotlightRect();
    if (rect === null) return null;
    return {
      top: rect.top + 'px',
      left: rect.left + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
    };
  });

  constructor() {
    afterEveryRender(() => {
      const selector = STEP_SELECTORS[this.currentStep()];
      if (selector === null) {
        this.spotlightRect.set(null);
      } else {
        this.spotlightRect.set(
          document.querySelector(selector)?.getBoundingClientRect() ?? null,
        );
      }
    });

    effect(() => {
      if (this.questCreatedCount() >= 1 && this.currentStep() === 'modalOpen') {
        this.currentStep.set('questCreated');
      }
      if (this.questCompletedCount() >= 1 && this.currentStep() === 'questCreated') {
        this.currentStep.set('questCompleted');
      }
    });
  }

  advance(): void {
    const step = this.currentStep();
    if (step === 'newQuestBtn') {
      this.openModal.emit();
      this.currentStep.set('modalOpen');
    } else if (step === 'done') {
      this.tourCompleted.emit();
    } else {
      const nextIndex = TOUR_STEPS.indexOf(step) + 1;
      this.currentStep.set(TOUR_STEPS[nextIndex]);
    }
  }
}
