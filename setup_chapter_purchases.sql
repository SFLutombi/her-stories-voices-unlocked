-- Setup Chapter Purchase System
-- Run this in your Supabase SQL Editor
-- This script is safe to run multiple times and handles existing objects gracefully

-- 1. Ensure profiles table has wallet_balance column
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE profiles ADD COLUMN wallet_balance INTEGER DEFAULT 0;
    RAISE NOTICE 'Added wallet_balance column to profiles table';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Column wallet_balance already exists in profiles table';
  END;
END $$;

-- 2. Create user_chapter_access table for tracking purchases
CREATE TABLE IF NOT EXISTS user_chapter_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blockchain_tx_hash TEXT,
  UNIQUE(user_id, chapter_id)
);

-- 3. Create transactions table for tracking payments and earnings
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id),
  to_user_id UUID NOT NULL REFERENCES auth.users(id),
  story_id UUID REFERENCES stories(id),
  chapter_id UUID REFERENCES chapters(id),
  amount INTEGER NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'tip', 'donation')),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  blockchain_tx_hash VARCHAR(66),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (safe to run multiple times)
ALTER TABLE user_chapter_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (fully idempotent)
DROP POLICY IF EXISTS "Users can view their own chapter access" ON user_chapter_access;
DROP POLICY IF EXISTS "Users can insert their own chapter access" ON user_chapter_access;
DROP POLICY IF EXISTS "Users can view their transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON transactions;

-- 6. Create RLS policies
-- Users can view their own chapter access
CREATE POLICY "Users can view their own chapter access" ON user_chapter_access
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own chapter access
CREATE POLICY "Users can insert their own chapter access" ON user_chapter_access
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view transactions they're involved in
CREATE POLICY "Users can view their transactions" ON transactions
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can insert transactions
CREATE POLICY "Users can insert transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- 7. Create indexes for performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_user_chapter_access_user ON user_chapter_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chapter_access_story ON user_chapter_access(story_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_user ON transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_story ON transactions(story_id);

-- 8. Grant necessary permissions (safe to run multiple times)
GRANT ALL ON user_chapter_access TO authenticated;
GRANT ALL ON transactions TO authenticated;

-- 9. Give existing users some welcome credits (only if they don't have any)
UPDATE profiles 
SET wallet_balance = 50 
WHERE wallet_balance = 0 OR wallet_balance IS NULL;

-- 10. Create a function to add welcome credits (safe to run multiple times)
CREATE OR REPLACE FUNCTION add_welcome_credits(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET wallet_balance = COALESCE(wallet_balance, 0) + 50
  WHERE user_id = user_uuid;
  
  INSERT INTO transactions (from_user_id, to_user_id, amount, transaction_type, status)
  VALUES (NULL, user_uuid, 50, 'donation', 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Grant execute permission on the function (safe to run multiple times)
GRANT EXECUTE ON FUNCTION add_welcome_credits(UUID) TO authenticated;

-- 12. Verify setup
DO $$
BEGIN
  RAISE NOTICE 'Chapter purchase system setup completed successfully!';
  RAISE NOTICE 'Tables created/verified: user_chapter_access, transactions';
  RAISE NOTICE 'Policies created/verified for both tables';
  RAISE NOTICE 'Indexes created/verified for performance';
  RAISE NOTICE 'Welcome credits function created/verified';
  RAISE NOTICE 'Existing users updated with welcome credits';
END $$;
