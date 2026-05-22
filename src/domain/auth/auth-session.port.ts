type Reactive<T> = () => T;

export interface AuthOperationResult {
  error: { message: string } | null;
}

export interface IAuthSessionPort {
  isAuthenticated(): boolean;
  readonly authState: Reactive<boolean>;
  signUp(email: string, password: string): Promise<AuthOperationResult>;
  signIn(email: string, password: string): Promise<AuthOperationResult>;
  signInWithGoogle(): Promise<AuthOperationResult>;
  signOut(): Promise<void>;
}
