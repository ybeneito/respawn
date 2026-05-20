import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ProfileStateService } from '../../core/profile-state.service';
import { CatSpriteComponent } from '../cat-sprite/cat-sprite.component';
import { XpBarComponent } from '../xp-bar/xp-bar.component';
import { STAGE_INFO } from '../cat-sprite/sprites.data';

@Component({
  selector: 'app-companion-summary',
  templateUrl: './companion-summary.component.html',
  styleUrl: './companion-summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CatSpriteComponent, XpBarComponent, TranslocoPipe],
})
export class CompanionSummaryComponent {
  private readonly profileState = inject(ProfileStateService);

  readonly profile = this.profileState.profile;

  readonly stageInfo = computed(() => {
    const prof = this.profile();
    return prof ? STAGE_INFO[prof.stage] : null;
  });

  readonly xpForNextLevel = computed(() => this.profile()?.xpForNextLevel ?? 0);

  readonly heartsArray = computed(() =>
    Array.from({ length: 9 }, (_, index) => index < (this.profile()?.lives ?? 9))
  );
}
