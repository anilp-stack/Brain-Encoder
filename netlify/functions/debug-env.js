export async function handler(event) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      has_supabase_url: !!process.env.SUPABASE_URL,
      has_supabase_key: !!process.env.SUPABASE_ANON_KEY,
      url_prefix: process.env.SUPABASE_URL?.substring(0, 20) || "NOT SET",
      node_env: process.env.NODE_ENV
    })
  };
}
