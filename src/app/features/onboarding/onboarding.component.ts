import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
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
  imports: [CatSpriteComponent, PixelButtonComponent],
})
export class OnboardingComponent {
  private readonly profileRepo = inject(PROFILE_REPOSITORY);
  private readonly currentUser = inject(CURRENT_USER);
  private readonly router = inject(Router);

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
      await this.profileRepo.updatePalette(this.currentUser.getUserId(), this.selected());
      this.router.navigate(['/dashboard']);
    } catch {
      this.error.set('Failed to save your choice. Please try again.');
      this.loading.set(false);
    }
  }
}
