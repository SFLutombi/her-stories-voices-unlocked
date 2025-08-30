import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { MetaMaskModal } from '@/components/MetaMaskModal';
import { Heart, BookOpen, Users, Wallet, Shield, Eye, PenTool } from 'lucide-react';
import { useEffect } from 'react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [anonymousName, setAnonymousName] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  const { signUp, signIn, user } = useAuth();
  const { 
    isConnected, 
    account, 
    isMetaMaskInstalled 
  } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (isAuthor) {
        navigate('/profile-setup');
      } else {
        navigate('/discover');
      }
    }
  }, [user, isAuthor, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For authors, require wallet connection
      if (isAuthor && !isConnected) {
        toast({
          variant: "destructive",
          title: "Wallet Required",
          description: "Authors must connect their MetaMask wallet to continue.",
        });
        setLoading(false);
        return;
      }

      const { error } = await signUp(email, password, displayName);
      if (error) throw error;

      toast({
        title: "Welcome to HerStories!",
        description: isAuthor 
          ? "Please check your email to verify your account, then complete your author profile."
          : "Please check your email to verify your account.",
      });

      // If author, redirect to profile setup after email verification
      if (isAuthor) {
        // Store author preferences in localStorage for profile setup
        localStorage.setItem('authorSetup', JSON.stringify({
          isAuthor: true,
          anonymousMode,
          anonymousName,
          walletAddress: account,
          walletData: {
            account: account,
            chainId: null, // Will be populated during profile setup
            connectedAt: new Date().toISOString()
          }
        }));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      
      // Check if user is an author and redirect accordingly
      // This would typically come from the user's profile in Supabase
      navigate('/discover');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSuccess = (connectedAccount: string) => {
    toast({
      title: "Wallet Connected!",
      description: `MetaMask connected successfully. You can now complete your author registration.`,
    });
  };

  const handleAuthorToggle = (checked: boolean) => {
    setIsAuthor(checked);
    if (checked && !isMetaMaskInstalled()) {
      toast({
        title: "MetaMask Required",
        description: "You need to install MetaMask to publish stories as an author.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-empowerment/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-3xl font-bold text-primary">
              HerStories
            </h1>
          </div>
          <p className="text-muted-foreground">Join our community of empowered voices</p>
        </div>

        <Tabs defaultValue="signin" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to continue reading and supporting women's stories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Join HerStories</CardTitle>
                <CardDescription>
                  Create your account to start reading, writing, and empowering women's voices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Display Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="How should we call you?"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  {/* Author Role Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="author-mode"
                        checked={isAuthor}
                        onCheckedChange={handleAuthorToggle}
                      />
                      <Label htmlFor="author-mode" className="font-medium">
                        I want to publish stories and earn from readers
                      </Label>
                    </div>
                    
                    {isAuthor && (
                      <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <PenTool className="h-4 w-4" />
                          <span>Author features will be unlocked after signup</span>
                        </div>
                        
                        {/* Wallet Connection for Authors */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">MetaMask Wallet</Label>
                          {!isMetaMaskInstalled() ? (
                            <div className="text-sm text-destructive">
                              MetaMask is not installed. Please install MetaMask to continue as an author.
                            </div>
                          ) : !isConnected ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowWalletModal(true)}
                              className="w-full"
                            >
                              <Wallet className="h-4 w-4 mr-2" />
                              Connect MetaMask
                            </Button>
                          ) : (
                            <div className="flex items-center justify-between p-2 bg-primary/10 rounded border">
                              <span className="text-sm font-mono">
                                {account?.slice(0, 6)}...{account?.slice(-4)}
                              </span>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Connected
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Anonymous Mode for Authors */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="anonymous-mode"
                              checked={anonymousMode}
                              onCheckedChange={setAnonymousMode}
                            />
                            <Label htmlFor="anonymous-mode" className="text-sm">
                              Enable anonymous publishing for sensitive content
                            </Label>
                          </div>
                          
                          {anonymousMode && (
                            <Input
                              placeholder="Choose a pen name"
                              value={anonymousName}
                              onChange={(e) => setAnonymousName(e.target.value)}
                              className="text-sm"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || (isAuthor && !isConnected)}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center space-y-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-sm text-muted-foreground">Read Stories</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Heart className="h-6 w-6 text-empowerment" />
            <span className="text-sm text-muted-foreground">Support Authors</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Users className="h-6 w-6 text-primary" />
            <span className="text-sm text-muted-foreground">Join Community</span>
          </div>
        </div>
      </div>

      {/* MetaMask Connection Modal */}
      <MetaMaskModal
        isOpen={showWalletModal}
        onOpenChange={setShowWalletModal}
        onSuccess={handleWalletSuccess}
      />
    </div>
  );
};

export default Auth;