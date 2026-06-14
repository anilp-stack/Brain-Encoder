export const config = { maxDuration: 30 };

import { createHash } from "crypto";

const hashToken = (token) => {
  const clean = String(token || "").trim();
  return clean ? createHash("sha256").update(clean).digest("hex") : null;
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

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

    const token = String(req.query?.token || "").trim();
    const sample = req.query?.sample === "true";
    const brand = req.query?.brand;
    const grade = req.query?.grade;
    const isCompetitor = req.query?.is_competitor;
    const competitorOf = req.query?.competitor_of;
    const limit = req.query?.limit || "50";
    const ownerTokenHash = hashToken(token);
    const isAdminToken = !!process.env.ACCESS_PASSWORD && token === process.env.ACCESS_PASSWORD;

    if (!sample && !ownerTokenHash) {
      return res.status(200).json({
        success: true,
        analyses: [],
        token_required: true
      });
    }

    const query = new URLSearchParams();
    query.set(
      "select",
      req.query?.summary === "true"
        ? "id,brand,campaign,creative_type,created_at,overall_grade,headline_verdict,is_competitor,competitor_of,is_certified,cert_id,owner_token_hash"
        : "*"
    );
    query.set("order", "created_at.desc");
    query.set("limit", sample ? "1" : limit);
    if (!sample) {
      if (isAdminToken) {
        query.set("or", `(owner_token_hash.eq.${ownerTokenHash},owner_token_hash.is.null)`);
      } else {
        query.set("owner_token_hash", `eq.${ownerTokenHash}`);
      }
    }
    if (brand) query.set("brand", `eq.${brand}`);
    if (grade) query.set("overall_grade", `eq.${grade}`);
    if (isCompetitor === "true" || isCompetitor === "false") query.set("is_competitor", `eq.${isCompetitor}`);
    if (competitorOf) query.set("competitor_of", `eq.${competitorOf}`);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/analyses?${query.toString()}`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const analyses = await response.json();
    if (!response.ok) {
      throw new Error(analyses.message || analyses.error || "Failed to fetch analyses.");
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).json({ success: true, analyses });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
