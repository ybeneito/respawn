import { Component, inject, signal, output, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { QUEST_REPOSITORY, CURRENT_USER } from '../../../core/di-tokens';
import { CreateQuestUseCase } from '../../../../application/create-quest.use-case';
import { Quest, QuestRarity, QuestTag } from '../../../../domain/quest/quest.entity';

const RARITIES: { value: QuestRarity; label: string; xp: number; diamonds: number }[] = [
  { value: 'low', label: 'COMMON',   xp: 5,  diamonds: 1 },
  { value: 'med', label: 'UNCOMMON', xp: 15, diamonds: 2 },
  { value: 'hi',  label: 'RARE',     xp: 35, diamonds: 3 },
  { value: 'urg', label: 'EPIC',     xp: 80, diamonds: 4 },
];

const TAGS: { value: QuestTag; label: string }[] = [
  { value: 'work',       label: 'Work' },
  { value: 'health',     label: 'Health' },
  { value: 'learn',      label: 'Learning' },
  { value: 'home',       label: 'Home' },
  { value: 'side-quest', label: 'Side Quest' },
];

@Component({
  selector: 'app-create-quest-modal',
  templateUrl: './create-quest-modal.component.html',
  styleUrl: './create-quest-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class CreateQuestModalComponent {
  private readonly questRepo = inject(QUEST_REPOSITORY);
  private readonly currentUser = inject(CURRENT_USER);
  private readonly fb = inject(FormBuilder);
  private readonly useCase = new CreateQuestUseCase(this.questRepo, this.currentUser);

  readonly questCreated = output<Quest>();
  readonly closed = output<void>();

  readonly step = signal<1 | 2>(1);
  readonly loading = signal(false);
  readonly rarities = RARITIES;
  readonly tags = TAGS;

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    tag: ['work' as QuestTag],
  });

  get titleLength() { return this.form.get('title')?.value?.length ?? 0; }

  nextStep() {
    if (this.form.get('title')?.invalid) return;
    this.step.set(2);
  }

  async selectRarity(rarity: QuestRarity) {
    this.loading.set(true);
    try {
      const quest = await this.useCase.execute({
        title: this.form.value.title!,
        rarity,
        tag: this.form.value.tag as QuestTag,
        today: true,
      });
      this.questCreated.emit(quest);
    } catch {
      // error is surfaced through the loading state reset
    } finally {
      this.loading.set(false);
    }
  }
}
