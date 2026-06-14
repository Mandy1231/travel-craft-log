
-- Allow anyone (including anonymous) to read trips, days, and attractions by id (UUIDs are unguessable).
-- Owners retain exclusive write access.
DROP POLICY IF EXISTS "Owners see their trips" ON public.trips;
CREATE POLICY "Anyone can view trips" ON public.trips FOR SELECT USING (true);

DROP POLICY IF EXISTS "Days visible if trip visible" ON public.days;
CREATE POLICY "Anyone can view days" ON public.days FOR SELECT USING (true);

DROP POLICY IF EXISTS "Attractions visible if trip visible" ON public.attractions;
CREATE POLICY "Anyone can view attractions" ON public.attractions FOR SELECT USING (true);

GRANT SELECT ON public.trips TO anon;
GRANT SELECT ON public.days TO anon;
GRANT SELECT ON public.attractions TO anon;
