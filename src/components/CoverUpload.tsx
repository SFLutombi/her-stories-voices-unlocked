import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, Image, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CoverUploadProps {
  storyId: string;
  currentCoverUrl?: string | null;
  onCoverUpdated: (coverUrl: string) => void;
}

const CoverUpload = ({ storyId, currentCoverUrl, onCoverUpdated }: CoverUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentCoverUrl || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please select an image file (JPEG, PNG, etc.)",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${storyId}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('story-covers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('story-covers')
        .getPublicUrl(filePath);

      // Update story record
      const { error: updateError } = await supabase
        .from('stories')
        .update({ cover_image_url: publicUrl })
        .eq('id', storyId);

      if (updateError) throw updateError;

      // Update preview
      setPreviewUrl(publicUrl);
      onCoverUpdated(publicUrl);

      toast({
        title: "Cover Uploaded",
        description: "Your book cover has been updated successfully",
      });

    } catch (error) {
      console.error('Error uploading cover:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload cover image. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
      handleUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
      handleUpload(file);
    }
  };

  const handleRemoveCover = async () => {
    if (!currentCoverUrl) return;

    try {
      // Remove from storage
      const fileName = currentCoverUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('story-covers')
          .remove([`covers/${fileName}`]);
      }

      // Update story record
      const { error } = await supabase
        .from('stories')
        .update({ cover_image_url: null })
        .eq('id', storyId);

      if (error) throw error;

      setPreviewUrl(null);
      onCoverUpdated('');

      toast({
        title: "Cover Removed",
        description: "Book cover has been removed",
      });

    } catch (error) {
      console.error('Error removing cover:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove cover image",
      });
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Image className="h-5 w-5 mr-2" />
          Book Cover
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={previewUrl}
                alt="Book cover preview"
                className="w-full h-64 object-cover rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveCover}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Cover uploaded successfully</span>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Book Cover</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop an image here, or click to browse
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Supported formats: JPEG, PNG, GIF</p>
              <p>Maximum size: 5MB</p>
              <p>Recommended dimensions: 400x600 pixels</p>
            </div>
            <Button 
              onClick={openFileDialog}
              disabled={uploading}
              className="mt-4"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </>
              )}
            </Button>
          </div>
        )}

        {!previewUrl && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Why add a book cover?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Makes your story more attractive to readers</li>
                  <li>Professional appearance increases credibility</li>
                  <li>Helps readers remember and identify your story</li>
                  <li>Improves discoverability on the platform</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { CoverUpload };
