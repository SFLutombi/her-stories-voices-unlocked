import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Coins, Lock, Unlock, Heart, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWeb3 } from '@/contexts/Web3Context';
import { useToast } from '@/hooks/use-toast';
import { purchaseChapterOnChain, getChapterAccessOnChain } from '@/integrations/web3/contracts';

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  is_free: boolean;
  published: boolean;
  created_at: string;
}

interface ChapterReaderProps {
  storyId: string;
  onPurchaseComplete?: () => void;
}

const ChapterReader = ({ storyId, onPurchaseComplete }: ChapterReaderProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [userPurchases, setUserPurchases] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected, contractsInitialized } = useWeb3();

  useEffect(() => {
    fetchChapters();
    if (user) {
      fetchUserPurchases();
    }
  }, [storyId, user]);

  const fetchChapters = async () => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('story_id', storyId)
        .eq('published', true)
        .order('chapter_number');

      if (error) throw error;
      setChapters(data || []);
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

  const handlePurchaseChapter = async (chapter: Chapter) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase chapters",
      });
      return;
    }

    if (!isConnected || !contractsInitialized) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your MetaMask wallet to purchase chapters",
      });
      return;
    }

    setPurchasing(chapter.id);
    try {
      // Get story price from the story data
      // For now, we'll use a default price - you'll need to pass this from the parent
      const chapterPrice = 0.001; // 0.001 ETH per chapter
      
      // Purchase chapter via smart contract
      const receipt = await purchaseChapterOnChain(
        parseInt(storyId), // Convert to number for smart contract
        parseInt(chapter.id), // Convert to number for smart contract
        chapterPrice
      );
      
      console.log('Chapter purchased on blockchain:', receipt);
      
      // Add to user purchases in database
      const { error } = await supabase
        .from('user_chapter_access')
        .insert({
          user_id: user.id,
          story_id: storyId,
          chapter_id: chapter.id,
          purchased_at: new Date().toISOString(),
          blockchain_tx_hash: receipt.transactionHash,
        });

      if (error) throw error;

      // Update local state
      setUserPurchases(prev => new Set([...prev, chapter.id]));

      toast({
        title: "Chapter Purchased!",
        description: "You now have access to this chapter",
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
        <div className="text-sm text-muted-foreground">
          {chapters.filter(c => c.is_free).length} free • {chapters.filter(c => !c.is_free).length} paid
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
                    Locked
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

      {user && (!isConnected || !contractsInitialized) && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start">
              <Coins className="h-5 w-5 text-orange-600 mr-2 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">Connect Your Wallet</p>
                <p>Connect your MetaMask wallet to purchase chapters using blockchain technology.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export { ChapterReader };
