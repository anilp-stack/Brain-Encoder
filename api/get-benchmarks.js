export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Env vars not set");

    const { industry, creative_type } = req.query;
    if (!industry || !creative_type) return res.status(400).json({ error: "industry and creative_type required" });

    const query = new URLSearchParams({
      select: "viral_potential,hook_strength,hold_rate,emotional_peak,brand_recall,memory_encoding,sound_off_survival,share_intent,creative_efficiency,cultural_resonance",
      industry: `eq.${industry}`,
      creative_type: `eq.${creative_type}`,
      limit: "500"
    });

    const response = await fetch(`${SUPABASE_URL}/rest/v1/analyses?${query.toString()}`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const rows = await response.json();
    if (!response.ok) throw new Error(rows.message || "Supabase query failed");

    const n = rows.length;
    if (n < 10) {
      return res.status(200).json({ n, benchmarks: null, message: `Only ${n} analyses in this category. Need 10+ for real benchmarks.` });
    }

    const avg = (field) => {
      const vals = rows.map(r => r[field]).filter(v => v !== null && v !== undefined && !isNaN(v));
      if (!vals.length) return null;
      return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
    };

    const benchmarks = {
      viral_potential: avg("viral_potential"),
      hook_strength: avg("hook_strength"),
      hold_rate: avg("hold_rate"),
      emotional_peak: avg("emotional_peak"),
      brand_recall: avg("brand_recall"),
      memory_encoding: avg("memory_encoding"),
      sound_off_survival: avg("sound_off_survival"),
      share_intent: avg("share_intent"),
      creative_efficiency: avg("creative_efficiency"),
      cultural_resonance: avg("cultural_resonance"),
    };

    return res.status(200).json({ n, benchmarks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
