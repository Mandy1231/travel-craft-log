
-- Visibility enum
CREATE TYPE public.trip_visibility AS ENUM ('private', 'public', 'draft');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trips
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '未命名行程',
  description TEXT,
  start_date DATE,
  end_date DATE,
  visibility public.trip_visibility NOT NULL DEFAULT 'private',
  cover_emoji TEXT DEFAULT '✈️',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners see their trips" ON public.trips FOR SELECT
  USING (auth.uid() = user_id OR visibility = 'public');
CREATE POLICY "Users insert own trips" ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own trips" ON public.trips FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own trips" ON public.trips FOR DELETE
  USING (auth.uid() = user_id);

-- Days
CREATE TABLE public.days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.days TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.days TO authenticated;
GRANT ALL ON public.days TO service_role;
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Days visible if trip visible" ON public.days FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND (t.user_id = auth.uid() OR t.visibility = 'public')));
CREATE POLICY "Days writable by trip owner" ON public.days FOR ALL
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));

-- Attractions
CREATE TABLE public.attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  opening_hours TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.attractions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attractions TO authenticated;
GRANT ALL ON public.attractions TO service_role;
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attractions visible if trip visible" ON public.attractions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.days d JOIN public.trips t ON t.id = d.trip_id
    WHERE d.id = day_id AND (t.user_id = auth.uid() OR t.visibility = 'public')
  ));
CREATE POLICY "Attractions writable by trip owner" ON public.attractions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.days d JOIN public.trips t ON t.id = d.trip_id
    WHERE d.id = day_id AND t.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.days d JOIN public.trips t ON t.id = d.trip_id
    WHERE d.id = day_id AND t.user_id = auth.uid()
  ));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    split_part(NEW.email, '@', 1)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
