import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWeb3 } from '@/contexts/Web3Context';
import { supabase } from '@/integrations/supabase/client';
import { getUserCredits } from '@/utils/credits';
import { createStory } from '@/services/storySync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Eye, 
  TrendingUp, 
  Users, 
  Coins,
  DollarSign,
  Calendar,
  PenTool,
  BarChart3,
  Heart,
  Wallet,
  AlertCircle
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

interface Story {
  id: string;
  title: string;
  description: string;
  total_chapters: number;
  price_per_chapter: number;
  published: boolean;
  created_at: string;
  category: {
    name: string;
  };
}

interface Analytics {
  totalEarnings: number;
  totalReaders: number;
  totalChapters: number;
  avgRating: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Web3 integration
  const { 
    isConnected, 
    connect, 
    account, 
    network, 
    contractsInitialized,
    addAndSwitchToPrimordialTestnet,
    error: web3Error 
  } = useWeb3();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState<{ balance: number; total_earned: number; total_spent: number } | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [authorStats, setAuthorStats] = useState({
    totalReaders: 0,
    totalChapters: 0
  });

  // New story form
  const [newStory, setNewStory] = useState({
    title: '',
    description: '',
    category_id: '',
    price_per_chapter: 5,
    is_anonymous: false,
    impact_percentage: 10,
  });

  // Story creation state
  const [creatingStory, setCreatingStory] = useState(false);
  const [currentNetworkStatus, setCurrentNetworkStatus] = useState<{
    chainId: string;
    networkName: string;
    isCorrectNetwork: boolean;
  } | null>(null);

  // Check current network status
  const checkCurrentNetwork = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const expectedChainId = '0x413'; // Primordial BlockDAG Testnet
        
        setCurrentNetworkStatus({
          chainId,
          networkName: chainId === '0x1' ? 'Ethereum Mainnet' : 
                       chainId === expectedChainId ? 'Primordial BlockDAG Testnet' : 
                       `Unknown Network (${parseInt(chainId, 16)})`,
          isCorrectNetwork: chainId === expectedChainId
        });
      } catch (error) {
        console.error('Failed to check network status:', error);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchAuthorData();
      fetchCategories();
      checkCurrentNetwork();
    } else {
      navigate('/auth');
    }
  }, [user]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (data) setCategories(data);
  };

  const fetchAuthorData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch author's stories
      const { data: storiesData } = await supabase
        .from('stories')
        .select(`
          *,
          category:categories(name)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (storiesData) {
        setStories(storiesData);
        
        // Calculate author statistics
        const totalChapters = storiesData.reduce((sum, story) => sum + (story.total_chapters || 0), 0);
        const totalReaders = storiesData.reduce((sum, story) => sum + 0, 0); // reader_count not available yet
        
        setAuthorStats({
          totalReaders,
          totalChapters
        });
      }

      // Load user credits
      setCreditsLoading(true);
      const creditsData = await getUserCredits(user.id);
      if (creditsData) {
        setUserCredits(creditsData);
      }
    } catch (error) {
      console.error('Error fetching author data:', error);
      toast({
        title: "Error",
        description: "Failed to load your dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setCreditsLoading(false);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Check Web3 connection
    if (!isConnected) {
      toast({
        variant: "destructive",
        title: "Web3 Connection Required",
        description: "Please connect your MetaMask wallet to create stories on the blockchain.",
      });
      return;
    }

    if (!contractsInitialized) {
      toast({
        variant: "destructive",
        title: "Smart Contracts Not Ready",
        description: "Please wait for smart contracts to initialize.",
      });
      return;
    }

    setCreatingStory(true);

    try {
      // Get category name for blockchain
      const category = categories.find(c => c.id === newStory.category_id);
      if (!category) {
        throw new Error('Category not found');
      }

      // Create story using smart contract integration
      const result = await createStory(
        {
          title: newStory.title,
          description: newStory.description,
          category: category.name,
          pricePerChapter: newStory.price_per_chapter,
          impactPercentage: newStory.impact_percentage,
          isAnonymous: newStory.is_anonymous,
        },
        user.id,
        account || ''
      );

      if (result.success) {
        toast({
          title: "Story Created Successfully!",
          description: "Your story has been created on the blockchain and saved to the database.",
        });

        // Reset form
        setNewStory({
          title: '',
          description: '',
          category_id: '',
          price_per_chapter: 5,
          is_anonymous: false,
          impact_percentage: 10,
        });

        // Refresh data
        fetchAuthorData();
      } else {
        throw new Error(result.error || 'Failed to create story');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Creating Story",
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setCreatingStory(false);
    }
  };

  const handleBecomeAuthor = async () => {
    if (!profile) return;

    try {
      await updateProfile({ is_author: true });
      toast({
        title: "Welcome, Author!",
        description: "You can now create and publish stories.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update author status",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access your dashboard</h1>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile?.is_author) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <CardTitle className="text-3xl mb-4">Become an Author</CardTitle>
              <CardDescription className="text-lg">
                Share your stories and earn directly from readers through micro-payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Publish Stories</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your experiences and creative works
                  </p>
                </div>
                <div className="text-center">
                  <Coins className="h-8 w-8 mx-auto mb-2 text-empowerment" />
                  <h3 className="font-semibold">Earn Directly</h3>
                  <p className="text-sm text-muted-foreground">
                    Get paid per chapter with transparent payments
                  </p>
                </div>
                <div className="text-center">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Make Impact</h3>
                  <p className="text-sm text-muted-foreground">
                    Contribute to women's shelters and empowerment
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleBecomeAuthor}
                size="lg"
                className="w-full md:w-auto"
              >
                Start Your Author Journey
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Web3 connection section
  const renderWeb3Status = () => {
    if (!isConnected) {
      return (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Wallet className="h-5 w-5 mr-2" />
              Connect Wallet
            </CardTitle>
            <CardDescription className="text-orange-700">
              Connect your MetaMask wallet to create stories on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button onClick={connect} className="bg-orange-600 hover:bg-orange-700 w-full">
                Connect MetaMask
              </Button>
              <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
                <p className="font-medium">Network Required:</p>
                <p>Primordial BlockDAG Testnet (Chain ID: 1043)</p>
                <p className="mt-1">If you're on Ethereum Mainnet, please switch networks first.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!contractsInitialized) {
      return (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              Smart Contracts Initializing
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Please wait while we connect to the blockchain...
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <Wallet className="h-5 w-5 mr-2" />
            Wallet Connected
          </CardTitle>
          <CardDescription className="text-green-700">
            Connected to {network} • {account?.slice(0, 6)}...{account?.slice(-4)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button 
              onClick={addAndSwitchToPrimordialTestnet} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              Switch to Primordial Testnet
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Author Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your stories and track your impact
          </p>
        </div>

        {/* Web3 Status */}
        {currentNetworkStatus && (
          <Card className={`mb-4 ${
            currentNetworkStatus.isCorrectNetwork 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm flex items-center ${
                currentNetworkStatus.isCorrectNetwork ? 'text-green-800' : 'text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  currentNetworkStatus.isCorrectNetwork ? 'bg-green-500' : 'bg-red-500'
                }`} />
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className={`text-sm ${
                currentNetworkStatus.isCorrectNetwork ? 'text-green-700' : 'text-red-700'
              }`}>
                <p className="font-medium">Current Network: {currentNetworkStatus.networkName}</p>
                <p className="text-xs mt-1">Chain ID: {currentNetworkStatus.chainId}</p>
                {!currentNetworkStatus.isCorrectNetwork && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                    <p className="font-medium">Action Required:</p>
                    <p>Switch to Primordial BlockDAG Testnet (Chain ID: 0x413)</p>
                    <p className="mt-1">You can do this in MetaMask or use the button below.</p>
                  </div>
                )}
                <div className="mt-3 flex space-x-2">
                  <Button 
                    onClick={checkCurrentNetwork} 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                  >
                    Refresh Network Status
                  </Button>
                  {!currentNetworkStatus.isCorrectNetwork && (
                    <Button 
                      onClick={addAndSwitchToPrimordialTestnet} 
                      variant="outline" 
                      size="sm"
                      className="text-xs bg-red-50 hover:bg-red-100"
                    >
                      Switch to Primordial Testnet
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {renderWeb3Status()}

        <Tabs defaultValue="overview" className="space-y-6 mt-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-empowerment">
                    {userCredits?.total_earned} credits
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Readers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{authorStats.totalReaders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chapters Published</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{authorStats.totalChapters}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {userCredits?.balance || 0} credits
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Stories */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Stories</CardTitle>
                <CardDescription>Your latest published content</CardDescription>
              </CardHeader>
              <CardContent>
                {stories.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No stories yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start sharing your voice with the world
                    </p>
                    <Button onClick={() => navigate('/dashboard?tab=create')}>
                      Create Your First Story
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stories.slice(0, 3).map((story) => (
                      <div key={story.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{story.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {story.category.name} • {story.total_chapters} chapters
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={story.published ? "default" : "secondary"}>
                            {story.published ? "Published" : "Draft"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Stories</h2>
              <Button onClick={() => navigate('/dashboard?tab=create')}>
                <Plus className="h-4 w-4 mr-2" />
                New Story
              </Button>
            </div>

            <div className="grid gap-6">
              {stories.map((story) => (
                <Card key={story.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{story.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {story.description}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-6 text-sm text-muted-foreground">
                        <span>{story.category.name}</span>
                        <span>{story.total_chapters} chapters</span>
                        <span>{story.price_per_chapter} credits/chapter</span>
                      </div>
                      <Badge variant={story.published ? "default" : "secondary"}>
                        {story.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Story</CardTitle>
                <CardDescription>
                  Share your voice and start earning from your stories on the blockchain
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isConnected ? (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
                    <p className="text-muted-foreground mb-4">
                      Connect your MetaMask wallet to create stories on the blockchain
                    </p>
                    <Button onClick={connect}>
                      Connect MetaMask
                    </Button>
                  </div>
                ) : !contractsInitialized ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Smart Contracts Loading</h3>
                    <p className="text-muted-foreground mb-4">
                      Please wait while we connect to the blockchain...
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleCreateStory} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="title">Story Title</Label>
                        <Input
                          id="title"
                          value={newStory.title}
                          onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                          placeholder="Enter your story title"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newStory.category_id}
                          onValueChange={(value) => setNewStory({ ...newStory, category_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newStory.description}
                        onChange={(e) => setNewStory({ ...newStory, description: e.target.value })}
                        placeholder="Describe your story..."
                        rows={4}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price per Chapter (Credits)</Label>
                        <Input
                          id="price"
                          type="number"
                          min="1"
                          max="50"
                          value={newStory.price_per_chapter}
                          onChange={(e) => setNewStory({ ...newStory, price_per_chapter: parseInt(e.target.value) })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="impact">Impact Percentage (%)</Label>
                        <Input
                          id="impact"
                          type="number"
                          min="0"
                          max="50"
                          value={newStory.impact_percentage}
                          onChange={(e) => setNewStory({ ...newStory, impact_percentage: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Percentage of earnings donated to women's shelters
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="anonymous"
                        checked={newStory.is_anonymous}
                        onCheckedChange={(checked) => setNewStory({ ...newStory, is_anonymous: checked })}
                      />
                      <Label htmlFor="anonymous">Publish anonymously</Label>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <p>✓ Connected to {network}</p>
                        <p>✓ Smart contracts ready</p>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto"
                        disabled={creatingStory}
                      >
                        {creatingStory ? 'Creating on Blockchain...' : 'Create Story on Blockchain'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Earnings Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Earnings</span>
                      <span className="font-bold text-empowerment">
                        {userCredits?.total_earned} credits
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average per Reader</span>
                      <span className="font-medium">
                        {authorStats.totalReaders > 0 
                          ? Math.round((userCredits?.total_earned || 0) / authorStats.totalReaders) 
                          : 0} credits
                      </span>
                    </div>
                    <Progress 
                      value={((userCredits?.total_earned || 0) / 1000) * 100} 
                      className="w-full" 
                    />
                    <p className="text-sm text-muted-foreground">
                      Progress towards 1,000 credits milestone
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Total Readers</h4>
                  <p className="text-3xl font-bold">{authorStats.totalReaders}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Chapters Published</h4>
                  <p className="text-3xl font-bold">{authorStats.totalChapters}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;