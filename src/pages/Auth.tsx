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
import { useToast } from '@/hooks/use-toast';
import { Heart, BookOpen, Coins, Shield, Users, PenTool } from 'lucide-react';
import { useEffect } from 'react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [anonymousName, setAnonymousName] = useState('');
  // Wallet modal removed - no longer needed during signup
  
  const { signUp, signIn, user } = useAuth();
  // Removed MetaMask requirement during signup
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

  // Wallet connection is now handled on the dashboard

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // MetaMask connection is no longer required during signup
      // Users can connect their wallet later on the dashboard

      const { error, data } = await signUp(email, password, displayName);
      if (error) {
        console.error('Signup error:', error);
        
        // User-friendly error messages
        let userMessage = "Something went wrong while creating your account. Please try again.";
        
        if (error.message?.includes('email')) {
          userMessage = "This email address is already registered. Please try signing in instead.";
        } else if (error.message?.includes('password')) {
          userMessage = "Password must be at least 6 characters long. Please choose a stronger password.";
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          userMessage = "Network connection issue. Please check your internet and try again.";
        } else if (error.message?.includes('timeout')) {
          userMessage = "Request timed out. Please try again.";
        } else if (error.message?.includes('rate limit')) {
          userMessage = "Too many signup attempts. Please wait a moment and try again.";
        }

      toast({
          variant: "destructive",
          title: "Account Creation Failed",
          description: userMessage,
        });
        return;
      }

      // Store verification data for the verification page
      const verificationData = {
        email,
        displayName,
        isAuthor
      };
      
      // Store the data first
      localStorage.setItem('verificationData', JSON.stringify(verificationData));
      console.log('Auth: Stored verification data:', verificationData);

      // If author, also store author preferences for profile setup
      if (isAuthor) {
        const authorSetupData = {
          isAuthor: true,
          anonymousMode,
          anonymousName,
          walletAddress: null, // Will be set when user connects wallet on dashboard
          walletData: {
            account: null,
            chainId: null,
            connectedAt: null
          }
        };
        localStorage.setItem('authorSetup', JSON.stringify(authorSetupData));
        console.log('Auth: Stored author setup data:', authorSetupData);
      }

      // Show success toast before redirect
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });

      // Small delay to ensure localStorage is set, then redirect
      setTimeout(() => {
        console.log('Auth: Redirecting to email verification page');
        navigate('/email-verification');
      }, 100);
      
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
      if (error) {
        console.error('Signin error:', error);
        
        // User-friendly error messages
        let userMessage = "Something went wrong while signing in. Please try again.";
        
        if (error.message?.includes('Invalid login credentials')) {
          userMessage = "Email or password is incorrect. Please check your credentials and try again.";
        } else if (error.message?.includes('Email not confirmed')) {
          userMessage = "Please check your email and click the verification link before signing in.";
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          userMessage = "Network connection issue. Please check your internet and try again.";
        } else if (error.message?.includes('timeout')) {
          userMessage = "Request timed out. Please try again.";
        } else if (error.message?.includes('rate limit')) {
          userMessage = "Too many sign-in attempts. Please wait a moment and try again.";
        }
        
        toast({
          variant: "destructive",
          title: "Sign In Failed",
          description: userMessage,
        });
        return;
      }

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

  // Wallet connection is now handled on the dashboard
  const handleAuthorToggle = (checked: boolean) => {
    setIsAuthor(checked);
    // No MetaMask requirement during signup
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    const basicFieldsValid = email && password && displayName;
    
    // No wallet requirement during signup
    return basicFieldsValid;
  };

  // Get button text based on form state
  const getButtonText = () => {
    if (loading) return 'Creating Account...';
    return 'Create Account';
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
                        onCheckedChange={setIsAuthor}
                      />
                      <Label htmlFor="author-mode" className="font-medium">
                        I want to publish stories and earn from readers
                      </Label>
                    </div>
                    
                    {isAuthor && (
                      <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <PenTool className="h-4 w-4" />
                          <span>Author features will be unlocked after signup. You can connect your MetaMask wallet later on the dashboard.</span>
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
                    className={`w-full ${
                      !isFormValid() 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                    disabled={loading || !isFormValid()}
                  >
                    {getButtonText()}
                  </Button>

                  {/* Detailed validation feedback */}
                  {!isFormValid() && (
                    <div className="text-sm text-muted-foreground bg-muted/20 p-2 rounded text-center space-y-1">
                      <div className="font-medium">Please complete the following:</div>
                      <div className="text-xs space-y-1">
                        {!email && <div>• Email address</div>}
                        {!password && <div>• Password</div>}
                        {!displayName && <div>• Display name</div>}
                        {/* MetaMask connection is now handled on the dashboard */}
                      </div>
                    </div>
                  )}
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

      {/* MetaMask connection is now handled on the dashboard */}
    </div>
  );
};

export default Auth;