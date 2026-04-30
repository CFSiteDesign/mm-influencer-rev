-- Revenue change history (audit log)
CREATE TABLE public.revenue_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_table TEXT NOT NULL, -- 'creator_monthly_revenue' or 'creator_revenue'
  operation TEXT NOT NULL,    -- 'INSERT' | 'UPDATE' | 'DELETE'
  creator_code TEXT,
  creator_id UUID,
  month TEXT,
  year INTEGER,
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_revenue_history_changed_at ON public.revenue_history(changed_at DESC);
CREATE INDEX idx_revenue_history_creator_code ON public.revenue_history(creator_code);
CREATE INDEX idx_revenue_history_month_year ON public.revenue_history(month, year);

ALTER TABLE public.revenue_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view revenue history"
  ON public.revenue_history FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can delete revenue history"
  ON public.revenue_history FOR DELETE
  TO authenticated
  USING (true);

-- Trigger function for creator_monthly_revenue (manual edits)
CREATE OR REPLACE FUNCTION public.log_creator_monthly_revenue_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  SELECT code INTO v_code FROM public.creators WHERE id = COALESCE(NEW.creator_id, OLD.creator_id);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.revenue_history (source_table, operation, creator_code, creator_id, month, year, new_values)
    VALUES ('creator_monthly_revenue', 'INSERT', v_code, NEW.creator_id, NEW.month, NEW.year, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.revenue_history (source_table, operation, creator_code, creator_id, month, year, old_values, new_values)
    VALUES ('creator_monthly_revenue', 'UPDATE', v_code, NEW.creator_id, NEW.month, NEW.year, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.revenue_history (source_table, operation, creator_code, creator_id, month, year, old_values)
    VALUES ('creator_monthly_revenue', 'DELETE', v_code, OLD.creator_id, OLD.month, OLD.year, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_log_creator_monthly_revenue
AFTER INSERT OR UPDATE OR DELETE ON public.creator_monthly_revenue
FOR EACH ROW EXECUTE FUNCTION public.log_creator_monthly_revenue_change();

-- Trigger function for creator_revenue (Google Sheets sync)
CREATE OR REPLACE FUNCTION public.log_creator_revenue_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.revenue_history (source_table, operation, creator_code, month, new_values)
    VALUES ('creator_revenue', 'INSERT', NEW.creator_code, NEW.month, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if revenue-relevant fields actually changed
    IF (OLD.rd_room_revenue IS DISTINCT FROM NEW.rd_room_revenue
        OR OLD.hgl_revenue IS DISTINCT FROM NEW.hgl_revenue
        OR OLD.events_revenue IS DISTINCT FROM NEW.events_revenue
        OR OLD.rd_bookings IS DISTINCT FROM NEW.rd_bookings
        OR OLD.hgl_bookings IS DISTINCT FROM NEW.hgl_bookings
        OR OLD.rd_gna IS DISTINCT FROM NEW.rd_gna) THEN
      INSERT INTO public.revenue_history (source_table, operation, creator_code, month, old_values, new_values)
      VALUES ('creator_revenue', 'UPDATE', NEW.creator_code, NEW.month, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.revenue_history (source_table, operation, creator_code, month, old_values)
    VALUES ('creator_revenue', 'DELETE', OLD.creator_code, OLD.month, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_log_creator_revenue
AFTER INSERT OR UPDATE OR DELETE ON public.creator_revenue
FOR EACH ROW EXECUTE FUNCTION public.log_creator_revenue_change();