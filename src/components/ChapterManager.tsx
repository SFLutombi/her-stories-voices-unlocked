import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Eye, EyeOff, Upload, Coins, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWeb3 } from '@/contexts/Web3Context';

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  is_free: boolean;
  published: boolean;
  created_at: string;
}

interface ChapterManagerProps {
  storyId: string;
  onChaptersUpdated: () => void;
  autoOpen?: boolean;
}

const ChapterManager = ({ storyId, onChaptersUpdated, autoOpen = false }: ChapterManagerProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(autoOpen);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  
  const { toast } = useToast();
  const { isConnected, contractsInitialized } = useWeb3();

  useEffect(() => {
    fetchChapters();
  }, [storyId]);

  useEffect(() => {
    if (autoOpen) {
      setIsDialogOpen(true);
    }
  }, [autoOpen]);

  const fetchChapters = async () => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('story_id', storyId)
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

  const resetForm = () => {
    setTitle('');
    setContent('');
    setIsFree(false);
    setIsPublished(false);
    setEditingChapter(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      if (editingChapter) {
        // Update existing chapter
        const { error } = await supabase
          .from('chapters')
          .update({
            title: title.trim(),
            content: content.trim(),
            is_free: isFree,
            published: isPublished,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingChapter.id);

        if (error) throw error;

        toast({
          title: "Chapter Updated",
          description: "Chapter has been updated successfully",
        });
      } else {
        // Create new chapter
        const nextChapterNumber = chapters.length + 1;
        
        const { error } = await supabase
          .from('chapters')
          .insert({
            story_id: storyId,
            chapter_number: nextChapterNumber,
            title: title.trim(),
            content: content.trim(),
            is_free: isFree,
            published: isPublished,
          });

        if (error) throw error;

        // Update story total_chapters count
        await supabase
          .from('stories')
          .update({ total_chapters: nextChapterNumber })
          .eq('id', storyId);

        toast({
          title: "Chapter Created",
          description: "New chapter has been created successfully",
        });
      }

      // If published, add to blockchain
      if (isPublished && isConnected && contractsInitialized) {
        try {
          // TODO: Call smart contract to add chapter
          console.log('Adding chapter to blockchain...');
        } catch (blockchainError) {
          console.error('Blockchain error:', blockchainError);
          toast({
            variant: "destructive",
            title: "Blockchain Warning",
            description: "Chapter saved locally but blockchain sync failed",
          });
        }
      }

      resetForm();
      setIsDialogOpen(false);
      onChaptersUpdated();
      fetchChapters();
    } catch (error) {
      console.error('Error saving chapter:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save chapter",
      });
    }
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setTitle(chapter.title);
    setContent(chapter.content);
    setIsFree(chapter.is_free);
    setIsPublished(chapter.published);
    setIsDialogOpen(true);
  };

  const handleTogglePublish = async (chapter: Chapter) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ published: !chapter.published })
        .eq('id', chapter.id);

      if (error) throw error;

      toast({
        title: chapter.published ? "Chapter Unpublished" : "Chapter Published",
        description: `Chapter is now ${chapter.published ? 'unpublished' : 'published'}`,
      });

      fetchChapters();
      onChaptersUpdated();
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update chapter status",
      });
    }
  };

  const handleDelete = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;

    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);

      if (error) throw error;

      toast({
        title: "Chapter Deleted",
        description: "Chapter has been removed",
      });

      fetchChapters();
      onChaptersUpdated();
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete chapter",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading chapters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Chapters ({chapters.length})</h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => {
              // This will be handled by the parent component
              // The button will automatically open the chapter creation dialog
            }}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            View Story
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Chapter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingChapter ? 'Edit Chapter' : 'Create New Chapter'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Chapter Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter chapter title"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Chapter Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your chapter content here..."
                    rows={10}
                    required
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isFree"
                      checked={isFree}
                      onCheckedChange={setIsFree}
                    />
                    <Label htmlFor="isFree">Free Chapter</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPublished"
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                    <Label htmlFor="isPublished">Publish Immediately</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingChapter ? 'Update Chapter' : 'Create Chapter'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {chapters.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No Chapters Yet</h4>
            <p className="text-muted-foreground mb-4">
              Start building your story by adding the first chapter
            </p>
            <div className="flex space-x-2 justify-center">
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Chapter
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsDialogOpen(true)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Start Writing
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter) => (
            <Card key={chapter.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge variant="secondary">
                        Chapter {chapter.chapter_number}
                      </Badge>
                      <h4 className="font-medium">{chapter.title}</h4>
                      {chapter.is_free && (
                        <Badge variant="outline" className="text-green-600">
                          <Coins className="h-3 w-3 mr-1" />
                          Free
                        </Badge>
                      )}
                      {chapter.published ? (
                        <Badge variant="default" className="bg-green-600">
                          <Eye className="h-3 w-3 mr-1" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {chapter.content.length > 100 
                        ? `${chapter.content.substring(0, 100)}...`
                        : chapter.content
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(chapter.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(chapter)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePublish(chapter)}
                    >
                      {chapter.published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(chapter.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        resetForm();
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export { ChapterManager };
