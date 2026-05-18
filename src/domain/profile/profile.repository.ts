import { UserProfile, CatPalette } from './user-profile.entity';

export interface CreateProfileDto {
  userId: string;
  username: string;
  palette: CatPalette;
}

export interface IUserProfileRepository {
  findById(userId: string): Promise<UserProfile | null>;
  save(profile: UserProfile): Promise<UserProfile>;
  create(dto: CreateProfileDto): Promise<UserProfile>;
  updatePalette(userId: string, palette: CatPalette): Promise<void>;
}
