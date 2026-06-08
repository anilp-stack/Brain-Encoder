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
      return res.status(200).json({ valid: true, credits: 999, bypass: true });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Env vars not set");

    const query = new URLSearchParams({
      select: "id,credits_remaining,plan_type",
      token: `eq.${token.trim()}`
    });

    const r = await fetch(`${SUPABASE_URL}/rest/v1/credits?${query}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    const rows = await r.json();
    if (!r.ok || !Array.isArray(rows) || rows.length === 0) {
      return res.status(200).json({ valid: false, error: "Invalid token. Please check or purchase credits." });
    }

    const row = rows[0];
    if (row.credits_remaining <= 0) {
      return res.status(200).json({ valid: false, error: "No credits remaining. Please purchase more." });
    }

    return res.status(200).json({
      valid: true,
      credits: row.credits_remaining,
      plan: row.plan_type
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
