import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-secret",
};

const MONTHS = new Set([
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]);

interface TripItem {
  code: string;
  month: string;
  bookings?: number;
  commission_confirmed?: number;
  commission_pending?: number;
}

function validate(item: any): { ok: true; value: TripItem } | { ok: false; error: string } {
  if (!item || typeof item !== "object") return { ok: false, error: "item must be an object" };
  if (!item.code || typeof item.code !== "string" || !item.code.trim()) {
    return { ok: false, error: "code is required" };
  }
  if (!item.month || typeof item.month !== "string" || !MONTHS.has(item.month)) {
    return { ok: false, error: "month must be a full month name (e.g. 'July')" };
  }
  return {
    ok: true,
    value: {
      code: item.code.trim().toUpperCase(),
      month: item.month,
      bookings: Number(item.bookings ?? 0) || 0,
      commission_confirmed: Number(item.commission_confirmed ?? 0) || 0,
      commission_pending: Number(item.commission_pending ?? 0) || 0,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("x-api-secret");
  const expected = Deno.env.get("ALLIN_TRIPS_API_SECRET");
  if (!authHeader || !expected || authHeader !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const rawItems: any[] = Array.isArray(body) ? body : [body];
  const items: TripItem[] = [];
  const errors: { index: number; error: string }[] = [];
  rawItems.forEach((raw, i) => {
    const v = validate(raw);
    if (v.ok) items.push(v.value);
    else errors.push({ index: i, error: v.error });
  });

  if (items.length === 0) {
    return new Response(JSON.stringify({ error: "No valid items", errors }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date().toISOString();
  let updated = 0;
  let inserted = 0;
  const failures: { code: string; month: string; error: string }[] = [];

  for (const it of items) {
    const { data: existing, error: selErr } = await supabase
      .from("creator_revenue")
      .select("id")
      .ilike("creator_code", it.code)
      .eq("month", it.month)
      .maybeSingle();

    if (selErr) {
      failures.push({ code: it.code, month: it.month, error: selErr.message });
      continue;
    }

    if (existing) {
      const { error: updErr } = await supabase
        .from("creator_revenue")
        .update({
          allin_bookings: it.bookings,
          allin_commission: it.commission_confirmed,
          allin_pending: it.commission_pending,
          allin_synced_at: now,
        })
        .eq("id", existing.id);
      if (updErr) failures.push({ code: it.code, month: it.month, error: updErr.message });
      else updated++;
    } else {
      const { error: insErr } = await supabase.from("creator_revenue").insert({
        creator_code: it.code,
        month: it.month,
        allin_bookings: it.bookings,
        allin_commission: it.commission_confirmed,
        allin_pending: it.commission_pending,
        allin_synced_at: now,
      });
      if (insErr) failures.push({ code: it.code, month: it.month, error: insErr.message });
      else inserted++;
    }
  }

  return new Response(
    JSON.stringify({
      success: failures.length === 0,
      received: rawItems.length,
      updated,
      inserted,
      rows_written: updated + inserted,
      validation_errors: errors,
      failures,
    }),
    { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
  );
});