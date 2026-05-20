import { UserProfile, CatPalette } from '../../domain/profile/user-profile.entity';
import { Streak } from '../../domain/profile/streak.entity';
import { CreateProfileDto, IUserProfileRepository } from '../../domain/profile/profile.repository';
import { supabase } from './supabase.client';

export class SupabaseProfileRepository implements IUserProfileRepository {
  async findById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error?.code === 'PGRST116') return null;
    if (error) throw error;
    return this.toEntity(data);
  }

  async save(profile: UserProfile): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        xp: profile.xp,
        level: profile.level,
        lives: profile.lives,
        streak_current: profile.streak.current,
        streak_longest: profile.streak.longest,
        last_activity_date: profile.streak.lastActivityDate?.toISOString().split('T')[0] ?? null,
      })
      .eq('id', profile.userId)
      .select()
      .single();
    if (error) throw error;
    return this.toEntity(data);
  }

  async updatePalette(userId: string, palette: CatPalette): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ palette })
      .eq('id', userId);
    if (error) throw error;
  }

  async updateOnboardingDone(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_done: true })
      .eq('id', userId);
    if (error) throw error;
  }

  async updateTourDone(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ tour_done: true })
      .eq('id', userId);
    if (error) throw error;
  }

  async create(dto: CreateProfileDto): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: dto.userId, username: dto.username, palette: dto.palette })
      .select()
      .single();
    if (error) throw error;
    return this.toEntity(data);
  }

  private toEntity(row: Record<string, unknown>): UserProfile {
    const streak = new Streak(
      row['streak_current'] as number,
      row['streak_longest'] as number,
      row['last_activity_date'] ? new Date(row['last_activity_date'] as string) : null,
    );
    return new UserProfile(
      row['id'] as string,
      row['username'] as string,
      null,
      row['palette'] as CatPalette,
      row['xp'] as number,
      row['level'] as number,
      row['lives'] as number,
      streak,
      new Date(row['created_at'] as string),
      row['onboarding_done'] as boolean,
      row['tour_done'] as boolean,
    );
  }
}
