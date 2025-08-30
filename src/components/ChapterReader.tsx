import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Coins, Lock, Unlock, Heart, Eye, EyeOff, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  is_free: boolean;
  published: boolean;
  created_at: string;
}

interface Story {
  id: string;
  title: string;
  price_per_chapter: number;
  author_id: string;
}

interface ChapterReaderProps {
  storyId: string;
  onPurchaseComplete?: () => void;
}

const ChapterReader = ({ storyId, onPurchaseComplete }: ChapterReaderProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [userPurchases, setUserPurchases] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [userCredits, setUserCredits] = useState<number>(0);
  const [gettingCredits, setGettingCredits] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchChapters();
    fetchStory();
    if (user) {
      fetchUserPurchases();
      fetchUserCredits();
    }
  }, [storyId, user]);

  const fetchChapters = async () => {
    try {
      console.log('Fetching chapters for story:', storyId);
      
      // First, try to fetch all chapters (bypassing RLS temporarily for debugging)
      const { data: allChapters, error: allError } = await supabase
        .from('chapters')
        .select('*')
        .eq('story_id', storyId);
      
      console.log('All chapters (bypassing RLS):', { allChapters, allError });
      
      // Then try the normal query with RLS
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('story_id', storyId)
        .eq('published', true)
        .order('chapter_number');

      console.log('Published chapters (with RLS):', { data, error });

      if (error) throw error;
      setChapters(data || []);
      
      console.log('Set chapters state:', data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load chapters",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStory = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('id, title, price_per_chapter, author_id')
        .eq('id', storyId)
        .single();

      if (error) throw error;
      setStory(data);
    } catch (error) {
      console.error('Error fetching story:', error);
    }
  };

  const fetchUserPurchases = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_chapter_access')
        .select('chapter_id')
        .eq('user_id', user.id)
        .eq('story_id', storyId);

      if (error) throw error;
      
      const purchaseSet = new Set(data?.map(p => p.chapter_id) || []);
      setUserPurchases(purchaseSet);
    } catch (error) {
      console.error('Error fetching user purchases:', error);
    }
  };

  const fetchUserCredits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserCredits(data?.wallet_balance || 0);
    } catch (error) {
      console.error('Error fetching user credits:', error);
    }
  };

  const handleGetWelcomeCredits = async () => {
    if (!user) return;

    setGettingCredits(true);
    try {
      // Give new users 50 welcome credits
      const welcomeCredits = 50;
      
      // Update user balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({
          wallet_balance: userCredits + welcomeCredits,
        })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          from_user_id: null, // System generated
          to_user_id: user.id,
          story_id: null,
          chapter_id: null,
          amount: welcomeCredits,
          transaction_type: 'donation',
          status: 'completed',
          completed_at: new Date().toISOString(),
        });

      if (transactionError) throw transactionError;

      // Update local state
      setUserCredits(prev => prev + welcomeCredits);

      toast({
        title: "Welcome Credits Added! 🎉",
        description: `You've received ${welcomeCredits} welcome credits to get started.`,
      });
    } catch (error) {
      console.error('Error adding welcome credits:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add welcome credits. Please try again.",
      });
    } finally {
      setGettingCredits(false);
    }
  };

  const handlePurchaseChapter = async (chapter: Chapter) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase chapters",
      });
      return;
    }

    if (!story) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Story information not available",
      });
      return;
    }

    if (userCredits < story.price_per_chapter) {
      toast({
        variant: "destructive",
        title: "Insufficient credits",
        description: `You need ${story.price_per_chapter} credits to purchase this chapter. You have ${userCredits} credits.`,
      });
      return;
    }

    setPurchasing(chapter.id);
    try {
      // Create purchase record
      const { error: purchaseError } = await supabase
        .from('user_chapter_access')
        .insert({
          user_id: user.id,
          story_id: storyId,
          chapter_id: chapter.id,
          purchased_at: new Date().toISOString(),
        });

      if (purchaseError) throw purchaseError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          from_user_id: user.id,
          to_user_id: story.author_id,
          story_id: storyId,
          chapter_id: chapter.id,
          amount: story.price_per_chapter,
          transaction_type: 'purchase',
          status: 'completed',
          completed_at: new Date().toISOString(),
        });

      if (transactionError) throw transactionError;

      // Update user balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({
          wallet_balance: userCredits - story.price_per_chapter,
        })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      // Update local state
      setUserPurchases(prev => new Set([...prev, chapter.id]));
      setUserCredits(prev => prev - story.price_per_chapter);

      toast({
        title: "Chapter Purchased!",
        description: `You've supported the author with ${story.price_per_chapter} credits`,
      });

      onPurchaseComplete?.();
    } catch (error) {
      console.error('Error purchasing chapter:', error);
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: "Failed to purchase chapter. Please try again.",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const toggleChapterExpansion = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const canReadChapter = (chapter: Chapter) => {
    return chapter.is_free || userPurchases.has(chapter.id);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading chapters...</p>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium mb-2">No Chapters Available</h4>
          <p className="text-muted-foreground">
            This story doesn't have any published chapters yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Chapters ({chapters.length})</h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            {chapters.filter(c => c.is_free).length} free • {chapters.filter(c => !c.is_free).length} paid
          </div>
          {user && (
            <div className="text-sm text-green-600 font-medium">
              <Coins className="h-3 w-3 inline mr-1" />
              {userCredits} credits
            </div>
          )}
        </div>
      </div>

      {chapters.map((chapter, index) => (
        <Card key={chapter.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant="secondary">
                  Chapter {chapter.chapter_number}
                </Badge>
                <h4 className="font-medium">{chapter.title}</h4>
                {chapter.is_free && (
                  <Badge variant="outline" className="text-green-600">
                    <Unlock className="h-3 w-3 mr-1" />
                    Free
                  </Badge>
                )}
                {!chapter.is_free && canReadChapter(chapter) && (
                  <Badge variant="default" className="bg-green-600">
                    <Unlock className="h-3 w-3 mr-1" />
                    Purchased
                  </Badge>
                )}
                {!chapter.is_free && !canReadChapter(chapter) && (
                  <Badge variant="outline" className="text-orange-600">
                    <Lock className="h-3 w-3 mr-1" />
                    {story?.price_per_chapter} credits
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {!chapter.is_free && !canReadChapter(chapter) && (
                  <Button
                    size="sm"
                    onClick={() => handlePurchaseChapter(chapter)}
                    disabled={purchasing === chapter.id}
                  >
                    {purchasing === chapter.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                        Purchasing...
                      </>
                    ) : (
                      <>
                        <Coins className="h-3 w-3 mr-1" />
                        Purchase
                      </>
                    )}
                  </Button>
                )}
                
                {canReadChapter(chapter) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleChapterExpansion(chapter.id)}
                  >
                    {expandedChapters.has(chapter.id) ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Read
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          {expandedChapters.has(chapter.id) && canReadChapter(chapter) && (
            <>
              <Separator />
              <CardContent className="pt-4">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {chapter.content}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  Published: {new Date(chapter.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      ))}

      {!user && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start">
              <Heart className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Support the Author</p>
                <p>Sign in to purchase chapters and support the author's work. Your purchases help creators continue writing.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user && userCredits === 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <Gift className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Get Welcome Credits! 🎁</p>
                  <p>New users get 50 free credits to start exploring stories. Click the button to claim yours!</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleGetWelcomeCredits}
                disabled={gettingCredits}
                className="bg-green-600 hover:bg-green-700"
              >
                {gettingCredits ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Gift className="h-3 w-3 mr-1" />
                    Get Credits
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {user && userCredits > 0 && userCredits < (story?.price_per_chapter || 0) && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <Coins className="h-5 w-5 text-orange-600 mr-2 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">Need More Credits</p>
                  <p>You need {story?.price_per_chapter} credits to purchase chapters. You currently have {userCredits} credits.</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGetWelcomeCredits}
                disabled={gettingCredits}
              >
                {gettingCredits ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Gift className="h-3 w-3 mr-1" />
                    Get More
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export { ChapterReader };
