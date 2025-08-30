import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Heart, Users, DollarSign, BookOpen, Target, Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ImpactStats {
  totalDonations: number;
  storiesSupported: number;
  authorsEmpowered: number;
  readersEngaged: number;
}

const ImpactPage = () => {
  const [stats, setStats] = useState<ImpactStats>({
    totalDonations: 0,
    storiesSupported: 0,
    authorsEmpowered: 0,
    readersEngaged: 0,
  });

  useEffect(() => {
    fetchImpactStats();
  }, []);

  const fetchImpactStats = async () => {
    try {
      // Fetch total transactions for impact calculation
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, story:stories(impact_percentage)');

      // Calculate total donations (assuming 10% average impact)
      const totalDonations = transactions?.reduce((sum, t) => {
        const impactPercentage = t.story?.impact_percentage || 10;
        return sum + (t.amount * impactPercentage / 100);
      }, 0) || 0;

      // Fetch unique stories count
      const { data: stories } = await supabase
        .from('stories')
        .select('id')
        .eq('published', true);

      // Fetch unique authors count
      const { data: authors } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_author', true);

      // Fetch unique readers count (users who made purchases)
      const { data: purchases } = await supabase
        .from('purchases')
        .select('user_id');

      const uniqueReaders = new Set(purchases?.map(p => p.user_id) || []).size;

      setStats({
        totalDonations: Math.round(totalDonations),
        storiesSupported: stories?.length || 0,
        authorsEmpowered: authors?.length || 0,
        readersEngaged: uniqueReaders,
      });
    } catch (error) {
      console.error('Error fetching impact stats:', error);
    }
  };

  const impactStories = [
    {
      title: "Survivor's Strength",
      author: "Anonymous",
      excerpt: "Through HerStories, I found my voice and the courage to share my journey. The support from readers helped me rebuild my life and contribute to helping other women.",
      impact: "Raised 150 credits for women's shelter",
    },
    {
      title: "Breaking Barriers",
      author: "Nomsa M.",
      excerpt: "As a young entrepreneur from the township, sharing my business journey on HerStories connected me with mentors and supporters I never thought possible.",
      impact: "Inspired 25+ women to start businesses",
    },
    {
      title: "The Mother's Guide",
      author: "Thandi K.",
      excerpt: "My story about single motherhood in South Africa resonated with so many women. The micro-payments helped me support my children while helping others.",
      impact: "Direct support to 50+ families",
    },
  ];

  const ngoPartners = [
    {
      name: "Women's Shelter Cape Town",
      description: "Providing safe haven and support services for women escaping domestic violence",
      supported: "45 credits this month",
    },
    {
      name: "Empowerment Foundation",
      description: "Skills training and economic empowerment programs for women in townships",
      supported: "78 credits this month",
    },
    {
      name: "Thrive Women's Network",
      description: "Mentorship and leadership development for young South African women",
      supported: "62 credits this month",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-empowerment/10 via-background to-primary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Our Impact
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Every story read, every credit spent, every voice shared creates ripples of change 
            throughout South African communities. See how we're empowering women together.
          </p>
        </div>
      </section>

      {/* Impact Statistics */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="text-center">
              <CardHeader>
                <DollarSign className="h-8 w-8 mx-auto text-empowerment mb-2" />
                <CardTitle className="text-2xl font-bold text-empowerment">
                  {stats.totalDonations}
                </CardTitle>
                <CardDescription>Credits donated to shelters</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BookOpen className="h-8 w-8 mx-auto text-primary mb-2" />
                <CardTitle className="text-2xl font-bold">
                  {stats.storiesSupported}
                </CardTitle>
                <CardDescription>Stories published</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Heart className="h-8 w-8 mx-auto text-empowerment mb-2" />
                <CardTitle className="text-2xl font-bold">
                  {stats.authorsEmpowered}
                </CardTitle>
                <CardDescription>Authors empowered</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-8 w-8 mx-auto text-primary mb-2" />
                <CardTitle className="text-2xl font-bold">
                  {stats.readersEngaged}
                </CardTitle>
                <CardDescription>Active readers</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Progress Towards Goals */}
          <Card className="mb-16">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-6 w-6 mr-2 text-primary" />
                2024 Impact Goals
              </CardTitle>
              <CardDescription>
                Tracking our progress towards empowering South African women
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Credits donated to shelters</span>
                  <span className="font-medium">{stats.totalDonations} / 5,000</span>
                </div>
                <Progress value={(stats.totalDonations / 5000) * 100} className="h-3" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span>Authors onboarded</span>
                  <span className="font-medium">{stats.authorsEmpowered} / 100</span>
                </div>
                <Progress value={(stats.authorsEmpowered / 100) * 100} className="h-3" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span>Stories published</span>
                  <span className="font-medium">{stats.storiesSupported} / 500</span>
                </div>
                <Progress value={(stats.storiesSupported / 500) * 100} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Impact Stories */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Real Stories, Real Impact</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Behind every transaction is a human story of empowerment, resilience, and community support.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {impactStories.map((story, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <CardTitle className="text-lg">{story.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">by {story.author}</p>
                    </div>
                    <Quote className="h-6 w-6 text-empowerment/50" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 italic">
                    "{story.excerpt}"
                  </p>
                  <Badge variant="outline" className="text-empowerment border-empowerment">
                    <Heart className="h-3 w-3 mr-1" />
                    {story.impact}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* NGO Partners */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our NGO Partners</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Working together with established organizations to maximize our impact in South African communities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {ngoPartners.map((ngo, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{ngo.name}</CardTitle>
                  <CardDescription>{ngo.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{ngo.supported}</Badge>
                    <Button variant="outline" size="sm">
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4">Want to Partner With Us?</h3>
                <p className="text-muted-foreground mb-6">
                  Are you an NGO working to empower South African women? 
                  Let's collaborate to amplify our impact together.
                </p>
                <Button>Contact Us</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ImpactPage;