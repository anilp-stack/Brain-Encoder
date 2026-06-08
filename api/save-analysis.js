export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY not set.");
    }

    const body = req.body || {};
    const payload = {
      brand: body.brand || "",
      client: body.client || "",
      campaign: body.campaign || "",
      agency: body.agency || "",
      industry: body.industry || "",
      market: body.market || "",
      country: body.country || "",
      creative_type: body.creative_type || "",
      overall_grade: body.overall_grade || "",
      headline_verdict: body.headline_verdict || "",
      viral_potential: body.viral_potential ?? null,
      hook_strength: body.hook_strength ?? null,
      hold_rate: body.hold_rate ?? null,
      emotional_peak: body.emotional_peak ?? null,
      brand_recall: body.brand_recall ?? null,
      memory_encoding: body.memory_encoding ?? null,
      sound_off_survival: body.sound_off_survival ?? null,
      share_intent: body.share_intent ?? null,
      creative_efficiency: body.creative_efficiency ?? null,
      cultural_resonance: body.cultural_resonance ?? null,
      full_result: body.full_result || {}
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/analyses`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || "Failed to save analysis.");
    }

    const savedRecord = Array.isArray(data) ? data[0] : data;
    return res.status(200).json({ success: true, id: savedRecord?.id });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
