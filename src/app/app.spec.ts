import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { AUTH_SESSION } from './core/di-tokens';

const mockAuthSession = {
  isAuthenticated: () => false,
  authState: () => false,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: AUTH_SESSION, useValue: mockAuthSession }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
