import { createHash } from "crypto";

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const hashToken = (token) => createHash("sha256").update(String(token || "").trim()).digest("hex");

function summarize(rows) {
  const comparableRows = rows.filter(row => num(row?.calibration_result?.weighted_accuracy) !== null);
  const avg = (values) => {
    const clean = values.map(num).filter(v => v !== null);
    return clean.length ? Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length) : null;
  };
  const averageAccuracy = avg(comparableRows.map(row => row.calibration_result?.weighted_accuracy));
  const averageBias = avg(comparableRows.map(row => row.calibration_result?.weighted_bias));
  const kpiMap = {};

  comparableRows.forEach(row => {
    (row.calibration_result?.comparisons || []).forEach(item => {
      if (!kpiMap[item.label]) kpiMap[item.label] = { label: item.label, count: 0, accuracy: [], bias: [] };
      kpiMap[item.label].count += 1;
      kpiMap[item.label].accuracy.push(item.accuracy);
      kpiMap[item.label].bias.push(item.bias);
    });
  });

  const kpi_accuracy = Object.values(kpiMap).map(item => ({
    label: item.label,
    count: item.count,
    average_accuracy: avg(item.accuracy),
    average_bias: avg(item.bias),
  }));

  return {
    total_rows: rows.length,
    comparable_rows: comparableRows.length,
    average_accuracy: averageAccuracy,
    average_bias: averageBias,
    confidence: comparableRows.length >= 10 ? "high" : comparableRows.length >= 5 ? "medium" : comparableRows.length >= 1 ? "low" : "none",
    bias_label: averageBias === null ? "not available" : averageBias > 10 ? "overestimating" : averageBias < -10 ? "underestimating" : "well calibrated",
    kpi_accuracy,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ success: false, error: "Method not allowed" });

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY not set.");

    const token = String(req.query?.token || "").trim();
    if (!token) return res.status(400).json({ success: false, error: "Token required." });

    const query = new URLSearchParams();
    query.set("select", "*");
    query.set("owner_token_hash", `eq.${hashToken(token)}`);
    query.set("order", "created_at.desc");
    query.set("limit", String(req.query?.limit || "100"));
    if (req.query?.brand) query.set("brand", `eq.${String(req.query.brand).trim()}`);
    if (req.query?.analysis_id) query.set("analysis_id", `eq.${String(req.query.analysis_id).trim()}`);
    if (req.query?.platform) query.set("platform", `eq.${String(req.query.platform).trim().toLowerCase()}`);
    if (req.query?.creative_type) query.set("creative_type", `eq.${String(req.query.creative_type).trim()}`);
    if (req.query?.industry) query.set("industry", `eq.${String(req.query.industry).trim()}`);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/outcome_calibrations?${query.toString()}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const rows = await response.json();
    if (!response.ok) throw new Error(rows.message || rows.error || "Failed to fetch outcome calibrations.");

    const calibrations = Array.isArray(rows) ? rows : [];
    return res.status(200).json({
      success: true,
      calibrations,
      summary: summarize(calibrations),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
