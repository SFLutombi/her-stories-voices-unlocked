import { Button } from "@/components/ui/button";
import { Heart, Search, User, BookOpen } from "lucide-react";

export const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              HerStories
            </h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#discover" className="text-foreground hover:text-primary transition-colors">
              Discover
            </a>
            <a href="#categories" className="text-foreground hover:text-primary transition-colors">
              Categories
            </a>
            <a href="#authors" className="text-foreground hover:text-primary transition-colors">
              Authors
            </a>
            <a href="#impact" className="text-foreground hover:text-primary transition-colors">
              Impact
            </a>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="empowerment" size="sm">
              <BookOpen className="h-4 w-4 mr-2" />
              Publish
            </Button>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};