import { Button } from "@/components/ui/button";
import { Heart, Search, User, BookOpen } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handlePublishClick = () => {
    if (!user) {
      // Redirect to auth page for signup
      navigate('/auth');
    } else {
      // Check if user is an author, if not redirect to profile setup
      // For now, redirect to dashboard where they can become an author
      navigate('/dashboard');
    }
  };

  const handleSignInClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // signOut function already handles redirect to home page
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback: redirect to home page
      navigate('/');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-primary">
              HerStories
            </h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="/discover" className="text-foreground hover:text-primary transition-colors">
              Discover
            </a>
            <a href="/#categories" className="text-foreground hover:text-primary transition-colors">
              Categories
            </a>
            <a href="/#authors" className="text-foreground hover:text-primary transition-colors">
              Authors
            </a>
            <a href="/impact" className="text-foreground hover:text-primary transition-colors">
              Impact
            </a>
          </div>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link to="/discover">Discover</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/profile">Profile</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};