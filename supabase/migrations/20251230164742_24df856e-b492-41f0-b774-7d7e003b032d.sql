-- Enable RLS on hotel_static_cache and search_cache (hotel_reviews already has RLS)
ALTER TABLE public.hotel_static_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- Grant SELECT permissions
GRANT SELECT ON public.hotel_static_cache TO anon;
GRANT SELECT ON public.hotel_static_cache TO authenticated;
GRANT SELECT ON public.search_cache TO anon;
GRANT SELECT ON public.search_cache TO authenticated;

-- Create public read policies for hotel_static_cache
CREATE POLICY "Enable read access for all users" 
  ON public.hotel_static_cache 
  FOR SELECT 
  TO public
  USING (true);

-- Create public read policies for search_cache
CREATE POLICY "Enable read access for all users" 
  ON public.search_cache 
  FOR SELECT 
  TO public
  USING (true);