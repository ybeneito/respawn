import { Component, inject, signal, output, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs/operators';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { QUEST_REPOSITORY, CURRENT_USER } from '../../../core/di-tokens';
import { CreateQuestUseCase, QUEST_TITLE_MAX_LENGTH } from '../../../../application/create-quest.use-case';
import { Quest, QuestRarity, QuestTag, RARITY_META, RarityMeta } from '../../../../domain/quest/quest.entity';

const RARITIES: ({ value: QuestRarity } & RarityMeta)[] = (
  Object.entries(RARITY_META) as [QuestRarity, RarityMeta][]
).map(([value, meta]) => ({ value, ...meta }));

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
  imports: [ReactiveFormsModule, TranslocoPipe],
})
export class CreateQuestModalComponent {
  private readonly questRepo = inject(QUEST_REPOSITORY);
  private readonly currentUser = inject(CURRENT_USER);
  private readonly fb = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);
  private readonly useCase = new CreateQuestUseCase(this.questRepo, this.currentUser);

  readonly questCreated = output<Quest>();
  readonly closed = output<void>();

  readonly step = signal<1 | 2>(1);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly rarities = RARITIES;
  readonly tags = TAGS;

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(QUEST_TITLE_MAX_LENGTH)]],
    tag: ['work' as QuestTag],
  });

  readonly titleLength = toSignal(
    this.form.controls.title.valueChanges.pipe(
      map(value => value?.length ?? 0),
      startWith(0),
    ),
    { initialValue: 0 }
  );

  get tagControl() { return this.form.controls.tag; }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closed.emit();
  }

  nextStep() {
    if (this.form.get('title')?.invalid) return;
    this.step.set(2);
  }

  async selectRarity(rarity: QuestRarity) {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const quest = await this.useCase.execute({
        title: this.form.value.title?.trim() ?? '',
        rarity,
        tag: this.form.value.tag as QuestTag,
        today: true,
      });
      this.questCreated.emit(quest);
    } catch {
      this.errorMessage.set(this.transloco.translate('createQuest.saveError'));
    } finally {
      this.loading.set(false);
    }
  }
}
