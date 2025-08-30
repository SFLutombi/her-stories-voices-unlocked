import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { StoryCard } from '@/components/StoryCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Heart, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Story {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  price_per_chapter: number;
  total_chapters: number;
  is_anonymous: boolean;
  impact_percentage: number;
  author: {
    display_name: string;
  };
  category: {
    name: string;
  };
}

const Discover = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

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
      let query = supabase
        .from('stories')
        .select(`
          *,
          author:profiles!author_id(display_name),
          category:categories(name)
        `)
        .eq('published', true);

      if (selectedCategory !== 'all') {
        const category = categories.find(c => c.name === selectedCategory);
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      // Sort options
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('total_chapters', { ascending: false });
          break;
        case 'price_low':
          query = query.order('price_per_chapter', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price_per_chapter', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter(story =>
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.author?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredStories = stories.slice(0, 3);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-empowerment/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              Discover Amazing Stories
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Support South African women writers through micro-payments and direct connections
            </p>
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search stories, authors, or themes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
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
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popular">Most Chapters</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
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
                  author={story.author?.display_name || 'Unknown'}
                  description={story.description}
                  coverImage={story.cover_image_url || '/placeholder.svg'}
                  pricePerChapter={story.price_per_chapter}
                  totalChapters={story.total_chapters}
                  category={story.category?.name || 'Uncategorized'}
                  isAnonymous={story.is_anonymous}
                  impact={story.impact_percentage > 0 ? `${story.impact_percentage}% to shelters` : undefined}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Stories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">All Stories</h2>
            <Badge variant="secondary" className="bg-empowerment/10 text-empowerment">
              {filteredStories.length} stories found
            </Badge>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-64 bg-muted rounded-t-lg" />
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded mb-4" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </CardContent>
                </Card>
              ))}
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
                  author={story.author?.display_name || 'Unknown'}
                  description={story.description}
                  coverImage={story.cover_image_url || '/placeholder.svg'}
                  pricePerChapter={story.price_per_chapter}
                  totalChapters={story.total_chapters}
                  category={story.category?.name || 'Uncategorized'}
                  isAnonymous={story.is_anonymous}
                  impact={story.impact_percentage > 0 ? `${story.impact_percentage}% to shelters` : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Discover;