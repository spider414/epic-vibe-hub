-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','staff','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- EVENTS
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'party',
  starts_at timestamptz NOT NULL,
  venue text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT 'Lagos',
  flyer_url text,
  price_regular numeric(12,2) NOT NULL DEFAULT 0,
  price_vip numeric(12,2),
  capacity integer,
  tickets_sold integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published events public" ON public.events FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TICKET ORDERS
CREATE TABLE public.ticket_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  user_id uuid,
  customer_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  ticket_type text NOT NULL DEFAULT 'regular',
  quantity integer NOT NULL DEFAULT 1,
  amount_total numeric(12,2) NOT NULL DEFAULT 0,
  reference text NOT NULL UNIQUE DEFAULT ('EPIC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  payment_status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.ticket_orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_orders TO authenticated;
GRANT ALL ON public.ticket_orders TO service_role;
ALTER TABLE public.ticket_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can order" ON public.ticket_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "own orders readable" ON public.ticket_orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage orders" ON public.ticket_orders FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER ticket_orders_updated_at BEFORE UPDATE ON public.ticket_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BOOKINGS
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_type text NOT NULL DEFAULT 'event_hosting',
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  organisation text,
  occasion text,
  preferred_date date,
  location text,
  guest_count integer,
  budget text,
  package_name text,
  details text,
  status text NOT NULL DEFAULT 'new',
  deposit_amount numeric(12,2),
  deposit_status text NOT NULL DEFAULT 'unpaid',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can request booking" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins manage bookings" ON public.bookings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ENQUIRIES
CREATE TABLE public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.enquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can enquire" ON public.enquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins manage enquiries" ON public.enquiries FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SUBSCRIBERS
CREATE TABLE public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscribers TO authenticated;
GRANT ALL ON public.subscribers TO service_role;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can subscribe" ON public.subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins manage subscribers" ON public.subscribers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- TESTIMONIALS
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_role text,
  message text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  avatar_url text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved testimonials public" ON public.testimonials FOR SELECT TO anon, authenticated USING (is_approved OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "anyone can leave testimonial" ON public.testimonials FOR INSERT TO anon, authenticated WITH CHECK (is_approved = false);
CREATE POLICY "admins manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT INSERT ON public.testimonials TO anon;

-- MEDIA
CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  url text NOT NULL,
  thumbnail_url text,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  tag text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visible media public" ON public.media FOR SELECT TO anon, authenticated USING (is_visible OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage media" ON public.media FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PACKAGES
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'events',
  tagline text,
  price_from numeric(12,2),
  price_note text,
  features text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active packages public" ON public.packages FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage packages" ON public.packages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- DANCERS
CREATE TABLE public.dancers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stage_role text,
  bio text,
  photo_url text,
  instagram text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dancers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dancers TO authenticated;
GRANT ALL ON public.dancers TO service_role;
ALTER TABLE public.dancers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active dancers public" ON public.dancers FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage dancers" ON public.dancers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SEED
INSERT INTO public.events (slug,title,description,category,starts_at,venue,city,price_regular,price_vip,capacity,is_featured) VALUES
('epic-pool-party-lagos','Epic Pool Party: Splash Season','The biggest daytime pool rave in Lagos. Live DJs, Creative Dance Team performances, games, shisha lounge and unlimited vibes.','Pool Party', now() + interval '21 days', 'The Waterfront, Lekki Phase 1','Lagos',10000,25000,500,true),
('beach-takeover-elegushi','Beach Takeover — Elegushi','Sunset to midnight beach party with bonfire, afrobeats DJs, and a full dance showcase.','Beach Party', now() + interval '38 days', 'Elegushi Royal Beach','Lagos',8000,20000,800,true),
('penthouse-hangout','Penthouse Hangout & Games Night','Intimate apartment hangout: board games, karaoke, small chops and cocktails.','Apartment Party', now() + interval '12 days', 'Ikoyi Penthouse (address on ticket)','Lagos',7500,15000,120,false),
('all-white-night','All White Night — Club Edition','Themed all-white club night with celebrity DJs and VIP table service.','Themed Party', now() + interval '55 days', 'Club Quilox, Victoria Island','Lagos',12000,50000,600,true);

INSERT INTO public.packages (name,category,tagline,price_from,price_note,features,sort_order) VALUES
('Starter Vibe','events','Perfect for house & apartment parties',250000,'from, per event','{"Event planning & timeline","DJ + sound system","Basic lighting & decor","2 hosts / hype men","Guest list management"}',1),
('Signature Party','events','Our most booked package',750000,'from, per event','{"Full event planning & production","Premium DJ + MC","Stage lighting & LED screen","Creative Dance Team performance","Photography & video coverage","Security & ushers"}',2),
('Epic Experience','events','Full-scale branded event production',2000000,'from, per event','{"End-to-end concept & production","Celebrity DJ / artist booking","Custom stage, decor & branding","Multi-camera video + aftermovie","Ticketing & access control","VIP & table service management"}',3),
('Dance Performance','dance','Creative Dance Team live set',150000,'from, per performance','{"3-8 professional dancers","Custom choreography to your playlist","Costumes & styling","Rehearsed 5-15 min showcase","Available for weddings, clubs & videos"}',4),
('Choreography Session','dance','Custom routine for your moment',80000,'from, per routine','{"Concept & song breakdown","Step-by-step choreography","Up to 3 rehearsal sessions","Bridal train / groom squad friendly","Video reference provided"}',5),
('Dance Classes','dance','Learn afrobeats, amapiano & hip-hop',15000,'per month, weekly classes','{"Weekly group classes","Beginner to advanced levels","Afrobeats, Amapiano, Hip-Hop, Afro-fusion","Private 1-on-1 option available","End-of-term showcase"}',6);

INSERT INTO public.testimonials (author_name,author_role,message,rating,is_approved) VALUES
('Chidera O.','Birthday client, Lekki','Epic Entertainment planned my 25th and it was the talk of the year. From decor to the DJ to the dancers, everything was smooth.',5,true),
('Tolu A.','Brand Manager, Lagos','We booked them for our product launch. Professional, punctual and the crowd energy was unmatched.',5,true),
('Amaka & Deji','Wedding couple','Creative Dance Team choreographed our bridal train dance. Our guests could not sit down!',5,true),
('Kelvin M.','Pool party attendee','Best pool party I have attended in Lagos, no cap. Already bought tickets for the next one.',5,true);

INSERT INTO public.dancers (name,stage_role,bio,sort_order) VALUES
('Sandra "Flexx" I.','Lead Choreographer','Afrobeats and afro-fusion specialist with 8 years of stage and music video experience.',1),
('David "Dee" A.','Dance Captain','Hip-hop and amapiano freestyle king, leads club and concert sets.',2),
('Blessing N.','Performer & Instructor','Teaches our weekly beginner classes and heads bridal choreography.',3),
('Emeka "Zeal" U.','Performer','High-energy street dance and acrobatics.',4);