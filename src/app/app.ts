import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { SupabaseAuthService } from '../infrastructure/auth/supabase-auth.service';
import { CompanionRailComponent } from './shared/companion-rail/companion-rail.component';
import { HamburgerMenuComponent } from './shared/hamburger-menu/hamburger-menu.component';
import { LangSwitcherComponent } from './shared/lang-switcher/lang-switcher.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CompanionRailComponent, HamburgerMenuComponent, LangSwitcherComponent, TranslocoPipe],
})
export class App {
  private readonly auth = inject(SupabaseAuthService);
  private readonly router = inject(Router);
  readonly isLoggedIn = computed(() => !!this.auth.session());

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/auth']);
  }
}
