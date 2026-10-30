import { describe, expect, it } from "vitest";
import { registerCreator } from "../../supabase/functions/_shared/creator-linking";

function fixture(initial: any[]) {
  const rows = initial.map(row => ({ email: null, name: "Creator", creator_id: null, ...row }));
  const client = { from: () => {
    let matches = rows;
    let change: any;
    let insert: any;
    const run = () => {
      if (insert) { const row = { id: `row-${rows.length}`, ...insert }; rows.push(row); matches = [row]; insert = null; }
      if (change) { matches.forEach(row => Object.assign(row, change)); change = null; }
      return { data: matches, error: null };
    };
    const query: any = {
      select: () => query,
      eq: (key: string, value: string) => { matches = matches.filter(row => row[key] === value); return query; },
      ilike: (key: string, value: string) => { matches = matches.filter(row => row[key]?.toLowerCase() === value.toLowerCase()); return query; },
      insert: (value: any) => { insert = value; return query; },
      update: (value: any) => { change = value; return query; },
      maybeSingle: () => { const result = run(); return Promise.resolve({ data: result.data[0] || null, error: null }); },
      single: () => { const result = run(); return Promise.resolve({ data: result.data[0], error: null }); },
      then: (resolve: any, reject: any) => Promise.resolve(run()).then(resolve, reject),
    };
    return query;
  } };
  return { client, rows };
}

describe("automatic creator code linking", () => {
  it("links Creator Hub's new code using the existing Creator ID and keeps the old code", async () => {
    const { client, rows } = fixture([{ id: "lucas", code: "LUCASB11", creator_id: "CH493" }]);
    const result = await registerCreator(client, { code: "aussiesin", creator_id: "ch493" });
    expect(result.linked).toBe(true);
    expect(rows.map(row => row.code)).toEqual(["LUCASB11", "AUSSIESIN"]);
    expect(rows[1].email).toBe(rows[0].email);
    expect(rows[1].creator_id).toBeNull();
    expect(rows[0].creator_id).toBe("CH493");
  });

  it("links a Sheets-provisioned code by normalized email", async () => {
    const { client, rows } = fixture([
      { id: "lucas", code: "LUCASB11", creator_id: "CH493", email: "lucasalocalguide@gmail.com" },
      { id: "old", code: "AUSSIESIN" },
    ]);
    await registerCreator(client, { code: "AUSSIESIN", email: " LucasALocalGuide@gmail.com " });
    expect(rows[1].email).toBe("lucasalocalguide@gmail.com");
    expect(rows).toHaveLength(2);
  });

  it("is idempotent when an alias is sent again", async () => {
    const { client, rows } = fixture([{ id: "lucas", code: "LUCASB11", creator_id: "CH493" }]);
    await registerCreator(client, { code: "AUSSIESIN", creator_id: "CH493" });
    await registerCreator(client, { code: "AUSSIESIN", creator_id: "CH493" });
    expect(rows).toHaveLength(2);
  });

  it("rejects linking a code assigned to a different Creator ID", async () => {
    const { client, rows } = fixture([
      { id: "lucas", code: "LUCASB11", creator_id: "CH493" },
      { id: "other", code: "OTHER10", creator_id: "CH001" },
    ]);
    await expect(registerCreator(client, { code: "OTHER10", creator_id: "CH493" })).rejects.toThrow("different Creator ID");
    expect(rows[1].creator_id).toBe("CH001");
  });

  it("does not guess identity for a code-only Sheets payload", async () => {
    const { client, rows } = fixture([{ id: "lucas", code: "LUCASB11", creator_id: "CH493" }]);
    await registerCreator(client, { code: "LUCAS10" });
    expect(rows[1].email).toBeNull();
    expect(rows[1].creator_id).toBeNull();
  });

  it("rejects an email associated with conflicting creator identities", async () => {
    const { client } = fixture([
      { id: "one", code: "ONE10", creator_id: "CH001", email: "shared@example.com" },
      { id: "two", code: "TWO10", creator_id: "CH002", email: "shared@example.com" },
    ]);
    await expect(registerCreator(client, { code: "NEW10", email: "shared@example.com" })).rejects.toThrow("multiple Creator IDs");
  });
});