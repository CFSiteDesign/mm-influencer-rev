import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Read-only: how much each creator code earned in the given months, for the
// Creator Hub's "your code has gone quiet" check-in email (Nov 2026).
//
//   POST { "months": ["August", "September", "October"] }
//   ->   { ok, rows: [{ code, month, revenue, bookings }], synced_at }
//
// revenue = rooms & dorms + HGL + events + ALL IN commission (paid + pending).
// bookings = rooms & dorms bookings + HGL/events bookings + ALL IN bookings.
// Same x-api-secret as add-creator (CREATOR_API_SECRET); the Hub holds the
// same value. Nothing is written.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-secret",
};
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const PAGE = 1000; // PostgREST caps every response at 1000 rows

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const num = (v: unknown) => Number(v) || 0;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = req.headers.get("x-api-secret");
  const expected = Deno.env.get("CREATOR_API_SECRET");
  if (!secret || !expected || secret !== expected) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await req.json().catch(() => ({}));
    const months = (Array.isArray(body?.months) ? body.months : [])
      .map((m: unknown) => String(m))
      .filter((m: string) => MONTHS.includes(m));
    if (!months.length) return json({ error: 'Send {"months": ["August", ...]}' }, 400);

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const rows: unknown[] = [];
    let syncedAt: string | null = null;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await sb
        .from("creator_revenue")
        .select("creator_code, month, rd_bookings, rd_room_revenue, hgl_bookings, hgl_revenue, events_revenue, allin_bookings, allin_commission, allin_pending, synced_at")
        .in("month", months)
        .order("creator_code")
        .order("month")
        .range(from, from + PAGE - 1);
      if (error) throw error;
      for (const r of data ?? []) {
        rows.push({
          code: r.creator_code,
          month: r.month,
          revenue: num(r.rd_room_revenue) + num(r.hgl_revenue) + num(r.events_revenue) + num(r.allin_commission) + num(r.allin_pending),
          bookings: num(r.rd_bookings) + num(r.hgl_bookings) + num(r.allin_bookings),
        });
        if (r.synced_at && (!syncedAt || r.synced_at > syncedAt)) syncedAt = r.synced_at;
      }
      if (!data || data.length < PAGE) break;
    }
    return json({ ok: true, rows, synced_at: syncedAt });
  } catch (e) {
    console.error("code-activity error:", e);
    return json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
