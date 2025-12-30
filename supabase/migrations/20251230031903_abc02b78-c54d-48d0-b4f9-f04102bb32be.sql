-- Grant SELECT permission on hotel_reviews to anon and authenticated roles
GRANT SELECT ON public.hotel_reviews TO anon;
GRANT SELECT ON public.hotel_reviews TO authenticated;

-- Enable RLS for future protection
ALTER TABLE public.hotel_reviews ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all users to read reviews (public read access)
CREATE POLICY "Allow public read access to hotel reviews"
  ON public.hotel_reviews
  FOR SELECT
  TO public
  USING (true);