import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Heart, Coins, Settings, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  is_free: boolean;
  story: {
    id: string;
    title: string;
    author_id: string;
    price_per_chapter: number;
    total_chapters: number;
    author: {
      display_name: string;
    };
  };
}

const ReadChapter = () => {
  const { storyId, chapterId } = useParams<{ storyId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);
  const [tipAmount, setTipAmount] = useState(5);
  const [tipping, setTipping] = useState(false);

  useEffect(() => {
    if (storyId && chapterId) {
      fetchChapter();
    }
  }, [storyId, chapterId]);

  const fetchChapter = async () => {
    if (!storyId || !chapterId) return;

    try {
      // First check if user has access to this chapter
      if (user) {
        const { data: purchase } = await supabase
          .from('purchases')
          .select('*')
          .eq('user_id', user.id)
          .eq('chapter_id', chapterId)
          .single();

        // If no purchase found and not a free chapter, check if it's free
        if (!purchase) {
          const { data: chapterData } = await supabase
            .from('chapters')
            .select('is_free')
            .eq('id', chapterId)
            .single();

          if (chapterData && !chapterData.is_free) {
            toast({
              variant: "destructive",
              title: "Access denied",
              description: "You need to purchase this chapter first",
            });
            navigate(`/story/${storyId}`);
            return;
          }
        }
      }

      const { data, error } = await supabase
        .from('chapters')
        .select(`
          *,
          story:stories(
            id,
            title,
            author_id,
            price_per_chapter,
            total_chapters,
            author:profiles!author_id(display_name)
          )
        `)
        .eq('id', chapterId)
        .eq('published', true)
        .single();

      if (error) throw error;
      setChapter(data);
    } catch (error) {
      console.error('Error fetching chapter:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Chapter not found",
      });
      navigate('/discover');
    } finally {
      setLoading(false);
    }
  };

  const handleTip = async (amount: number) => {
    if (!user || !chapter) {
      toast({
        title: "Sign in required",
        description: "Please sign in to tip authors",
      });
      return;
    }

    setTipping(true);
    try {
      // Check user balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.wallet_balance < amount) {
        toast({
          variant: "destructive",
          title: "Insufficient credits",
          description: "You need more credits to tip this author",
        });
        return;
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          buyer_id: user.id,
          story_id: chapter.story.id,
          chapter_id: chapter.id,
          amount: amount,
          transaction_type: 'tip',
        });

      if (transactionError) throw transactionError;

      // Update user balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({
          wallet_balance: profile.wallet_balance - amount,
        })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      toast({
        title: "Thank you!",
        description: `You've sent ${amount} credits to support this author`,
      });
    } catch (error) {
      console.error('Error sending tip:', error);
      toast({
        variant: "destructive",
        title: "Tip failed",
        description: "There was an error processing your tip",
      });
    } finally {
      setTipping(false);
    }
  };

  const navigateToNextChapter = async () => {
    if (!chapter) return;

    const nextChapterNumber = chapter.chapter_number + 1;
    if (nextChapterNumber > chapter.story.total_chapters) {
      toast({
        title: "End of story",
        description: "You've reached the last chapter!",
      });
      return;
    }

    // Find next chapter
    const { data: nextChapter } = await supabase
      .from('chapters')
      .select('id')
      .eq('story_id', chapter.story.id)
      .eq('chapter_number', nextChapterNumber)
      .single();

    if (nextChapter) {
      navigate(`/read/${chapter.story.id}/${nextChapter.id}`);
    }
  };

  const navigateToPrevChapter = async () => {
    if (!chapter || chapter.chapter_number <= 1) return;

    const prevChapterNumber = chapter.chapter_number - 1;

    // Find previous chapter
    const { data: prevChapter } = await supabase
      .from('chapters')
      .select('id')
      .eq('story_id', chapter.story.id)
      .eq('chapter_number', prevChapterNumber)
      .single();

    if (prevChapter) {
      navigate(`/read/${chapter.story.id}/${prevChapter.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-48 bg-muted rounded mb-4 mx-auto" />
          <div className="h-4 w-32 bg-muted rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chapter not found</h1>
          <Button onClick={() => navigate('/discover')}>
            Back to Stories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'dark bg-gray-900' : 'bg-background'}`}>
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/story/${chapter.story.id}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Story
              </Button>
              
              <div>
                <h1 className="font-semibold">{chapter.story.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Chapter {chapter.chapter_number}: {chapter.title}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Reading Controls */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              >
                A-
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
              >
                A+
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Banner */}
      {user && !chapter.is_free && (
        <div className="bg-gradient-to-r from-primary/10 to-empowerment/10 border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Heart className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  You supported <span className="text-primary font-semibold">{chapter.story.author?.display_name || 'Anonymous'}</span> with {chapter.story.price_per_chapter} Credits
                </span>
              </div>
              
              {/* Micro-tipping */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Show appreciation:</span>
                <div className="flex items-center space-x-1">
                  {[1, 3, 5, 10].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTip(amount)}
                      disabled={tipping}
                      className="h-8 px-2 text-xs hover:bg-empowerment hover:text-white"
                    >
                      +{amount}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTipAmount(0)}
                  className="h-8 px-2 text-xs"
                >
                  Custom
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Chapter {chapter.chapter_number}: {chapter.title}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    by {chapter.story.author.display_name}
                  </Badge>
                  {chapter.is_free && (
                    <Badge variant="outline" className="text-primary">
                      Free Chapter
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div
                  className="prose prose-gray dark:prose-invert max-w-none leading-relaxed"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {chapter.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={navigateToPrevChapter}
                disabled={chapter.chapter_number <= 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous Chapter
              </Button>
              
              <Badge variant="secondary">
                {chapter.chapter_number} of {chapter.story.total_chapters}
              </Badge>
              
              <Button
                variant="outline"
                onClick={navigateToNextChapter}
                disabled={chapter.chapter_number >= chapter.story.total_chapters}
              >
                Next Chapter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Tip Author */}
              {user && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Gift className="h-5 w-5 mr-2 text-empowerment" />
                      Support Author
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Show appreciation with a tip
                    </p>
                    
                    <div className="flex space-x-2">
                      {[5, 10, 20].map((amount) => (
                        <Button
                          key={amount}
                          variant={tipAmount === amount ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTipAmount(amount)}
                        >
                          {amount}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      className="w-full"
                      disabled={tipping}
                      onClick={() => handleTip(tipAmount)}
                    >
                      <Coins className="h-4 w-4 mr-2" />
                      {tipping ? 'Sending...' : `Tip ${tipAmount} Credits`}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reading Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Chapter {chapter.chapter_number}</span>
                      <span>{chapter.story.total_chapters} total</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${(chapter.chapter_number / chapter.story.total_chapters) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      {Math.round((chapter.chapter_number / chapter.story.total_chapters) * 100)}% complete
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadChapter;