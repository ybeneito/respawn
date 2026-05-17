import { describe, it, expect, vi } from 'vitest';
import { CreateQuestUseCase } from './create-quest.use-case';
import { Quest } from '../domain/quest/quest.entity';
import { IQuestRepository } from '../domain/quest/quest.repository';

const mockRepo: IQuestRepository = {
  findByUser: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
  create: vi.fn().mockImplementation(async (dto) =>
    new Quest('new-id', dto.ownerId, dto.title, 'todo', dto.rarity, dto.tag, dto.today, null, new Date())
  ),
};

describe('CreateQuestUseCase', () => {
  it('crée une quête avec le bon owner et la bonne rareté', async () => {
    const useCase = new CreateQuestUseCase(mockRepo);
    const quest = await useCase.execute({ ownerId: 'u1', title: 'Ma quête', rarity: 'hi', tag: 'work', today: true });
    expect(quest.title).toBe('Ma quête');
    expect(quest.rarity).toBe('hi');
    expect(quest.status).toBe('todo');
  });
});
