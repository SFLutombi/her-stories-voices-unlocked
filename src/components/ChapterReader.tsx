import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Coins, Lock, Unlock, Heart, Eye, EyeOff, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWeb3 } from '@/contexts/Web3Context';
import { useToast } from '@/hooks/use-toast';
import { purchaseChapterWithCredits } from '@/integrations/web3/contracts';

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

  
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected, contractsInitialized, account, connect } = useWeb3();

  useEffect(() => {
    fetchChapters();
    fetchStory();
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

  const fetchStory = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('id, title, price_per_chapter, author_id')
        .eq('id', storyId)
        .single();

      if (error) {
        console.error('Error fetching story:', error);
        // Set a fallback story object to prevent crashes
        setStory({
          id: storyId,
          title: 'Story Not Found',
          price_per_chapter: 5,
          author_id: ''
        });
        return;
      }
      
      if (data) {
        setStory(data);
      } else {
        // Set fallback if no data returned
        setStory({
          id: storyId,
          title: 'Story Not Found',
          price_per_chapter: 5,
          author_id: ''
        });
      }
    } catch (error) {
      console.error('Error fetching story:', error);
      // Set fallback story object to prevent crashes
      setStory({
        id: storyId,
        title: 'Story Not Found',
        price_per_chapter: 5,
        author_id: ''
      });
    }
  };

  const fetchUserPurchases = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('purchases')
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

    if (!story) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Story information not available",
      });
      return;
    }

    // Check if user is trying to buy their own chapter
    if (user.id === story.author_id) {
      toast({
        variant: "destructive",
        title: "Cannot Purchase Own Chapter",
        description: "You cannot purchase chapters from your own story. This is not allowed by the smart contract.",
      });
      return;
    }

    // If wallet not connected, try to connect first
    if (!isConnected) {
      try {
        const connected = await connect();
        if (!connected) {
          toast({
            variant: "destructive",
            title: "Wallet Connection Failed",
            description: "Please connect your MetaMask wallet to purchase chapters",
          });
          return;
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Wallet Connection Failed",
          description: "Failed to connect MetaMask. Please try again.",
        });
        return;
      }
    }

    // Now proceed with the purchase
    await purchaseWithMetaMask(chapter);
  };



  const purchaseWithMetaMask = async (chapter: Chapter) => {
    // Check if user is trying to buy their own chapter
    if (user?.id === story?.author_id) {
      toast({
        variant: "destructive",
        title: "Cannot Purchase Own Chapter",
        description: "You cannot purchase chapters from your own story. This is not allowed by the smart contract.",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "MetaMask Required",
        description: "Please connect your MetaMask wallet to purchase chapters",
      });
      return;
    }

    if (!contractsInitialized) {
      toast({
        title: "Smart Contracts Not Ready",
        description: "Please wait for smart contracts to initialize",
      });
      return;
    }

    setPurchasing(chapter.id);
    try {
      // Get author's wallet address from the story
      if (!story?.author_id) {
        throw new Error('Author information not available');
      }

      // Get author's profile to find their wallet address
      const { data: authorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('user_id', story.author_id)
        .single();

      if (profileError || !authorProfile?.wallet_address) {
        throw new Error('Author wallet address not found. Please ask the author to set their wallet address.');
      }

      // Convert story ID to number for blockchain (simplified - just use a hash)
      const storyIdNumber = parseInt(storyId.replace(/-/g, '').substring(0, 8), 16);
      const chapterIdNumber = parseInt(chapter.id.replace(/-/g, '').substring(0, 8), 16);
      
      // Use the integration contract's purchaseStoryWithCredits function
      // This doesn't require the story/chapter to exist on-chain
      const receipt = await purchaseChapterWithCredits(
        storyIdNumber,
        chapterIdNumber,
        authorProfile.wallet_address,
        story.price_per_chapter
      );

      // Create local purchase record for UI consistency
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          story_id: storyId,
          chapter_id: chapter.id,
        });

      if (purchaseError) {
        console.warn('Failed to create local purchase record:', purchaseError);
        // Continue anyway since blockchain purchase succeeded
      }

      // Update local state
      setUserPurchases(prev => new Set([...prev, chapter.id]));

      toast({
        title: "Chapter Purchased on Blockchain! 🚀",
        description: `Transaction: ${receipt.transactionHash.substring(0, 10)}...`,
      });

      onPurchaseComplete?.();
    } catch (error) {
      console.error('Error purchasing chapter on blockchain:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to purchase chapter on blockchain. Please try again.";
      
      if (error.message?.includes('Author wallet address not found')) {
        errorMessage = "Author hasn't set their wallet address yet. Please contact the author.";
      } else if (error.message?.includes('Insufficient credits')) {
        errorMessage = "You don't have enough credits in your wallet. Please purchase more credits first.";
      } else if (error.message?.includes('transaction failed')) {
        errorMessage = "Blockchain transaction failed. This might be due to insufficient funds or network issues.";
      } else if (error.message?.includes('Cannot purchase from yourself')) {
        errorMessage = "You cannot purchase chapters from your own story. This is not allowed.";
      }
      
      toast({
        variant: "destructive",
        title: "Blockchain Purchase Failed",
        description: errorMessage,
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
                                 {!userPurchases.has(chapter.id) && (
                   <div className="flex gap-2 mt-4">
                     <Button
                       onClick={() => handlePurchaseChapter(chapter)}
                       disabled={purchasing === chapter.id}
                       className="flex-1"
                     >
                                               {purchasing === chapter.id ? (
                          "Processing..."
                        ) : (
                          <>
                            <Coins className="w-4 h-4 mr-2" />
                            {isConnected ? "Buy with MetaMask" : "Connect & Buy"}
                          </>
                        )}
                     </Button>
                   </div>
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

       {user && !isConnected && (
         <Card className="bg-orange-50 border-orange-200">
           <CardContent className="p-4">
             <div className="flex items-start">
               <Wallet className="h-5 w-5 text-orange-600 mr-2 mt-0.5" />
               <div className="text-sm text-orange-800">
                 <p className="font-medium mb-1">MetaMask Required</p>
                 <p>Connect your MetaMask wallet to purchase chapters with blockchain tokens. This ensures secure, decentralized payments to authors.</p>
               </div>
             </div>
           </CardContent>
         </Card>
       )}

       {user && isConnected && story?.author_id && (
         <Card className="bg-blue-50 border-blue-200">
           <CardContent className="p-4">
             <div className="flex items-start">
               <Wallet className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
               <div className="text-sm text-blue-800">
                 <p className="font-medium mb-1">Author Wallet Setup</p>
                 <p>To receive payments, authors need to set their wallet address in their profile. This ensures blockchain payments go directly to them.</p>
                 {user.id === story.author_id && (
                   <div className="mt-2">
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={() => {
                         // Copy current wallet address to clipboard
                         if (account) {
                           navigator.clipboard.writeText(account);
                           toast({
                             title: "Wallet Address Copied!",
                             description: "Paste this in your profile's wallet address field",
                           });
                         }
                       }}
                       disabled={!account}
                     >
                       <Wallet className="h-3 w-3 mr-1" />
                       Copy My Wallet Address
                     </Button>
                   </div>
                 )}
               </div>
             </div>
           </CardContent>
         </Card>
       )}

       {user && user.id === story?.author_id && (
         <Card className="bg-yellow-50 border-yellow-200">
           <CardContent className="p-4">
             <div className="flex items-start">
               <Lock className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
               <div className="text-sm text-yellow-800">
                 <p className="font-medium mb-1">Author Notice</p>
                 <p>You cannot purchase chapters from your own story. This is a smart contract restriction to prevent self-purchases.</p>
               </div>
             </div>
           </CardContent>
         </Card>
       )}

      

      
    </div>
  );
};

export { ChapterReader };
