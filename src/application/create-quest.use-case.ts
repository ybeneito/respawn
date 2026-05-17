import { Quest } from '../domain/quest/quest.entity';
import { CreateQuestDto, IQuestRepository } from '../domain/quest/quest.repository';

export class CreateQuestUseCase {
  constructor(private readonly questRepo: IQuestRepository) {}

  execute(dto: CreateQuestDto): Promise<Quest> {
    return this.questRepo.create(dto);
  }
}