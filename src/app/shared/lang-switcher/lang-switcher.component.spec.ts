import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { LangSwitcherComponent } from './lang-switcher.component';

describe('LangSwitcherComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [
        LangSwitcherComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
    });
  });

  it('starts with the default language', () => {
    const fixture = TestBed.createComponent(LangSwitcherComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.activeLang()).toBe('en');
  });

  it('switches to fr and persists to localStorage', () => {
    const fixture = TestBed.createComponent(LangSwitcherComponent);
    fixture.detectChanges();
    fixture.componentInstance.setLang('fr');
    expect(fixture.componentInstance.activeLang()).toBe('fr');
    expect(localStorage.getItem('respawn_lang')).toBe('fr');
  });

  it('switches back to en and updates localStorage', () => {
    localStorage.setItem('respawn_lang', 'fr');
    const fixture = TestBed.createComponent(LangSwitcherComponent);
    fixture.detectChanges();
    fixture.componentInstance.setLang('en');
    expect(fixture.componentInstance.activeLang()).toBe('en');
    expect(localStorage.getItem('respawn_lang')).toBe('en');
  });
});
