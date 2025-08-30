import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Users, BookOpen } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/40" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-empowerment/10 text-empowerment border border-empowerment/20 text-sm font-medium">
              <Heart className="h-4 w-4 mr-2" />
              Every Voice Matters
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-hero bg-clip-text text-transparent">
              HerStories
            </span>
            <br />
            <span className="text-foreground">
              Voices Unlocked
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            South African women's stories — whether novels, survival stories, or life lessons — 
            are often undervalued or silenced. HerStories lets women publish, share, and 
            <span className="text-empowerment font-semibold"> monetize their words</span> one chapter at a time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button variant="hero" size="lg" className="text-lg px-8 py-6">
              <BookOpen className="h-5 w-5 mr-2" />
              Start Reading
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button variant="empowerment" size="lg" className="text-lg px-8 py-6">
              <Heart className="h-5 w-5 mr-2" />
              Publish Your Story
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1,247</div>
              <div className="text-muted-foreground">Stories Published</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-empowerment mb-2">₹2.8M</div>
              <div className="text-muted-foreground">Earned by Authors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warmth mb-2">8,432</div>
              <div className="text-muted-foreground">Empowered Readers</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};