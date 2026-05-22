import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CreateQuestUseCase } from './create-quest.use-case';
import { Quest } from '../domain/quest/quest.entity';
import { IQuestRepository } from '../domain/quest/quest.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';
import { QUEST_REPOSITORY, CURRENT_USER } from '../app/core/di-tokens';

const USER_ID = 'u1';
const currentUser: ICurrentUserPort = { getUserId: () => USER_ID };

const mockRepo: IQuestRepository = {
  findByUser: vi.fn(),
  findByIdForUser: vi.fn(),
  save: vi.fn(),
  create: vi.fn().mockImplementation(async (dto) =>
    new Quest('new-id', dto.ownerId, dto.title, 'todo', dto.rarity, dto.tag, dto.today, null, new Date())
  ),
};

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      { provide: QUEST_REPOSITORY, useValue: mockRepo },
      { provide: CURRENT_USER, useValue: currentUser },
    ],
  });
});

afterEach(() => TestBed.resetTestingModule());

describe('CreateQuestUseCase', () => {
  it('creates a quest with the correct owner and rarity', async () => {
    const useCase = TestBed.inject(CreateQuestUseCase);
    const quest = await useCase.execute({ title: 'My quest', rarity: 'hi', tag: 'work', today: true });
    expect(quest.title).toBe('My quest');
    expect(quest.rarity).toBe('hi');
    expect(quest.status).toBe('todo');
    expect(quest.ownerId).toBe(USER_ID);
  });

  it('throws if title is empty or whitespace-only', () => {
    const useCase = TestBed.inject(CreateQuestUseCase);
    expect(() => useCase.execute({ title: '   ', rarity: 'low', tag: 'home', today: true })).toThrow();
  });

  it('throws if title exceeds max length', () => {
    const useCase = TestBed.inject(CreateQuestUseCase);
    expect(() => useCase.execute({ title: 'a'.repeat(256), rarity: 'low', tag: 'home', today: true })).toThrow();
  });
});
