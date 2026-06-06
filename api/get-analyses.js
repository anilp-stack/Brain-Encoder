export const config = { maxDuration: 30 };

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

    const brand = req.query?.brand;
    const grade = req.query?.grade;
    const limit = req.query?.limit || "50";

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

    return res.status(200).json({ success: true, analyses });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
