import { Quest } from '../domain/quest/quest.entity';
import { CreateQuestDto, IQuestRepository } from '../domain/quest/quest.repository';
import { ICurrentUserPort } from '../domain/auth/current-user.port';

const TITLE_MIN_LENGTH = 1;
export const QUEST_TITLE_MAX_LENGTH = 255;

export class CreateQuestUseCase {
  constructor(
    private readonly questRepo: IQuestRepository,
    private readonly currentUser: ICurrentUserPort,
  ) {}

  execute(dto: Omit<CreateQuestDto, 'ownerId'>): Promise<Quest> {
    const title = dto.title.trim();
    if (title.length < TITLE_MIN_LENGTH || title.length > QUEST_TITLE_MAX_LENGTH) {
      throw new Error(`Quest title must be between ${TITLE_MIN_LENGTH} and ${QUEST_TITLE_MAX_LENGTH} characters.`);
    }

    const ownerId = this.currentUser.getUserId();
    return this.questRepo.create({ ...dto, title, ownerId });
  }
}
