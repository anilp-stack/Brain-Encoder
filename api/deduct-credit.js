export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { token } = req.body;
    if (!token || !token.trim()) return res.status(400).json({ error: "Token required" });

    const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;
    if (ACCESS_PASSWORD && token.trim() === ACCESS_PASSWORD) {
      return res.status(200).json({ success: true, bypass: true });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Env vars not set");

    const query = new URLSearchParams({
      select: "id,credits_remaining",
      token: `eq.${token.trim()}`
    });
    const r = await fetch(`${SUPABASE_URL}/rest/v1/credits?${query}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const rows = await r.json();
    if (!r.ok || !rows.length) return res.status(400).json({ error: "Token not found" });

    const row = rows[0];
    if (row.credits_remaining <= 0) {
      return res.status(400).json({ error: "No credits remaining" });
    }

    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/credits?id=eq.${row.id}`,
      {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({ credits_remaining: row.credits_remaining - 1 })
      }
    );

    if (!updateRes.ok) throw new Error("Credit deduction failed");

    return res.status(200).json({
      success: true,
      credits_remaining: row.credits_remaining - 1
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
