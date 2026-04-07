import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Auth check
  const authHeader = req.headers.get("Authorization");
  const expected = Deno.env.get("SHEETS_WEBHOOK_SECRET");
  if (!authHeader || authHeader !== `Bearer ${expected}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!body.creators || !Array.isArray(body.creators)) {
    return jsonResponse({ error: "Missing or invalid 'creators' array" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const rows: any[] = [];

  for (const creator of body.creators) {
    if (!creator.code || typeof creator.code !== "string") continue;
    if (!Array.isArray(creator.months)) continue;

    for (const m of creator.months) {
      if (!m.month || typeof m.month !== "string") continue;

      const rd_bookings = Number(m.rd_bookings) || 0;
      const rd_gna = Number(m.rd_gna) || 0;
      const rd_room_revenue = Number(m.rd_room_revenue) || 0;
      const hgl_bookings = Number(m.hgl_bookings) || 0;
      const hgl_revenue = Number(m.hgl_revenue) || 0;

      // Skip if all values are zero
      if (rd_bookings === 0 && rd_gna === 0 && rd_room_revenue === 0 && hgl_bookings === 0 && hgl_revenue === 0) {
        continue;
      }

      rows.push({
        creator_code: creator.code,
        month: m.month,
        rd_bookings,
        rd_gna,
        rd_room_revenue,
        hgl_bookings,
        hgl_revenue,
        synced_at: new Date().toISOString(),
      });
    }
  }

  if (rows.length === 0) {
    return jsonResponse({ success: true, synced: 0, message: "No non-zero data to sync" });
  }

  const { error } = await supabase
    .from("creator_revenue")
    .upsert(rows, { onConflict: "creator_code,month" });

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ success: true, synced: rows.length });
});
