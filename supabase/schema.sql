-- ==========================================================================
-- SUPABASE DATABASE SETUP FOR KINDNESS BOARD
-- Paste and execute this entire SQL script in your Supabase SQL Editor.
-- ==========================================================================

-- 1. Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    name TEXT DEFAULT '',
    email TEXT DEFAULT '',
    relationship TEXT NOT NULL DEFAULT 'Student',
    category TEXT NOT NULL DEFAULT 'Words of Hope',
    message TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pending',
    warmth_count INT NOT NULL DEFAULT 0,
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies
-- Policy: Anyone can read messages (for public board display)
DROP POLICY IF EXISTS "Allow public read access to messages" ON public.messages;
CREATE POLICY "Allow public read access to messages"
ON public.messages FOR SELECT
USING (true);

-- Policy: Anyone can submit new messages
DROP POLICY IF EXISTS "Allow public insert of messages" ON public.messages;
CREATE POLICY "Allow public insert of messages"
ON public.messages FOR INSERT
WITH CHECK (true);

-- Policy: Anyone can update warmth count and message status
DROP POLICY IF EXISTS "Allow public update of messages" ON public.messages;
CREATE POLICY "Allow public update of messages"
ON public.messages FOR UPDATE
USING (true)
WITH CHECK (true);

-- Policy: Allow deletion of messages
DROP POLICY IF EXISTS "Allow public delete of messages" ON public.messages;
CREATE POLICY "Allow public delete of messages"
ON public.messages FOR DELETE
USING (true);

-- Database is ready. No seed data — the board starts clean.
-- All messages will come from real student submissions.
