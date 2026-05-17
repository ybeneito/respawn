import { Quest, QuestRarity, QuestTag } from './quest.entity';

export interface CreateQuestDto {
  ownerId: string;
  title: string;
  rarity: QuestRarity;
  tag: QuestTag;
  today: boolean;
}

export interface IQuestRepository {
  findByUser(userId: string): Promise<Quest[]>;
  findById(id: string): Promise<Quest | null>;
  save(quest: Quest): Promise<Quest>;
  create(dto: CreateQuestDto): Promise<Quest>;
}
