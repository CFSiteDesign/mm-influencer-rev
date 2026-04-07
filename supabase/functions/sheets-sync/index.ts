import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("SHEETS_WEBHOOK_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { creators } = await req.json();
    if (!creators || !Array.isArray(creators)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const rows = [];
    for (const creator of creators) {
      for (const entry of creator.months) {
        if (entry.rd_bookings || entry.rd_gna || entry.rd_room_revenue || entry.hgl_bookings || entry.hgl_revenue) {
          rows.push({
            creator_code: creator.code,
            month: entry.month,
            rd_bookings: entry.rd_bookings || 0,
            rd_gna: entry.rd_gna || 0,
            rd_room_revenue: entry.rd_room_revenue || 0,
            hgl_bookings: entry.hgl_bookings || 0,
            hgl_revenue: entry.hgl_revenue || 0,
            synced_at: new Date().toISOString(),
          });
        }
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase
        .from("creator_revenue")
        .upsert(rows, { onConflict: "creator_code,month" });

      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true, synced: rows.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
