import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, BookOpen, Eye, User, Shield, Wallet } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    role: 'reader', // 'reader', 'writer', 'both'
    isAnonymous: false,
    anonymousName: '',
    categories: [],
    impactPercentage: 10,
    walletAddress: '',
    walletData: {
      account: '',
      chainId: '',
      connectedAt: '',
      networkName: ''
    }
  });

  // Load author setup data from localStorage if available
  useEffect(() => {
    const authorSetup = localStorage.getItem('authorSetup');
    if (authorSetup) {
      try {
        const setup = JSON.parse(authorSetup);
        setProfileData(prev => ({
          ...prev,
          ...setup,
          role: 'writer' // Force role to writer for authors
        }));
      } catch (error) {
        console.error('Error parsing author setup:', error);
      }
    }
  }, []);

  // Get current wallet information for authors
  useEffect(() => {
    const getWalletInfo = async () => {
      if (profileData.role === 'writer' || profileData.role === 'both') {
        try {
          // Get current chain ID and other wallet info
          if (typeof window !== 'undefined' && window.ethereum) {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            if (accounts.length > 0) {
              setProfileData(prev => ({
                ...prev,
                walletAddress: accounts[0],
                walletData: {
                  account: accounts[0],
                  chainId: chainId,
                  connectedAt: new Date().toISOString(),
                  networkName: getNetworkName(chainId)
                }
              }));
            }
          }
        } catch (error) {
          console.error('Error getting wallet info:', error);
        }
      }
    };

    getWalletInfo();
  }, [profileData.role]);

  // Helper function to get network name from chain ID
  const getNetworkName = (chainId: string) => {
    const networks: { [key: string]: string } = {
      '0x1': 'Ethereum Mainnet',
      '0x3': 'Ropsten Testnet',
      '0x4': 'Rinkeby Testnet',
      '0x5': 'Goerli Testnet',
      '0x2a': 'Kovan Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Mumbai Testnet',
      '0xa': 'Optimism',
      '0xa4b1': 'Arbitrum One',
      '0xa4ec': 'Celo Mainnet'
    };
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // First, check if a profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing profile:', checkError);
        throw checkError;
      }

      if (existingProfile) {
        console.log('Profile already exists, updating instead of creating');
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            display_name: profileData.displayName,
            bio: profileData.bio,
            is_author: profileData.role === 'writer' || profileData.role === 'both',
            is_anonymous: profileData.isAnonymous,
            pseudonym: profileData.isAnonymous ? profileData.anonymousName : null,
            wallet_address: profileData.walletAddress,
            wallet_data: profileData.walletData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        console.log('Creating new profile');
        // Create new profile
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: profileData.displayName,
            bio: profileData.bio,
            is_author: profileData.role === 'writer' || profileData.role === 'both',
            is_anonymous: profileData.isAnonymous,
            pseudonym: profileData.isAnonymous ? profileData.anonymousName : null,
            wallet_address: profileData.walletAddress,
            wallet_data: profileData.walletData,
            updated_at: new Date().toISOString()
          });

        if (createError) throw createError;
      }

      // If author, create/update author profile
      if (profileData.role === 'writer' || profileData.role === 'both') {
        console.log('Creating/updating author profile');
        
        const { error: authorError } = await supabase
          .from('author_profiles')
          .upsert({
            user_id: user.id,
            pseudonym: profileData.isAnonymous ? profileData.anonymousName : null,
            wallet_address: profileData.walletAddress,
            wallet_data: profileData.walletData,
            impact_percentage: profileData.impactPercentage || 0,
            total_earnings: 0.00,
            total_stories_published: 0,
            total_chapters_published: 0,
            total_readers: 0
          });

        if (authorError) {
          console.error('Error creating author profile:', authorError);
          throw authorError;
        }
      }

      // Create user credits record (everyone starts with 0)
      console.log('Creating user credits record');
      const { error: creditsError } = await supabase
        .from('user_credits')
        .upsert({
          user_id: user.id,
          balance: 0.00,
          total_earned: 0.00,
          total_spent: 0.00
        });

      if (creditsError) {
        console.error('Error creating user credits:', creditsError);
        throw creditsError;
      }

      // Clear onboarding data
      localStorage.removeItem('authorSetup');

      toast({
        title: "Profile Setup Complete! 🎉",
        description: "Welcome to HerStories! You can now start publishing your stories and connecting with readers.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Profile setup error:', error);
      
      // User-friendly error message
      let userMessage = "Something went wrong while setting up your profile. Please try again.";
      
      if (error.code === '23505') { // Unique constraint violation
        userMessage = "It looks like your profile was already set up. Redirecting you to the dashboard...";
        // Redirect after a short delay
        setTimeout(() => navigate('/dashboard'), 2000);
      } else if (error.message?.includes('duplicate key')) {
        userMessage = "Your profile is already set up! Taking you to the dashboard...";
        setTimeout(() => navigate('/dashboard'), 2000);
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        userMessage = "Network connection issue. Please check your internet and try again.";
      } else if (error.message?.includes('timeout')) {
        userMessage = "Request timed out. Please try again.";
      }

      toast({
        variant: "destructive",
        title: "Setup Issue",
        description: userMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold">Choose Your Role</h3>
        <p className="text-muted-foreground">
          How would you like to use HerStories?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            profileData.role === 'reader' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => setProfileData({...profileData, role: 'reader'})}
        >
          <CardContent className="p-6 text-center">
            <Eye className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h4 className="font-semibold mb-2">Reader</h4>
            <p className="text-sm text-muted-foreground">
              Discover and support women's stories through micro-payments
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            profileData.role === 'writer' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => setProfileData({...profileData, role: 'writer'})}
        >
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-empowerment" />
            <h4 className="font-semibold mb-2">Writer</h4>
            <p className="text-sm text-muted-foreground">
              Share your stories and earn directly from readers
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            profileData.role === 'both' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => setProfileData({...profileData, role: 'both'})}
        >
          <CardContent className="p-6 text-center">
            <Heart className="h-12 w-12 mx-auto mb-4 text-warmth" />
            <h4 className="font-semibold mb-2">Both</h4>
            <p className="text-sm text-muted-foreground">
              Read, write, and fully engage with the community
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold">Personalize Your Profile</h3>
        <p className="text-muted-foreground">
          Tell us about yourself and your preferences
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={profileData.displayName}
            onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
            placeholder="How should we call you?"
            required
          />
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profileData.bio}
            onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
            placeholder="Tell us a bit about yourself..."
            rows={3}
          />
        </div>

        {(profileData.role === 'writer' || profileData.role === 'both') && (
          <>
            <div className="flex items-center space-x-2">
              <Switch
                id="anonymous"
                checked={profileData.isAnonymous}
                onCheckedChange={(checked) => setProfileData({...profileData, isAnonymous: checked})}
              />
              <Label htmlFor="anonymous">Enable Anonymous Mode</Label>
            </div>

            {profileData.isAnonymous && (
              <div>
                <Label htmlFor="anonymousName">Anonymous Pen Name</Label>
                <Input
                  id="anonymousName"
                  value={profileData.anonymousName}
                  onChange={(e) => setProfileData({...profileData, anonymousName: e.target.value})}
                  placeholder="Choose a pen name for sensitive content"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This name will be used when you publish anonymous stories
                </p>
              </div>
            )}

            {profileData.walletAddress && (
              <div>
                <Label>Connected Wallet</Label>
                <div className="flex items-center space-x-2 p-2 bg-muted rounded border">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-mono">
                    {profileData.walletAddress.slice(0, 6)}...{profileData.walletAddress.slice(-4)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  This wallet will be used for receiving payments from readers
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold">Finalize Your Setup</h3>
        <p className="text-muted-foreground">
          Review your choices and complete your profile
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Summary</CardTitle>
          <CardDescription>Review your profile settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Role:</span>
              <span className="ml-2 capitalize">{profileData.role}</span>
            </div>
            <div>
              <span className="font-medium">Display Name:</span>
              <span className="ml-2">{profileData.displayName || 'Not set'}</span>
            </div>
            {(profileData.role === 'writer' || profileData.role === 'both') && (
              <>
                <div>
                  <span className="font-medium">Anonymous Mode:</span>
                  <span className="ml-2">{profileData.isAnonymous ? 'Enabled' : 'Disabled'}</span>
                </div>
                {profileData.isAnonymous && (
                  <div>
                    <span className="font-medium">Pen Name:</span>
                    <span className="ml-2">{profileData.anonymousName || 'Not set'}</span>
                  </div>
                )}
                {profileData.walletAddress && (
                  <div>
                    <span className="font-medium">Wallet:</span>
                    <span className="ml-2 font-mono">
                      {profileData.walletAddress.slice(0, 6)}...{profileData.walletAddress.slice(-4)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 text-empowerment">
          <Shield className="h-5 w-5" />
          <span className="text-sm font-medium">Your privacy and safety are our priority</span>
        </div>
        <p className="text-sm text-muted-foreground">
          You can change these settings anytime in your profile
        </p>
      </div>
    </div>
  );

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-empowerment/5 to-warmth/5 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Heart className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-primary">HerStories</h1>
            </div>
            <p className="text-muted-foreground">Complete your profile setup</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-empowerment h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>Step {step} of 3</span>
              <span>{Math.round((step / 3) * 100)}%</span>
            </div>
          </div>

          {/* Step Content */}
          <Card className="mb-8">
            <CardContent className="p-8">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={loading || (step === 2 && !profileData.displayName)}
              className="bg-gradient-to-r from-primary to-empowerment hover:from-primary/90 hover:to-empowerment/90 text-white"
            >
              {loading ? 'Saving...' : (step === 3 ? 'Complete Setup' : 'Next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
