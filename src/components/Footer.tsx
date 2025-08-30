import { Heart, Twitter, Facebook, Instagram, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <Heart className="h-8 w-8 text-primary" />
              <h3 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                HerStories
              </h3>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              Empowering South African women to share their stories, 
              monetize their voices, and create lasting impact in their communities.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Mail className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-6">For Readers</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Browse Stories</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Categories</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Support Authors</a></li>
            </ul>
          </div>
          
          {/* Authors */}
          <div>
            <h4 className="font-semibold mb-6">For Authors</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Publish Your Story</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Author Dashboard</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pricing Guide</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Success Stories</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 HerStories. Every voice matters. Built with love for South African women.</p>
        </div>
      </div>
    </footer>
  );
};