
ALTER TABLE public.trips
  ADD CONSTRAINT trips_title_length CHECK (char_length(title) <= 200),
  ADD CONSTRAINT trips_description_length CHECK (description IS NULL OR char_length(description) <= 2000);

ALTER TABLE public.attractions
  ADD CONSTRAINT attractions_name_length CHECK (char_length(name) <= 200),
  ADD CONSTRAINT attractions_description_length CHECK (description IS NULL OR char_length(description) <= 2000),
  ADD CONSTRAINT attractions_opening_hours_length CHECK (opening_hours IS NULL OR char_length(opening_hours) <= 500);

ALTER TABLE public.days
  ADD CONSTRAINT days_title_length CHECK (title IS NULL OR char_length(title) <= 200);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_display_name_length CHECK (display_name IS NULL OR char_length(display_name) <= 80),
  ADD CONSTRAINT profiles_username_length CHECK (username IS NULL OR char_length(username) <= 50),
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 500),
  ADD CONSTRAINT profiles_location_length CHECK (location IS NULL OR char_length(location) <= 120),
  ADD CONSTRAINT profiles_avatar_url_length CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500);
