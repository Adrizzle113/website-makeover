-- Enable realtime for profiles table so users get instant status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;