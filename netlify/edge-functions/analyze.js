// netlify/edge-functions/analyze.js
// ADVantage Insights Brain Encoder - Edge Function (50s timeout)

export default async (request, context) => {
  if (request.method === "OPTIONS") {
    return new Response("", {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "POST, OPTIONS" }
    });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY not set in Netlify environment variables." }, { status: 500 });
  }

  const ACCESS_PASSWORD = Deno.env.get("ACCESS_PASSWORD");
  if (ACCESS_PASSWORD) {
    const authHeader = request.headers.get("authorization") || "";
    if (authHeader !== "Bearer " + ACCESS_PASSWORD) {
      return Response.json({ error: "Invalid access code." }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    let frames = body.frames || [];
    const meta = body.metadata || {};

    if (!frames.length) {
      return Response.json({ error: "No frames provided." }, { status: 400 });
    }

    // Limit to 3 frames for balance of speed and quality
    if (frames.length > 3) {
      const mid = Math.floor(frames.length / 2);
      frames = [frames[0], frames[mid], frames[frames.length - 1]];
    }

    const imageContent = frames.map(f => ({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: f }
    }));

    const isImage = meta.isImage || false;
    const duration = meta.duration || 0;

    const systemPrompt = `You are the ADVantage Insights Brain Encoder. Analyze advertising creative frames.
CRITICAL: Return ONLY valid JSON. No markdown, no backticks, no preamble.

Creative: ${frames.length} frames from ${isImage ? "display ad" : "video (" + duration.toFixed(1) + "s)"}
Brand: ${meta.brand || "Unknown"} | Client: ${meta.client || "Unknown"} | Campaign: ${meta.campaign || "Unknown"}
Agency: ${meta.agency || "Unknown"} | Type: ${meta.type || "video"} | Industry: ${meta.industry || "N/A"}
Audience: ${meta.audience || "N/A"} | Market: ${meta.market || "India"}

Return this JSON (all INT = 0-100):
{
"viral_potential":INT,"hook_strength":INT,"hold_rate":INT,"emotional_peak":INT,"brand_recall":INT,
"memory_encoding":INT,"sound_off_survival":INT,"creative_efficiency":INT,"share_intent":INT,
"ad_fatigue_risk":INT,"cultural_resonance":INT,"system1_vs_system2":INT,
"first_party_data_opportunity":INT,"celebrity_talent_index":INT,"brand_safety":INT,
"regulatory_compliance":INT,"carbon_signal":INT,
"score_notes":{"viral_potential":"note","hook_strength":"note","hold_rate":"note","emotional_peak":"note","brand_recall":"note","memory_encoding":"note","sound_off_survival":"note","creative_efficiency":"note","share_intent":"note"},
"attention_curve":[20 integers 0-100 representing attention over time],
"emotion_curve":[20 integers 0-100],
"emotion_types_curve":{"joy":[20 ints],"surprise":[20 ints],"trust":[20 ints],"fear":[20 ints],"desire":[20 ints],"curiosity":[20 ints]},
"brain_regions":{"visual_cortex":INT,"prefrontal_cortex":INT,"amygdala":INT,"hippocampus":INT,"auditory_cortex":INT,"mirror_neurons":INT,"nucleus_accumbens":INT,"anterior_cingulate":INT},
"cognitive_channel_load":{"visual":INT,"auditory":INT,"motion":INT,"text_overlay":INT,"brand_elements":INT,"human_faces":INT,"color_saturation":INT},
"platform_scores":{"youtube_preroll_6s":INT,"youtube_preroll_15s":INT,"youtube_instream":INT,"instagram_reels":INT,"instagram_stories":INT,"instagram_feed":INT,"meta_feed":INT,"meta_stories":INT,"tiktok":INT,"linkedin_feed":INT,"twitter_x":INT,"tv_broadcast":INT,"ctv_ott":INT,"dooh":INT,"programmatic_display":INT},
"scenes":[{"ts":"0:00-3:00","name":"Scene Name","desc":"3-4 sentence neural analysis","attention":INT,"emotion":INT,"system_mode":"system1|system2|mixed","cognitive_load":"low|medium|high","risk_flag":"none|drop_zone|ad_avoidance","badges":["Badge1","Badge2"]}],
"insights":[{"num":"01","title":"Insight Title","body":"4-5 sentence strategic analysis using System 1/2, attention economics, memory encoding, Byron Sharp.","verdict":"One sentence action","vtype":"risk|win|tip|watch"}],
"cmo_actions":[{"num":"01","title":"Action Title","body":"3-4 sentence recommendation with predicted impact.","priority":"critical|high|medium|low","impact":"Predicted improvement","effort":"easy|medium|hard"}],
"competitive_context":{"category_avg_viral":INT,"category_avg_hook":INT,"category_avg_hold":INT,"category_avg_recall":INT,"position":"above_average|average|below_average|category_leader","benchmark_note":"One sentence"},
"sound_analysis":{"sound_dependency":INT,"music_effectiveness":INT,"voiceover_clarity":INT,"sound_off_text_quality":INT,"asmr_trigger":INT,"sonic_branding":INT,"sound_note":"2-3 sentences"},
"privacy_and_data_audit":{"data_collection_present":BOOL,"consent_mechanism_visible":BOOL,"qr_code_present":BOOL,"url_cta_present":BOOL,"hashtag_present":BOOL,"regulatory_disclaimers_visible":BOOL,"dpdp_compliance_risk":"low|medium|high","privacy_note":"2-3 sentences"},
"creative_summary":"4-5 sentence summary",
"headline_verdict":"One powerful sentence a CMO would remember",
"overall_grade":"A+|A|B+|B|C|D|F"
}

Provide 5 scenes, 5 insights, 5 cmo_actions. Be specific, critical, strategic. No Publicis Media mentions.`;

    const userMsg = `Analyze this ${meta.type || "video"} ad for ${meta.brand || "brand"}. ${meta.notes ? "Context: " + meta.notes : ""} Return ONLY JSON.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 6000,
        system: systemPrompt,
        messages: [{ role: "user", content: [...imageContent, { type: "text", text: userMsg }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json({ error: "Anthropic API error " + response.status, details: errText.substring(0, 300) }, { status: response.status });
    }

    const data = await response.json();
    let text = "";
    for (const block of (data.content || [])) {
      if (block.text) text += block.text;
    }

    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      return Response.json({ error: "AI returned invalid JSON. Try again.", preview: clean.substring(0, 200) }, { status: 500 });
    }

    return Response.json({ success: true, analysis: parsed, usage: data.usage });

  } catch (err) {
    return Response.json({ error: "Error: " + err.message }, { status: 500 });
  }
};

export const config = {
  path: "/api/analyze",
  method: "POST"
};
