-- FRESH DATABASE SETUP - Complete Database Reset
-- Run this in your Supabase SQL Editor to start completely fresh
-- This will create all tables, columns, and relationships correctly

-- 1. DROP ALL EXISTING TABLES (START FRESH)
DROP TABLE IF EXISTS user_chapter_access CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS author_profiles CASCADE;
DROP TABLE IF EXISTS user_credits CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- 2. CREATE PROFILES TABLE
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  is_author BOOLEAN DEFAULT false,
  pseudonym TEXT,
  wallet_balance INTEGER DEFAULT 100,
  wallet_address TEXT,
  wallet_data JSONB,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE CATEGORIES TABLE
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE STORIES TABLE
CREATE TABLE stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  category_id UUID REFERENCES categories(id),
  price_per_chapter INTEGER NOT NULL DEFAULT 5,
  total_chapters INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  impact_percentage INTEGER DEFAULT 10,
  author_wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE CHAPTERS TABLE
CREATE TABLE chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_free BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, chapter_number)
);

-- 6. CREATE TRANSACTIONS TABLE
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'tip', 'donation')),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  blockchain_tx_hash VARCHAR(66),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CREATE USER_CHAPTER_ACCESS TABLE
CREATE TABLE user_chapter_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blockchain_tx_hash TEXT,
  UNIQUE(user_id, chapter_id)
);

-- 8. CREATE PURCHASES TABLE (for backward compatibility)
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- 8.5. CREATE AUTHOR_PROFILES TABLE
CREATE TABLE author_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudonym TEXT,
  wallet_address TEXT,
  wallet_data JSONB,
  impact_percentage INTEGER DEFAULT 10,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  total_stories_published INTEGER DEFAULT 0,
  total_chapters_published INTEGER DEFAULT 0,
  total_readers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.6. CREATE USER_CREDITS TABLE
CREATE TABLE user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_stories_author_id ON stories(author_id);
CREATE INDEX idx_stories_published ON stories(published);
CREATE INDEX idx_chapters_story_id ON chapters(story_id);
CREATE INDEX idx_chapters_published ON chapters(published);
CREATE INDEX idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX idx_transactions_to_user ON transactions(to_user_id);
CREATE INDEX idx_user_chapter_access_user ON user_chapter_access(user_id);
CREATE INDEX idx_user_chapter_access_story ON user_chapter_access(story_id);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_story ON purchases(story_id);
CREATE INDEX idx_author_profiles_user ON author_profiles(user_id);
CREATE INDEX idx_user_credits_user ON user_credits(user_id);

-- 10. INSERT DEFAULT CATEGORIES
INSERT INTO categories (name, description) VALUES
('Survivor Stories', 'Stories of resilience and overcoming challenges'),
('Life Lessons', 'Wisdom and insights from lived experiences'),
('Fiction & Novels', 'Creative fiction and storytelling'),
('Poetry & Reflections', 'Poetry and personal reflections')
ON CONFLICT (name) DO NOTHING;

-- 11. CREATE FUNCTIONS
-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to add welcome credits
CREATE OR REPLACE FUNCTION add_welcome_credits(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET wallet_balance = wallet_balance + 50 
  WHERE user_id = user_uuid;
  
  RAISE NOTICE 'Added 50 welcome credits to user %', user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user wallet address
CREATE OR REPLACE FUNCTION update_user_wallet_address(user_uuid UUID, wallet_addr TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET wallet_address = wallet_addr
  WHERE user_id = user_uuid;
  
  -- Also update any stories by this author
  UPDATE stories 
  SET author_wallet_address = wallet_addr
  WHERE author_id = user_uuid;
  
  RAISE NOTICE 'Updated wallet address for user % to %', user_uuid, wallet_addr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. CREATE TRIGGERS
-- Timestamp update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. ENABLE ROW LEVEL SECURITY (but with permissive policies for demo)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_chapter_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE author_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- 14. CREATE PERMISSIVE RLS POLICIES (for demo)
-- Profiles - everyone can read, users can update their own
CREATE POLICY "demo_profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "demo_profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "demo_profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Categories - everyone can read
CREATE POLICY "demo_categories_select_all" ON categories FOR SELECT USING (true);

-- Stories - everyone can read, authors can manage their own
CREATE POLICY "demo_stories_select_all" ON stories FOR SELECT USING (true);
CREATE POLICY "demo_stories_insert_own" ON stories FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "demo_stories_update_own" ON stories FOR UPDATE USING (auth.uid() = author_id);

-- Chapters - everyone can read, authors can manage their own
CREATE POLICY "demo_chapters_select_all" ON chapters FOR SELECT USING (true);
CREATE POLICY "demo_chapters_insert_own" ON chapters FOR INSERT WITH CHECK (auth.uid() = (SELECT author_id FROM stories WHERE id = story_id));
CREATE POLICY "demo_chapters_update_own" ON chapters FOR UPDATE USING (auth.uid() = (SELECT author_id FROM stories WHERE id = story_id));

-- Transactions - everyone can read, users can insert their own
CREATE POLICY "demo_transactions_select_all" ON transactions FOR SELECT USING (true);
CREATE POLICY "demo_transactions_insert_own" ON transactions FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- User chapter access - everyone can read, users can insert their own
CREATE POLICY "demo_user_chapter_access_select_all" ON user_chapter_access FOR SELECT USING (true);
CREATE POLICY "demo_user_chapter_access_insert_own" ON user_chapter_access FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Purchases - everyone can read, users can insert their own
CREATE POLICY "demo_purchases_select_all" ON purchases FOR SELECT USING (true);
CREATE POLICY "demo_purchases_insert_own" ON purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Author profiles - everyone can read, users can manage their own
CREATE POLICY "demo_author_profiles_select_all" ON author_profiles FOR SELECT USING (true);
CREATE POLICY "demo_author_profiles_insert_own" ON author_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "demo_author_profiles_update_own" ON author_profiles FOR UPDATE USING (auth.uid() = user_id);

-- User credits - everyone can read, users can manage their own
CREATE POLICY "demo_user_credits_select_all" ON user_credits FOR SELECT USING (true);
CREATE POLICY "demo_user_credits_insert_own" ON user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "demo_user_credits_update_own" ON user_credits FOR UPDATE USING (auth.uid() = user_id);

-- 15. GRANT PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 16. CREATE NEW USER HANDLER
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile for new user with proper error handling
  INSERT INTO profiles (user_id, display_name, wallet_balance)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'Anonymous User'),
    50  -- Give new users 50 welcome credits
  );
  
  RAISE NOTICE 'Created profile for new user: %', NEW.id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the user creation
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. CREATE TRIGGER FOR NEW USERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 18. GIVE EXISTING USERS WELCOME CREDITS
UPDATE profiles 
SET wallet_balance = 50 
WHERE wallet_balance = 0 OR wallet_balance IS NULL;

-- 19. SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '=== FRESH DATABASE SETUP COMPLETED SUCCESSFULLY! ===';
  RAISE NOTICE 'All tables created with proper relationships';
  RAISE NOTICE 'All RLS policies set to permissive for demo';
  RAISE NOTICE 'All foreign key constraints properly configured';
  RAISE NOTICE 'Demo should work without any database errors';
  RAISE NOTICE '================================================';
END $$;

-- 20. VERIFY SETUP - Test that everything is working
DO $$
DECLARE
  table_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'stories', 'chapters', 'transactions', 'user_chapter_access', 'purchases', 'categories', 'author_profiles', 'user_credits');
  
  -- Count triggers
  SELECT COUNT(*) INTO trigger_count 
  FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created';
  
  RAISE NOTICE 'Verification Results:';
  RAISE NOTICE 'Tables created: %/9', table_count;
  RAISE NOTICE 'User creation trigger: %', CASE WHEN trigger_count > 0 THEN 'OK' ELSE 'MISSING' END;
  
  IF table_count = 9 AND trigger_count > 0 THEN
    RAISE NOTICE '✅ Database setup verification PASSED';
  ELSE
    RAISE WARNING '❌ Database setup verification FAILED';
  END IF;
END $$;
