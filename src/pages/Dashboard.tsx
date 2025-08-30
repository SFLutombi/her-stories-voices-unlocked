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
import { ChapterManager } from '@/components/ChapterManager';
import { CoverUpload } from '@/components/CoverUpload';

interface Story {
  id: string;
  title: string;
  description: string;
  total_chapters: number;
  price_per_chapter: number;
  published: boolean;
  created_at: string;
  category?: {
    name: string;
  } | null;
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
  const [activeTab, setActiveTab] = useState('overview');
  const [autoOpenStoryId, setAutoOpenStoryId] = useState<string | null>(null);
  
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
  const [isRegisteringAuthor, setIsRegisteringAuthor] = useState(false);
  const [isAuthorRegistered, setIsAuthorRegistered] = useState(false);

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

  // Register user as author on blockchain
  const registerAuthorOnBlockchain = async () => {
    if (!isConnected) {
      toast({
        variant: "destructive",
        title: "Connection Required",
        description: "Please connect your MetaMask wallet first.",
      });
      return;
    }

    if (!contractsInitialized) {
      toast({
        variant: "destructive",
        title: "Smart Contracts Not Ready",
        description: "Please wait for smart contracts to initialize before registering as an author.",
      });
      return;
    }

    if (!account) {
      toast({
        variant: "destructive",
        title: "Account Required",
        description: "Please ensure your MetaMask wallet is connected and unlocked.",
      });
      return;
    }

    setIsRegisteringAuthor(true);
    try {
      // Import the function from contracts
      const { registerAuthorOnChain } = await import('@/integrations/web3/contracts');
      
      // Register author with pseudonym and impact percentage
      const pseudonym = profile?.display_name || 'Anonymous Author';
      const impactPercentage = 10; // Default impact percentage
      
      const tx = await registerAuthorOnChain(pseudonym, impactPercentage);
      
      toast({
        title: "Author Registration Successful!",
        description: "You can now create stories on the blockchain.",
      });
      
      setIsAuthorRegistered(true);
    } catch (error: any) {
      console.error('Failed to register author:', error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || 'Failed to register as author on blockchain',
      });
    } finally {
      setIsRegisteringAuthor(false);
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

  // Check author registration when contracts are ready
  useEffect(() => {
    if (isConnected && contractsInitialized && account) {
      checkAuthorRegistration();
    }
  }, [isConnected, contractsInitialized, account]);

  // Check if user is registered as author on blockchain
  const checkAuthorRegistration = async () => {
    if (!isConnected || !contractsInitialized || !account) {
      console.log('checkAuthorRegistration: Missing requirements:', { 
        isConnected, 
        contractsInitialized, 
        account 
      });
      return;
    }
    
    try {
      console.log('checkAuthorRegistration: Checking author status for account:', account);
      const { getUserProfileOnChain } = await import('@/integrations/web3/contracts');
      const profile = await getUserProfileOnChain(account);
      console.log('checkAuthorRegistration: Author profile found:', profile);
      
      // Check if this is actually a valid, active author profile
      // The profile should have a valid author address (not zero address) and be active
      if (profile && 
          profile.author && 
          profile.author !== '0x0000000000000000000000000000000000000000' && 
          profile.author.toLowerCase() === account.toLowerCase() &&
          profile.isActive) {
        console.log('checkAuthorRegistration: Valid active author profile found');
        setIsAuthorRegistered(true);
        
        // Show success message if this is the first time we're detecting registration
        if (!isAuthorRegistered) {
          toast({
            title: "Author Status Confirmed! 🎉",
            description: "You are registered as an author on the blockchain and can create stories.",
          });
        }
      } else {
        console.log('checkAuthorRegistration: Profile found but not a valid active author:', {
          requestedAccount: account,
          profileAuthor: profile?.author,
          isActive: profile?.isActive,
          pseudonym: profile?.pseudonym,
          addressesMatch: profile?.author?.toLowerCase() === account?.toLowerCase()
        });
        setIsAuthorRegistered(false);
      }
    } catch (error) {
      console.log('checkAuthorRegistration: User not registered as author:', error);
      // User is not registered as author
      setIsAuthorRegistered(false);
    }
  };

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
      // Fetch author's stories with comprehensive data including categories
      const { data: storiesData } = await supabase
        .from('stories')
        .select(`
          *,
          category:categories(id, name, description)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (storiesData) {
        console.log('Fetched stories data:', storiesData);
        
        // Ensure all stories have category information
        const validStories = storiesData.map(story => ({
          ...story,
          category: story.category || { name: 'Uncategorized', id: null, description: null }
        }));
        
        setStories(validStories);
        
        // Calculate author statistics
        const totalChapters = validStories.reduce((sum, story) => sum + (story.total_chapters || 0), 0);
        const totalReaders = validStories.reduce((sum, story) => sum + 0, 0); // reader_count not available yet
        
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

    // Check if user is registered as author on blockchain
    if (!isAuthorRegistered) {
      toast({
        variant: "destructive",
        title: "Author Registration Required",
        description: "You must register as an author on the blockchain before creating stories. Please use the 'Register as Author' button above.",
      });
      setCreatingStory(false);
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
          category: category.name, // Pass category name for blockchain
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
          <div className="space-y-3">
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
            
            {!isAuthorRegistered && (
              <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
                <p className="font-medium">Author Registration Required:</p>
                <p>You need to register as an author on the blockchain before creating stories.</p>
                {!contractsInitialized && (
                  <p className="mt-1 text-red-600">⚠️ Smart contracts are still initializing. Please wait...</p>
                )}
                <div className="flex space-x-2 mt-2">
                  <Button 
                    onClick={registerAuthorOnBlockchain}
                    disabled={isRegisteringAuthor || !contractsInitialized}
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-orange-50 hover:bg-orange-100"
                  >
                    {isRegisteringAuthor ? 'Registering...' : 
                     !contractsInitialized ? 'Waiting for Contracts...' : 
                     'Register as Author'}
                  </Button>
                  <Button 
                    onClick={checkAuthorRegistration}
                    disabled={!contractsInitialized}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Check Status
                  </Button>
                </div>
              </div>
            )}
            
            {isAuthorRegistered && (
              <div className="text-xs text-green-600 bg-green-100 p-2 rounded">
                <p className="font-medium">✓ Author Registered:</p>
                <p>You can now create stories on the blockchain!</p>
              </div>
            )}
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

        {/* Debug Info - Author Registration Status */}
        {isConnected && contractsInitialized && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center text-blue-800">
                <div className="w-2 h-2 rounded-full mr-2 bg-blue-500" />
                Author Registration Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-blue-700 space-y-2">
                <p><strong>Wallet:</strong> {account?.slice(0, 6)}...{account?.slice(-4)}</p>
                <p><strong>Network:</strong> {network}</p>
                <p><strong>Contracts Ready:</strong> {contractsInitialized ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Author Registered:</strong> {isAuthorRegistered ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Profile is_author:</strong> {profile?.is_author ? '✅ Yes' : '❌ No'}</p>
              </div>
              <div className="mt-3 flex space-x-2">
                <Button
                  onClick={checkAuthorRegistration}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Refresh Status
                </Button>
                {!isAuthorRegistered && (
                  <Button
                    onClick={registerAuthorOnBlockchain}
                    disabled={isRegisteringAuthor}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-orange-50 hover:bg-orange-100"
                  >
                    {isRegisteringAuthor ? 'Registering...' : 'Register Now'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 mt-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Recent Stories</CardTitle>
                    <CardDescription>Your latest published content</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('chapters')}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Manage All Chapters
                    </Button>
                    <Button 
                      variant="default"
                      size="sm"
                      onClick={() => setActiveTab('create')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Story
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {stories.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No stories yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start sharing your voice with the world
                    </p>
                    <Button onClick={() => setActiveTab('create')}>
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
                            {story.category?.name || 'Uncategorized'} • {story.total_chapters} chapters
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={story.published ? "default" : "secondary"}>
                            {story.published ? "Published" : "Draft"}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/story/${story.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab('chapters')}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Chapters
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => {
                              setActiveTab('chapters');
                              setAutoOpenStoryId(story.id);
                              setTimeout(() => setAutoOpenStoryId(null), 100);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Chapter
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
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab('chapters')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Chapters
                </Button>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Story
                </Button>
                <Button 
                  variant="default"
                  onClick={() => {
                    setActiveTab('chapters');
                    // Auto-open the first story's chapter manager
                    if (stories.length > 0) {
                      setAutoOpenStoryId(stories[0].id);
                      setTimeout(() => setAutoOpenStoryId(null), 100);
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Add Chapter
                </Button>
              </div>
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/story/${story.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setActiveTab('chapters')}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Chapters
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => {
                            setActiveTab('chapters');
                            setAutoOpenStoryId(story.id);
                            setTimeout(() => setAutoOpenStoryId(null), 100);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Chapter
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-6 text-sm text-muted-foreground">
                        <span>{story.category?.name || 'Uncategorized'}</span>
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

          <TabsContent value="chapters" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Chapter Management</h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">
                  Select a story to manage its chapters
                </div>
                {stories.length > 0 ? (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // Scroll to the first story's chapter manager
                        const firstStoryElement = document.querySelector('[data-story-id]');
                        if (firstStoryElement) {
                          firstStoryElement.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Quick Start
                    </Button>
                    <Button 
                      variant="default"
                      onClick={() => {
                        // Auto-open the first story's chapter manager
                        setAutoOpenStoryId(stories[0].id);
                        setTimeout(() => setAutoOpenStoryId(null), 100);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Quick Add Chapter
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setActiveTab('create')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Story
                  </Button>
                )}
              </div>
            </div>

            {stories.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Stories Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first story to start adding chapters
                  </p>
                  <div className="flex space-x-2 justify-center">
                    <Button onClick={() => setActiveTab('create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Story
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('overview')}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {stories.map((story) => (
                  <Card key={story.id} data-story-id={story.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{story.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {story.description}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge variant={story.published ? "default" : "secondary"} className="mb-2">
                            {story.published ? "Published" : "Draft"}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {story.total_chapters} chapters • {story.price_per_chapter} credits/chapter
                          </div>
                          <div className="flex space-x-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/story/${story.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Story
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => {
                                setAutoOpenStoryId(story.id);
                                // Reset after a short delay to allow the component to re-render
                                setTimeout(() => setAutoOpenStoryId(null), 100);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Chapter
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ChapterManager 
                        storyId={story.id} 
                        autoOpen={autoOpenStoryId === story.id}
                        onChaptersUpdated={() => {
                          // Refresh stories to update chapter counts
                          fetchAuthorData();
                        }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
                        {!isAuthorRegistered && (
                          <p className="text-orange-600">⚠️ Author registration required</p>
                        )}
                        {!isAuthorRegistered && !contractsInitialized && (
                          <p className="text-red-600">⚠️ Smart contracts are still initializing</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {!isAuthorRegistered && (
                          <Button 
                            type="button"
                            onClick={registerAuthorOnBlockchain}
                            disabled={isRegisteringAuthor || !contractsInitialized}
                            variant="outline"
                            className="bg-orange-50 hover:bg-orange-100"
                          >
                            {isRegisteringAuthor ? 'Registering...' : 
                             !contractsInitialized ? 'Waiting for Contracts...' : 
                             'Register as Author'}
                          </Button>
                        )}
                        <Button 
                          type="submit" 
                          className="w-full md:w-auto"
                          disabled={creatingStory || !isAuthorRegistered}
                        >
                          {creatingStory ? 'Creating on Blockchain...' : 'Create Story on Blockchain'}
                        </Button>
                      </div>
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