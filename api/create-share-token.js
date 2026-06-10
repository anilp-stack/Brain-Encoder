import { randomBytes } from "crypto";

export const config = { maxDuration: 15 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  try {
    const { results, metadata } = req.body || {};

    if (!results || !metadata) {
      return res.status(400).json({ error: "results and metadata required" });
    }

    const token = randomBytes(8).toString("hex");
    const safeNum = v => (typeof v === "number" && !Number.isNaN(v) ? Math.round(v) : null);

    const payload = {
      share_token: token,
      brand: (metadata.brand || "").trim().slice(0, 100),
      client: (metadata.client || "").trim().slice(0, 100),
      campaign: (metadata.campaign || "").trim().slice(0, 100),
      agency: (metadata.agency || "").trim().slice(0, 100),
      industry: (metadata.industry || "").trim().slice(0, 100),
      country: (metadata.country || "India").trim(),
      market: (metadata.market || "").trim().slice(0, 100),
      creative_type: (metadata.type || "video").trim(),
      overall_grade: (results.overall_grade || "").trim(),
      headline_verdict: (results.headline_verdict || "").trim().slice(0, 500),
      viral_potential: safeNum(results.viral_potential),
      hook_strength: safeNum(results.hook_strength),
      hold_rate: safeNum(results.hold_rate),
      emotional_peak: safeNum(results.emotional_peak),
      brand_recall: safeNum(results.brand_recall),
      memory_encoding: safeNum(results.memory_encoding),
      sound_off_survival: safeNum(results.sound_off_survival),
      share_intent: safeNum(results.share_intent),
      creative_efficiency: safeNum(results.creative_efficiency),
      cultural_resonance: safeNum(results.cultural_resonance),
      full_result: results,
    };

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/analyses`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Supabase insert failed: ${errText}`);
    }

    return res.status(200).json({ token });
  } catch (err) {
    console.error("create-share-token error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
