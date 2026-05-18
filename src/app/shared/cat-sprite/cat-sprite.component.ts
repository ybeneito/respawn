import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CatPalette, CatStage } from '../../../domain/profile/user-profile.entity';
import { buildPalette, STAGE_SPRITES } from './sprites.data';

interface Pixel {
  x: number;
  y: number;
  color: string;
}

@Component({
  selector: 'app-cat-sprite',
  templateUrl: './cat-sprite.component.html',
  styleUrl: './cat-sprite.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatSpriteComponent {
  readonly palette = input.required<CatPalette>();
  readonly stage = input.required<CatStage>();
  readonly pixelSize = input(8);

  private readonly rows = computed(() =>
    STAGE_SPRITES[this.stage()].replace(/^\n/, '').replace(/\n$/, '').split('\n')
  );
  readonly containerWidth  = computed(() => Math.max(...this.rows().map(row => row.length)) * this.pixelSize());
  readonly containerHeight = computed(() => this.rows().length * this.pixelSize());
  readonly pixels = computed(() => this.parseSprite(this.rows(), this.palette()));

  private parseSprite(rows: string[], paletteKey: CatPalette): Pixel[] {
    const colorMap = buildPalette(paletteKey);
    const pixels: Pixel[] = [];
    rows.forEach((row, rowIndex) => {
      [...row].forEach((char, colIndex) => {
        if (char === '.' || char === ' ' || !char) return;
        const color = colorMap[char];
        if (color) pixels.push({ x: colIndex, y: rowIndex, color });
      });
    });
    return pixels;
  }
}
