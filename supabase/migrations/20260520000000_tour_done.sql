-- Add tour_done flag to track whether a user has completed the guided onboarding tour.
-- Existing rows default to FALSE — the tour will show on their next dashboard visit.
ALTER TABLE profiles
  ADD COLUMN tour_done BOOLEAN NOT NULL DEFAULT FALSE;
