export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  const { token } = req.query || {};
  if (!token || token.length !== 16) {
    return res.status(400).json({ error: "Invalid token" });
  }

  try {
    const params = new URLSearchParams({
      select: "brand,client,campaign,agency,industry,country,creative_type,overall_grade,headline_verdict,full_result,created_at",
      share_token: `eq.${token}`,
      limit: "1",
    });

    const response = await fetch(`${SUPABASE_URL}/rest/v1/analyses?${params.toString()}`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    const rows = await response.json();

    if (!response.ok || !rows.length) {
      return res.status(404).json({ error: "Report not found" });
    }

    const row = rows[0];
    const fullResult = typeof row.full_result === "string" ? JSON.parse(row.full_result) : row.full_result;

    return res.status(200).json({
      found: true,
      metadata: {
        brand: row.brand,
        client: row.client,
        campaign: row.campaign,
        agency: row.agency,
        industry: row.industry,
        country: row.country,
        type: row.creative_type,
        date: row.created_at,
      },
      results: fullResult,
    });
  } catch (err) {
    console.error("get-shared-report error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
