import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Create admin user with the username as email
  const email = "mm-rev-admin@madmonkey.internal";
  const password = "MMREV!?";

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const exists = existingUsers?.users?.some(u => u.email === email);

  if (exists) {
    return new Response(JSON.stringify({ message: "Admin user already exists" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ message: "Admin user created", user: data.user?.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
