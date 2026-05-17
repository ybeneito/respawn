-- Profiles (étend auth.users)
CREATE TABLE profiles (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username           TEXT UNIQUE NOT NULL,
  palette            TEXT NOT NULL DEFAULT 'orange',
  xp                 INTEGER NOT NULL DEFAULT 0,
  level              INTEGER NOT NULL DEFAULT 1,
  lives              INTEGER NOT NULL DEFAULT 9,
  streak_current     INTEGER NOT NULL DEFAULT 0,
  streak_longest     INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quests
CREATE TABLE quests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  rarity       TEXT NOT NULL DEFAULT 'med' CHECK (rarity IN ('low','med','hi','urg')),
  tag          TEXT NOT NULL DEFAULT 'work' CHECK (tag IN ('work','health','learn','home','side-quest')),
  status       TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  today        BOOLEAN NOT NULL DEFAULT TRUE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests   ENABLE ROW LEVEL SECURITY;

-- profiles : lecture publique (phase 2 leaderboard), écriture sur son propre profil
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()));

-- quests : CRUD sur ses propres quêtes uniquement
CREATE POLICY "quests_all" ON quests
  TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- Trigger : créer un profil vide à la création du compte
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
