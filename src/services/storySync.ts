import { supabase } from '@/integrations/supabase/client';
import { 
  createStoryOnChain, 
  addChapterOnChain,
  getStoryInfoOnChain,
  checkChapterAccess 
} from '@/integrations/web3/contracts';
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
 * Create a story on both blockchain and database
 */
export const createStory = async (
  storyData: StoryData,
  authorId: string,
  authorWallet: string
): Promise<{ success: boolean; storyId?: string; error?: string }> => {
  try {
    // First, create story on blockchain
    const blockchainTx = await createStoryOnChain(
      storyData.title,
      storyData.description,
      storyData.category,
      storyData.pricePerChapter,
      storyData.impactPercentage,
      storyData.isAnonymous
    );

    // Get the story ID from blockchain (you might need to parse events or use a different approach)
    // For now, we'll use a placeholder - you'll need to implement this based on your contract events
    const blockchainStoryId = blockchainTx.events?.find(e => e.event === 'StoryCreated')?.args?.storyId || '1';

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

    // Create story in Supabase database with proper category_id
    const { data: dbStory, error: dbError } = await supabase
      .from('stories')
      .insert({
        title: storyData.title,
        description: storyData.description,
        author_id: authorId,
        category_id: categoryData.id, // ✅ Now properly setting category_id
        price_per_chapter: storyData.pricePerChapter,
        impact_percentage: storyData.impactPercentage,
        is_anonymous: storyData.isAnonymous,
        cover_image_url: storyData.coverImageUrl,
        published: false, // Start as unpublished
        total_chapters: 0
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return { success: false, error: 'Failed to save story to database' };
    }

    // Store blockchain reference in database
    await supabase
      .from('stories')
      .update({ 
        blockchain_id: blockchainStoryId,
        blockchain_tx_hash: blockchainTx.transactionHash 
      })
      .eq('id', dbStory.id);

    console.log('Story created successfully:', {
      storyId: dbStory.id,
      blockchainId: blockchainStoryId,
      categoryId: categoryData.id,
      categoryName: storyData.category
    });

    return { success: true, storyId: dbStory.id };
  } catch (error) {
    console.error('Error creating story:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Add a chapter to an existing story
 */
export const addChapter = async (
  storyId: string,
  chapterData: ChapterData,
  authorWallet: string
): Promise<{ success: boolean; chapterId?: string; error?: string }> => {
  try {
    // Get story from database to get blockchain ID
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('blockchain_id, price_per_chapter')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return { success: false, error: 'Story not found' };
    }

    // Add chapter to blockchain
    const blockchainTx = await addChapterOnChain(
      parseInt(story.blockchain_id || '1'),
      chapterData.title,
      chapterData.content, // In production, you'd hash this content
      chapterData.isFree ? 0 : (chapterData.price || story.price_per_chapter)
    );

    // Create chapter in database
    const { data: dbChapter, error: dbError } = await supabase
      .from('chapters')
      .insert({
        story_id: storyId,
        title: chapterData.title,
        content: chapterData.content,
        price: chapterData.isFree ? 0 : (chapterData.price || story.price_per_chapter),
        is_free: chapterData.isFree || false,
        published: false,
        chapter_number: 1 // You'll need to calculate this based on existing chapters
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return { success: false, error: 'Failed to save chapter to database' };
    }

    // Update story chapter count
    await supabase
      .from('stories')
      .update({ total_chapters: story.total_chapters + 1 })
      .eq('id', storyId);

    return { success: true, chapterId: dbChapter.id };
  } catch (error) {
    console.error('Error adding chapter:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Publish a story (make it visible on discover page)
 */
export const publishStory = async (
  storyId: string,
  authorId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Update story in database
    const { error: dbError } = await supabase
      .from('stories')
      .update({ published: true })
      .eq('id', storyId)
      .eq('author_id', authorId);

    if (dbError) {
      console.error('Database error:', dbError);
      return { success: false, error: 'Failed to publish story' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error publishing story:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Publish a chapter
 */
export const publishChapter = async (
  chapterId: string,
  storyId: string,
  authorId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify author owns the story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('author_id')
      .eq('id', storyId)
      .single();

    if (storyError || story?.author_id !== authorId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update chapter in database
    const { error: dbError } = await supabase
      .from('chapters')
      .update({ published: true })
      .eq('id', chapterId)
      .eq('story_id', storyId);

    if (dbError) {
      console.error('Database error:', dbError);
      return { success: false, error: 'Failed to publish chapter' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error publishing chapter:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Check if user has access to a chapter
 */
export const checkUserChapterAccess = async (
  userId: string,
  storyId: string,
  chapterId: string
): Promise<boolean> => {
  try {
    // First check database for access
    const { data: access, error } = await supabase
      .from('user_chapter_access')
      .select('*')
      .eq('user_id', userId)
      .eq('story_id', storyId)
      .eq('chapter_id', chapterId)
      .single();

    if (access) {
      return true;
    }

    // If no database access, check blockchain
    // You'll need to implement this based on your smart contract logic
    // For now, return false
    return false;
  } catch (error) {
    console.error('Error checking chapter access:', error);
    return false;
  }
};

/**
 * Sync blockchain data with database
 */
export const syncBlockchainData = async (): Promise<void> => {
  try {
    // This function would sync blockchain events with the database
    // Implementation depends on your specific smart contract events
    console.log('Syncing blockchain data...');
    
    // Example: Listen for StoryCreated events and update database
    // Example: Listen for ChapterPurchased events and update access records
    
  } catch (error) {
    console.error('Error syncing blockchain data:', error);
  }
};

/**
 * Get stories for discover page (combines database and blockchain data)
 */
export const getDiscoverStories = async () => {
  try {
    const { data: stories, error } = await supabase
      .from('stories')
      .select(`
        *,
        author:profiles!author_id(display_name, is_anonymous),
        category:categories(name),
        chapters(id, chapter_number, title, is_free, published)
      `)
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter stories that have at least one published chapter
    const validStories = stories?.filter(story => 
      story.chapters && story.chapters.some(chapter => chapter.published)
    ) || [];

    return validStories;
  } catch (error) {
    console.error('Error fetching discover stories:', error);
    return [];
  }
};
