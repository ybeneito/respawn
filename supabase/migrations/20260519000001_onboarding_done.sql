-- Add onboarding_done flag to track whether a user has completed the cat-picker step.
-- Existing rows default to FALSE — they will be redirected to /onboarding on next visit.
ALTER TABLE profiles
  ADD COLUMN onboarding_done BOOLEAN NOT NULL DEFAULT FALSE;
