import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Vote, Plus, BarChart3, Users, ArrowLeft, Eye, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [polls, setPolls] = useState<any[]>([]);
  const [publicPolls, setPublicPolls] = useState<any[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [expandedPoll, setExpandedPoll] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      setLoading(false);
    };
    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate('/auth');
        } else {
          setUser(session.user);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPolls = async () => {
    if (!user) return;
    
    try {
      // Fetch user's own polls
      const { data: userPolls, error: userError } = await supabase
        .from('polls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      // Fetch all public polls (excluding user's own)
      const { data: allPolls, error: publicError } = await supabase
        .from('polls')
        .select('*')
        .neq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (publicError) throw publicError;

      setPolls(userPolls || []);
      setPublicPolls(allPolls || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch polls",
        variant: "destructive",
      });
    } finally {
      setLoadingPolls(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPolls();
    }
  }, [user]);

  // Realtime updates: keep your polls and community polls in sync
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('polls-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'polls', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated: any = (payload as any).new ?? (payload as any).record ?? (payload as any);
          setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'polls', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const inserted: any = (payload as any).new ?? (payload as any).record ?? (payload as any);
          setPolls((prev) => [inserted, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'polls', filter: `status=eq.active` },
        (payload) => {
          const updated: any = (payload as any).new ?? (payload as any).record ?? (payload as any);
          setPublicPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleDeletePoll = async (pollId: string) => {
    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId);

      if (error) throw error;

      toast({
        title: "Poll Deleted",
        description: "Poll has been deleted successfully",
      });
      
      // Refresh polls
      fetchPolls();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete poll",
        variant: "destructive",
      });
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    try {
      const { error } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: pollId,
          user_id: user!.id,
          option_index: optionIndex
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Voted",
            description: "You have already voted on this poll",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Vote Submitted",
        description: "Your vote has been recorded",
      });
      
      // Refresh polls to show updated vote counts
      fetchPolls();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive",
      });
    }
  };

  if (loading || loadingPolls) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-bg py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="border-white/20 text-white hover:bg-white hover:text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-white/80">Manage your polls and view analytics</p>
            </div>
            <Button
              onClick={() => navigate('/create-poll')}
              className="bg-white text-primary hover:bg-white/90 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Poll
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Vote className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{polls.length}</p>
                  <p className="text-muted-foreground">Total Polls</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{polls.reduce((sum, poll) => sum + poll.total_votes, 0)}</p>
                  <p className="text-muted-foreground">Total Votes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{polls.filter(p => p.status === 'active').length}</p>
                  <p className="text-muted-foreground">Active Polls</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Your Polls */}
        <Card className="bg-white/95 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle>Your Polls</CardTitle>
            <CardDescription>Manage and monitor your polling activities</CardDescription>
          </CardHeader>
          <CardContent>
            {polls.length === 0 ? (
              <div className="text-center py-12">
                <Vote className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No polls yet</h3>
                <p className="text-muted-foreground mb-4">Create your first poll to get started</p>
                <Button onClick={() => navigate('/create-poll')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Poll
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {polls.map((poll) => (
                  <div key={poll.id} className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{poll.title}</h3>
                          <Badge variant={poll.status === 'active' ? 'default' : 'secondary'}>
                            {poll.status}
                          </Badge>
                        </div>
                        {poll.description && (
                          <p className="text-muted-foreground text-sm mb-2">{poll.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{poll.total_votes} votes</span>
                          <span>{poll.options.length} options</span>
                          <span>Created {new Date(poll.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedPoll(expandedPoll === poll.id ? null : poll.id)}
                        >
                          <BarChart3 className="w-4 h-4 mr-1" />
                          {expandedPoll === poll.id ? 'Hide' : 'View'} Results
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePoll(poll.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    {/* Poll Results - Expanded View */}
                    {expandedPoll === poll.id && (
                      <div className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border">
                        <h4 className="font-semibold mb-4 text-primary">Poll Results</h4>
                        <div className="space-y-3">
                          {poll.options.map((option: string, index: number) => {
                            const votes = poll.votes?.[index] || 0;
                            const percentage = poll.total_votes > 0 ? (votes / poll.total_votes) * 100 : 0;
                            
                            return (
                              <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{option}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {votes} votes ({percentage.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div
                                    className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {poll.total_votes === 0 && (
                          <div className="text-center py-4 text-muted-foreground">
                            <Vote className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No votes yet</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Public Polls - Vote on Others' Polls */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Community Polls</CardTitle>
            <CardDescription>Vote on polls created by other users</CardDescription>
          </CardHeader>
          <CardContent>
            {publicPolls.length === 0 ? (
              <div className="text-center py-12">
                <Vote className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No public polls available</h3>
                <p className="text-muted-foreground">Check back later for new polls to vote on</p>
              </div>
            ) : (
              <div className="space-y-6">
                {publicPolls.map((poll) => (
                  <div
                    key={poll.id}
                    className="p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50"
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">{poll.title}</h3>
                      {poll.description && (
                        <p className="text-muted-foreground mb-3">{poll.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span>{poll.total_votes} votes</span>
                        <span>Created {new Date(poll.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {poll.options.map((option: string, index: number) => {
                        const votes = poll.votes?.[index] || 0;
                        const percentage = poll.total_votes > 0 ? (votes / poll.total_votes) * 100 : 0;
                        
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Button
                                variant="outline"
                                className="flex-1 justify-start"
                                onClick={() => handleVote(poll.id, index)}
                              >
                                {option}
                              </Button>
                              <span className="ml-3 text-sm text-muted-foreground w-16 text-right">
                                {votes} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;