-- Fix the update_poll_votes function and add trigger
CREATE OR REPLACE FUNCTION public.update_poll_votes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

-- Create the trigger for poll_votes
DROP TRIGGER IF EXISTS update_poll_votes_trigger ON public.poll_votes;
CREATE TRIGGER update_poll_votes_trigger
  AFTER INSERT OR DELETE ON public.poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_poll_votes();

-- Enable realtime for polls table
ALTER TABLE public.polls REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.polls;