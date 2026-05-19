-- Grant table-level privileges to authenticated role.
-- RLS policies alone are insufficient: PostgreSQL checks GRANT before evaluating
-- RLS, so without these the 42501 "permission denied" is raised before any policy runs.
-- Local Docker includes this via ALTER DEFAULT PRIVILEGES in its bootstrap image;
-- the hosted project requires explicit grants.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quests   TO authenticated;
