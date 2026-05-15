// netlify/edge-functions/analyze.js
// ADVantage Insights Brain Encoder — Edge Function (50s timeout, Deno runtime)

export default async function handler(request, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured." }), { status: 500, headers });
  }

  try {
    const body = await request.json();
    const { frames, metadata } = body;

    if (!frames || !frames.length) {
      return new Response(JSON.stringify({ error: "No frames provided." }), { status: 400, headers });
    }

    const meta = metadata || {};
    const isImage = meta.isImage || false;
    const duration = meta.duration || 0;

    // Cap at 3 frames
    const usedFrames = frames.slice(0, 3);

    const imageContent = usedFrames.map(f => ({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: f }
    }));

    const systemPrompt = `You are ADVantage Insights Brain Encoder — advanced AI creative intelligence for advertising. Analyze frames from video/display/social ads.

CRITICAL: Return ONLY valid JSON. No markdown, no backticks, no preamble. Just the JSON object.

Analyzing ${usedFrames.length} frames from a ${isImage ? "static display/image ad" : `video ad (${duration.toFixed(1)}s)`}.
Brand: ${meta.brand||"Unknown"} | Client: ${meta.client||"Unknown"} | Campaign: ${meta.campaign||"Unknown"} | Agency: ${meta.agency||"Unknown"} | Type: ${meta.type||"video"} | Industry: ${meta.industry||"Not specified"} | Audience: ${meta.audience||"Not specified"} | Market: ${meta.market||"India"}

Return this exact JSON structure (ALL fields required, INT = 0-100):

{
  "headline_verdict": "ONE powerful sentence a CMO will remember",
  "overall_grade": "A+|A|A-|B+|B|B-|C+|C|C-|D|F",
  "grade_note": "One line justification",
  "creative_summary": "4-5 sentence executive summary of this specific creative",
  "viral_potential": INT, "hook_strength": INT, "hold_rate": INT, "emotional_peak": INT,
  "brand_recall": INT, "memory_encoding": INT, "sound_off_survival": INT, "share_intent": INT,
  "creative_efficiency": INT, "ad_fatigue_risk": INT, "cultural_resonance": INT,
  "celebrity_talent_index": INT, "brand_safety": INT, "regulatory_compliance": INT,
  "first_party_data_opportunity": INT, "carbon_signal": INT, "system1_vs_system2": INT,
  "attention_curve": [INT,INT,INT,INT,INT,INT,INT,INT,INT,INT],
  "emotion_curve": [INT,INT,INT,INT,INT,INT,INT,INT,INT,INT],
  "emotion_types": {
    "joy": [INT,INT,INT,INT,INT],
    "surprise": [INT,INT,INT,INT,INT],
    "trust": [INT,INT,INT,INT,INT],
    "fear": [INT,INT,INT,INT,INT],
    "desire": [INT,INT,INT,INT,INT],
    "curiosity": [INT,INT,INT,INT,INT]
  },
  "brain_regions": {
    "visual_cortex": INT, "prefrontal_cortex": INT, "amygdala": INT, "hippocampus": INT,
    "auditory_cortex": INT, "mirror_neurons": INT, "nucleus_accumbens": INT, "anterior_cingulate": INT
  },
  "cognitive_channels": {
    "visual": INT, "auditory": INT, "motion": INT, "text_overlay": INT,
    "brand_elements": INT, "human_faces": INT, "color_saturation": INT
  },
  "platform_scores": {
    "youtube_preroll_6s": INT, "youtube_preroll_15s": INT, "youtube_instream": INT,
    "instagram_reels": INT, "instagram_stories": INT, "instagram_feed": INT,
    "meta_feed": INT, "meta_stories": INT, "tiktok": INT, "linkedin_feed": INT,
    "twitter_x": INT, "tv_broadcast": INT, "ctv_ott": INT, "dooh": INT, "programmatic_display": INT
  },
  "scenes": [
    {"ts":"0:00-0:06","name":"Scene Name","desc":"3-4 sentence neural analysis of what happens and why it matters","attention":INT,"emotion":INT,"system_mode":"system1|system2|mixed","cognitive_load":"low|medium|high|overload","risk_flag":"none|drop_zone|ad_avoidance|cognitive_overload|pacing_issue","badges":["badge1","badge2"]}
  ],
  "strategic_insights": [
    {"num":"01","title":"Insight Title","body":"4-6 sentence analysis referencing advertising science","verdict":"Actionable one-sentence verdict","vtype":"risk|win|tip|watch"}
  ],
  "cmo_actions": [
    {"num":"01","title":"Action Title","body":"3-4 sentence specific recommendation with predicted improvement","priority":"critical|high|medium|low","impact":"Predicted metric improvement","effort":"easy|medium|hard"}
  ],
  "competitive_context": {
    "category_avg_viral": INT, "category_avg_hook": INT, "category_avg_hold": INT,
    "category_avg_recall": INT,
    "position": "above_average|average|below_average|category_leader",
    "benchmark_note": "One sentence about where this creative sits vs category"
  },
  "sound_analysis": {
    "sound_dependency": INT, "music_effectiveness": INT, "voiceover_clarity": INT,
    "sound_off_text_quality": INT, "asmr_trigger": INT, "sonic_branding": INT,
    "sound_note": "2-3 sentences on audio strategy and sound-off risk"
  },
  "privacy_and_data_audit": {
    "data_collection_present": false, "consent_mechanism_visible": false,
    "qr_code_present": false, "url_cta_present": false,
    "hashtag_present": false, "regulatory_disclaimers_visible": false,
    "dpdp_compliance_risk": "low|medium|high",
    "privacy_note": "2-3 sentences on data privacy implications"
  }
}`;

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
        messages: [{
          role: "user",
          content: [
            ...imageContent,
            {
              type: "text",
              text: `Analyze these ${usedFrames.length} frames for ${meta.brand||"this brand"}. ${meta.notes ? "Context: " + meta.notes : ""} Return ONLY the JSON object.`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${response.status}`, details: errText }),
        { status: response.status, headers }
      );
    }

    const data = await response.json();
    const text = (data.content || []).map(c => c.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "JSON parse failed", raw: clean.substring(0, 400) }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({ success: true, analysis: parsed, usage: data.usage }),
      { status: 200, headers }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers }
    );
  }
}

export const config = { path: "/api/analyze" };
