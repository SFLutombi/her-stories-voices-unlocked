-- Fix Existing Stories Missing Category Assignments
-- Run this script in your Supabase SQL Editor to fix stories without categories

-- 1. Check current status
SELECT 
  'Current Status' as info,
  COUNT(*) as total_stories,
  COUNT(category_id) as stories_with_categories,
  COUNT(*) - COUNT(category_id) as stories_without_categories
FROM stories;

-- 2. Show stories without categories
SELECT 
  id,
  title,
  description,
  created_at
FROM stories 
WHERE category_id IS NULL;

-- 3. Fix stories without categories by assigning a default category
-- This will assign all uncategorized stories to "Life Lessons" category
UPDATE stories 
SET category_id = (
  SELECT id FROM categories WHERE name = 'Life Lessons' LIMIT 1
)
WHERE category_id IS NULL;

-- 4. Verify the fix
SELECT 
  'After Fix' as info,
  COUNT(*) as total_stories,
  COUNT(category_id) as stories_with_categories,
  COUNT(*) - COUNT(category_id) as stories_without_categories
FROM stories;

-- 5. Show updated stories
SELECT 
  s.id,
  s.title,
  c.name as category_name,
  s.created_at
FROM stories s
LEFT JOIN categories c ON s.category_id = c.id
ORDER BY s.created_at DESC;

-- 6. Create a comprehensive view for easy access
CREATE OR REPLACE VIEW stories_complete AS
SELECT 
  s.id,
  s.title,
  s.description,
  s.author_id,
  s.category_id,
  c.name as category_name,
  c.description as category_description,
  s.price_per_chapter,
  s.impact_percentage,
  s.is_anonymous,
  s.published,
  s.total_chapters,
  s.created_at,
  s.updated_at,
  p.display_name as author_name,
  p.is_anonymous as author_anonymous,
  p.wallet_address as author_wallet,
  CASE 
    WHEN s.blockchain_id IS NOT NULL THEN 'blockchain'
    ELSE 'database'
  END as story_source
FROM stories s
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN profiles p ON s.author_id = p.user_id;

-- Grant permissions
GRANT SELECT ON stories_complete TO authenticated;

-- Success message
SELECT 'Existing stories fixed successfully!' as status;

