import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StoryData {
  title: string;
  description: string;
  category: string;
  pricePerChapter: number;
  impactPercentage: number;
  isAnonymous: boolean;
  coverImageUrl?: string;
}

export interface ChapterData {
  title: string;
  content: string;
  price: number;
  isFree?: boolean;
}

/**
 * Create a story in the database only (blockchain is only used for purchases)
 */
export const createStory = async (
  storyData: StoryData,
  authorId: string,
  authorWallet: string
): Promise<{ success: boolean; storyId?: string; error?: string }> => {
  try {
    // Find the category ID from the category name
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', storyData.category)
      .single();

    if (categoryError || !categoryData) {
      console.error('Category not found:', storyData.category);
      return { success: false, error: `Category "${storyData.category}" not found in database` };
    }

    // Create story in Supabase database
    const { data: dbStory, error: dbError } = await supabase
      .from('stories')
      .insert({
        title: storyData.title,
        description: storyData.description,
        author_id: authorId,
        category_id: categoryData.id,
        price_per_chapter: storyData.pricePerChapter,
        impact_percentage: storyData.impactPercentage,
        is_anonymous: storyData.isAnonymous,
        cover_image_url: storyData.coverImageUrl,
        published: true,
        total_chapters: 0
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return { success: false, error: 'Failed to save story to database' };
    }

    console.log('Story created successfully:', {
      storyId: dbStory.id,
      categoryId: categoryData.id,
      categoryName: storyData.category
    });

    return { success: true, storyId: dbStory.id };
  } catch (error) {
    console.error('Error creating story:', error);
    return { success: false, error: 'Failed to create story' };
  }
};

/**
 * Add a chapter to a story (database only)
 */
export const addChapter = async (
  storyId: string,
  chapterData: ChapterData,
  authorId: string
): Promise<{ success: boolean; chapterId?: string; error?: string }> => {
  try {
    // Get story info from database
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('price_per_chapter, total_chapters')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return { success: false, error: 'Story not found' };
    }

    // Use story's price_per_chapter if chapter doesn't have a specific price
    const chapterPrice = chapterData.price || story.price_per_chapter;

    // Create chapter in database
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .insert({
        title: chapterData.title,
        content: chapterData.content,
        story_id: storyId,
        chapter_number: (story.total_chapters || 0) + 1,
        price: chapterPrice,
        is_free: chapterData.isFree || false,
        published: true
      })
      .select()
      .single();

    if (chapterError) {
      console.error('Error creating chapter:', chapterError);
      return { success: false, error: 'Failed to create chapter' };
    }

    // Update story's total chapters count
    await supabase
      .from('stories')
      .update({ total_chapters: (story.total_chapters || 0) + 1 })
      .eq('id', storyId);

    console.log('Chapter added successfully:', {
      chapterId: chapter.id,
      storyId: storyId,
      chapterNumber: chapter.chapter_number
    });

    return { success: true, chapterId: chapter.id };
  } catch (error) {
    console.error('Error adding chapter:', error);
    return { success: false, error: 'Failed to add chapter' };
  }
};

/**
 * Get story information from database
 */
export const getStoryInfo = async (storyId: string) => {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        categories(name),
        profiles(display_name, wallet_address)
      `)
      .eq('id', storyId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting story info:', error);
    return { success: false, error: 'Failed to get story info' };
  }
};

/**
 * Check if user has access to a chapter
 */
export const checkChapterAccess = async (chapterId: string, userId: string) => {
  try {
    // Check if chapter is free
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('is_free, story_id')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      return { success: false, error: 'Chapter not found' };
    }

    if (chapter.is_free) {
      return { success: true, hasAccess: true };
    }

    // Check if user has purchased the chapter
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('id')
      .eq('chapter_id', chapterId)
      .eq('user_id', userId)
      .single();

    if (purchaseError && purchaseError.code !== 'PGRST116') {
      console.error('Error checking purchase:', purchaseError);
      return { success: false, error: 'Failed to check purchase status' };
    }

    return { success: true, hasAccess: !!purchase };
  } catch (error) {
    console.error('Error checking chapter access:', error);
    return { success: false, error: 'Failed to check chapter access' };
  }
};