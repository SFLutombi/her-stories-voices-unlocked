// Environment configuration for different deployment environments
export const config = {
  // Supabase configuration
  supabase: {
    url: "https://yqvmoewpmafayodphbdy.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlxdm1vZXdwbWFmYXlvZHBoYmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjMxOTUsImV4cCI6MjA3MjEzOTE5NX0.dGevsnxSjK3ioGsCyZnOpZIsXaVE8OCAGYEa73ckbZk"
  },
  
  // App configuration
  app: {
    // Development
    development: {
      baseUrl: 'http://localhost:8080',
      redirectUrls: [
        'http://localhost:8080/auth/callback',
        'http://localhost:8080/email-verification',
        'http://localhost:8080/profile-setup',
        'http://localhost:8080'
      ]
    },
    
    // Production (Vercel)
    production: {
      baseUrl: 'https://your-app-name.vercel.app', // Replace with your actual Vercel domain
      redirectUrls: [
        'https://your-app-name.vercel.app/auth/callback',
        'https://your-app-name.vercel.app/email-verification',
        'https://your-app-name.vercel.app/profile-setup',
        'https://your-app-name.vercel.app'
      ]
    }
  }
};

// Helper function to get current environment config
export const getCurrentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  
  return {
    ...config,
    current: isDevelopment ? config.app.development : config.app.production
  };
};

// Helper function to get redirect URLs for Supabase dashboard
export const getRedirectUrls = () => {
  const currentConfig = getCurrentConfig();
  return currentConfig.current.redirectUrls;
};

// Helper function to get base URL for Supabase dashboard
export const getBaseUrl = () => {
  const currentConfig = getCurrentConfig();
  return currentConfig.current.baseUrl;
};
