-- Create polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  votes JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_votes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

-- Create policies for polls
CREATE POLICY "Users can view all active polls" 
ON public.polls 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Users can create their own polls" 
ON public.polls 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own polls" 
ON public.polls 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own polls" 
ON public.polls 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_polls_updated_at
BEFORE UPDATE ON public.polls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create votes table to track individual votes
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Enable RLS for votes
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for votes
CREATE POLICY "Users can view all votes" 
ON public.poll_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own votes" 
ON public.poll_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update poll vote counts
CREATE OR REPLACE FUNCTION public.update_poll_votes()
RETURNS TRIGGER AS $$
DECLARE
  poll_votes_count JSONB;
  total INTEGER;
BEGIN
  -- Calculate vote counts for each option
  SELECT jsonb_object_agg(option_index::text, count)
  INTO poll_votes_count
  FROM (
    SELECT option_index, COUNT(*) as count
    FROM public.poll_votes
    WHERE poll_id = COALESCE(NEW.poll_id, OLD.poll_id)
    GROUP BY option_index
  ) counts;
  
  -- Calculate total votes
  SELECT COUNT(*)
  INTO total
  FROM public.poll_votes
  WHERE poll_id = COALESCE(NEW.poll_id, OLD.poll_id);
  
  -- Update the poll with new vote counts
  UPDATE public.polls
  SET 
    votes = COALESCE(poll_votes_count, '{}'::jsonb),
    total_votes = total
  WHERE id = COALESCE(NEW.poll_id, OLD.poll_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update vote counts
CREATE TRIGGER update_poll_votes_on_insert
AFTER INSERT ON public.poll_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_poll_votes();

CREATE TRIGGER update_poll_votes_on_delete
AFTER DELETE ON public.poll_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_poll_votes();