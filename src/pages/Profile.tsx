import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Settings, Bell, Shield, Coins, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile, updateProfile, loading } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    is_anonymous: profile?.is_anonymous || false,
  });

  const [notifications, setNotifications] = useState({
    email_updates: true,
    new_stories: true,
    earnings_alerts: true,
    community_highlights: false,
  });

  const [privacy, setPrivacy] = useState({
    public_profile: true,
    show_reading_activity: false,
    allow_author_contact: true,
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      await updateProfile(formData);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse">
            <div className="h-32 bg-muted rounded mb-8" />
            <div className="h-8 bg-muted rounded mb-4" />
            <div className="h-4 bg-muted rounded mb-2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-xl">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold">
                    {profile?.display_name || 'Your Profile'}
                  </h1>
                  {profile?.is_author && (
                    <Badge variant="default">Author</Badge>
                  )}
                  {profile?.is_anonymous && (
                    <Badge variant="outline">Anonymous Mode</Badge>
                  )}
                </div>
                
                <p className="text-muted-foreground mb-3">
                  {user.email}
                </p>
                
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Coins className="h-4 w-4 mr-1 text-primary" />
                    {profile?.wallet_balance || 0} credits
                  </div>
                  <div>
                    Member since {new Date(user.created_at || '').toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Photo
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <nav className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Profile Information
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Privacy & Security
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and how you appear to others
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                          id="display_name"
                          value={formData.display_name}
                          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                          placeholder="How should we call you?"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Tell us about yourself..."
                          rows={4}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="anonymous"
                          checked={formData.is_anonymous}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
                        />
                        <Label htmlFor="anonymous">Enable anonymous mode</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        When enabled, your name will not be displayed on stories you create or interact with
                      </p>

                      <Separator />

                      <Button type="submit">Save Changes</Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose what notifications you'd like to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Email Updates</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive updates about platform news and features
                        </p>
                      </div>
                      <Switch
                        checked={notifications.email_updates}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, email_updates: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">New Stories</h4>
                        <p className="text-sm text-muted-foreground">
                          Get notified when authors you follow publish new content
                        </p>
                      </div>
                      <Switch
                        checked={notifications.new_stories}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, new_stories: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Earnings Alerts</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about your author earnings
                        </p>
                      </div>
                      <Switch
                        checked={notifications.earnings_alerts}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, earnings_alerts: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Community Highlights</h4>
                        <p className="text-sm text-muted-foreground">
                          Weekly digest of popular stories and community achievements
                        </p>
                      </div>
                      <Switch
                        checked={notifications.community_highlights}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, community_highlights: checked })
                        }
                      />
                    </div>

                    <Separator />
                    <Button>Save Preferences</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy & Security</CardTitle>
                    <CardDescription>
                      Control your privacy settings and account security
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Public Profile</h4>
                        <p className="text-sm text-muted-foreground">
                          Allow others to view your profile and reading activity
                        </p>
                      </div>
                      <Switch
                        checked={privacy.public_profile}
                        onCheckedChange={(checked) => 
                          setPrivacy({ ...privacy, public_profile: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Show Reading Activity</h4>
                        <p className="text-sm text-muted-foreground">
                          Display what stories you've read on your profile
                        </p>
                      </div>
                      <Switch
                        checked={privacy.show_reading_activity}
                        onCheckedChange={(checked) => 
                          setPrivacy({ ...privacy, show_reading_activity: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Allow Author Contact</h4>
                        <p className="text-sm text-muted-foreground">
                          Let authors reach out to you directly
                        </p>
                      </div>
                      <Switch
                        checked={privacy.allow_author_contact}
                        onCheckedChange={(checked) => 
                          setPrivacy({ ...privacy, allow_author_contact: checked })
                        }
                      />
                    </div>

                    <Separator />
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Data & Privacy</h4>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          Download My Data
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account and authentication settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Email Address</h4>
                      <Input value={user.email} disabled />
                      <p className="text-sm text-muted-foreground mt-1">
                        Contact support to change your email address
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Password</h4>
                      <Button variant="outline">Change Password</Button>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-4 text-destructive">Danger Zone</h4>
                      <div className="space-y-2">
                        <Button variant="outline" onClick={handleSignOut}>
                          Sign Out
                        </Button>
                        <Button variant="destructive">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;