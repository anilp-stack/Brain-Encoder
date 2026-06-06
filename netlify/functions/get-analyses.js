// netlify/functions/get-analyses.js

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: "Method not allowed" }) };
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY not set.");
    }

    const params = new URLSearchParams(event.queryStringParameters || {});
    const brand = params.get("brand");
    const grade = params.get("grade");
    const limit = params.get("limit") || "50";

    const query = new URLSearchParams();
    query.set("select", "*");
    query.set("order", "created_at.desc");
    query.set("limit", limit);
    if (brand) query.set("brand", `eq.${brand}`);
    if (grade) query.set("overall_grade", `eq.${grade}`);

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

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, analyses }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
  }
}
