export const config = { maxDuration: 30 };

const CERT_SELECT = "brand,campaign,industry,creative_type,overall_grade,cert_id,cert_issued_at,full_result";

const parseFullResult = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const score = (result, key) => {
  const value = result?.[key];
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ valid: false, error: "Method not allowed" });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY not set.");
    }

    const certId = String(req.query?.cert_id || "").trim();
    if (!certId) {
      return res.status(400).json({ valid: false, error: "cert_id query param is required." });
    }

    const query = new URLSearchParams();
    query.set("select", CERT_SELECT);
    query.set("cert_id", `eq.${certId}`);
    query.set("is_certified", "eq.true");
    query.set("limit", "1");

    const response = await fetch(`${SUPABASE_URL}/rest/v1/analyses?${query.toString()}`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const rows = await response.json();
    if (!response.ok) {
      throw new Error(rows.message || rows.error || "Failed to verify certificate.");
    }

    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) {
      return res.status(404).json({ valid: false });
    }

    const result = parseFullResult(row.full_result);
    return res.status(200).json({
      valid: true,
      cert_id: row.cert_id,
      brand: row.brand,
      campaign: row.campaign,
      industry: row.industry,
      creative_type: row.creative_type,
      grade: row.overall_grade,
      cert_issued_at: row.cert_issued_at,
      key_scores: {
        brand_recall: score(result, "brand_recall"),
        memory_encoding: score(result, "memory_encoding"),
        hook_strength: score(result, "hook_strength"),
        emotional_peak: score(result, "emotional_peak"),
        cultural_resonance: score(result, "cultural_resonance"),
      },
    });
  } catch (error) {
    return res.status(500).json({ valid: false, error: error.message });
  }
}
