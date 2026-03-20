
-- Create creators table
CREATE TABLE public.creators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monthly revenue table
CREATE TABLE public.creator_monthly_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- e.g. 'January', 'February'
  year INTEGER NOT NULL DEFAULT 2025,
  rooms_bookings INTEGER NOT NULL DEFAULT 0,
  rooms_gna INTEGER NOT NULL DEFAULT 0,
  rooms_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  tours_bookings INTEGER NOT NULL DEFAULT 0,
  tours_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(creator_id, month, year)
);

-- Enable RLS
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_monthly_revenue ENABLE ROW LEVEL SECURITY;

-- Public read for creators (anyone can search by code)
CREATE POLICY "Anyone can view creators" ON public.creators FOR SELECT USING (true);

-- Public read for revenue (anyone can view via code lookup)
CREATE POLICY "Anyone can view revenue" ON public.creator_monthly_revenue FOR SELECT USING (true);

-- Authenticated users can manage creators
CREATE POLICY "Authenticated users can insert creators" ON public.creators FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update creators" ON public.creators FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete creators" ON public.creators FOR DELETE TO authenticated USING (true);

-- Authenticated users can manage revenue
CREATE POLICY "Authenticated users can insert revenue" ON public.creator_monthly_revenue FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update revenue" ON public.creator_monthly_revenue FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete revenue" ON public.creator_monthly_revenue FOR DELETE TO authenticated USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_creator_monthly_revenue_updated_at
  BEFORE UPDATE ON public.creator_monthly_revenue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed all creator codes
INSERT INTO public.creators (code, name) VALUES
  ('EMMASDAYDREAM10', 'Emma'),
  ('REECE10', 'Reece'),
  ('SCRUFF10', 'Scruff Brothers'),
  ('ARCHIE10', 'Archie'),
  ('MARLEY10', 'Marley'),
  ('MA10', 'Marley & Archie'),
  ('TIFFANY10', 'Tiffany'),
  ('MITCH10', 'Mitch'),
  ('LIVVY10', 'Livvy'),
  ('MICAH10', 'Micah'),
  ('OWEN10', 'Owen'),
  ('KATIE10', 'Katie'),
  ('CALLAN10', 'Callan'),
  ('CAM10', 'Cam'),
  ('LEE10', 'Lee'),
  ('JAMES10', 'James'),
  ('VINS10', 'Vins'),
  ('TOM10', 'Tom'),
  ('ALFIE10', 'Alfie'),
  ('HOPE10', 'Hope'),
  ('BRAD10', 'Brad'),
  ('TORI10', 'Tori'),
  ('BOYDY10', 'Boydy'),
  ('CUTTLE10', 'Cuttle'),
  ('MOLS10', 'Molly'),
  ('RAESHEL10', 'Raeshel'),
  ('EDDEN10', 'Edden'),
  ('EMILY10', 'Emily'),
  ('VICTORIA10', 'Victoria'),
  ('ZSUZSI10', 'Zsuzsi'),
  ('LINDSEY10', 'Lindsey'),
  ('LAUREN10', 'Lauren'),
  ('LAURA10', 'Laura'),
  ('ARIEL10', 'Ariel'),
  ('ANN10', 'Ann'),
  ('ANGELAGINA10', 'Angela & Gina'),
  ('ARIANA10', 'Ariana'),
  ('DUDEABROAD10', 'Dude Abroad'),
  ('BROOKE10', 'Brooke'),
  ('CHICKABROAD10', 'Chick Abroad'),
  ('COLE10', 'Cole'),
  ('CHLOE10', 'Chloe'),
  ('JIM10', 'Jim'),
  ('KAYLA10', 'Kayla'),
  ('LENNON10', 'Lennon'),
  ('FRANCESCO10', 'Francesco'),
  ('KIM10', 'Kim'),
  ('LEVI10', 'Levi'),
  ('CHARLEY10', 'Charley'),
  ('CELINE10', 'Celine'),
  ('ITALLIA10', 'Itallia'),
  ('NADINE10', 'Nadine'),
  ('LIAM10', 'Liam'),
  ('CLAIRE10', 'Claire'),
  ('GEORGEB10', 'George B'),
  ('GREG10', 'Greg'),
  ('OLIVERB10', 'Oliver B'),
  ('WILLR10', 'Will R'),
  ('APRIL10', 'April'),
  ('CHELSEA10', 'Chelsea'),
  ('EOIN10', 'Eoin'),
  ('MIA10', 'Mia'),
  ('HEIDI10', 'Heidi');
