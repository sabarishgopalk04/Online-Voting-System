import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Vote, Users, BarChart3, Shield, Sparkles, TrendingUp, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { User } from '@supabase/supabase-js';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleLearnMore = () => {
    // Scroll to features section
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {user && (
        <div className="absolute top-4 right-4 z-50">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <span className="text-white font-medium">Welcome, {user.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-white/20 text-white hover:bg-white hover:text-primary"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="gradient-bg py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="space-y-6 animate-slide-up">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm float-animation">
                <Vote className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-6xl font-bold text-white mb-4 pulse-slow glow-effect">
              VoteFlow
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
              {user 
                ? "Welcome back! Ready to create or participate in polls?" 
                : "Create secure polls, gather opinions, and visualize results with our comprehensive online voting platform"
              }
            </p>
            <div className="flex gap-4 justify-center mt-8 animate-slide-up" style={{animationDelay: '0.4s'}}>
              {user ? (
                <>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    onClick={() => navigate('/create-poll')}
                    className="button-hover bg-white text-primary hover:bg-white/90 font-semibold px-8"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Poll
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate('/dashboard')}
                    className="border-white text-white hover:bg-white hover:text-primary button-hover font-semibold px-8"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    onClick={handleGetStarted}
                    className="button-hover bg-white text-primary hover:bg-white/90 font-semibold px-8"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={handleLearnMore}
                    className="border-white text-white hover:bg-white hover:text-primary button-hover font-semibold px-8"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Learn More
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 gradient-bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Why Choose VoteFlow?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the future of online voting with our comprehensive platform
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-hover border-0 shadow-md bg-white/80 backdrop-blur-sm animate-slide-up" style={{animationDelay: '0.1s'}}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 float-animation">
                  <Vote className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Easy Voting</h3>
                <p className="text-muted-foreground text-sm">
                  Simple and intuitive voting interface for all users
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover border-0 shadow-md bg-white/80 backdrop-blur-sm animate-slide-up" style={{animationDelay: '0.2s'}}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 float-animation" style={{animationDelay: '1s'}}>
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">User Management</h3>
                <p className="text-muted-foreground text-sm">
                  Secure authentication and user profile management
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover border-0 shadow-md bg-white/80 backdrop-blur-sm animate-slide-up" style={{animationDelay: '0.3s'}}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 float-animation" style={{animationDelay: '2s'}}>
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Real-time Results</h3>
                <p className="text-muted-foreground text-sm">
                  Live poll results with beautiful charts and analytics
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover border-0 shadow-md bg-white/80 backdrop-blur-sm animate-slide-up" style={{animationDelay: '0.4s'}}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 float-animation" style={{animationDelay: '3s'}}>
                  <Shield className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Secure & Reliable</h3>
                <p className="text-muted-foreground text-sm">
                  Advanced security measures to protect your data
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
