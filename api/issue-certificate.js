export const config = { maxDuration: 30 };

import crypto from "crypto";

const CERT_SELECT = "id,brand,client,campaign,industry,market,creative_type,overall_grade,full_result,is_certified,cert_id,cert_issued_at,created_at";

const parseFullResult = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const num = (obj, key) => {
  const value = obj?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const weightedScore = (result) => (
  (num(result, "memory_encoding") || 0) * 0.20 +
  (num(result, "brand_recall") || 0) * 0.20 +
  (num(result, "hook_strength") || 0) * 0.15 +
  (num(result, "hold_rate") || 0) * 0.15 +
  (num(result, "emotional_peak") || 0) * 0.10 +
  (num(result, "creative_efficiency") || 0) * 0.10 +
  (num(result, "cultural_resonance") || 0) * 0.10
);

const eligibility = (result) => {
  const score = weightedScore(result);
  const checks = [
    ["Overall weighted score", Math.round(score), 75],
    ["Brand Recall", num(result, "brand_recall"), 65],
    ["Memory Encoding", num(result, "memory_encoding"), 60],
    ["Hook Strength", num(result, "hook_strength"), 65],
    ["Brand Safety", num(result, "brand_safety"), 85],
    ["Regulatory Compliance", num(result, "regulatory_compliance"), 85],
  ];
  const failed = checks
    .filter(([, value, min]) => typeof value !== "number" || value < min)
    .map(([label, value, min]) => `${label}: ${typeof value === "number" ? Math.round(value) : "missing"} (minimum ${min})`);
  return { score, failed };
};

const keyScores = (result) => ({
  brand_recall: Math.round(num(result, "brand_recall") || 0),
  memory_encoding: Math.round(num(result, "memory_encoding") || 0),
  hook_strength: Math.round(num(result, "hook_strength") || 0),
  emotional_peak: Math.round(num(result, "emotional_peak") || 0),
  cultural_resonance: Math.round(num(result, "cultural_resonance") || 0),
});

const fetchAnalysis = async ({ supabaseUrl, supabaseKey, analysisId }) => {
  const query = new URLSearchParams();
  query.set("select", CERT_SELECT);
  query.set("id", `eq.${analysisId}`);
  query.set("limit", "1");

  const response = await fetch(`${supabaseUrl}/rest/v1/analyses?${query.toString()}`, {
    method: "GET",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to fetch analysis.");
  }
  return Array.isArray(data) ? data[0] : null;
};

const patchCertificate = async ({ supabaseUrl, supabaseKey, analysisId, certId, issuedAt }) => {
  const query = new URLSearchParams();
  query.set("id", `eq.${analysisId}`);

  const response = await fetch(`${supabaseUrl}/rest/v1/analyses?${query.toString()}`, {
    method: "PATCH",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      is_certified: true,
      cert_id: certId,
      cert_issued_at: issuedAt,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to issue certificate.");
  }
  return Array.isArray(data) ? data[0] : data;
};

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

    const analysisId = String(req.body?.analysis_id || "").trim();
    if (!analysisId) {
      return res.status(400).json({ success: false, error: "analysis_id is required." });
    }

    const row = await fetchAnalysis({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY,
      analysisId,
    });

    if (!row) {
      return res.status(404).json({ success: false, error: "Analysis not found" });
    }

    const result = parseFullResult(row.full_result);
    const { score, failed } = eligibility(result);

    if (row.is_certified === true && row.cert_id) {
      return res.status(200).json({
        success: true,
        already_certified: true,
        certified: true,
        cert_id: row.cert_id,
        cert_issued_at: row.cert_issued_at,
        weighted_score: Math.round(score),
        brand: row.brand,
        client: row.client,
        campaign: row.campaign,
        industry: row.industry,
        creative_type: row.creative_type,
        grade: row.overall_grade,
        key_scores: keyScores(result),
      });
    }

    if (failed.length) {
      return res.status(200).json({
        success: true,
        eligible: false,
        failed_criteria: failed,
        weighted_score: Math.round(score),
      });
    }

    const certId = `ACI-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const issuedAt = new Date().toISOString();
    const saved = await patchCertificate({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY,
      analysisId,
      certId,
      issuedAt,
    });

    return res.status(200).json({
      success: true,
      certified: true,
      cert_id: saved?.cert_id || certId,
      cert_issued_at: saved?.cert_issued_at || issuedAt,
      weighted_score: Math.round(score),
      brand: row.brand,
      client: row.client,
      campaign: row.campaign,
      industry: row.industry,
      creative_type: row.creative_type,
      grade: row.overall_grade,
      key_scores: keyScores(result),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
