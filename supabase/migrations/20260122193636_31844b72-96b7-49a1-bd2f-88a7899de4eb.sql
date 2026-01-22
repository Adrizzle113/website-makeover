-- Create user_bookings table to persist confirmed bookings
CREATE TABLE public.user_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  partner_order_id TEXT,
  order_group_id TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  confirmation_number TEXT,
  hotel_id TEXT,
  hotel_name TEXT,
  hotel_address TEXT,
  hotel_city TEXT,
  hotel_country TEXT,
  hotel_star_rating INTEGER,
  hotel_phone TEXT,
  hotel_image TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  nights INTEGER,
  rooms_data JSONB,
  guests_data JSONB,
  lead_guest_name TEXT,
  lead_guest_email TEXT,
  amount TEXT,
  currency_code TEXT DEFAULT 'USD',
  amount_refunded TEXT,
  is_cancellable BOOLEAN DEFAULT true,
  free_cancellation_before TIMESTAMPTZ,
  cancellation_policies JSONB,
  cancelled_at TIMESTAMPTZ,
  payment_type TEXT,
  payment_status TEXT,
  taxes JSONB,
  raw_api_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_synced_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_user_bookings_user_id ON public.user_bookings(user_id);
CREATE INDEX idx_user_bookings_check_in ON public.user_bookings(check_in_date);
CREATE INDEX idx_user_bookings_status ON public.user_bookings(status);

-- Auto-update updated_at trigger
CREATE TRIGGER handle_user_bookings_updated_at
  BEFORE UPDATE ON public.user_bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE public.user_bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON public.user_bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own bookings
CREATE POLICY "Users can insert own bookings"
  ON public.user_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings"
  ON public.user_bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own bookings
CREATE POLICY "Users can delete own bookings"
  ON public.user_bookings FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON public.user_bookings FOR SELECT
  USING (has_role(auth.uid(), 'admin'));