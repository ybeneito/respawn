-- Fix: handle_new_user ran under supabase_auth_admin whose search_path does not
-- include public, causing "relation profiles does not exist" on every signup.
-- Setting search_path = '' and using fully-qualified table names is the
-- recommended Supabase pattern for SECURITY DEFINER triggers.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(SPLIT_PART(NEW.email, '@', 1), 'user_' || SUBSTR(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$;
