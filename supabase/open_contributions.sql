-- =============================================================================
-- Open Contributions Table for Muski's 19th Birthday
-- Allows friends & contributors to submit scratch cards, photos, audio & stickers
-- without requiring tokens, logins, or approvals.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.contributions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author     TEXT NOT NULL,
  title      TEXT,
  message    TEXT,
  emoji      TEXT DEFAULT '🎂',
  rarity     TEXT DEFAULT 'RARE',
  theme      TEXT DEFAULT 'theme2',
  media      JSONB DEFAULT '[]'::jsonb,
  stickers   JSONB DEFAULT '[]'::jsonb,
  vault_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Allow public read & write access
CREATE POLICY "Public can insert contributions"
  ON public.contributions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can read contributions"
  ON public.contributions
  FOR SELECT
  USING (true);
