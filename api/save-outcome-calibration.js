import { createHash } from "crypto";

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const hashToken = (token) => createHash("sha256").update(String(token || "").trim()).digest("hex");

const KPI_MAP = [
  { actual: "actual_spontaneous_awareness_lift", predicted: "spontaneous_awareness_lift", label: "Spontaneous Awareness", weight: 1.25, kind: "lift" },
  { actual: "actual_aided_awareness_lift", predicted: "aided_awareness_lift", label: "Aided Awareness", weight: 1.25, kind: "lift" },
  { actual: "actual_brand_lift", predicted: "aided_awareness_lift", label: "Brand Lift", weight: 1.25, kind: "lift" },
  { actual: "actual_consideration_lift", predicted: "consideration_lift", label: "Consideration", weight: 1.25, kind: "lift" },
  { actual: "actual_purchase_intent_lift", predicted: "purchase_intent_lift", label: "Purchase Intent", weight: 1.25, kind: "lift" },
  { actual: "actual_vtr", predicted: "vtr_completion_potential", label: "VTR", weight: 1, kind: "percentage" },
  { actual: "actual_completion_rate", predicted: "vtr_completion_potential", label: "Completion Rate", weight: 1, kind: "percentage" },
  { actual: "actual_ctr", predicted: "ctr_response_potential", label: "CTR", weight: 1, kind: "ctr" },
];

function normalizeActual(value, kind) {
  const actual = num(value);
  if (actual === null) return null;
  if (kind === "percentage") return Math.round(clamp(actual));
  if (kind === "ctr") return Math.round(clamp((actual / 3.0) * 90));
  if (kind === "lift") {
    if (actual <= 0) return 0;
    if (actual >= 8) return 100;
    if (actual >= 5) return Math.round(70 + ((actual - 5) / 3) * 30);
    if (actual >= 2) return Math.round(40 + ((actual - 2) / 3) * 30);
    return Math.round((actual / 2) * 40);
  }
  return null;
}

function computeCalibration(outcomeForecast, body) {
  const predictedValues = {};
  const normalizedActuals = {};
  const comparisons = [];

  KPI_MAP.forEach((item) => {
    const predicted = num(outcomeForecast?.[item.predicted]);
    const normalized = normalizeActual(body[item.actual], item.kind);
    if (predicted === null || normalized === null) return;

    predictedValues[item.predicted] = predicted;
    normalizedActuals[item.actual] = normalized;
    const error = Math.abs(predicted - normalized);
    const accuracy = Math.round(clamp(100 - error));
    const bias = Math.round(predicted - normalized);
    const verdict = bias > 10 ? "overestimated" : bias < -10 ? "underestimated" : "predicted correctly";
    comparisons.push({
      label: item.label,
      actual_field: item.actual,
      predicted_field: item.predicted,
      predicted,
      normalized_actual: normalized,
      raw_actual: num(body[item.actual]),
      error: Math.round(error),
      accuracy,
      bias,
      verdict,
      weight: item.weight,
    });
  });

  const denominator = comparisons.reduce((sum, row) => sum + row.weight, 0);
  const weightedAccuracy = denominator
    ? Math.round(comparisons.reduce((sum, row) => sum + row.accuracy * row.weight, 0) / denominator)
    : null;
  const weightedBias = denominator
    ? Math.round(comparisons.reduce((sum, row) => sum + row.bias * row.weight, 0) / denominator)
    : null;
  const confidence = comparisons.length >= 5 ? "high" : comparisons.length >= 3 ? "medium" : comparisons.length >= 1 ? "low" : "none";
  const verdict = weightedBias === null
    ? "not_comparable"
    : weightedBias > 10
      ? "overestimated"
      : weightedBias < -10
        ? "underestimated"
        : "predicted correctly";

  return {
    predictedValues,
    normalizedActuals,
    calibrationResult: {
      comparable_kpis: comparisons.length,
      weighted_accuracy: weightedAccuracy,
      weighted_bias: weightedBias,
      confidence,
      verdict,
      comparisons,
    },
  };
}

async function fetchAnalysis({ supabaseUrl, supabaseKey, analysisId }) {
  const query = new URLSearchParams();
  query.set("select", "id,brand,campaign,industry,country,market,creative_type,owner_token_hash,full_result");
  query.set("id", `eq.${analysisId}`);
  query.set("limit", "1");

  const response = await fetch(`${supabaseUrl}/rest/v1/analyses?${query.toString()}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || "Failed to fetch analysis.");
  return Array.isArray(data) ? data[0] : null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY not set.");

    const body = req.body || {};
    const token = String(body.token || "").trim();
    const analysisId = String(body.analysis_id || "").trim();
    const platform = String(body.platform || "").trim().toLowerCase();
    if (!token) return res.status(400).json({ success: false, error: "Token required." });
    if (!analysisId) return res.status(400).json({ success: false, error: "analysis_id required." });
    if (!platform) return res.status(400).json({ success: false, error: "Platform required." });

    const ownerTokenHash = hashToken(token);
    const analysis = await fetchAnalysis({ supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_ANON_KEY, analysisId });
    if (!analysis) return res.status(404).json({ success: false, error: "Analysis not found." });
    if (analysis.owner_token_hash && analysis.owner_token_hash !== ownerTokenHash) {
      return res.status(403).json({ success: false, error: "This analysis belongs to a different private token." });
    }

    const fullResult = typeof analysis.full_result === "string" ? JSON.parse(analysis.full_result) : (analysis.full_result || {});
    const forecast = fullResult.outcome_forecast || {};
    const { predictedValues, normalizedActuals, calibrationResult } = computeCalibration(forecast, body);

    const payload = {
      analysis_id: analysisId,
      owner_token_hash: ownerTokenHash,
      brand: body.brand || analysis.brand || "",
      campaign: body.campaign || analysis.campaign || "",
      industry: body.industry || analysis.industry || "",
      country: body.country || analysis.country || "",
      market: body.market || analysis.market || "",
      creative_type: body.creative_type || analysis.creative_type || fullResult.creative_format || "",
      platform,
      campaign_start_date: body.campaign_start_date || null,
      campaign_end_date: body.campaign_end_date || null,
      actual_vtr: num(body.actual_vtr),
      actual_ctr: num(body.actual_ctr),
      actual_completion_rate: num(body.actual_completion_rate),
      actual_brand_lift: num(body.actual_brand_lift),
      actual_aided_awareness_lift: num(body.actual_aided_awareness_lift),
      actual_spontaneous_awareness_lift: num(body.actual_spontaneous_awareness_lift),
      actual_consideration_lift: num(body.actual_consideration_lift),
      actual_purchase_intent_lift: num(body.actual_purchase_intent_lift),
      actual_sales_proxy: num(body.actual_sales_proxy),
      actual_store_visits: num(body.actual_store_visits),
      actual_roas: num(body.actual_roas),
      target_roas: num(body.target_roas),
      predicted_values: predictedValues,
      normalized_actuals: normalizedActuals,
      calibration_result: calibrationResult,
      notes: body.notes || "",
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/outcome_calibrations?on_conflict=analysis_id,platform`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates, return=representation",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || "Failed to save calibration.");

    return res.status(200).json({ success: true, calibration: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
