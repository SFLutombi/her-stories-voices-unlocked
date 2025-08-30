import { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { EmailVerification } from '@/components/EmailVerification';

const EmailVerificationPage = () => {
  const location = useLocation();
  const [verificationData, setVerificationData] = useState<{
    email: string;
    displayName: string;
    isAuthor: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get verification data from localStorage
    const storedData = localStorage.getItem('verificationData');
    console.log('EmailVerificationPage: Stored verification data:', storedData);
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        console.log('EmailVerificationPage: Parsed verification data:', data);
        setVerificationData(data);
      } catch (error) {
        console.error('Error parsing verification data:', error);
      }
    } else {
      console.log('EmailVerificationPage: No verification data found in localStorage');
    }
    
    setLoading(false);
  }, []);

  // Show loading state while checking localStorage
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-empowerment/5 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading verification page...</p>
        </div>
      </div>
    );
  }

  // If no verification data, redirect to auth
  if (!verificationData) {
    console.log('EmailVerificationPage: Redirecting to /auth - no verification data');
    return <Navigate to="/auth" replace />;
  }

  console.log('EmailVerificationPage: Rendering with data:', verificationData);
  
  return (
    <EmailVerification
      email={verificationData.email}
      displayName={verificationData.displayName}
      isAuthor={verificationData.isAuthor}
    />
  );
};

export default EmailVerificationPage;
