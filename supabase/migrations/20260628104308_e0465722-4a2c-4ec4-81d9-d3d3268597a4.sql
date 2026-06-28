
DROP POLICY IF EXISTS "Anyone can view trips" ON public.trips;
CREATE POLICY "View public or own trips" ON public.trips
  FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view days" ON public.days;
CREATE POLICY "View days of accessible trips" ON public.days
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = days.trip_id
      AND (t.visibility = 'public' OR t.user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Anyone can view attractions" ON public.attractions;
CREATE POLICY "View attractions of accessible trips" ON public.attractions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.days d
    JOIN public.trips t ON t.id = d.trip_id
    WHERE d.id = attractions.day_id
      AND (t.visibility = 'public' OR t.user_id = auth.uid())
  ));
