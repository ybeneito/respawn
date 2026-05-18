import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-pixel-card',
  template: `<div class="pbox" [class.notch-corners]="notched()"><ng-content /></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PixelCardComponent {
  readonly notched = input(true);
}
