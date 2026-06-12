export const config = { maxDuration: 15 };

const METRICS = [
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

const gradeToScore = (grade) => {
  const map = {
    "A+": 95,
    A: 88,
    "A-": 82,
    "B+": 78,
    B: 72,
    "B-": 67,
    "C+": 62,
    C: 57,
    "C-": 52,
    D: 43,
    F: 30
  };
  return map[String(grade || "").toUpperCase()] ?? null;
};

const average = (rows, key) => {
  const nums = rows
    .map((row) => row?.[key])
    .filter((value) => typeof value === "number" && Number.isFinite(value));
  if (!nums.length) return null;
  return Math.round(nums.reduce((sum, value) => sum + value, 0) / nums.length);
};

const latestDate = (rows) => {
  const dates = rows
    .map((row) => row.created_at)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a));
  return dates[0] || null;
};

const summarizeBrand = (brand, rows) => {
  const gradeScores = rows
    .map((row) => gradeToScore(row.overall_grade))
    .filter((value) => typeof value === "number");
  const averages = {
    grade_score: gradeScores.length
      ? Math.round(gradeScores.reduce((sum, value) => sum + value, 0) / gradeScores.length)
      : null
  };
  METRICS.forEach((metric) => {
    averages[metric] = average(rows, metric);
  });
  return {
    brand,
    count: rows.length,
    latest: latestDate(rows),
    averages
  };
};

const fetchRows = async ({ supabaseUrl, supabaseKey, filters }) => {
  const query = new URLSearchParams();
  query.set("select", `brand,overall_grade,created_at,${METRICS.join(",")}`);
  query.set("order", "created_at.desc");
  query.set("limit", "1000");
  Object.entries(filters).forEach(([key, value]) => {
    query.set(key, value);
  });

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
    throw new Error(data.message || data.error || "Failed to fetch competitive intelligence.");
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

    const ownRows = await fetchRows({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY,
      filters: {
        brand: `eq.${brand}`,
        is_competitor: "eq.false"
      }
    });

    const competitorRows = await fetchRows({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY,
      filters: {
        competitor_of: `eq.${brand}`,
        is_competitor: "eq.true"
      }
    });

    const competitorGroups = competitorRows.reduce((groups, row) => {
      const competitorBrand = row.brand || "Unknown Competitor";
      if (!groups[competitorBrand]) groups[competitorBrand] = [];
      groups[competitorBrand].push(row);
      return groups;
    }, {});

    return res.status(200).json({
      success: true,
      own: summarizeBrand(brand, ownRows),
      competitors: Object.entries(competitorGroups)
        .map(([competitorBrand, rows]) => summarizeBrand(competitorBrand, rows))
        .sort((a, b) => (b.averages.grade_score || 0) - (a.averages.grade_score || 0))
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
