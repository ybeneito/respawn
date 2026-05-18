import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SupabaseAuthService } from '../infrastructure/auth/supabase-auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
})
export class App {
  private readonly auth = inject(SupabaseAuthService);
  readonly isLoggedIn = computed(() => !!this.auth.session());
}
