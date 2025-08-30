import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Web3Provider } from "./contexts/Web3Context";
import { SplashScreen } from "./components/SplashScreen";
import { Onboarding } from "./components/Onboarding";
import { ProfileSetup } from "./components/ProfileSetup";
import { AuthCallback } from "./components/AuthCallback";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import Discover from "./pages/Discover";
import StoryDetails from "./pages/StoryDetails";
import ReadChapter from "./pages/ReadChapter";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import ImpactPage from "./pages/Impact";
import Profile from "./pages/Profile";
import AuthorProfile from "./pages/AuthorProfile";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

// Component to handle hash fragments and auth callbacks
const HashHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle query params for auth callbacks (authorization code flow)
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // Redirect to auth callback route with the code
      navigate(`/auth/callback?code=${code}`, { replace: true });
    }
    
    // Handle hash fragments for auth callbacks (implicit flow)
    if (location.hash && location.hash.includes('access_token')) {
      // Redirect to auth callback route
      navigate('/auth/callback' + location.hash, { replace: true });
    }
  }, [location.search, location.hash, navigate]);

  return null;
};

// Wrapper component that includes HashHandler
const AppRoutes = () => (
  <>
    <HashHandler />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/profile-setup" element={<ProfileSetup />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/email-verification" element={<EmailVerificationPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/story/:id" element={<StoryDetails />} />
      <Route path="/read/:storyId/:chapterId" element={<ReadChapter />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/impact" element={<ImpactPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/author/:userId" element={<AuthorProfile />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Web3Provider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </Web3Provider>
  </QueryClientProvider>
);

export default App;
