import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseAuthService } from '../../../infrastructure/auth/supabase-auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class AuthComponent {
  private readonly auth = inject(SupabaseAuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly isSignUp = signal(false);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const { email, password } = this.form.value as { email: string; password: string };
      const isSignUp = this.isSignUp();
      const { error } = await (isSignUp
        ? this.auth.signUp(email, password)
        : this.auth.signIn(email, password));
      if (error) { this.error.set(error.message); return; }
      this.router.navigate([isSignUp ? '/onboarding' : '/dashboard']);
    } catch {
      this.error.set('An unexpected error occurred. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  toggle() { this.isSignUp.update(currentValue => !currentValue); }
}
