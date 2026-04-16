
ALTER TABLE public.creator_monthly_revenue ADD COLUMN events_revenue numeric NOT NULL DEFAULT 0;
ALTER TABLE public.creator_revenue ADD COLUMN events_revenue numeric DEFAULT 0;
