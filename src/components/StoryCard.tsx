import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, BookOpen, Coins, Link, ExternalLink, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StoryCardProps {
  id: string;
  title: string;
  author: string;
  authorId?: string; // Add author ID for navigation
  description: string;
  coverImage: string;
  pricePerChapter: number;
  totalChapters: number;
  category: string;
  isAnonymous?: boolean;
  impact?: string;
  blockchainInfo?: {
    id: string;
    txHash?: string;
  };
}

export const StoryCard = ({
  id,
  title,
  author,
  authorId,
  description,
  coverImage,
  pricePerChapter,
  totalChapters,
  category,
  isAnonymous = false,
  impact,
  blockchainInfo
}: StoryCardProps) => {
  const navigate = useNavigate();
  
  const handleViewStory = () => {
    navigate(`/story/${id}`);
  };

  const handleViewAuthor = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the story view
    if (authorId && !isAnonymous) {
      navigate(`/author/${authorId}`);
    }
  };

  const handleViewBlockchain = () => {
    if (blockchainInfo?.txHash) {
      // Open Primordial BlockDAG explorer in new tab
      const explorerUrl = `https://primordial.bdagscan.com/tx/${blockchainInfo.txHash}`;
      window.open(explorerUrl, '_blank');
    }
  };

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
        {blockchainInfo && (
          <div className="absolute bottom-4 left-4">
            <Badge variant="default" className="bg-green-600 text-white">
              <Link className="h-3 w-3 mr-1" />
              Blockchain
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-1">
          by {isAnonymous ? "Anonymous" : (
            authorId ? (
              <button
                onClick={handleViewAuthor}
                className="hover:text-primary hover:underline transition-colors cursor-pointer flex items-center space-x-1"
              >
                <User className="h-3 w-3" />
                <span>{author}</span>
              </button>
            ) : (
              author
            )
          )}
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

        {blockchainInfo && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-700 font-medium">
                ✓ Created on Primordial BlockDAG Testnet
              </span>
              {blockchainInfo.txHash && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewBlockchain}
                  className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-100"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View TX
                </Button>
              )}
            </div>
            <p className="text-green-600 text-xs mt-1">
              ID: {blockchainInfo.id}
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Button 
          onClick={handleViewStory}
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
        >
          Read Story
        </Button>
      </CardFooter>
    </Card>
  );
};