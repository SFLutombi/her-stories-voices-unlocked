import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, Mail, CheckCircle, Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmailVerificationProps {
  email: string;
  displayName: string;
  isAuthor: boolean;
}

export const EmailVerification = ({ email, displayName, isAuthor }: EmailVerificationProps) => {
  const [isVerified, setIsVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Start timer
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Check verification status every 5 seconds
    const checkInterval = setInterval(() => {
      checkVerificationStatus();
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(checkInterval);
    };
  }, []);

  // Clean up verification data when component unmounts
  useEffect(() => {
    return () => {
      // Only clear if verification was successful
      if (isVerified) {
        localStorage.removeItem('verificationData');
      }
    };
  }, [isVerified]);

  const checkVerificationStatus = async () => {
    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        setIsVerified(true);
        toast({
          title: "Email Verified!",
          description: "Your email has been verified successfully. Redirecting you...",
        });
        // Redirect after a short delay to show success
        setTimeout(() => {
          if (isAuthor) {
            navigate('/profile-setup');
          } else {
            navigate('/discover');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) {
        console.error('Error resending email:', error);
        
        // User-friendly error messages
        let userMessage = "Something went wrong while resending the verification email. Please try again.";
        
        if (error.message?.includes('rate limit')) {
          userMessage = "Please wait a moment before requesting another verification email.";
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          userMessage = "Network connection issue. Please check your internet and try again.";
        } else if (error.message?.includes('timeout')) {
          userMessage = "Request timed out. Please try again.";
        }
        
        toast({
          title: 'Failed to resend verification email',
          description: userMessage,
          variant: 'destructive',
        });
      } else {
        // Show success message
        console.log('Verification email resent successfully');
        toast({
          title: 'Verification Email Sent! 📧',
          description: 'A new verification link has been sent to your email address. Please check your inbox.',
        });
      }
    } catch (error: any) {
      console.error('Error resending email:', error);
      
      let userMessage = "Something went wrong while resending the verification email. Please try again.";
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        userMessage = "Network connection issue. Please check your internet and try again.";
      } else if (error.message?.includes('timeout')) {
        userMessage = "Request timed out. Please try again.";
      }
      
      toast({
        title: 'Failed to resend verification email',
        description: userMessage,
        variant: 'destructive',
      });
    }
  };

  const handleGoBack = () => {
    navigate('/auth');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Email Verified!</h2>
            <p className="text-muted-foreground mb-4">
              Your email has been verified successfully. Redirecting you...
            </p>
            <div className="animate-pulse">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Redirecting in 2 seconds...
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-empowerment/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-3xl font-bold text-primary">HerStories</h1>
          </div>
          <p className="text-muted-foreground">Almost there! Just one more step</p>
        </div>

        {/* Verification Card */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Display */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm text-muted-foreground mb-1">Verification email sent to:</div>
              <div className="font-mono text-sm font-medium">{email}</div>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Time elapsed: {formatTime(timeElapsed)}</span>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800 space-y-2">
                <div className="font-medium">What to do next:</div>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>Come back here - we'll automatically detect verification</li>
                </ol>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={checkVerificationStatus}
                disabled={checking}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                {checking ? 'Checking...' : 'Check Verification Status'}
              </Button>
              
              <Button 
                onClick={handleResendEmail}
                variant="ghost"
                className="w-full"
              >
                Resend Verification Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Go Back Button */}
        <div className="text-center">
          <Button 
            onClick={handleGoBack}
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign Up
          </Button>
        </div>

        {/* Author Info */}
        {isAuthor && (
          <div className="mt-6 bg-empowerment/10 border border-empowerment/20 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-empowerment mb-2">
                🎯 Author Account Setup
              </div>
              <p className="text-xs text-muted-foreground">
                After verification, you'll be guided through setting up your author profile 
                and connecting your MetaMask wallet to start earning from your stories.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
