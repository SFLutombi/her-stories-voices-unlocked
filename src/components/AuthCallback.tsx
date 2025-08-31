import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export const AuthCallback = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Processing auth callback...');
        console.log('AuthCallback: Current URL:', window.location.href);
        console.log('AuthCallback: Pathname:', window.location.pathname);
        console.log('AuthCallback: Search:', window.location.search);
        console.log('AuthCallback: Hash:', window.location.hash);
        
        // Check if we have an authorization code in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        console.log('AuthCallback: URL parameters:', { code: !!code, error, errorDescription });
        
        if (error) {
          console.error('AuthCallback: Auth error detected:', error, errorDescription);
          setStatus('error');
          setMessage(`Authentication error: ${errorDescription || error}`);
          return;
        }
        
        if (code) {
          // We have an authorization code, complete the PKCE flow
          console.log('AuthCallback: Completing PKCE flow with code...');
          
          try {
            // Exchange the authorization code for a session
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            console.log('AuthCallback: Exchange result:', { data, error });
            
            if (error) {
              console.error('AuthCallback: Exchange error:', error);
              throw error;
            }
            
            if (data.session) {
              console.log('AuthCallback: Session obtained successfully via exchange');
              setStatus('success');
              setMessage('Authentication successful! Redirecting you...');
              
              // Clear query params
              if (window.location.search) {
                window.history.replaceState(null, '', window.location.pathname);
              }
              
              // Redirect after a short delay
              setTimeout(() => {
                // Check if user is an author and redirect accordingly
                const authorSetup = localStorage.getItem('authorSetup');
                if (authorSetup) {
                  console.log('AuthCallback: Redirecting to profile setup');
                  navigate('/profile-setup');
                } else {
                  console.log('AuthCallback: Redirecting to discover');
                  navigate('/discover');
                }
              }, 2000);
            } else {
              throw new Error('No session in exchange response');
            }
          } catch (exchangeError) {
            console.error('AuthCallback: Exchange failed, trying fallback...', exchangeError);
            
            // Fallback: try to get session directly
            const { data: fallbackData, error: fallbackError } = await supabase.auth.getSession();
            
            if (fallbackError || !fallbackData.session) {
              console.error('AuthCallback: Fallback also failed');
              throw exchangeError; // Throw the original error
            } else {
              console.log('AuthCallback: Fallback session successful');
              setStatus('success');
              setMessage('Authentication successful! Redirecting you...');
              
              // Clear query params
              if (window.location.search) {
                window.history.replaceState(null, '', window.location.pathname);
              }
              
              // Redirect after a short delay
              setTimeout(() => {
                // Check if user is an author and redirect accordingly
                const authorSetup = localStorage.getItem('authorSetup');
                if (authorSetup) {
                  console.log('AuthCallback: Redirecting to profile setup');
                  navigate('/profile-setup');
                } else {
                  console.log('AuthCallback: Redirecting to discover');
                  navigate('/discover');
                }
              }, 2000);
            }
          }
        } else {
          // No authorization code, check for existing session
          console.log('AuthCallback: No code found, checking existing session...');
          
          const { data, error } = await supabase.auth.getSession();
          
          console.log('AuthCallback: Session check result:', { data, error });
          
          if (error) {
            console.error('AuthCallback: Session check error:', error);
            throw error;
          }

          if (data.session) {
            console.log('AuthCallback: Existing session found');
            setStatus('success');
            setMessage('Authentication successful! Redirecting you...');
            
            // Clear any hash fragments
            if (window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            
            // Redirect after a short delay
            setTimeout(() => {
              // Check if user is an author and redirect accordingly
              const authorSetup = localStorage.getItem('authorSetup');
              if (authorSetup) {
                console.log('AuthCallback: Redirecting to profile setup');
                navigate('/profile-setup');
              } else {
                console.log('AuthCallback: Redirecting to discover');
                navigate('/discover');
              }
            }, 2000);
          } else {
            console.error('AuthCallback: No session found');
            setStatus('error');
            setMessage('No active session found. Please try signing up again.');
          }
        }
      } catch (error: any) {
        console.error('AuthCallback: Unexpected error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed. Please try again.');
      }
    };

    // Add a small delay to ensure Supabase has time to process the auth flow
    const timeoutId = setTimeout(handleAuthCallback, 500);
    
    return () => clearTimeout(timeoutId);
  }, [navigate]);

  const handleRetry = () => {
    navigate('/auth');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-empowerment/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-2xl font-bold text-primary">HerStories</h1>
            </div>
            <CardTitle>Processing Authentication</CardTitle>
            <CardDescription>
              Please wait while we complete your signup process...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              This should only take a moment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Welcome to HerStories!</h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            <div className="animate-pulse">
              <Button variant="secondary" className="bg-green-100 text-green-800" disabled>
                Redirecting...
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-background to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Authentication Failed</h2>
          <p className="text-muted-foreground mb-6">{message}</p>
          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
