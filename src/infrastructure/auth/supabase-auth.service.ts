import { Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseAuthService {
  readonly session = signal<Session | null>(null);

  constructor() {
    supabase.auth.getSession().then(({ data }) => this.session.set(data.session));
    supabase.auth.onAuthStateChange((_, session) => this.session.set(session));
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
