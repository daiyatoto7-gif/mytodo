-- Add google_token_expires_at column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ;
