import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const SplashScreen = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/onboarding');
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-empowerment/5 to-warmth/5">
      <div className="text-center space-y-8 max-w-md mx-auto px-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-empowerment rounded-full flex items-center justify-center shadow-lg">
            <Heart className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Tagline */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            HerStories
          </h1>
          <p className="text-xl md:text-2xl text-foreground font-medium">
            Every Voice Matters
          </p>
        </div>

        {/* Mission Statement */}
        <p className="text-muted-foreground text-lg leading-relaxed">
          South African women's stories — whether novels, survival stories, or life lessons — 
          are often undervalued or silenced. HerStories lets women publish, share, and 
          monetize their words one chapter at a time.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4 pt-8">
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            className="w-full bg-gradient-to-r from-primary to-empowerment hover:from-primary/90 hover:to-empowerment/90 text-white"
          >
            Get Started
          </Button>
          <Button 
            onClick={handleSkip}
            variant="ghost" 
            size="lg" 
            className="w-full"
          >
            Skip Introduction
          </Button>
        </div>
      </div>
    </div>
  );
};
