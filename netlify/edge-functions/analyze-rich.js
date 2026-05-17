// Brain Encoder — Rich Edge Function: scenes, insights, CMO actions
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

  const { frames, metadata: meta = {}, fastResults = {} } = body;
  if (!frames?.length) return new Response(JSON.stringify({ error: "No frames" }), { status: 400, headers });

  const usedFrames = (meta.isImage ? frames.slice(0,1) : frames.slice(0,2));
  const imageContent = usedFrames.map(f => ({ type:"image", source:{ type:"base64", media_type:"image/jpeg", data:f } }));

  const scoreCtx = fastResults?.viral_potential ? `Context scores: viral=${fastResults.viral_potential}, hook=${fastResults.hook_strength}, hold=${fastResults.hold_rate}, emotion=${fastResults.emotional_peak}, recall=${fastResults.brand_recall}, grade=${fastResults.overall_grade}. Reference these in your insights.` : "";

  const prompt = `You are ADVantage Insights Brain Encoder — expert creative strategist.
Brand: ${meta.brand||"Unknown"} | Industry: ${meta.industry||"FMCG"} | Market: ${meta.market||"India"} | Campaign: ${meta.campaign||""} | Agency: ${meta.agency||""}
${scoreCtx}

CRITICAL: Return ONLY valid JSON. No markdown. Generate EXACTLY 4 scenes, 6 strategic_insights, 5 cmo_actions.

{"scenes":[
{"ts":"0:00-0:07","name":"Scene name","desc":"3-4 sentences on what happens, neural activation, emotional trigger","attention":INT,"emotion":INT,"system_mode":"system1|system2|mixed","cognitive_load":"low|medium|high|overload","risk_flag":"none|drop_zone|ad_avoidance|cognitive_overload|pacing_issue","badges":["tag1","tag2"]},
{"ts":"0:07-0:14","name":"Scene 2","desc":"3-4 sentences","attention":INT,"emotion":INT,"system_mode":"system1","cognitive_load":"medium","risk_flag":"none","badges":["tag"]},
{"ts":"0:14-0:21","name":"Scene 3","desc":"3-4 sentences","attention":INT,"emotion":INT,"system_mode":"mixed","cognitive_load":"medium","risk_flag":"none","badges":["tag"]},
{"ts":"0:21-0:28","name":"Scene 4","desc":"3-4 sentences","attention":INT,"emotion":INT,"system_mode":"system2","cognitive_load":"low","risk_flag":"none","badges":["tag"]}
],
"strategic_insights":[
{"num":"01","title":"Insight title","body":"4-5 sentences with advertising science reference (Byron Sharp/Kahneman/Nelson-Field)","verdict":"Actionable verdict","vtype":"risk|win|tip|watch"},
{"num":"02","title":"Insight 2","body":"4-5 sentences","verdict":"verdict","vtype":"win"},
{"num":"03","title":"Insight 3","body":"4-5 sentences","verdict":"verdict","vtype":"tip"},
{"num":"04","title":"Insight 4","body":"4-5 sentences","verdict":"verdict","vtype":"risk"},
{"num":"05","title":"Insight 5","body":"4-5 sentences","verdict":"verdict","vtype":"watch"},
{"num":"06","title":"Insight 6","body":"4-5 sentences","verdict":"verdict","vtype":"tip"}
],
"cmo_actions":[
{"num":"01","title":"Action title","body":"3-4 sentences with specific recommendation and predicted outcome","priority":"critical|high|medium|low","impact":"Predicted % improvement","effort":"easy|medium|hard"},
{"num":"02","title":"Action 2","body":"3-4 sentences","priority":"high","impact":"improvement","effort":"medium"},
{"num":"03","title":"Action 3","body":"3-4 sentences","priority":"high","impact":"improvement","effort":"hard"},
{"num":"04","title":"Action 4","body":"3-4 sentences","priority":"medium","impact":"improvement","effort":"easy"},
{"num":"05","title":"Action 5","body":"3-4 sentences","priority":"medium","impact":"improvement","effort":"medium"}
]}`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type":"application/json", "x-api-key":ANTHROPIC_API_KEY, "anthropic-version":"2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4500,
        system: prompt,
        messages: [{ role:"user", content: [...imageContent, { type:"text", text:`Generate rich analysis for ${meta.brand||"this"} creative. Return ONLY JSON.` }] }]
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
