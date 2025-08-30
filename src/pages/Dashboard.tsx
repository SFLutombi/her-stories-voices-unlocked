import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Coins, 
  TrendingUp, 
  Users, 
  Plus, 
  Edit, 
  Eye,
  DollarSign,
  Heart,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  
  const [stories, setStories] = useState<Story[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalEarnings: 0,
    totalReaders: 0,
    totalChapters: 0,
    avgRating: 0,
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New story form
  const [newStory, setNewStory] = useState({
    title: '',
    description: '',
    category_id: '',
    price_per_chapter: 5,
    is_anonymous: false,
    impact_percentage: 10,
  });

  useEffect(() => {
    if (user) {
      fetchAuthorData();
      fetchCategories();
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

      setStories(storiesData || []);

      // Fetch analytics
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('amount')
        .in('story_id', storiesData?.map(s => s.id) || []);

      const totalEarnings = transactionsData?.reduce((sum, t) => sum + t.amount, 0) || 0;

      // Count unique readers
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('user_id')
        .in('story_id', storiesData?.map(s => s.id) || []);

      const uniqueReaders = new Set(purchasesData?.map(p => p.user_id) || []).size;

      const totalChapters = storiesData?.reduce((sum, s) => sum + s.total_chapters, 0) || 0;

      setAnalytics({
        totalEarnings,
        totalReaders: uniqueReaders,
        totalChapters,
        avgRating: 4.2, // Mock data for now
      });
    } catch (error) {
      console.error('Error fetching author data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('stories')
        .insert({
          ...newStory,
          author_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Story created!",
        description: "Your story has been created. You can now add chapters.",
      });

      setNewStory({
        title: '',
        description: '',
        category_id: '',
        price_per_chapter: 5,
        is_anonymous: false,
        impact_percentage: 10,
      });

      fetchAuthorData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
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

        <Tabs defaultValue="overview" className="space-y-6">
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
                    {analytics.totalEarnings} credits
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Readers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalReaders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Published Chapters</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalChapters}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {profile?.wallet_balance || 0} credits
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
                  Share your voice and start earning from your stories
                </CardDescription>
              </CardHeader>
              <CardContent>
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

                  <Button type="submit" className="w-full md:w-auto">
                    Create Story
                  </Button>
                </form>
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
                        {analytics.totalEarnings} credits
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average per Reader</span>
                      <span className="font-medium">
                        {analytics.totalReaders > 0 
                          ? Math.round(analytics.totalEarnings / analytics.totalReaders) 
                          : 0} credits
                      </span>
                    </div>
                    <Progress 
                      value={(analytics.totalEarnings / 1000) * 100} 
                      className="w-full" 
                    />
                    <p className="text-sm text-muted-foreground">
                      Progress towards 1,000 credits milestone
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reader Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Total Readers</h4>
                      <p className="text-3xl font-bold">{analytics.totalReaders}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Chapters Published</h4>
                      <p className="text-3xl font-bold">{analytics.totalChapters}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;