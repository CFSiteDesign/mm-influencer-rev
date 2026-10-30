export interface CreatorIdentity {
  code: string;
  creator_id?: string | null;
  email?: string | null;
  name?: string | null;
}

export function normalizeIdentity(input: CreatorIdentity): CreatorIdentity {
  return {
    code: input.code.trim().toUpperCase(),
    creator_id: input.creator_id?.trim().toUpperCase() || null,
    email: input.email?.trim().toLowerCase() || null,
    name: input.name?.trim() || null,
  };
}

// Keep old code records and revenue intact. Email groups are the dashboard's
// existing identity mechanism; a stable internal address covers creators without email.
export async function registerCreator(client: any, input: CreatorIdentity) {
  const identity = normalizeIdentity(input);
  const columns = "id, code, creator_id, email, name";
  const byCode = await client.from("creators").select(columns).eq("code", identity.code).maybeSingle();
  if (byCode.error) throw byCode.error;
  let primary = null;

  if (identity.creator_id) {
    const result = await client.from("creators").select(columns).eq("creator_id", identity.creator_id).maybeSingle();
    if (result.error) throw result.error;
    primary = result.data;
  }
  if (!primary && identity.email) {
    const result = await client.from("creators").select(columns).ilike("email", identity.email);
    if (result.error) throw result.error;
    const matches = result.data || [];
    const ids = new Set(matches.map((row: any) => row.creator_id).filter(Boolean));
    if (ids.size > 1) throw new Error("Email matches multiple Creator IDs; manual review required");
    primary = matches.find((row: any) => row.creator_id) || matches[0] || null;
    if (primary?.creator_id && identity.creator_id && primary.creator_id !== identity.creator_id) {
      throw new Error("Email belongs to a different Creator ID");
    }
  }

  const existing = byCode.data;
  if (existing?.creator_id && identity.creator_id && existing.creator_id !== identity.creator_id) {
    throw new Error("Code belongs to a different Creator ID");
  }
  if (existing && primary && existing.id !== primary.id) {
    if (existing.creator_id || (existing.email && existing.email.toLowerCase() !== primary.email?.toLowerCase())) {
      throw new Error("Code already belongs to another account; manual review required");
    }
  }

  if (primary) {
    const email = primary.email || identity.email || `linked-${primary.id}@madmonkey.internal`;
    if (!primary.email) {
      const result = await client.from("creators").update({ email }).eq("id", primary.id);
      if (result.error) throw result.error;
    }
    if (existing?.id === primary.id) return { creator: { ...primary, email }, added: false, linked: false };
    const values = { email, name: primary.name || identity.name };
    const result = existing
      ? await client.from("creators").update(values).eq("id", existing.id).select(columns).single()
      : await client.from("creators").insert({ ...values, code: identity.code, creator_id: null }).select(columns).single();
    if (result.error) throw result.error;
    return { creator: result.data, added: !existing, linked: true };
  }

  if (existing) {
    const values = {
      creator_id: existing.creator_id || identity.creator_id,
      email: existing.email || identity.email,
      name: identity.name || existing.name,
    };
    const result = await client.from("creators").update(values).eq("id", existing.id).select(columns).single();
    if (result.error) throw result.error;
    return { creator: result.data, added: false, linked: false };
  }

  const result = await client.from("creators").insert({ ...identity, name: identity.name || identity.code.replace(/10$/, "") }).select(columns).single();
  if (result.error) throw result.error;
  return { creator: result.data, added: true, linked: false };
}