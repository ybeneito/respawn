-- Enforce valid ranges on gamification columns to prevent client-side manipulation.
-- RLS alone can't restrict *values*, only row-level access.

ALTER TABLE profiles
  ADD CONSTRAINT profiles_xp_non_negative    CHECK (xp >= 0),
  ADD CONSTRAINT profiles_level_bounds       CHECK (level BETWEEN 1 AND 1000),
  ADD CONSTRAINT profiles_lives_bounds       CHECK (lives BETWEEN 0 AND 99);

-- Index to make owner-scoped quest lookups fast (used by findByIdForUser).
CREATE INDEX IF NOT EXISTS quests_owner_id_idx ON quests (owner_id);
