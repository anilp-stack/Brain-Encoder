// netlify/functions/save-analysis.js

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: "Method not allowed" }) };
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY not set.");
    }

    const body = JSON.parse(event.body || "{}");
    const payload = {
      brand: body.brand || "",
      client: body.client || "",
      campaign: body.campaign || "",
      agency: body.agency || "",
      industry: body.industry || "",
      market: body.market || "",
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
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, id: savedRecord?.id }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
  }
}
