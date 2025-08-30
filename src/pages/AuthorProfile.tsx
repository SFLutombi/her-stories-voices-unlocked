import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  BookOpen, 
  PenTool, 
  TrendingUp,
  Heart,
  Eye,
  ArrowLeft,
  Calendar,
  Coins
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

interface AuthorProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  is_anonymous: boolean;
  is_author: boolean;
  pseudonym?: string;
  avatar_url?: string;
  created_at: string;
}

interface Story {
  id: string;
  title: string;
  description: string;
  cover_image_url?: string;
  price_per_chapter: number;
  total_chapters: number;
  published: boolean;
  is_anonymous: boolean;
  impact_percentage: number;
  created_at: string;
  category: {
    name: string;
  };
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  is_free: boolean;
  published: boolean;
  created_at: string;
}

const AuthorProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userId) {
      loadAuthorProfile();
    }
  }, [userId]);

  const loadAuthorProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Load author's basic profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error loading author profile:', profileError);
        navigate('/discover');
        return;
      }

      setAuthorProfile(profileData);

      // Load author's published stories with chapters
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select(`
          *,
          category:categories(name),
          chapters(id, chapter_number, title, content, is_free, published, created_at)
        `)
        .eq('author_id', userId)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (storiesError) {
        console.error('Error loading author stories:', storiesError);
      } else if (storiesData) {
        // Filter stories to only show those with published chapters
        const validStories = storiesData.filter(story => 
          story.chapters && story.chapters.some(chapter => chapter.published)
        );
        setStories(validStories);
      }
    } catch (error) {
      console.error('Error loading author data:', error);
      navigate('/discover');
    } finally {
      setLoading(false);
    }
  };

  const toggleChapterExpansion = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewStory = (story: Story) => {
    navigate(`/story/${story.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-empowerment/5">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading author profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!authorProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-empowerment/5">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Author Not Found</h2>
            <p className="text-muted-foreground mb-4">The author you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/discover')}>Back to Discover</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-empowerment/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/discover')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Discover
        </Button>

        {/* Author Profile Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start space-x-6">
              <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center">
                {authorProfile.avatar_url ? (
                  <img 
                    src={authorProfile.avatar_url} 
                    alt={authorProfile.display_name}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold">
                    {authorProfile.is_anonymous && authorProfile.pseudonym 
                      ? authorProfile.pseudonym 
                      : authorProfile.display_name}
                  </h1>
                  <Badge variant="secondary" className="bg-empowerment/20 text-empowerment">
                    <PenTool className="h-3 w-3 mr-1" />
                    Author
                  </Badge>
                  {authorProfile.is_anonymous && (
                    <Badge variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Anonymous
                    </Badge>
                  )}
                </div>
                
                {authorProfile.bio && (
                  <p className="text-muted-foreground text-lg mb-3">{authorProfile.bio}</p>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {formatDate(authorProfile.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{stories.length} stories published</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stories Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Published Stories</h2>
            <Badge variant="secondary">
              {stories.length} {stories.length === 1 ? 'story' : 'stories'}
            </Badge>
          </div>

          {stories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Stories Published Yet</h3>
                <p className="text-muted-foreground">
                  This author hasn't published any stories yet. Check back later!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {stories.map((story) => (
                <Card key={story.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold">{story.title}</h3>
                          <Badge variant="outline">{story.category?.name || 'Uncategorized'}</Badge>
                          {story.impact_percentage > 0 && (
                            <Badge variant="outline" className="bg-empowerment/10 border-empowerment text-empowerment">
                              <Heart className="h-3 w-3 mr-1" />
                              {story.impact_percentage}% Impact
                            </Badge>
                          )}
                        </div>
                        
                        {story.description && (
                          <p className="text-muted-foreground mb-3">{story.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{story.total_chapters} chapters</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Coins className="h-4 w-4" />
                            <span>{story.price_per_chapter} credits/chapter</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Published {formatDate(story.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleViewStory(story)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Story
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <Separator />
                  
                  <CardContent className="p-6">
                    <h4 className="font-medium mb-4">Chapters</h4>
                    
                    {story.chapters && story.chapters.length > 0 ? (
                      <div className="space-y-3">
                        {story.chapters
                          .filter(chapter => chapter.published)
                          .sort((a, b) => a.chapter_number - b.chapter_number)
                          .map((chapter) => (
                            <div key={chapter.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                  <h5 className="font-medium">
                                    Chapter {chapter.chapter_number}: {chapter.title}
                                  </h5>
                                  {chapter.is_free && (
                                    <Badge variant="outline" className="text-green-600 border-green-200">
                                      Free
                                    </Badge>
                                  )}
                                  {!chapter.is_free && (
                                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                                      {story.price_per_chapter} credits
                                    </Badge>
                                  )}
                                </div>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleChapterExpansion(chapter.id)}
                                >
                                  {expandedChapters.has(chapter.id) ? 'Hide' : 'Show'} Content
                                </Button>
                              </div>
                              
                              {expandedChapters.has(chapter.id) && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="prose max-w-none">
                                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                                      {chapter.content}
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                                    Published: {formatDate(chapter.created_at)}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No chapters published yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AuthorProfile;
