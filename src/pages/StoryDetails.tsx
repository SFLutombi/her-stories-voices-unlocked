import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Heart, BookOpen, Coins, User, Calendar, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface StoryDetails {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  price_per_chapter: number;
  total_chapters: number;
  is_anonymous: boolean;
  impact_percentage: number;
  created_at: string;
  author: {
    display_name: string;
    bio: string;
  };
  category: {
    name: string;
  };
  chapters: Array<{
    id: string;
    chapter_number: number;
    title: string;
    is_free: boolean;
  }>;
}

const StoryDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [story, setStory] = useState<StoryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStoryDetails();
    }
  }, [id]);

  const fetchStoryDetails = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          author:profiles!author_id(display_name, bio),
          category:categories(name),
          chapters(id, chapter_number, title, is_free)
        `)
        .eq('id', id)
        .eq('published', true)
        .single();

      if (error) throw error;
      setStory(data);
    } catch (error) {
      console.error('Error fetching story:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Story not found",
      });
      navigate('/discover');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseChapter = async (chapterId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase chapters",
      });
      navigate('/auth');
      return;
    }

    setPurchasing(true);
    try {
      // Check user balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.wallet_balance < story!.price_per_chapter) {
        toast({
          variant: "destructive",
          title: "Insufficient credits",
          description: "You need more credits to purchase this chapter",
        });
        return;
      }

      // Create purchase record
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          story_id: story!.id,
          chapter_id: chapterId,
        });

      if (purchaseError) throw purchaseError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          buyer_id: user.id,
          story_id: story!.id,
          chapter_id: chapterId,
          amount: story!.price_per_chapter,
          transaction_type: 'chapter',
        });

      if (transactionError) throw transactionError;

      // Update user balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({
          wallet_balance: profile.wallet_balance - story!.price_per_chapter,
        })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      toast({
        title: "Chapter purchased!",
        description: `You've supported the author with ${story!.price_per_chapter} credits`,
      });

      navigate(`/read/${story!.id}/${chapterId}`);
    } catch (error) {
      console.error('Error purchasing chapter:', error);
      toast({
        variant: "destructive",
        title: "Purchase failed",
        description: "There was an error processing your purchase",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleReadFreeChapter = (chapterId: string) => {
    navigate(`/read/${story!.id}/${chapterId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse">
            <div className="h-96 bg-muted rounded-lg mb-8" />
            <div className="h-8 bg-muted rounded mb-4" />
            <div className="h-4 bg-muted rounded mb-2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Story not found</h1>
        </div>
        <Footer />
      </div>
    );
  }

  const freeChapter = story.chapters.find(c => c.is_free);
  const totalPrice = story.price_per_chapter * story.total_chapters;

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Story Cover and Quick Info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <div className="relative">
                <img
                  src={story.cover_image_url || '/placeholder.svg'}
                  alt={story.title}
                  className="w-full h-80 object-cover rounded-t-lg"
                />
                {story.impact_percentage > 0 && (
                  <Badge className="absolute top-4 right-4 bg-empowerment/90 text-white">
                    <Heart className="h-3 w-3 mr-1" />
                    Impact Story
                  </Badge>
                )}
              </div>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{story.category.name}</Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(story.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Per Chapter</span>
                      <div className="flex items-center text-empowerment font-medium">
                        <Coins className="h-4 w-4 mr-1" />
                        {story.price_per_chapter} credits
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Chapters</span>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {story.total_chapters}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Full Story</span>
                      <div className="flex items-center text-primary font-medium">
                        <Coins className="h-4 w-4 mr-1" />
                        {totalPrice} credits
                      </div>
                    </div>
                  </div>

                  {story.impact_percentage > 0 && (
                    <div className="bg-empowerment/10 p-3 rounded-lg">
                      <div className="flex items-center text-empowerment text-sm">
                        <Target className="h-4 w-4 mr-2" />
                        {story.impact_percentage}% of proceeds support women's shelters
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    {freeChapter && (
                      <Button 
                        className="w-full mb-2" 
                        variant="outline"
                        onClick={() => handleReadFreeChapter(freeChapter.id)}
                      >
                        Read Free Chapter
                      </Button>
                    )}
                    <Button 
                      className="w-full" 
                      disabled={purchasing}
                      onClick={() => story.chapters[1] && handlePurchaseChapter(story.chapters[1].id)}
                    >
                      {purchasing ? 'Purchasing...' : 'Buy Next Chapter'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Story Details */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">{story.title}</h1>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    by {story.is_anonymous ? 'Anonymous' : story.author.display_name}
                  </span>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {story.description}
              </p>
            </div>

            {!story.is_anonymous && story.author.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About the Author</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{story.author.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Chapter List */}
            <Card>
              <CardHeader>
                <CardTitle>Chapters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {story.chapters
                    .sort((a, b) => a.chapter_number - b.chapter_number)
                    .map((chapter) => (
                      <div
                        key={chapter.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div>
                          <h4 className="font-medium">
                            Chapter {chapter.chapter_number}: {chapter.title}
                          </h4>
                          {chapter.is_free && (
                            <Badge variant="secondary" className="mt-1">
                              Free
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {chapter.is_free ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReadFreeChapter(chapter.id)}
                            >
                              Read Free
                            </Button>
                          ) : (
                            <>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Coins className="h-3 w-3 mr-1" />
                                {story.price_per_chapter}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={purchasing}
                                onClick={() => handlePurchaseChapter(chapter.id)}
                              >
                                Buy & Read
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StoryDetails;