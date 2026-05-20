import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CatPalette } from '../../../domain/profile/user-profile.entity';
import { PROFILE_REPOSITORY, CURRENT_USER } from '../../core/di-tokens';
import { CatSpriteComponent } from '../../shared/cat-sprite/cat-sprite.component';
import { PixelButtonComponent } from '../../shared/pixel-button/pixel-button.component';

const ALL_PALETTES: CatPalette[] = ['orange', 'black', 'slate', 'white', 'brown', 'siamese', 'calico', 'void'];

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CatSpriteComponent, PixelButtonComponent, TranslocoPipe],
})
export class OnboardingComponent {
  private readonly profileRepo = inject(PROFILE_REPOSITORY);
  private readonly currentUser = inject(CURRENT_USER);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  readonly palettes = ALL_PALETTES;
  readonly selected = signal<CatPalette>('orange');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  select(palette: CatPalette): void {
    this.selected.set(palette);
  }

  async confirm(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const userId = this.currentUser.getUserId();
      await this.profileRepo.updatePalette(userId, this.selected());
      await this.profileRepo.updateOnboardingDone(userId);
      this.router.navigate(['/dashboard']);
    } catch {
      this.error.set(this.transloco.translate('onboarding.saveError'));
    } finally {
      this.loading.set(false);
    }
  }
}
