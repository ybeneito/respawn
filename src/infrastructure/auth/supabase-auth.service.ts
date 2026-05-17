import { Injectable, OnDestroy, signal } from '@angular/core';
import { Session, Subscription } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseAuthService implements OnDestroy {
  readonly session = signal<Session | null>(null);

  private readonly authSubscription: Subscription;

  constructor() {
    supabase.auth.getSession().then(({ data }) => this.session.set(data.session));
    const { data } = supabase.auth.onAuthStateChange((_, session) => this.session.set(session));
    this.authSubscription = data.subscription;
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  signUp(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  }

  signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  signOut() {
    return supabase.auth.signOut();
  }
}
