import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { StoryCard } from '@/components/StoryCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Heart, TrendingUp, Coins, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useWeb3 } from '@/contexts/Web3Context';

interface Story {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  price_per_chapter: number;
  total_chapters: number;
  is_anonymous: boolean;
  impact_percentage: number;
  blockchain_id?: string;
  blockchain_tx_hash?: string;
  author_id: string;
  category: {
    name: string;
  };
  published: boolean;
  created_at: string;
}

const Discover = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  
  // Web3 integration
  const { isConnected, contractsInitialized } = useWeb3();

  useEffect(() => {
    fetchStories();
    fetchCategories();
  }, [selectedCategory, sortBy]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (data) setCategories(data);
  };

  const fetchStories = async () => {
    setLoading(true);
    try {
      // Direct database fetch for better reliability
      let query = supabase
        .from('stories')
        .select(`
          *,
          category:categories(name)
        `)
        .eq('published', true);

      if (selectedCategory !== 'all') {
        const category = categories.find(c => c.name === selectedCategory);
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      const { data: storiesData, error } = await query;

      if (error) {
        console.error('Database fetch error:', error);
        throw error;
      }

      console.log('Fetched stories from database:', storiesData);

      // Filter and sort stories
      let filteredStories = storiesData || [];

      // Apply search filter
      if (searchQuery) {
        filteredStories = filteredStories.filter(story =>
          story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          story.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Sort stories
      switch (sortBy) {
        case 'newest':
          filteredStories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'popular':
          filteredStories.sort((a, b) => (b.total_chapters || 0) - (a.total_chapters || 0));
          break;
        case 'price_low':
          filteredStories.sort((a, b) => a.price_per_chapter - b.price_per_chapter);
          break;
        case 'price_high':
          filteredStories.sort((a, b) => b.price_per_chapter - a.price_per_chapter);
          break;
      }

      console.log('Filtered and sorted stories:', filteredStories);
      setStories(filteredStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
      // Fallback to database-only fetch if blockchain fails
      await fetchStoriesFromDatabase();
    } finally {
      setLoading(false);
    }
  };

  // Fallback to database-only fetch
  const fetchStoriesFromDatabase = async () => {
    try {
      let query = supabase
        .from('stories')
        .select(`
          *,
          author:profiles!author_id(display_name, is_anonymous),
          category:categories(name),
          chapters(id, chapter_number, title, is_free, published)
        `)
        .eq('published', true);

      if (selectedCategory !== 'all') {
        const category = categories.find(c => c.name === selectedCategory);
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Show all published stories, even if they don't have chapters yet
      // This allows new stories to appear on the discover page immediately
      const validStories = data?.map(story => ({
        ...story,
        // Ensure chapters array exists even if empty
        chapters: story.chapters || []
      })) || [];
      
      setStories(validStories);
    } catch (error) {
      console.error('Error fetching stories from database:', error);
      setStories([]);
    }
  };

  const filteredStories = stories.filter(story => {
    if (searchQuery) {
      return story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             story.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const featuredStories = stories.slice(0, 3);

  const renderBlockchainStatus = () => {
    if (!isConnected) {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
            <div>
              <h3 className="font-medium text-orange-800">Blockchain Stories Available</h3>
              <p className="text-sm text-orange-700">
                Connect your MetaMask wallet to access stories created on the blockchain
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!contractsInitialized) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="font-medium text-yellow-800">Loading Blockchain Stories</h3>
              <p className="text-sm text-yellow-700">
                Connecting to smart contracts...
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Coins className="h-5 w-5 text-green-600 mr-2" />
          <div>
            <h3 className="font-medium text-green-800">Blockchain Connected</h3>
            <p className="text-sm text-green-700">
              Viewing stories from both database and blockchain
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Discover Stories</h1>
          <p className="text-xl text-muted-foreground">
            Explore powerful narratives from South African women, powered by blockchain technology
          </p>
        </div>

        {/* Blockchain Status */}
        {renderBlockchainStatus()}

        {/* Search and Filter */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search stories, authors, or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Featured Stories */}
        {featuredStories.length > 0 && (
          <section className="py-16 bg-card/50">
            <div className="container mx-auto px-4">
              <div className="flex items-center mb-8">
                <TrendingUp className="h-6 w-6 text-primary mr-3" />
                <h2 className="text-3xl font-bold">Featured Stories</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {featuredStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    id={story.id}
                    title={story.title}
                    author={story.author_id ? story.author_id.slice(0, 6) + '...' + story.author_id.slice(-4) : 'Anonymous'}
                    description={story.description}
                    coverImage={story.cover_image_url || '/placeholder.svg'}
                    pricePerChapter={story.price_per_chapter}
                    totalChapters={story.total_chapters}
                    category={story.category?.name || 'Uncategorized'}
                    isAnonymous={story.is_anonymous}
                    impact={story.impact_percentage > 0 ? `${story.impact_percentage}% to shelters` : undefined}
                    blockchainInfo={story.blockchain_id ? {
                      id: story.blockchain_id,
                      txHash: story.blockchain_tx_hash
                    } : undefined}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Stories */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">All Stories</h2>
              <div className="text-sm text-muted-foreground">
                {filteredStories.length} story{filteredStories.length !== 1 ? 's' : ''} found
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading stories...</p>
              </div>
            ) : filteredStories.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No stories found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or browse all categories
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    id={story.id}
                    title={story.title}
                    author={story.author_id ? story.author_id.slice(0, 6) + '...' + story.author_id.slice(-4) : 'Unknown'}
                    description={story.description}
                    coverImage={story.cover_image_url || '/placeholder.svg'}
                    pricePerChapter={story.price_per_chapter}
                    totalChapters={story.total_chapters}
                    category={story.category?.name || 'Uncategorized'}
                    isAnonymous={story.is_anonymous}
                    impact={story.impact_percentage > 0 ? `${story.impact_percentage}% to shelters` : undefined}
                    blockchainInfo={story.blockchain_id ? {
                      id: story.blockchain_id,
                      txHash: story.blockchain_tx_hash
                    } : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Discover;