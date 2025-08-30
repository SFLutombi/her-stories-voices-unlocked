import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, BookOpen, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StoryCardProps {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  pricePerChapter: number;
  totalChapters: number;
  category: string;
  isAnonymous?: boolean;
  impact?: string;
}

export const StoryCard = ({
  id,
  title,
  author,
  description,
  coverImage,
  pricePerChapter,
  totalChapters,
  category,
  isAnonymous = false,
  impact
}: StoryCardProps) => {
  const navigate = useNavigate();
  return (
    <Card className="group overflow-hidden hover:shadow-story transition-all duration-300 bg-card border-border">
      <div className="relative overflow-hidden">
        <img 
          src={coverImage} 
          alt={title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm">
            {category}
          </Badge>
        </div>
        {impact && (
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="bg-empowerment/10 border-empowerment text-empowerment">
              <Heart className="h-3 w-3 mr-1" />
              Impact
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-1">
          by {isAnonymous ? "Anonymous" : author}
        </p>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {description}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <BookOpen className="h-4 w-4 mr-2" />
            {totalChapters} chapters
          </div>
          <div className="flex items-center text-empowerment font-medium">
            <Coins className="h-4 w-4 mr-1" />
            {pricePerChapter} credits/chapter
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Button 
          variant="chapter" 
          className="w-full"
          onClick={() => navigate(`/story/${id}`)}
        >
          View Story
        </Button>
      </CardFooter>
    </Card>
  );
};