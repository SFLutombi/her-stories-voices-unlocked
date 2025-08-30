-- Chapters and User Access Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
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

-- 3. Create story-covers storage bucket
-- Note: This needs to be done in Supabase Dashboard > Storage
-- Bucket name: story-covers
-- Public bucket: true
-- File size limit: 5MB
-- Allowed MIME types: image/*

-- 4. Add RLS policies for chapters
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Anyone can read published chapters
CREATE POLICY "Anyone can read published chapters" ON chapters
  FOR SELECT USING (published = true);

-- Authors can manage their own chapters
CREATE POLICY "Authors can manage own chapters" ON chapters
  FOR ALL USING (
    story_id IN (
      SELECT id FROM stories WHERE author_id = auth.uid()
    )
  );

-- 5. Add RLS policies for user_chapter_access
ALTER TABLE user_chapter_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases" ON user_chapter_access
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own purchases
CREATE POLICY "Users can insert own purchases" ON user_chapter_access
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_chapters_published ON chapters(published);
CREATE INDEX IF NOT EXISTS idx_chapters_story_published ON chapters(story_id, published);
CREATE INDEX IF NOT EXISTS idx_user_chapter_access_user_id ON user_chapter_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chapter_access_story_id ON user_chapter_access(story_id);

-- 7. Create function to update story total_chapters
CREATE OR REPLACE FUNCTION update_story_chapter_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE stories 
    SET total_chapters = (
      SELECT COUNT(*) FROM chapters WHERE story_id = NEW.story_id
    )
    WHERE id = NEW.story_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE stories 
    SET total_chapters = (
      SELECT COUNT(*) FROM chapters WHERE story_id = OLD.story_id
    )
    WHERE id = OLD.story_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to automatically update chapter count
DROP TRIGGER IF EXISTS trigger_update_chapter_count ON chapters;
CREATE TRIGGER trigger_update_chapter_count
  AFTER INSERT OR DELETE ON chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_story_chapter_count();

-- 9. Create view for discover page with chapter info
CREATE OR REPLACE VIEW discover_stories_with_chapters AS
SELECT 
  s.id,
  s.title,
  s.description,
  s.cover_image_url,
  s.price_per_chapter,
  s.total_chapters,
  s.is_anonymous,
  s.impact_percentage,
  s.published,
  s.created_at,
  s.category_id,
  c.name as category_name,
  p.display_name as author_name,
  p.is_anonymous as author_anonymous,
  COUNT(ch.id) as published_chapters_count
FROM stories s
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN profiles p ON s.author_id = p.user_id
LEFT JOIN chapters ch ON s.id = ch.story_id AND ch.published = true
WHERE s.published = true
GROUP BY s.id, c.name, p.display_name, p.is_anonymous
ORDER BY s.created_at DESC;

-- Grant permissions
GRANT SELECT ON discover_stories_with_chapters TO authenticated;

-- 10. Insert sample chapters for testing (optional)
-- Uncomment the lines below if you want to add sample chapters to existing stories

/*
INSERT INTO chapters (story_id, chapter_number, title, content, is_free, published)
SELECT 
  s.id,
  1,
  'Chapter 1: The Beginning',
  'This is the beginning of the story. The author will replace this with actual content.',
  true,
  true
FROM stories s
WHERE s.total_chapters = 0
LIMIT 5;
*/

-- Success message
SELECT 'Chapters schema created successfully! You can now:' as info;
SELECT '1. Create and manage chapters for your stories' as feature;
SELECT '2. Upload book covers using the CoverUpload component' as feature;
SELECT '3. Purchase chapters using smart contracts' as feature;
SELECT '4. Track user access to purchased chapters' as feature;
