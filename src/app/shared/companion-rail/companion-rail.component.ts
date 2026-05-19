import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CatStage } from '../../../domain/profile/user-profile.entity';
import { ProfileStateService } from '../../core/profile-state.service';
import { XpBarComponent } from '../xp-bar/xp-bar.component';
import { CatSpriteComponent } from '../cat-sprite/cat-sprite.component';
import { STAGE_INFO, STAGE_ORDER } from '../cat-sprite/sprites.data';

@Component({
  selector: 'app-companion-rail',
  templateUrl: './companion-rail.component.html',
  styleUrl: './companion-rail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [XpBarComponent, CatSpriteComponent, TranslocoPipe],
})
export class CompanionRailComponent {
  private readonly profileState = inject(ProfileStateService);

  readonly profile   = this.profileState.profile;
  readonly stageOrder = STAGE_ORDER;
  readonly stageInfoMap = STAGE_INFO;

  readonly stageInfo = computed(() => {
    const prof = this.profile();
    return prof ? STAGE_INFO[prof.stage] : null;
  });

  readonly xpForNextLevel = computed(() => {
    const prof = this.profile();
    return prof ? prof.xpForNextLevel : 0;
  });

  readonly heartsArray = computed(() => {
    const lives = this.profile()?.lives ?? 9;
    return Array.from({ length: 9 }, (_, i) => i < lives);
  });

  isUnlocked(stage: CatStage): boolean {
    const prof = this.profile();
    return prof ? prof.level >= STAGE_INFO[stage].minLevel : false;
  }

  isCurrent(stage: CatStage): boolean {
    return this.profile()?.stage === stage;
  }

  stageRange(stage: CatStage): string {
    const info = STAGE_INFO[stage];
    return info.maxLevel >= 999 ? `${info.minLevel}+` : `${info.minLevel}–${info.maxLevel}`;
  }
}
