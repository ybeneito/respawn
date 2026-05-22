import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AUTH_SESSION } from './core/di-tokens';
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
  private readonly auth = inject(AUTH_SESSION);
  private readonly router = inject(Router);
  readonly isLoggedIn = computed(() => this.auth.authState());

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/auth']);
  }
}
