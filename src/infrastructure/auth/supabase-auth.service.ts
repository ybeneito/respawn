import { Injectable, OnDestroy, signal, computed } from '@angular/core';
import { Session, Subscription } from '@supabase/supabase-js';
import { ICurrentUserPort } from '../../domain/auth/current-user.port';
import { IAuthSessionPort, AuthOperationResult } from '../../domain/auth/auth-session.port';
import { supabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseAuthService implements OnDestroy, ICurrentUserPort, IAuthSessionPort {
  readonly session = signal<Session | null>(null);
  readonly authState = computed(() => this.session() !== null);

  private readonly authSubscription: Subscription;

  constructor() {
    supabase.auth.getSession().then(({ data }) => this.session.set(data.session));
    const { data } = supabase.auth.onAuthStateChange((_, session) => this.session.set(session));
    this.authSubscription = data.subscription;
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  isAuthenticated(): boolean {
    return this.session() !== null;
  }

  getUserId(): string {
    const currentSession = this.session();
    if (!currentSession) throw new Error('No active session.');
    return currentSession.user.id;
  }

  async signUp(email: string, password: string): Promise<AuthOperationResult> {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ? { message: error.message } : null };
  }

  async signIn(email: string, password: string): Promise<AuthOperationResult> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? { message: error.message } : null };
  }

  async signInWithGoogle(): Promise<AuthOperationResult> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    return { error: error ? { message: error.message } : null };
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }
}
