// ADVantage Insights Brain Encoder — Edge Function

export default async function handler(request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") return new Response("", { status: 200, headers });

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured." }), { status: 500, headers });

  let body;
  try { body = await request.json(); }
  catch (e) { return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers }); }

  const { frames, metadata } = body;
  if (!frames || !frames.length) return new Response(JSON.stringify({ error: "No frames provided." }), { status: 400, headers });

  const meta = metadata || {};
  const isImage = meta.isImage || false;
  const duration = meta.duration || 0;

  // 1 frame for images, max 2 for video — keeps response time under 25s
  const usedFrames = isImage ? frames.slice(0, 1) : frames.slice(0, 2);

  const imageContent = usedFrames.map(f => ({
    type: "image",
    source: { type: "base64", media_type: "image/jpeg", data: f }
  }));

  const systemPrompt = `You are ADVantage Insights Brain Encoder — AI creative intelligence for advertising.
CRITICAL: Return ONLY valid JSON. No markdown, no backticks, no preamble.

Creative: ${isImage ? "static image/display ad" : `video (${Number(duration).toFixed(1)}s)`}
Brand: ${meta.brand||"Unknown"} | Industry: ${meta.industry||"FMCG"} | Market: ${meta.market||"India"} | Type: ${meta.type||"video"} | Audience: ${meta.audience||""} | Agency: ${meta.agency||""} | Campaign: ${meta.campaign||""} | Notes: ${meta.notes||""}

MANDATORY OUTPUT COUNTS: scenes=4, strategic_insights=6, cmo_actions=5. Do not return fewer. Keep body fields to 2-3 sentences max.

Return this JSON (INT=0-100):
{"headline_verdict":"CMO-ready one sentence","overall_grade":"A+|A|A-|B+|B|B-|C+|C|C-|D|F","grade_note":"one line","creative_summary":"4-5 sentences","viral_potential":INT,"hook_strength":INT,"hold_rate":INT,"emotional_peak":INT,"brand_recall":INT,"memory_encoding":INT,"sound_off_survival":INT,"share_intent":INT,"creative_efficiency":INT,"ad_fatigue_risk":INT,"cultural_resonance":INT,"celebrity_talent_index":INT,"brand_safety":INT,"regulatory_compliance":INT,"first_party_data_opportunity":INT,"carbon_signal":INT,"system1_vs_system2":INT,"attention_curve":[INT,INT,INT,INT,INT,INT,INT,INT,INT,INT],"emotion_curve":[INT,INT,INT,INT,INT,INT,INT,INT,INT,INT],"emotion_types":{"joy":[INT,INT,INT,INT,INT],"surprise":[INT,INT,INT,INT,INT],"trust":[INT,INT,INT,INT,INT],"fear":[INT,INT,INT,INT,INT],"desire":[INT,INT,INT,INT,INT],"curiosity":[INT,INT,INT,INT,INT]},"brain_regions":{"visual_cortex":INT,"prefrontal_cortex":INT,"amygdala":INT,"hippocampus":INT,"auditory_cortex":INT,"mirror_neurons":INT,"nucleus_accumbens":INT,"anterior_cingulate":INT},"cognitive_channels":{"visual":INT,"auditory":INT,"motion":INT,"text_overlay":INT,"brand_elements":INT,"human_faces":INT,"color_saturation":INT},"platform_scores":{"youtube_preroll_6s":INT,"youtube_preroll_15s":INT,"youtube_instream":INT,"instagram_reels":INT,"instagram_stories":INT,"instagram_feed":INT,"meta_feed":INT,"meta_stories":INT,"tiktok":INT,"linkedin_feed":INT,"twitter_x":INT,"tv_broadcast":INT,"ctv_ott":INT,"dooh":INT,"programmatic_display":INT},"scenes":[{"ts":"0:00-0:06","name":"Scene name","desc":"3-4 sentence neural analysis","attention":INT,"emotion":INT,"system_mode":"system1|system2|mixed","cognitive_load":"low|medium|high|overload","risk_flag":"none|drop_zone|ad_avoidance|cognitive_overload|pacing_issue","badges":["tag1","tag2"]},{"ts":"0:06-0:12","name":"Scene 2","desc":"3-4 sentence analysis","attention":INT,"emotion":INT,"system_mode":"system1","cognitive_load":"medium","risk_flag":"none","badges":["tag1"]},{"ts":"0:12-0:18","name":"Scene 3","desc":"3-4 sentence analysis","attention":INT,"emotion":INT,"system_mode":"mixed","cognitive_load":"medium","risk_flag":"none","badges":["tag1"]},{"ts":"0:18-0:24","name":"Scene 4","desc":"3-4 sentence analysis","attention":INT,"emotion":INT,"system_mode":"system1","cognitive_load":"low","risk_flag":"none","badges":["tag1"]}],"strategic_insights":[{"num":"01","title":"Insight title","body":"2-3 sentences referencing Byron Sharp, Kahneman, or attention economics","verdict":"Actionable verdict","vtype":"risk|win|tip|watch"},{"num":"02","title":"Insight 2","body":"2-3 sentences","verdict":"verdict","vtype":"win"},{"num":"03","title":"Insight 3","body":"2-3 sentences","verdict":"verdict","vtype":"tip"},{"num":"04","title":"Insight 4","body":"2-3 sentences","verdict":"verdict","vtype":"risk"},{"num":"05","title":"Insight 5","body":"2-3 sentences","verdict":"verdict","vtype":"watch"},{"num":"06","title":"Insight 6","body":"2-3 sentences","verdict":"verdict","vtype":"tip"}],"cmo_actions":[{"num":"01","title":"Action title","body":"3-4 sentence recommendation","priority":"critical|high|medium|low","impact":"Predicted improvement","effort":"easy|medium|hard"},{"num":"02","title":"Action 2","body":"3-4 sentences","priority":"high","impact":"improvement","effort":"medium"},{"num":"03","title":"Action 3","body":"3-4 sentences","priority":"high","impact":"improvement","effort":"hard"},{"num":"04","title":"Action 4","body":"3-4 sentences","priority":"medium","impact":"improvement","effort":"easy"},{"num":"05","title":"Action 5","body":"3-4 sentences","priority":"medium","impact":"improvement","effort":"medium"}],"competitive_context":{"category_avg_viral":INT,"category_avg_hook":INT,"category_avg_hold":INT,"category_avg_recall":INT,"position":"above_average|average|below_average|category_leader","benchmark_note":"one sentence"},"sound_analysis":{"sound_dependency":INT,"music_effectiveness":INT,"voiceover_clarity":INT,"sound_off_text_quality":INT,"asmr_trigger":INT,"sonic_branding":INT,"sound_note":"2-3 sentences"},"privacy_and_data_audit":{"data_collection_present":false,"consent_mechanism_visible":false,"qr_code_present":false,"url_cta_present":false,"hashtag_present":false,"regulatory_disclaimers_visible":false,"dpdp_compliance_risk":"low|medium|high","privacy_note":"2-3 sentences"}}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 5000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: [
            ...imageContent,
            { type: "text", text: `Analyze for ${meta.brand||"this brand"}. Return ONLY the JSON. Fill ALL 4 scenes, ALL 6 strategic_insights, ALL 5 cmo_actions with real content.` }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `API error ${response.status}: ${errText.substring(0,200)}` }), { status: response.status, headers });
    }

    const data = await response.json();
    const rawText = (data.content || []).map(c => c.text || "").join("");
    const clean = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch (e) { return new Response(JSON.stringify({ error: "JSON parse failed", raw: clean.substring(0,300) }), { status: 500, headers }); }

    return new Response(JSON.stringify({ success: true, analysis: parsed }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), { status: 500, headers });
  }
}
