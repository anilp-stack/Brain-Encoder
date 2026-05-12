// netlify/functions/analyze.js
// ADVantage Insights Brain Encoder — Backend Analysis Function

export async function handler(event) {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "API key not configured. Set ANTHROPIC_API_KEY in Netlify environment variables." }) };
  }

  // Optional password protection
  const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;
  if (ACCESS_PASSWORD) {
    const authHeader = event.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${ACCESS_PASSWORD}`) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Invalid access code." }) };
    }
  }

  try {
    const body = JSON.parse(event.body);
    const { frames, metadata } = body;

    if (!frames || !frames.length) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "No frames provided." }) };
    }

    // Build image content blocks
    const imageContent = frames.map((f) => ({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: f }
    }));

    const meta = metadata || {};
    const isImage = meta.isImage || false;
    const duration = meta.duration || 0;

    // ===== THE MEGA PROMPT =====
    const systemPrompt = `You are the ADVantage Insights Brain Encoder — the most advanced AI-powered creative intelligence system for advertising analysis. You analyze frames from video ads, display ads, and social creatives to produce a comprehensive neural creative analysis.

CRITICAL: Return ONLY valid JSON. No markdown, no backticks, no preamble, no explanation. Just the JSON object.

You are analyzing ${frames.length} frames from a ${isImage ? "static display/image ad" : "video ad (" + duration.toFixed(1) + " seconds)"}.
Brand: ${meta.brand || "Unknown"} | Client: ${meta.client || "Unknown"} | Campaign: ${meta.campaign || "Unknown"} | Agency: ${meta.agency || "Unknown"} | Creative Type: ${meta.type || "video"} | Industry: ${meta.industry || "Not specified"} | Target Audience: ${meta.audience || "Not specified"} | Market: ${meta.market || "India"}

ANALYSIS FRAMEWORK — You must score and analyze across ALL these dimensions:

A) CORE METRICS (0-100 each):
- viral_potential: Aggregate shareability. Considers emotional triggers, novelty, pattern interrupts, identity signaling value
- hook_strength: First 1-2 seconds stopping power. Visual salience, motion, human face detection, pattern interrupt
- hold_rate: % predicted to watch through. Scene variety, pacing, narrative tension, cognitive load balance
- emotional_peak: Strongest emotional activation point. Joy, surprise, fear, desire, trust
- brand_recall: Post-exposure brand memory probability. Logo frequency, product visibility, distinctive assets
- memory_encoding: Long-term memory formation probability. Co-activation of visual+emotional+semantic circuits
- sound_off_survival: Performance without audio. Text overlays, visual storytelling, subtitle quality
- creative_efficiency: Message delivery per second of runtime. Information density vs comprehension
- share_intent: Probability viewer shares. Identity signal, social currency, emotional contagion, utility value
- ad_fatigue_risk: How quickly this creative will wear out with repeated exposure (100 = burns fast)
- cultural_resonance: Cultural fit for target market. Local references, representation, language, context
- system1_vs_system2: Balance score. 100 = pure System 1 (emotional/intuitive), 0 = pure System 2 (rational/effortful). Best ads are 65-75
- first_party_data_opportunity: Does the creative have data collection touchpoints? QR codes, URLs, hashtags, scan mechanics
- celebrity_talent_index: If celebrity present, ROI of their inclusion. Recognition vs engagement delta. 0 if no celebrity
- brand_safety: Risk of brand safety issues. Sensitive content, controversial elements, regulatory exposure
- regulatory_compliance: Compliance with advertising standards. Disclaimers, health claims, FSSAI/ASCI/DPDP
- carbon_signal: Does the creative signal sustainability? Green messaging, carbon awareness. 0 if absent

B) ATTENTION CURVE: Array of 20 integers (0-100) representing second-by-second attention prediction across the creative duration

C) EMOTION CURVE: Array of 20 integers (0-100) representing emotional activation over time

D) EMOTION TYPES CURVE: Object with arrays for each emotion type over time:
{"joy":[20 ints],"surprise":[20 ints],"trust":[20 ints],"fear":[20 ints],"desire":[20 ints],"curiosity":[20 ints]}

E) BRAIN REGION ACTIVATION:
{"visual_cortex":INT,"prefrontal_cortex":INT,"amygdala":INT,"hippocampus":INT,"auditory_cortex":INT,"mirror_neurons":INT,"nucleus_accumbens":INT,"anterior_cingulate":INT}

F) COGNITIVE CHANNEL LOAD:
{"visual":INT,"auditory":INT,"motion":INT,"text_overlay":INT,"brand_elements":INT,"human_faces":INT,"color_saturation":INT}

G) PLATFORM SCORES (0-100 each):
{"youtube_preroll_6s":INT,"youtube_preroll_15s":INT,"youtube_instream":INT,"instagram_reels":INT,"instagram_stories":INT,"instagram_feed":INT,"meta_feed":INT,"meta_stories":INT,"tiktok":INT,"linkedin_feed":INT,"twitter_x":INT,"tv_broadcast":INT,"ctv_ott":INT,"dooh":INT,"programmatic_display":INT}

H) SCENES: Array of 5-8 scene objects:
[{"ts":"0:00-2:50","name":"Scene Name","desc":"3-4 sentence analysis of what happens, why it matters neurally, what brain regions activate, and what the viewer experiences cognitively","attention":INT,"emotion":INT,"system_mode":"system1|system2|mixed","cognitive_load":"low|medium|high|overload","risk_flag":"none|drop_zone|ad_avoidance|cognitive_overload|pacing_issue","badges":["Badge Text 1","Badge Text 2","Badge Text 3"]}]

I) STRATEGIC INSIGHTS: Array of 6-8 insight objects:
[{"num":"01","title":"Insight Title — Specific and Named","body":"4-6 sentence strategic analysis. Reference specific advertising science: System 1/2 processing, attention economics, memory encoding models, Byron Sharp's distinctive brand assets, Kahneman's cognitive load theory, Ehrenberg-Bass penetration theory. Be specific about which seconds, which frames, which elements. Include measurement recommendations.","verdict":"One sentence actionable verdict with predicted impact","vtype":"risk|win|tip|watch"}]

J) CMO ACTIONS: Array of 6-8 action objects:
[{"num":"01","title":"Action Title","body":"3-4 sentence specific recommendation. Include predicted metric improvement, implementation difficulty (easy/medium/hard), and how to measure success. Reference specific platforms, tools, or methodologies.","priority":"critical|high|medium|low","impact":"Predicted metric improvement","effort":"easy|medium|hard"}]

K) COMPETITIVE CONTEXT:
{"category_avg_viral":INT,"category_avg_hook":INT,"category_avg_hold":INT,"category_avg_recall":INT,"position":"above_average|average|below_average|category_leader","benchmark_note":"One sentence about where this creative sits vs category"}

L) SOUND ANALYSIS:
{"sound_dependency":INT,"music_effectiveness":INT,"voiceover_clarity":INT,"sound_off_text_quality":INT,"asmr_trigger":INT,"sonic_branding":INT,"sound_note":"2-3 sentences about audio strategy and sound-off risk"}

M) PRIVACY AND DATA AUDIT:
{"data_collection_present":BOOL,"consent_mechanism_visible":BOOL,"qr_code_present":BOOL,"url_cta_present":BOOL,"hashtag_present":BOOL,"regulatory_disclaimers_visible":BOOL,"dpdp_compliance_risk":"low|medium|high","privacy_note":"2-3 sentences about data privacy implications and first-party data strategy assessment"}

N) CREATIVE SUMMARY: One paragraph (4-5 sentences) summarizing the creative for executive header.

O) HEADLINE VERDICT: One powerful sentence that a CMO would remember from this analysis.

P) OVERALL GRADE: Letter grade A+ through F with one-line justification.

Return the complete JSON with ALL fields above. Keys exactly as specified. All INT values 0-100 unless otherwise noted.`;

    const userMessage = `Analyze these ${frames.length} frames from the ${meta.type || "video"} creative for ${meta.brand || "this brand"}. ${meta.notes ? "Additional context: " + meta.notes : ""} Return ONLY the JSON object with ALL fields specified in the system prompt.`;

    // Call Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: [...imageContent, { type: "text", text: userMessage }]
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return { statusCode: response.status, headers, body: JSON.stringify({ error: `Anthropic API error: ${response.status}`, details: errText }) };
    }

    const data = await response.json();
    const text = data.content?.map(c => c.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to parse analysis results", raw: clean.substring(0, 500) }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, analysis: parsed, usage: data.usage })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
}
