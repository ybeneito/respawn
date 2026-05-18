import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-xp-toast',
  templateUrl: './xp-toast.component.html',
  styleUrl: './xp-toast.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpToastComponent {
  readonly xp = input(0);
  readonly visible = input(false);
}
