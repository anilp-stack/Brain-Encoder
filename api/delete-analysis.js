export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "DELETE") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY not set.");
    }

    const id = req.query?.id;
    if (!id) throw new Error("Missing analysis id.");

    const response = await fetch(`${SUPABASE_URL}/rest/v1/analyses?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      let data = {};
      try { data = await response.json(); } catch (e) {}
      throw new Error(data.message || data.error || "Failed to delete analysis.");
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
