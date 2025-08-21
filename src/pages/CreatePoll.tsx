import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Vote, Plus, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';

const CreatePoll = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [pollData, setPollData] = useState({
    title: "",
    description: "",
    options: ["", ""]
  });

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
    };
    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate('/auth');
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const addOption = () => {
    setPollData(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };

  const removeOption = (index: number) => {
    if (pollData.options.length > 2) {
      setPollData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setPollData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pollData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a poll title",
        variant: "destructive",
      });
      return;
    }

    const validOptions = pollData.options.filter(option => option.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Please provide at least 2 options",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('polls')
        .insert({
          user_id: user!.id,
          title: pollData.title.trim(),
          description: pollData.description.trim() || null,
          options: validOptions
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Poll created successfully",
      });
      
      // Reset form
      setPollData({
        title: "",
        description: "",
        options: ["", ""]
      });
      
      // Redirect to dashboard after creation
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create poll",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="border-white/20 text-white hover:bg-white hover:text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Create New Poll</h1>
          <p className="text-white/80">Create engaging polls and gather opinions from your audience</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Vote className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Poll Details</CardTitle>
                <CardDescription>Fill in the information for your new poll</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Poll Title *</Label>
                <Input
                  id="title"
                  placeholder="What's your question?"
                  value={pollData.title}
                  onChange={(e) => setPollData(prev => ({ ...prev, title: e.target.value }))}
                  className="button-hover"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Provide more context about your poll..."
                  value={pollData.description}
                  onChange={(e) => setPollData(prev => ({ ...prev, description: e.target.value }))}
                  className="button-hover min-h-20"
                />
              </div>

              <div className="space-y-4">
                <Label>Poll Options *</Label>
                {pollData.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="button-hover"
                    />
                    {pollData.options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full gradient-bg text-white font-semibold"
                disabled={loading}
              >
                {loading ? "Creating Poll..." : "Create Poll"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePoll;