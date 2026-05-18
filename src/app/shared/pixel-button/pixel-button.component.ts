import { Component, input, ChangeDetectionStrategy } from '@angular/core';

type ButtonVariant = 'purple' | 'teal' | 'amber' | 'ghost';

@Component({
  selector: 'app-pixel-button',
  template: `<button [class]="'pbtn ' + variant()" [disabled]="disabled()"><ng-content /></button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PixelButtonComponent {
  readonly variant = input<ButtonVariant>('purple');
  readonly disabled = input(false);
}
