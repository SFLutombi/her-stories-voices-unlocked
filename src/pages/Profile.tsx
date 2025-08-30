import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getTransactionHistory, getUserCredits } from '@/utils/credits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Wallet, 
  DollarSign, 
  BookOpen, 
  Users, 
  Eye, 
  PenTool, 
  TrendingUp,
  Calendar,
  Shield,
  Heart,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthorProfile {
  id: string;
  pseudonym: string | null;
  wallet_address: string;
  wallet_data: any;
  impact_percentage: number;
  total_earnings: number;
  total_stories_published: number;
  total_chapters_published: number;
  total_readers: number;
  created_at: string;
  updated_at: string;
}

interface UserCredits {
  id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  updated_at: string;
}

interface Transaction {
  id: string;
  from_user_id: string;
  to_user_id: string;
  story_id: string | null;
  chapter_id: string | null;
  amount: number;
  transaction_type: 'purchase' | 'tip' | 'donation';
  status: 'pending' | 'completed' | 'failed';
  blockchain_tx_hash: string | null;
  created_at: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalStories: 0,
    totalChapters: 0,
    totalReaders: 0,
    totalEarnings: 0,
    impactPercentage: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadProfileData();
  }, [user, navigate]);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      // Load basic profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      } else if (profileData) {
        setProfile(profileData);
      }

      // Load author profile if user is an author
      if (profileData?.is_author) {
        const { data: authorData, error: authorError } = await supabase
          .from('author_profiles')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        if (authorError && authorError.code !== 'PGRST116') {
          console.error('Error loading author profile:', authorError);
        } else if (authorData) {
          setAuthorProfile(authorData);
          setStats({
            totalStories: authorData.total_stories_published,
            totalChapters: authorData.total_chapters_published,
            totalReaders: authorData.total_readers,
            totalEarnings: authorData.total_earnings,
            impactPercentage: authorData.impact_percentage
          });
        }
      }

      // Load user credits using utility function
      const creditsData = await getUserCredits(user?.id);
      if (creditsData) {
        setUserCredits({
          id: user?.id,
          ...creditsData,
          updated_at: new Date().toISOString()
        });
      } else {
        // If credits don't exist, create them with 0 balance
        console.log('No credits found, creating default credits');
        const { error: createError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user?.id,
            balance: 0.00,
            total_earned: 0.00,
            total_spent: 0.00
          });

        if (createError && createError.code !== '23505') { // Ignore duplicate key errors
          console.error('Error creating default credits:', createError);
        } else {
          // Set default credits
          setUserCredits({
            id: user?.id,
            balance: 0.00,
            total_earned: 0.00,
            total_spent: 0.00,
            updated_at: new Date().toISOString()
          });
        }
      }

      // Load recent transactions using utility function
      const transactionsData = await getTransactionHistory(user?.id, 10);
      if (transactionsData) {
        setRecentTransactions(transactionsData);
      }

    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return 'Not connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <BookOpen className="h-4 w-4" />;
      case 'tip':
        return <Heart className="h-4 w-4" />;
      case 'donation':
        return <Shield className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'text-blue-600';
      case 'tip':
        return 'text-pink-600';
      case 'donation':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-empowerment/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-empowerment/5 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">Please complete your profile setup first.</p>
          <Button onClick={() => navigate('/profile-setup')}>Complete Profile Setup</Button>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-empowerment/5 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">Your Profile</h1>
          <p className="text-muted-foreground">Manage your account and track your progress</p>
                </div>
                
        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                <p className="text-lg font-semibold">{profile.display_name || 'Not set'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Bio</label>
                <p className="text-lg">{profile.bio || 'No bio added yet'}</p>
                  </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <div className="flex items-center space-x-2">
                  {profile.is_author ? (
                    <Badge variant="secondary" className="bg-empowerment/20 text-empowerment">
                      <PenTool className="h-3 w-3 mr-1" />
                      Author
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <BookOpen className="h-3 w-3 mr-1" />
                      Reader
                    </Badge>
                  )}
                  {profile.is_anonymous && (
                    <Badge variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Anonymous
                    </Badge>
                  )}
                  </div>
                </div>
              {profile.is_anonymous && profile.pseudonym && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Pseudonym</label>
                  <p className="text-lg font-semibold text-empowerment">{profile.pseudonym}</p>
              </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Wallet Information */}
                <Card>
                  <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Wallet Information</span>
            </CardTitle>
                  </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Wallet Address</label>
                <div className="flex items-center space-x-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {formatWalletAddress(profile.wallet_address)}
                  </code>
                  <Button variant="outline" size="sm">Copy</Button>
                </div>
                      </div>
                      <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Network</label>
                <p className="text-lg">
                  {profile.wallet_data?.networkName || 'Ethereum Mainnet'}
                </p>
              </div>
                      </div>
            {profile.wallet_data?.connectedAt && (
              <div className="text-sm text-muted-foreground">
                Connected since: {formatDate(profile.wallet_data.connectedAt)}
                      </div>
            )}
                  </CardContent>
                </Card>

        {/* Credits & Balance */}
                <Card>
                  <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Credits & Balance</span>
            </CardTitle>
                  </CardHeader>
          <CardContent>
            {userCredits ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {formatAmount(userCredits.balance)}
                      </div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                    </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600 mb-2">
                    {formatAmount(userCredits.total_earned)}
                      </div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                    </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-red-600 mb-2">
                    {formatAmount(userCredits.total_spent)}
                      </div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                    </div>
                      </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading credit information...</p>
                    </div>
            )}
                  </CardContent>
                </Card>

        {/* Author Statistics (if author) */}
        {profile.is_author && authorProfile && (
                <Card>
                  <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Author Statistics</span>
              </CardTitle>
                  </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {stats.totalStories}
                  </div>
                  <p className="text-sm text-muted-foreground">Stories Published</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-empowerment mb-2">
                    {stats.totalChapters}
                  </div>
                  <p className="text-sm text-muted-foreground">Chapters Published</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {stats.totalReaders}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Readers</p>
                      </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {formatAmount(stats.totalEarnings)}
                    </div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                      </div>
                    </div>

              {stats.impactPercentage > 0 && (
                <div className="mt-6 p-4 bg-empowerment/10 border border-empowerment/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Heart className="h-5 w-5 text-empowerment" />
                    <span className="font-semibold text-empowerment">Social Impact</span>
                  </div>
                        <p className="text-sm text-muted-foreground">
                    {stats.impactPercentage}% of your earnings go to women's shelters and empowerment programs.
                        </p>
                      </div>
              )}
                  </CardContent>
                </Card>
        )}

        {/* Recent Transactions */}
                <Card>
                  <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Recent Transactions</span>
            </CardTitle>
                  </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`${getTransactionColor(transaction.transaction_type)}`}>
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                    <div>
                        <p className="font-medium">
                          {transaction.transaction_type === 'purchase' ? 'Chapter Purchase' :
                           transaction.transaction_type === 'tip' ? 'Tip Sent' : 'Donation'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.created_at)}
                      </p>
                    </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.to_user_id === user?.id ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.to_user_id === user?.id ? '+' : '-'}{formatAmount(transaction.amount)}
                      </p>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                      </div>
                    </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No transactions yet</p>
            )}
                  </CardContent>
                </Card>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <Button onClick={() => navigate('/profile-setup')} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          {profile.is_author && (
            <Button onClick={() => navigate('/dashboard')}>
              <PenTool className="h-4 w-4 mr-2" />
              Author Dashboard
            </Button>
          )}
          <Button onClick={() => signOut()} variant="destructive">
            <Shield className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        </div>
    </div>
  );
};

export default Profile;