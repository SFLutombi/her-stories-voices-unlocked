import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, BookOpen, Star, Users, Feather, Shield } from "lucide-react";

const categories = [
  {
    id: "survivor-stories",
    title: "Survivor Stories",
    description: "Powerful testimonies of resilience and healing",
    icon: Shield,
    count: 234,
    gradient: "gradient-empowerment"
  },
  {
    id: "life-lessons",
    title: "Life Lessons",
    description: "Wisdom shared from lived experiences", 
    icon: Star,
    count: 456,
    gradient: "gradient-warm"
  },
  {
    id: "fiction-novels",
    title: "Fiction & Novels",
    description: "Creative storytelling and imaginative worlds",
    icon: BookOpen,
    count: 342,
    gradient: "gradient-primary"
  },
  {
    id: "poetry",
    title: "Poetry & Reflections",
    description: "Verses that touch the soul and inspire",
    icon: Feather,
    count: 189,
    gradient: "gradient-empowerment"
  },
  {
    id: "community",
    title: "Community Voices",
    description: "Stories that bind us together",
    icon: Users,
    count: 267,
    gradient: "gradient-warm"
  },
  {
    id: "healing",
    title: "Healing Journeys",
    description: "Paths to wholeness and self-discovery",
    icon: Heart,
    count: 156,
    gradient: "gradient-primary"
  }
];

export const Categories = () => {
  return (
    <section id="categories" className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-empowerment bg-clip-text text-transparent">
              Story Categories
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover diverse voices and experiences across different genres. 
            Every story matters, every voice deserves to be heard.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.id}
                className="group cursor-pointer hover:shadow-story transition-all duration-300 border-border overflow-hidden"
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 ${category.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-empowerment transition-all duration-300`}>
                    <Icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                    {category.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-4 text-sm">
                    {category.description}
                  </p>
                  
                  <Badge variant="secondary" className="bg-empowerment/10 text-empowerment">
                    {category.count} stories
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};