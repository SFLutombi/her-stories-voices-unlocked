-- Blockchain Integration Schema Updates for HerStories
-- Run this in your Supabase SQL Editor

-- Step 1: Add blockchain_tx_hash column to stories table (only if it doesn't exist)
-- Note: blockchain_id column already exists, so we skip adding it
DO $$ 
BEGIN
  -- Add blockchain_tx_hash column only
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'blockchain_tx_hash'
  ) THEN
    ALTER TABLE stories ADD COLUMN blockchain_tx_hash TEXT;
    RAISE NOTICE 'Added blockchain_tx_hash column to stories table';
  ELSE
    RAISE NOTICE 'Column blockchain_tx_hash already exists in stories table';
  END IF;
END $$;

-- Step 2: Create blockchain-related tables
CREATE TABLE IF NOT EXISTS user_chapter_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blockchain_tx_hash TEXT,
  access_granted BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, story_id, chapter_id)
);

CREATE TABLE IF NOT EXISTS blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contract_address TEXT NOT NULL,
  function_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  gas_used BIGINT,
  gas_price TEXT,
  block_number BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS blockchain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT REFERENCES blockchain_transactions(tx_hash) ON DELETE CASCADE,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB,
  block_number BIGINT,
  log_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_stories_blockchain_id ON stories(blockchain_id);
CREATE INDEX IF NOT EXISTS idx_stories_blockchain_tx ON stories(blockchain_tx_hash);
CREATE INDEX IF NOT EXISTS idx_user_chapter_access_user ON user_chapter_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chapter_access_story ON user_chapter_access(story_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_hash ON blockchain_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_user ON blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_status ON blockchain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_tx ON blockchain_events(tx_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_contract ON blockchain_events(contract_address);

-- Step 4: Enable Row Level Security
ALTER TABLE user_chapter_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_events ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
CREATE POLICY "Users can view their own chapter access" ON user_chapter_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chapter access" ON user_chapter_access
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" ON blockchain_transactions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert their own transactions" ON blockchain_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view blockchain events" ON blockchain_events
  FOR SELECT USING (true);

-- Step 6: Create helper functions
CREATE OR REPLACE FUNCTION update_blockchain_transaction_status(
  p_tx_hash TEXT,
  p_status TEXT,
  p_gas_used BIGINT DEFAULT NULL,
  p_block_number BIGINT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE blockchain_transactions 
  SET 
    status = p_status,
    gas_used = COALESCE(p_gas_used, gas_used),
    block_number = COALESCE(p_block_number, block_number),
    error_message = COALESCE(p_error_message, error_message),
    confirmed_at = CASE WHEN p_status = 'confirmed' THEN now() ELSE confirmed_at END
  WHERE tx_hash = p_tx_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_blockchain_event(
  p_tx_hash TEXT,
  p_contract_address TEXT,
  p_event_name TEXT,
  p_event_data JSONB DEFAULT NULL,
  p_block_number BIGINT DEFAULT NULL,
  p_log_index INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO blockchain_events (
    tx_hash, contract_address, event_name, event_data, block_number, log_index
  ) VALUES (
    p_tx_hash, p_contract_address, p_event_name, p_event_data, p_block_number, p_log_index
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_story_access(
  p_user_id UUID,
  p_story_id UUID
) RETURNS TABLE (
  has_access BOOLEAN,
  access_granted_at TIMESTAMP WITH TIME ZONE,
  blockchain_tx_hash TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uca.access_granted,
    uca.purchased_at,
    uca.blockchain_tx_hash
  FROM user_chapter_access uca
  WHERE uca.user_id = p_user_id 
    AND uca.story_id = p_story_id
    AND uca.access_granted = true
    AND (uca.expires_at IS NULL OR uca.expires_at > now())
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_chapter_access(
  p_user_id UUID,
  p_story_id UUID,
  p_chapter_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_chapter_access uca
    WHERE uca.user_id = p_user_id 
      AND uca.story_id = p_story_id
      AND uca.chapter_id = p_chapter_id
      AND uca.access_granted = true
      AND (uca.expires_at IS NULL OR uca.expires_at > now())
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_chapter_access TO authenticated;
GRANT ALL ON blockchain_transactions TO authenticated;
GRANT ALL ON blockchain_events TO authenticated;
GRANT EXECUTE ON FUNCTION update_blockchain_transaction_status TO authenticated;
GRANT EXECUTE ON FUNCTION record_blockchain_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_story_access TO authenticated;
GRANT EXECUTE ON FUNCTION check_chapter_access TO authenticated;

-- Step 8: Add sample categories
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

-- Step 9: Create view
CREATE OR REPLACE VIEW stories_with_blockchain AS
SELECT 
  s.*,
  p.display_name as author_name,
  p.is_anonymous as author_anonymous,
  c.name as category_name,
  CASE 
    WHEN s.blockchain_id IS NOT NULL THEN 'blockchain'
    ELSE 'database'
  END as story_source
FROM stories s
LEFT JOIN profiles p ON s.author_id = p.user_id
LEFT JOIN categories c ON s.category_id = c.id;

GRANT SELECT ON stories_with_blockchain TO authenticated;

-- Success message
SELECT 'Blockchain integration schema updated successfully!' as status;
