import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { registerCreator } from "../_shared/creator-linking.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    // Validate API secret
    const authHeader = req.headers.get("x-api-secret");
    const expectedSecret = Deno.env.get("CREATOR_API_SECRET");

    if (!authHeader || authHeader !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { code, name, creator_id, email } = body;

    // Validate required fields
    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return new Response(JSON.stringify({ error: "code is required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    if (!creator_id || typeof creator_id !== "string" || creator_id.trim().length === 0) {
      return new Response(JSON.stringify({ error: "creator_id is required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Service configuration missing");
    const supabase = createClient(url, key);
    const result = await registerCreator(supabase, { code, name, creator_id, email });

    return new Response(JSON.stringify({ success: true, creator: result.creator, linked: result.linked }), {
      status: result.added ? 201 : 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Creator registration failed" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
