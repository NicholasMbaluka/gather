-- ============================================================
-- GATHERLY - Complete Supabase Database Setup
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ========================
-- EXTENSIONS
-- ========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- TABLES
-- ========================

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  interests TEXT[] DEFAULT '{}',
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL DEFAULT 'social',
  image_url TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  featured BOOLEAN DEFAULT false,
  max_attendees INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Attendees (with unique constraint to prevent duplicates)
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connections
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  to_user UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user, to_user, event_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('premium_monthly', 'premium_quarterly', 'featured_event')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  reference TEXT,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile views (for premium feature)
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(viewer_id, profile_id)
);

-- ========================
-- INDEXES
-- ========================
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(featured);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON public.event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON public.event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_event ON public.messages(event_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_connections_users ON public.connections(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user ON public.ratings(to_user);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON public.profile_views(profile_id);

-- ========================
-- ROW LEVEL SECURITY
-- ========================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- ---- USERS ----
CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ---- EVENTS ----
CREATE POLICY "Events are viewable by everyone" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Event creators can update their events" ON public.events
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Event creators can delete their events" ON public.events
  FOR DELETE USING (auth.uid() = created_by);

-- ---- EVENT ATTENDEES ----
CREATE POLICY "Attendees are viewable by everyone" ON public.event_attendees
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join events" ON public.event_attendees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave events" ON public.event_attendees
  FOR DELETE USING (auth.uid() = user_id);

-- ---- MESSAGES ----
-- Only attendees can read and write messages
CREATE POLICY "Attendees can read messages" ON public.messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.event_attendees WHERE event_id = messages.event_id
    )
  );

CREATE POLICY "Attendees can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
      SELECT user_id FROM public.event_attendees WHERE event_id = messages.event_id
    )
  );

-- ---- CONNECTIONS ----
CREATE POLICY "Users can see their own connections" ON public.connections
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can send connection requests" ON public.connections
  FOR INSERT WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update connections directed at them" ON public.connections
  FOR UPDATE USING (auth.uid() = user2_id);

CREATE POLICY "Users can delete their own connections" ON public.connections
  FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ---- RATINGS ----
CREATE POLICY "Ratings are viewable by everyone" ON public.ratings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can rate" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = from_user);

CREATE POLICY "Users can update their own ratings" ON public.ratings
  FOR UPDATE USING (auth.uid() = from_user);

-- ---- PAYMENTS ----
CREATE POLICY "Users can see their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---- PROFILE VIEWS ----
CREATE POLICY "Premium users can see views on their profile" ON public.profile_views
  FOR SELECT USING (
    auth.uid() = profile_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_premium = true)
  );

CREATE POLICY "Authenticated users can record views" ON public.profile_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Upsert profile views" ON public.profile_views
  FOR UPDATE USING (auth.uid() = viewer_id);

-- ========================
-- REALTIME SUBSCRIPTIONS
-- ========================
-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ========================
-- STORAGE BUCKETS
-- ========================
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Event images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload event images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');

CREATE POLICY "Avatars are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTR(NEW.id::text, 1, 4)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========================
-- PAYMENT WEBHOOK FUNCTION
-- (Called by M-Pesa callback Edge Function)
-- ========================
CREATE OR REPLACE FUNCTION public.complete_payment(payment_ref TEXT)
RETURNS VOID AS $$
DECLARE
  pay_record RECORD;
BEGIN
  SELECT * INTO pay_record FROM public.payments WHERE reference = payment_ref AND status = 'pending';
  IF NOT FOUND THEN RETURN; END IF;

  -- Mark payment complete
  UPDATE public.payments SET status = 'completed' WHERE reference = payment_ref;

  -- Apply premium if subscription
  IF pay_record.type IN ('premium_monthly', 'premium_quarterly') THEN
    UPDATE public.users SET
      is_premium = true,
      premium_expires_at = CASE
        WHEN pay_record.type = 'premium_monthly' THEN NOW() + INTERVAL '30 days'
        ELSE NOW() + INTERVAL '90 days'
      END
    WHERE id = pay_record.user_id;
  END IF;

  -- Feature event if boost
  IF pay_record.type = 'featured_event' AND pay_record.event_id IS NOT NULL THEN
    UPDATE public.events SET featured = true WHERE id = pay_record.event_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================
-- SAMPLE SEED DATA
-- (Optional - for testing)
-- ========================

-- NOTE: Replace the UUIDs below with real user IDs from your auth.users table
-- after creating test accounts. The example below uses placeholder values.

/*
-- Sample events (replace 'your-user-id-here' with a real user UUID)
INSERT INTO public.events (title, description, location, date, category, featured, created_by) VALUES
  ('Nairobi Tech Meetup #15', 'Monthly gathering of Nairobi''s tech community. Talks, demos, and networking.', 'iHub, Ngong Road, Nairobi', NOW() + INTERVAL '7 days', 'tech', true, 'your-user-id-here'),
  ('Blankets & Wine Nairobi', 'Nairobi''s favorite outdoor music festival returns! Great music, food, and vibes.', 'Racecourse Road, Nairobi', NOW() + INTERVAL '14 days', 'music', false, 'your-user-id-here'),
  ('Startup Pitch Night', 'Watch 10 startups pitch their ideas to investors. Network with founders.', 'Radisson Blu, Upper Hill', NOW() + INTERVAL '5 days', 'business', false, 'your-user-id-here'),
  ('Nairobi Food Festival', 'Taste food from 50+ restaurants and street food vendors from across Kenya.', 'Uhuru Gardens, Nairobi', NOW() + INTERVAL '21 days', 'food', true, 'your-user-id-here'),
  ('Saturday Morning Run', 'Join 200+ runners for our weekly 5K and 10K routes around Karura Forest.', 'Karura Forest, Nairobi', NOW() + INTERVAL '3 days', 'sports', false, 'your-user-id-here'),
  ('Creative Arts Workshop', 'Learn painting, sketching and digital art from professional Kenyan artists.', 'GoDown Arts Centre, Nairobi', NOW() + INTERVAL '10 days', 'arts', false, 'your-user-id-here');
*/
