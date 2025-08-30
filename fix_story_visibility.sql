-- Fix Story Visibility for Discover Page
-- This script ensures stories are visible on the discover page

-- 1. Check current story status
SELECT 
  'Current Story Status' as info,
  COUNT(*) as total_stories,
  COUNT(CASE WHEN published = true THEN 1 END) as published_stories,
  COUNT(CASE WHEN published = false THEN 1 END) as unpublished_stories
FROM stories;

-- 2. Mark all existing stories as published so they show on discover page
UPDATE stories 
SET published = true 
WHERE published = false;

-- 3. Verify the fix
SELECT 
  'After Fix' as info,
  COUNT(*) as total_stories,
  COUNT(CASE WHEN published = true THEN 1 END) as published_stories,
  COUNT(CASE WHEN published = false THEN 1 END) as unpublished_stories
FROM stories;

-- 4. Show all stories with their current status
SELECT 
  id,
  title,
  published,
  total_chapters,
  created_at,
  category_id
FROM stories 
ORDER BY created_at DESC;

-- 5. Create a simple view for discover page
CREATE OR REPLACE VIEW discover_stories AS
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
  p.is_anonymous as author_anonymous
FROM stories s
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN profiles p ON s.author_id = p.user_id
WHERE s.published = true
ORDER BY s.created_at DESC;

-- Grant permissions
GRANT SELECT ON discover_stories TO authenticated;

-- Success message
SELECT 'Story visibility fixed successfully! All stories are now published and will show on the discover page.' as status;
