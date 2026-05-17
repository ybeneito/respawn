import { Injectable } from '@angular/core';
import { Quest, QuestRarity, QuestStatus, QuestTag } from '../../domain/quest/quest.entity';
import { CreateQuestDto, IQuestRepository } from '../../domain/quest/quest.repository';
import { supabase } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseQuestRepository implements IQuestRepository {
  async findByUser(userId: string): Promise<Quest[]> {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.toEntity);
  }

  async findById(id: string): Promise<Quest | null> {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return this.toEntity(data);
  }

  async save(quest: Quest): Promise<Quest> {
    const { data, error } = await supabase
      .from('quests')
      .update({
        status: quest.status,
        completed_at: quest.completedAt?.toISOString() ?? null,
      })
      .eq('id', quest.id)
      .select()
      .single();
    if (error) throw error;
    return this.toEntity(data);
  }

  async create(dto: CreateQuestDto): Promise<Quest> {
    const { data, error } = await supabase
      .from('quests')
      .insert({
        owner_id: dto.ownerId,
        title: dto.title,
        rarity: dto.rarity,
        tag: dto.tag,
        today: dto.today,
      })
      .select()
      .single();
    if (error) throw error;
    return this.toEntity(data);
  }

  private toEntity(row: Record<string, unknown>): Quest {
    return new Quest(
      row['id'] as string,
      row['owner_id'] as string,
      row['title'] as string,
      row['status'] as QuestStatus,
      row['rarity'] as QuestRarity,
      row['tag'] as QuestTag,
      row['today'] as boolean,
      row['completed_at'] ? new Date(row['completed_at'] as string) : null,
      new Date(row['created_at'] as string),
    );
  }
}