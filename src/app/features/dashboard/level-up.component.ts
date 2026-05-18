import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CatSpriteComponent } from '../../shared/cat-sprite/cat-sprite.component';
import { UserProfile } from '../../../domain/profile/user-profile.entity';

@Component({
  selector: 'app-level-up',
  templateUrl: './level-up.component.html',
  styleUrl: './level-up.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CatSpriteComponent],
})
export class LevelUpComponent {
  readonly profile = input.required<UserProfile>();
  readonly continued = output<void>();

  readonly stage = computed(() => this.profile().stage);
  readonly level = computed(() => this.profile().level);
}
