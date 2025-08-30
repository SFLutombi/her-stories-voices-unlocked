import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWeb3 } from '@/contexts/Web3Context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { Wallet, AlertCircle, CheckCircle, Loader2, Eye, BookOpen, Heart, Shield } from 'lucide-react';

export const ProfileSetup = () => {
  const { user } = useAuth();
  const { isConnected, contractsInitialized, account } = useWeb3();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [registeringAuthor, setRegisteringAuthor] = useState(false);
  const [authorRegistered, setAuthorRegistered] = useState(false);

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

  // Check if user is already registered as author on blockchain
  useEffect(() => {
    if (isConnected && contractsInitialized && account && profileData.role === 'writer') {
      checkAuthorRegistration();
    }
  }, [isConnected, contractsInitialized, account, profileData.role]);

  const checkAuthorRegistration = async () => {
    try {
      const { getUserProfileOnChain } = await import('@/integrations/web3/contracts');
      const profile = await getUserProfileOnChain(account);
      
      // Check if this is actually a valid, active author profile
      if (profile && 
          profile.author && 
          profile.author !== '0x0000000000000000000000000000000000000000' && 
          profile.author.toLowerCase() === account.toLowerCase() &&
          profile.isActive) {
        setAuthorRegistered(true);
      } else {
        setAuthorRegistered(false);
      }
    } catch (error) {
      setAuthorRegistered(false);
    }
  };

  const registerAuthorOnBlockchain = async () => {
    if (!isConnected || !contractsInitialized || !account) {
      toast({
        variant: "destructive",
        title: "Web3 Connection Required",
        description: "Please ensure your MetaMask wallet is connected and on the correct network.",
      });
      return;
    }

    setRegisteringAuthor(true);
    try {
      const { registerAuthorOnChain } = await import('@/integrations/web3/contracts');
      const pseudonym = profileData.displayName || 'Anonymous Author';
      const impactPercentage = profileData.impactPercentage || 10;

      const tx = await registerAuthorOnChain(pseudonym, impactPercentage);
      
      toast({
        title: "Author Registration Successful! 🎉",
        description: "You've been registered as an author on the blockchain. Transaction hash: " + tx.transactionHash.slice(0, 10) + "...",
      });

      setAuthorRegistered(true);
    } catch (error: any) {
      console.error('Failed to register author:', error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || 'Failed to register as author on blockchain',
      });
    } finally {
      setRegisteringAuthor(false);
    }
  };

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

  // Connect MetaMask wallet
  const connectMetaMask = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast({
        variant: "destructive",
        title: "MetaMask Not Found",
        description: "Please install MetaMask extension to continue.",
      });
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
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
        
        toast({
          title: "Wallet Connected! 🎉",
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    } catch (error: any) {
      console.error('Failed to connect MetaMask:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || 'Failed to connect MetaMask wallet',
      });
    }
  };

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

    // For authors, require blockchain registration first
    if (profileData.role === 'writer' && !authorRegistered) {
      toast({
        variant: "destructive",
        title: "Author Registration Required",
        description: "Please complete your blockchain author registration before continuing.",
      });
      return;
    }

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

                {/* MetaMask Connection Section */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <h4 className="text-md font-semibold">MetaMask Wallet</h4>
                  </div>
                  
                  {!profileData.walletAddress ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Connect your MetaMask wallet to receive payments from readers
                      </p>
                      <Button
                        onClick={connectMetaMask}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Connect MetaMask
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Connected Wallet</Label>
                      <div className="flex items-center space-x-2 p-2 bg-muted rounded border">
                        <Wallet className="h-4 w-4 text-primary" />
                        <span className="text-sm font-mono">
                          {profileData.walletAddress.slice(0, 6)}...{profileData.walletAddress.slice(-4)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Network: {profileData.walletData.networkName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This wallet will be used for receiving payments from readers
                      </p>
                    </div>
                  )}
                </div>

            {/* Blockchain Author Registration */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                <h4 className="text-md font-semibold text-blue-800">Blockchain Registration</h4>
              </div>
              
              <p className="text-sm text-blue-700">
                To publish stories and earn from readers, you need to register as an author on the blockchain.
              </p>

              {!isConnected ? (
                <div className="text-sm text-red-600 bg-red-100 p-3 rounded">
                  <p className="font-medium">⚠️ MetaMask Not Connected</p>
                  <p>Please connect your MetaMask wallet to continue with author registration.</p>
                </div>
              ) : !contractsInitialized ? (
                <div className="text-sm text-yellow-600 bg-yellow-100 p-3 rounded">
                  <p className="font-medium">⏳ Smart Contracts Loading</p>
                  <p>Please wait while we connect to the blockchain...</p>
                </div>
              ) : authorRegistered ? (
                <div className="text-sm text-green-600 bg-green-100 p-3 rounded flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">✓ Author Registered on Blockchain</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-blue-600 bg-blue-100 p-3 rounded">
                    <p className="font-medium">Ready to Register</p>
                    <p>Click the button below to register as an author on the blockchain. MetaMask will open for transaction approval.</p>
                  </div>
                  
                  <Button
                    onClick={registerAuthorOnBlockchain}
                    disabled={registeringAuthor}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {registeringAuthor ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registering on Blockchain...
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4 mr-2" />
                        Register as Author on Blockchain
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
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
