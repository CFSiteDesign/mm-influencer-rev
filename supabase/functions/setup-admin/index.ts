import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const email = "Admin.revenue@madmonkeyhostels.com";
  const password = "kzrYGm2OZoqH3qfVYBDUdw";

  // Try to create user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error && error.message?.includes("already been registered")) {
    // Update existing user's password
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existing = users?.users?.find((u: any) => u.email === email);
    if (existing) {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, { password });
      return new Response(JSON.stringify({ status: "updated" }), { headers: { "Content-Type": "application/json" } });
    }
  }

  return new Response(JSON.stringify({ status: error ? "error" : "created", error: error?.message, data }), {
    headers: { "Content-Type": "application/json" },
  });
});
