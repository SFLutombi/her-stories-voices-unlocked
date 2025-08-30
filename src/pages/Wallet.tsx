import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Coins, ArrowUpRight, ArrowDownLeft, Heart, BookOpen, Gift, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'chapter' | 'story' | 'tip';
  created_at: string;
  story: {
    title: string;
    author: {
      display_name: string;
    };
  };
}

const Wallet = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      navigate('/auth');
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          story:stories(
            title,
            author:profiles!author_id(display_name)
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'chapter':
        return <BookOpen className="h-4 w-4" />;
      case 'story':
        return <BookOpen className="h-4 w-4" />;
      case 'tip':
        return <Gift className="h-4 w-4" />;
      default:
        return <ArrowDownLeft className="h-4 w-4" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'chapter':
        return 'Chapter Purchase';
      case 'story':
        return 'Full Story Purchase';
      case 'tip':
        return 'Author Tip';
      default:
        return 'Transaction';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access your wallet</h1>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Wallet</h1>
          <p className="text-muted-foreground">
            Manage your credits and track your support for authors
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Wallet Balance */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Coins className="h-5 w-5 mr-2 text-primary" />
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {profile?.wallet_balance || 0}
                  </div>
                  <p className="text-muted-foreground mb-4">Credits Available</p>
                  
                  <Button className="w-full mb-3">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Credits
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Credits support authors directly with transparent payments
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Stories Supported</span>
                  <Badge variant="secondary">
                    {new Set(transactions.map(t => t.story.title)).size}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Authors Supported</span>
                  <Badge variant="secondary">
                    {new Set(transactions.map(t => t.story.author.display_name)).size}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Spent</span>
                  <Badge variant="outline" className="text-empowerment border-empowerment">
                    {transactions.reduce((sum, t) => sum + t.amount, 0)} credits
                  </Badge>
                </div>

                <Separator />

                <div className="bg-empowerment/10 p-3 rounded-lg">
                  <div className="flex items-center text-empowerment text-sm">
                    <Heart className="h-4 w-4 mr-2" />
                    You've helped fund women's shelters through impact stories
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Track your payments and see where your support goes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-muted rounded-full" />
                          <div className="flex-1">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                          </div>
                          <div className="h-6 w-16 bg-muted rounded" />
                        </div>
                        <Separator className="my-4" />
                      </div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start supporting authors by reading their stories
                    </p>
                    <Button onClick={() => navigate('/discover')}>
                      Discover Stories
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {transactions.map((transaction, index) => (
                      <div key={transaction.id}>
                        <div className="flex items-center justify-between py-4">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                              {getTransactionIcon(transaction.transaction_type)}
                            </div>
                            
                            <div>
                              <h4 className="font-medium">
                                {getTransactionLabel(transaction.transaction_type)}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {transaction.story.title} • by {transaction.story.author.display_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleDateString()} at{' '}
                                {new Date(transaction.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center text-empowerment font-medium">
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                              {transaction.amount} credits
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-xs mt-1"
                            >
                              {transaction.transaction_type}
                            </Badge>
                          </div>
                        </div>
                        
                        {index < transactions.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Where Your Payment Goes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Direct to Author</span>
                    <Badge variant="default">90%</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Women's Shelters (Impact Stories)</span>
                    <Badge variant="outline" className="text-empowerment border-empowerment">
                      10%
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="bg-card/50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">100% Transparency</h4>
                    <p className="text-xs text-muted-foreground">
                      Every payment you make directly supports the author and contributes to empowering 
                      women in South Africa. No hidden fees, no middlemen.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Wallet;