import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, DollarSign, Users, Shield, TrendingUp, Globe } from "lucide-react";

const impactStats = [
  {
    icon: DollarSign,
    value: "₹2.8M",
    label: "Directly to Authors",
    description: "100% of payments go to storytellers"
  },
  {
    icon: Users,
    value: "1,247",
    label: "Women Empowered",
    description: "Authors earning from their stories"
  },
  {
    icon: Shield,
    value: "₹450K",
    label: "For GBV Support",
    description: "Donated to women's shelters"
  },
  {
    icon: Globe,
    value: "23",
    label: "Communities",
    description: "Across South Africa"
  }
];

export const Impact = () => {
  return (
    <section id="impact" className="py-20 bg-gradient-to-br from-empowerment/5 via-primary/5 to-warmth/5">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-empowerment">
              Creating Real Impact
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Every story purchased creates a ripple effect of empowerment. 
            See how your support transforms lives and builds communities.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {impactStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="text-center border-border hover:shadow-story transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-16 h-16 gradient-empowerment rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-lg font-semibold mb-2">
                    {stat.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.description}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Impact Story */}
        <Card className="bg-card/50 backdrop-blur-sm border-empowerment/20 max-w-4xl mx-auto">
          <CardContent className="p-12 text-center">
            <Heart className="h-12 w-12 text-empowerment mx-auto mb-6" />
            <blockquote className="text-2xl font-medium mb-6 text-foreground story-text">
              "HerStories gave me a voice when I thought I had lost it forever. 
              Not only can I share my healing journey, but I'm earning enough 
              to support my children. This platform saved my life."
            </blockquote>
            <cite className="text-empowerment font-semibold">
              - Sarah M., Survivor Story Author
            </cite>
            <div className="mt-8">
              <Button variant="empowerment" size="lg">
                <TrendingUp className="h-5 w-5 mr-2" />
                See More Impact Stories
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};