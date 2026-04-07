
DROP TABLE IF EXISTS creator_revenue;

CREATE TABLE creator_revenue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_code TEXT NOT NULL,
  month TEXT NOT NULL,
  rd_bookings INTEGER DEFAULT 0,
  rd_gna INTEGER DEFAULT 0,
  rd_room_revenue NUMERIC(12,2) DEFAULT 0,
  hgl_bookings INTEGER DEFAULT 0,
  hgl_revenue NUMERIC(12,2) DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_code, month)
);

CREATE INDEX idx_creator_month ON creator_revenue(creator_code, month);

ALTER TABLE creator_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON creator_revenue
  FOR SELECT USING (true);

CREATE POLICY "Allow service role write" ON creator_revenue
  FOR ALL USING (true);
