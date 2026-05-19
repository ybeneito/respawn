import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { LANG_STORAGE_KEY } from '../../core/constants';

type SupportedLang = 'en' | 'fr';

@Component({
  selector: 'app-lang-switcher',
  templateUrl: './lang-switcher.component.html',
  styleUrl: './lang-switcher.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LangSwitcherComponent {
  private readonly transloco = inject(TranslocoService);

  readonly langs: readonly SupportedLang[] = ['en', 'fr'];
  readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  setLang(lang: SupportedLang): void {
    this.transloco.setActiveLang(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  }
}
