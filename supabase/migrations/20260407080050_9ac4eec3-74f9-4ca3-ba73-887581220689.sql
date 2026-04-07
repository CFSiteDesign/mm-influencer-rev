
-- Add unique constraint on (creator_code, month) for upsert support
ALTER TABLE public.creator_revenue
ADD CONSTRAINT creator_revenue_code_month_unique UNIQUE (creator_code, month);

-- Add index for fast lookups (the unique constraint already creates one, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_creator_revenue_code_month ON public.creator_revenue (creator_code, month);
