import { createHash } from "crypto";

const hashToken = (token) => {
  const clean = String(token || "").trim();
  return clean ? createHash("sha256").update(clean).digest("hex") : null;
};

const DNA_METRICS = [
  "viral_potential",
  "hook_strength",
  "hold_rate",
  "emotional_peak",
  "brand_recall",
  "memory_encoding",
  "sound_off_survival",
  "share_intent",
  "creative_efficiency",
  "cultural_resonance"
];

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

const stdDev = (values, avg) => {
  const variance = values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
};

const rounded = (value) => Math.round(value);

const consistencyFromStdDev = (value) => Math.max(0, Math.round(100 - 2 * value));

const parseFullResult = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
};

const extractMetricRow = (row) => {
  const fullResult = parseFullResult(row?.full_result);
  if (!fullResult) return null;

  const metrics = {};
  for (const metric of DNA_METRICS) {
    const value = fullResult[metric];
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    metrics[metric] = value;
  }

  return {
    creative_type: row?.creative_type || fullResult.creative_subtype || fullResult.creative_format || "Unknown",
    created_at: row?.created_at || null,
    metrics
  };
};

const mostFrequentFormat = (rows) => {
  const counts = rows.reduce((acc, row) => {
    const format = row.creative_type || "Unknown";
    acc[format] = (acc[format] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";
};

const traitScore = (metricMeans, metrics) => rounded(mean(metrics.map((metric) => metricMeans[metric])));

const traitConsistency = (metricStdDev, metrics) => {
  const groupStdDev = mean(metrics.map((metric) => metricStdDev[metric]));
  return consistencyFromStdDev(groupStdDev);
};

const fetchRows = async ({ supabaseUrl, supabaseKey, brand, ownerTokenHash }) => {
  const query = new URLSearchParams();
  query.set("select", "full_result,creative_type,created_at");
  query.set("brand", `eq.${brand}`);
  query.set("is_competitor", "eq.false");
  if (ownerTokenHash) query.set("owner_token_hash", `eq.${ownerTokenHash}`);
  query.set("order", "created_at.desc");
  query.set("limit", "1000");

  const response = await fetch(`${supabaseUrl}/rest/v1/analyses?${query.toString()}`, {
    method: "GET",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to fetch brand DNA.");
  }
  return Array.isArray(data) ? data : [];
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY not set.");
    }

    const brand = String(req.query?.brand || "").trim();
    if (!brand) {
      return res.status(400).json({ success: false, error: "brand query param is required." });
    }
    const ownerTokenHash = hashToken(req.query?.token);

    const rows = await fetchRows({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY,
      brand,
      ownerTokenHash
    });

    const validRows = rows.map(extractMetricRow).filter(Boolean);
    const count = validRows.length;

    if (count < 5) {
      return res.status(200).json({
        success: true,
        ready: false,
        count,
        needed: 5 - count
      });
    }

    const metricMeans = {};
    const metricStdDev = {};
    const metricConsistency = {};

    DNA_METRICS.forEach((metric) => {
      const values = validRows.map((row) => row.metrics[metric]);
      const avg = mean(values);
      const sd = stdDev(values, avg);
      metricMeans[metric] = rounded(avg);
      metricStdDev[metric] = rounded(sd);
      metricConsistency[metric] = consistencyFromStdDev(sd);
    });

    return res.status(200).json({
      success: true,
      ready: true,
      count,
      dominant_format: mostFrequentFormat(validRows),
      traits: {
        emotional_signature: traitScore(metricMeans, ["emotional_peak", "share_intent"]),
        memory_architecture: traitScore(metricMeans, ["brand_recall", "memory_encoding"]),
        attention_pattern: traitScore(metricMeans, ["hook_strength", "hold_rate"]),
        cultural_rooting: metricMeans.cultural_resonance,
        trait_consistency: {
          emotional_signature: traitConsistency(metricStdDev, ["emotional_peak", "share_intent"]),
          memory_architecture: traitConsistency(metricStdDev, ["brand_recall", "memory_encoding"]),
          attention_pattern: traitConsistency(metricStdDev, ["hook_strength", "hold_rate"]),
          cultural_rooting: metricConsistency.cultural_resonance
        }
      },
      metric_means: metricMeans,
      metric_stddev: metricStdDev,
      metric_consistency: metricConsistency
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
