import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { registerCreator } from "../_shared/creator-linking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-secret",
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

  // Auth check — accept either "Authorization: Bearer <secret>" or "x-api-secret: <secret>"
  const expected = Deno.env.get("SHEETS_WEBHOOK_SECRET");
  const authHeader = req.headers.get("Authorization");
  const apiSecret = req.headers.get("x-api-secret");
  const authorized =
    !!expected &&
    ((!!authHeader && authHeader === `Bearer ${expected}`) || apiSecret === expected);
  if (!authorized) {
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

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return jsonResponse({ error: "Service configuration missing" }, 500);
  const supabase = createClient(url, key);

  const rows: any[] = [];

  for (const creator of body.creators) {
    if (!creator.code || typeof creator.code !== "string") continue;
    if (!Array.isArray(creator.months)) continue;

    const normalizedCode = creator.code.trim().toUpperCase();

    for (const m of creator.months) {
      if (!m.month || typeof m.month !== "string") continue;

      const rd_bookings = Number(m.rd_bookings) || 0;
      const rd_gna = Number(m.rd_gna) || 0;
      const rd_room_revenue = Number(m.rd_room_revenue) || 0;
      const hgl_bookings = Number(m.hgl_bookings) || 0;
      const hgl_revenue = Number(m.hgl_revenue) || 0;
      const events_revenue = Number(m.events_revenue) || 0;

      // Always sync — zero rows overwrite stale data so dashboard matches the sheet.
      rows.push({
        creator_code: normalizedCode,
        month: m.month,
        rd_bookings,
        rd_gna,
        rd_room_revenue,
        hgl_bookings,
        hgl_revenue,
        events_revenue,
        synced_at: new Date().toISOString(),
      });
    }
  }

  // Deduplicate by creator_code + month — Postgres upsert cannot touch the same
  // row twice in one statement. Later occurrences win.
  const dedupedMap = new Map<string, any>();
  for (const r of rows) {
    dedupedMap.set(`${r.creator_code}__${r.month}`, r);
  }
  const dedupedRows = [...dedupedMap.values()];

  if (dedupedRows.length === 0) {
    return jsonResponse({ success: true, synced: 0, creatorsAdded: 0, message: "No non-zero data to sync" });
  }

  // Auto-add new creator codes to the creators table
  const uniqueCodes = [...new Set(dedupedRows.map((r) => r.creator_code))];
  const { data: existingCreators, error: existingError } = await supabase
    .from("creators")
    .select("code")
    .in("code", uniqueCodes);
  if (existingError) return jsonResponse({ error: existingError.message }, 500);

  const existingCodes = new Set((existingCreators || []).map((c: any) => c.code));
  let creatorsAdded = 0;
  let creatorsLinked = 0;
  const identityMap = new Map<string, any>();
  for (const creator of body.creators) {
    if (typeof creator.code === "string") identityMap.set(creator.code.trim().toUpperCase(), creator);
  }
  try {
    for (const code of uniqueCodes) {
      const identity = identityMap.get(code);
      // Code-only existing feeds stay fast and retain their current behaviour.
      if (existingCodes.has(code) && !identity?.creator_id && !identity?.email) continue;
      const result = await registerCreator(supabase, { code, creator_id: identity?.creator_id, email: identity?.email, name: identity?.name });
      if (result.added) creatorsAdded++;
      if (result.linked) creatorsLinked++;
    }
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Creator identity reconciliation failed" }, 409);
  }

  // Upsert in chunks to stay well within statement limits
  const CHUNK = 500;
  for (let i = 0; i < dedupedRows.length; i += CHUNK) {
    const { error } = await supabase
      .from("creator_revenue")
      .upsert(dedupedRows.slice(i, i + CHUNK), { onConflict: "creator_code,month" });
    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }
  }

  return jsonResponse({
    success: true,
    synced: dedupedRows.length,
    duplicatesMerged: rows.length - dedupedRows.length,
    creatorsAdded,
    creatorsLinked,
  });
});
