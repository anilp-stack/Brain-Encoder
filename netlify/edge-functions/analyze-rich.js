// Brain Encoder — Rich Edge Function (optimised for speed)
export default async function handler(request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
  if (request.method === "OPTIONS") return new Response("", { status: 200, headers });

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) return new Response(JSON.stringify({ error: "No API key" }), { status: 500, headers });

  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: "Bad JSON" }), { status: 400, headers }); }

  const { frames, metadata: meta = {} } = body;
  if (!frames?.length) return new Response(JSON.stringify({ error: "No frames" }), { status: 400, headers });

  // Only 1 frame to minimise input tokens
  const usedFrames = frames.slice(0, 1);
  const imageContent = usedFrames.map(f => ({ type:"image", source:{ type:"base64", media_type:"image/jpeg", data:f } }));

  const prompt = `You are AdCritIQ creative strategist.
Brand: ${meta.brand||"Unknown"} | Industry: ${meta.industry||"FMCG"} | Market: ${meta.market||"India"}

Return ONLY valid JSON. No markdown. Be concise — 2 sentences max per body field.
Generate exactly 4 scenes, 5 strategic_insights, 4 cmo_actions.

{"scenes":[{"ts":"0:00-0:07","name":"Name","desc":"2 sentence analysis","attention":INT,"emotion":INT,"system_mode":"system1|system2|mixed","cognitive_load":"low|medium|high","risk_flag":"none|drop_zone|ad_avoidance","badges":["tag"]},{"ts":"0:07-0:14","name":"S2","desc":"2 sentences","attention":INT,"emotion":INT,"system_mode":"system1","cognitive_load":"medium","risk_flag":"none","badges":["tag"]},{"ts":"0:14-0:21","name":"S3","desc":"2 sentences","attention":INT,"emotion":INT,"system_mode":"mixed","cognitive_load":"medium","risk_flag":"none","badges":["tag"]},{"ts":"0:21-0:28","name":"S4","desc":"2 sentences","attention":INT,"emotion":INT,"system_mode":"system2","cognitive_load":"low","risk_flag":"none","badges":["tag"]}],"strategic_insights":[{"num":"01","title":"Title","body":"2-3 sentences with ad science ref","verdict":"One sentence","vtype":"win"},{"num":"02","title":"T2","body":"2-3 sentences","verdict":"verdict","vtype":"risk"},{"num":"03","title":"T3","body":"2-3 sentences","verdict":"verdict","vtype":"tip"},{"num":"04","title":"T4","body":"2-3 sentences","verdict":"verdict","vtype":"watch"},{"num":"05","title":"T5","body":"2-3 sentences","verdict":"verdict","vtype":"tip"}],"cmo_actions":[{"num":"01","title":"Action","body":"2 sentences with predicted outcome","priority":"critical","impact":"% improvement","effort":"easy|medium|hard"},{"num":"02","title":"A2","body":"2 sentences","priority":"high","impact":"improvement","effort":"medium"},{"num":"03","title":"A3","body":"2 sentences","priority":"high","impact":"improvement","effort":"hard"},{"num":"04","title":"A4","body":"2 sentences","priority":"medium","impact":"improvement","effort":"easy"}]}`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type":"application/json", "x-api-key":ANTHROPIC_API_KEY, "anthropic-version":"2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2500,
        system: prompt,
        messages: [{ role:"user", content: [...imageContent, { type:"text", text:`Analyze ${meta.brand||"this"} ad. JSON only. Be concise.` }] }]
      })
    });
    if (!resp.ok) { const t = await resp.text(); return new Response(JSON.stringify({ error:`API ${resp.status}: ${t.substring(0,150)}` }), { status:resp.status, headers }); }
    const data = await resp.json();
    const text = (data.content||[]).map(c=>c.text||"").join("").replace(/```json|```/g,"").trim();
    let parsed;
    try { parsed = JSON.parse(text); } catch { return new Response(JSON.stringify({ error:"JSON parse failed", raw:text.substring(0,200) }), { status:500, headers }); }
    return new Response(JSON.stringify({ success:true, richData:parsed }), { status:200, headers });
  } catch(err) {
    return new Response(JSON.stringify({ error:err.message }), { status:500, headers });
  }
}

export const config = { path: "/api/analyze-rich" };
