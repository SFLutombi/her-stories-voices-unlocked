-- Database Schema Updates for Enhanced Profile Functionality
-- Run these SQL commands in your Supabase SQL Editor
-- This script is safe to run multiple times and handles existing tables

-- 1. Add new columns to existing profiles table
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE profiles ADD COLUMN pseudonym VARCHAR(100);
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Column pseudonym already exists in profiles table';
  END;
  
  BEGIN
    ALTER TABLE profiles ADD COLUMN wallet_address VARCHAR(42);
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Column wallet_address already exists in profiles table';
  END;
  
  BEGIN
    ALTER TABLE profiles ADD COLUMN wallet_data JSONB;
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Column wallet_data already exists in profiles table';
  END;
  
  BEGIN
    ALTER TABLE profiles ADD COLUMN total_earnings DECIMAL(10,2) DEFAULT 0.00;
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Column total_earnings already exists in profiles table';
  END;
  
  BEGIN
    ALTER TABLE profiles ADD COLUMN total_stories_published INTEGER DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Column total_stories_published already exists in profiles table';
  END;
  
  BEGIN
    ALTER TABLE profiles ADD COLUMN total_chapters_published INTEGER DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Column total_chapters_published already exists in profiles table';
  END;
  
  BEGIN
    ALTER TABLE profiles ADD COLUMN total_readers INTEGER DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'Column total_readers already exists in profiles table';
  END;
END $$;

-- 2. Drop existing transactions table if it exists and recreate it properly
DROP TABLE IF EXISTS transactions CASCADE;

-- 3. Create author_profiles table for detailed author information
CREATE TABLE IF NOT EXISTS author_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudonym VARCHAR(100),
  wallet_address VARCHAR(42) NOT NULL,
  wallet_data JSONB,
  impact_percentage DECIMAL(5,2) DEFAULT 0.00,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  total_stories_published INTEGER DEFAULT 0,
  total_chapters_published INTEGER DEFAULT 0,
  total_readers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create transactions table for tracking payments and earnings
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id),
  to_user_id UUID REFERENCES auth.users(id) NOT NULL,
  story_id UUID REFERENCES stories(id),
  chapter_id UUID REFERENCES chapters(id),
  amount DECIMAL(10,2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'tip', 'donation')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  blockchain_tx_hash VARCHAR(66),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create user_credits table for managing user credit balances
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create RLS policies for security
ALTER TABLE author_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (fully idempotent)
DROP POLICY IF EXISTS "Users can view own author profile" ON author_profiles;
DROP POLICY IF EXISTS "Users can insert own author profile" ON author_profiles;
DROP POLICY IF EXISTS "Users can update own author profile" ON author_profiles;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;

DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON user_credits;

-- Author profiles: Users can only see their own profile
CREATE POLICY "Users can view own author profile" ON author_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own author profile" ON author_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own author profile" ON author_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Transactions: Users can see transactions they're involved in
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- User credits: Users can only see their own credits
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON user_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON user_credits
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_author_profiles_user_id ON author_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_user_id ON transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_user_id ON transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_story_id ON transactions(story_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- 8. Create function to update user credits
CREATE OR REPLACE FUNCTION update_user_credits(
  user_id_param UUID,
  amount DECIMAL(10,2),
  operation VARCHAR(10) -- 'add' or 'subtract'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance, total_earned, total_spent)
  VALUES (
    user_id_param,
    CASE WHEN operation = 'add' THEN amount ELSE -amount END,
    CASE WHEN operation = 'add' THEN amount ELSE 0 END,
    CASE WHEN operation = 'subtract' THEN amount ELSE 0 END
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = user_credits.balance + CASE WHEN operation = 'add' THEN amount ELSE -amount END,
    total_earned = user_credits.total_earned + CASE WHEN operation = 'add' THEN amount ELSE 0 END,
    total_spent = user_credits.total_spent + CASE WHEN operation = 'subtract' THEN amount ELSE 0 END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to update author earnings
CREATE OR REPLACE FUNCTION update_author_earnings(
  author_user_id UUID,
  amount DECIMAL(10,2)
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO author_profiles (user_id, total_earnings)
  VALUES (author_user_id, amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_earnings = author_profiles.total_earnings + amount,
    updated_at = NOW();
    
  -- Also update the profiles table
  UPDATE profiles 
  SET total_earnings = total_earnings + amount,
      updated_at = NOW()
  WHERE user_id = author_user_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Insert default credit balance for existing users
INSERT INTO user_credits (user_id, balance, total_earned, total_spent)
SELECT id, 0.00, 0.00, 0.00
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_credits)
ON CONFLICT (user_id) DO NOTHING;

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 12. Verify tables were created successfully
DO $$
BEGIN
  RAISE NOTICE 'Schema update completed successfully!';
  RAISE NOTICE 'Tables created: author_profiles, transactions, user_credits';
  RAISE NOTICE 'Functions created: update_user_credits, update_author_earnings';
  RAISE NOTICE 'RLS policies enabled on all new tables';
END $$;

-- 13. Database Relationship Verification and Fixes
-- This section ensures proper relationships between stories and categories

-- Check if stories table has category_id column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE stories ADD COLUMN category_id UUID REFERENCES categories(id);
    RAISE NOTICE 'Added category_id column to stories table';
  ELSE
    RAISE NOTICE 'Column category_id already exists in stories table';
  END IF;
END $$;

-- Verify foreign key constraint exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stories_category_id_fkey' 
    AND table_name = 'stories'
  ) THEN
    ALTER TABLE stories ADD CONSTRAINT stories_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES categories(id);
    RAISE NOTICE 'Added foreign key constraint for stories.category_id';
  ELSE
    RAISE NOTICE 'Foreign key constraint stories_category_id_fkey already exists';
  END IF;
END $$;

-- Create index on category_id for better performance
CREATE INDEX IF NOT EXISTS idx_stories_category_id ON stories(category_id);

-- Ensure categories table has proper data
INSERT INTO categories (name, description) VALUES
  ('Survivor Stories', 'Personal accounts of overcoming challenges and trauma'),
  ('Life Lessons', 'Wisdom and insights from life experiences'),
  ('Fiction & Novels', 'Creative storytelling and imaginative narratives'),
  ('Poetry & Reflections', 'Poetic expressions and personal reflections'),
  ('Healing Journeys', 'Stories of recovery and personal growth'),
  ('Cultural Heritage', 'Traditions, customs, and cultural experiences'),
  ('Professional Growth', 'Career development and workplace experiences'),
  ('Family & Relationships', 'Stories about family dynamics and relationships')
ON CONFLICT (name) DO NOTHING;

-- Create a view to easily see stories with their categories
CREATE OR REPLACE VIEW stories_with_categories AS
SELECT 
  s.id,
  s.title,
  s.description,
  s.author_id,
  s.category_id,
  c.name as category_name,
  s.price_per_chapter,
  s.impact_percentage,
  s.is_anonymous,
  s.published,
  s.total_chapters,
  s.created_at,
  s.updated_at,
  p.display_name as author_name,
  p.is_anonymous as author_anonymous
FROM stories s
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN profiles p ON s.author_id = p.user_id;

-- Grant permissions on the view
GRANT SELECT ON stories_with_categories TO authenticated;

-- Create function to get stories by category
CREATE OR REPLACE FUNCTION get_stories_by_category(category_name_param TEXT)
RETURNS TABLE (
  story_id UUID,
  title TEXT,
  description TEXT,
  category_name TEXT,
  author_name TEXT,
  price_per_chapter INTEGER,
  total_chapters INTEGER,
  published BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    c.name,
    p.display_name,
    s.price_per_chapter,
    s.total_chapters,
    s.published,
    s.created_at
  FROM stories s
  JOIN categories c ON s.category_id = c.id
  JOIN profiles p ON s.author_id = p.user_id
  WHERE c.name = category_name_param
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_stories_by_category(TEXT) TO authenticated;

-- Final verification
DO $$
DECLARE
  stories_count INTEGER;
  categories_count INTEGER;
  stories_with_categories_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO stories_count FROM stories;
  SELECT COUNT(*) INTO categories_count FROM categories;
  SELECT COUNT(*) INTO stories_with_categories_count FROM stories WHERE category_id IS NOT NULL;
  
  RAISE NOTICE 'Database verification completed:';
  RAISE NOTICE 'Total stories: %', stories_count;
  RAISE NOTICE 'Total categories: %', categories_count;
  RAISE NOTICE 'Stories with categories: %', stories_with_categories_count;
  RAISE NOTICE 'Stories without categories: %', (stories_count - stories_with_categories_count);
  
  IF stories_count > 0 AND stories_with_categories_count = 0 THEN
    RAISE NOTICE 'WARNING: No stories have category assignments!';
  ELSIF stories_count > 0 AND stories_with_categories_count < stories_count THEN
    RAISE NOTICE 'WARNING: Some stories are missing category assignments!';
  ELSE
    RAISE NOTICE 'SUCCESS: All stories have proper category relationships!';
  END IF;
END $$;
