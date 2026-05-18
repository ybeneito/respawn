import { describe, it, expect, vi } from 'vitest';
import { CreateQuestUseCase } from './create-quest.use-case';
import { Quest } from '../domain/quest/quest.entity';
import { IQuestRepository } from '../domain/quest/quest.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';

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

describe('CreateQuestUseCase', () => {
  it('creates a quest with the correct owner and rarity', async () => {
    const useCase = new CreateQuestUseCase(mockRepo, currentUser);
    const quest = await useCase.execute({ title: 'My quest', rarity: 'hi', tag: 'work', today: true });
    expect(quest.title).toBe('My quest');
    expect(quest.rarity).toBe('hi');
    expect(quest.status).toBe('todo');
    expect(quest.ownerId).toBe(USER_ID);
  });

  it('throws if title is empty or whitespace-only', () => {
    const useCase = new CreateQuestUseCase(mockRepo, currentUser);
    expect(() => useCase.execute({ title: '   ', rarity: 'low', tag: 'home', today: true })).toThrow();
  });

  it('throws if title exceeds max length', () => {
    const useCase = new CreateQuestUseCase(mockRepo, currentUser);
    expect(() => useCase.execute({ title: 'a'.repeat(256), rarity: 'low', tag: 'home', today: true })).toThrow();
  });
});
